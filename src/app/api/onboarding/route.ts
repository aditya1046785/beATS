import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isProcessing, processGithubForUser } from "@/lib/pipeline";
import { saveUser } from "@/lib/store";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (isProcessing(user.id)) {
    return NextResponse.json({ ok: true, alreadyProcessing: true });
  }
  const body = await request.json();
  const updated = {
    ...user,
    name: body.name,
    phone: body.phone,
    city: body.city,
    collegeName: body.collegeName,
    degree: body.degree,
    graduationYear: body.graduationYear,
    cgpa: body.cgpa,
    linkedinUrl: body.linkedinUrl || "",
    portfolioUrl: body.portfolioUrl || "",
    targetRoles: body.targetRoles || [],
    onboardingComplete: true,
    githubProcessed: false,
    githubProcessing: true,
    githubProcessingError: "",
    githubProcessingStage: "We're analyzing your GitHub. This only happens once!",
    githubProcessingProgress: 5,
    githubProcessingCurrentRepo: "",
    githubProcessingCompleted: 0,
    githubProcessingTotal: 0,
    githubProcessingRepos: [],
  };
  await saveUser(updated);
  processGithubForUser(updated);
  return NextResponse.json({ ok: true });
}
