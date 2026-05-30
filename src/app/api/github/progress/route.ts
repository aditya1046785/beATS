import "server-only";
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getUser } from "@/lib/store";

export async function GET(request: NextRequest) {
  const user = await requireUser();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(new TextEncoder().encode(`retry: 2000\n\n`));
      let lastPayload = "";

      const interval = setInterval(async () => {
        try {
          const fresh = await getUser(user.id);
          if (!fresh) {
            controller.close();
            clearInterval(interval);
            return;
          }

          const payload = JSON.stringify({
            stage: fresh.githubProcessingStage || "",
            progress: fresh.githubProcessingProgress || 0,
            error: fresh.githubProcessingError || "",
            processing: Boolean(fresh.githubProcessing),
            processedAt: fresh.lastGithubSyncAt || null,
          });

          if (payload !== lastPayload) {
            controller.enqueue(new TextEncoder().encode(`data: ${payload}\n\n`));
            lastPayload = payload;
          }

          if (!fresh.githubProcessing) {
            // final event and close
            controller.enqueue(new TextEncoder().encode(`event: done\ndata: ${payload}\n\n`));
            controller.close();
            clearInterval(interval);
            return;
          }
        } catch (err) {
          controller.enqueue(new TextEncoder().encode(`event: error\ndata: ${JSON.stringify({ message: String(err) })}\n\n`));
        }
      }, 500);

      controller.oncancel = () => {
        clearInterval(interval);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export const runtime = "nodejs";
