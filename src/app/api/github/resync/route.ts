import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { processGithubForUser } from "@/lib/pipeline";
import { saveUser } from "@/lib/store";

export async function POST() {
  const user = await requireUser();
  const updated = {
    ...user,
    githubProcessed: false,
    githubProcessing: true,
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
