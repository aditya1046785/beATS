import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isProcessing, processGithubForUser } from "@/lib/pipeline";
import { saveUser } from "@/lib/store";

export async function POST() {
  const user = await requireUser();
  if (isProcessing(user.id)) {
    return NextResponse.json({ ok: true, alreadyProcessing: true });
  }
  const updated = {
    ...user,
    githubProcessed: false,
    githubProcessing: true,
    githubProcessingError: "",
    githubProcessingStage: "Fetching your repositories...",
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
