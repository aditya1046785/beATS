import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import ProcessingClient from "./ProcessingClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ProcessingPage() {
  const user = await requireUser();
  if (!user.onboardingComplete) redirect("/onboarding");
  return (
    <main className="flex min-h-screen items-center bg-[#0a0a0f] px-6 py-10 text-white">
      <ProcessingClient />
    </main>
  );
}
