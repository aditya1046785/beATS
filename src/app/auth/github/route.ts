import { NextRequest, NextResponse } from "next/server";
import { setSession } from "@/lib/auth";
import { exchangeCodeForToken, getGitHubProfile } from "@/lib/github";
import { readData, writeData } from "@/lib/store";
import { UserProfile } from "@/lib/types";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || "",
      scope: "read:user user:email public_repo",
      redirect_uri: `${request.nextUrl.origin}/auth/github`,
    });
    return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  }

  const token = await exchangeCodeForToken(code);
  const profile = await getGitHubProfile(token);
  const data = await readData();
  let user = data.users.find((item) => item.githubId === profile.githubId);
  const monthTracker = new Date().toISOString().slice(0, 7);
  if (!user) {
    user = {
      id: crypto.randomUUID(),
      ...profile,
      githubAccessToken: token,
      planType: "free",
      resumesGeneratedThisMonth: 0,
      monthTracker,
      onboardingComplete: false,
      githubProcessed: false,
      githubProcessing: false,
      createdAt: new Date().toISOString(),
    } satisfies UserProfile;
    data.users.push(user);
  } else {
    user.githubAccessToken = token;
    user.name = profile.name;
    user.email = profile.email || user.email;
    user.avatarUrl = profile.avatarUrl;
  }
  await writeData(data);
  setSession(user.id);
  return NextResponse.redirect(`${request.nextUrl.origin}${user.onboardingComplete ? "/dashboard" : "/onboarding"}`);
}
