import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUser, saveUser } from "./store";

const COOKIE_NAME = "pp_session";

export function setSession(userId: string) {
  cookies().set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
}

export function getSessionUserId() {
  return cookies().get(COOKIE_NAME)?.value;
}

export async function requireUser() {
  const userId = getSessionUserId();
  if (!userId) redirect("/");
  const user = await getUser(userId);
  if (!user) redirect("/");

  const nowMonth = new Date().toISOString().slice(0, 7);
  const planExpiryDate = user.planExpiryDate ? new Date(user.planExpiryDate) : null;
  let nextUser = user;

  if (user.monthTracker !== nowMonth) {
    nextUser = { ...nextUser, monthTracker: nowMonth, resumesGeneratedThisMonth: 0 };
  }

  if (nextUser.planType === "pro" && planExpiryDate && Number.isFinite(planExpiryDate.getTime()) && planExpiryDate.getTime() < Date.now()) {
    nextUser = { ...nextUser, planType: "free", planExpiryDate: undefined };
  }

  if (nextUser !== user) {
    await saveUser(nextUser);
  }

  return nextUser;
}

export async function requireDashboardUser() {
  const user = await requireUser();
  if (!user.onboardingComplete) redirect("/onboarding");
  if (!user.githubProcessed) redirect("/processing");
  return user;
}
