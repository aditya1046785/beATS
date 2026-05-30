import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

function userFacingError(error: string) {
  if (!error) return "";
  if (error.includes("OPENROUTER_API_KEY") || error.includes("ANTHROPIC_API_KEY")) {
    return "AI service key is not configured correctly. Add OPENROUTER_API_KEY in .env.local and restart the server.";
  }
  if (error.includes("OpenRouter request failed")) {
    return "AI analysis request failed. Please check your OpenRouter key and try again.";
  }
  if (error.includes("Sentence Transformers")) {
    return "Local embedding model is not ready. Install sentence-transformers on the server and try again.";
  }
  return "Processing taking longer than usual. Please try syncing again.";
}

export async function GET() {
  const user = await requireUser();
  return NextResponse.json({
    processed: user.githubProcessed,
    processing: user.githubProcessing,
    stage: user.githubProcessingStage || "Preparing...",
    progress: user.githubProcessingProgress || 0,
    error: userFacingError(user.githubProcessingError || ""),
  });
}
