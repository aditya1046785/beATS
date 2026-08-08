import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.onboardingComplete && !user.githubProcessed) redirect("/processing");
  if (user.onboardingComplete && user.githubProcessed) redirect("/dashboard");
  return (
    <main className="min-h-screen overflow-hidden bg-[#0a0a0f] px-5 py-6 text-white">
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-[-10%] top-[-10%] h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[28rem] w-[28rem] rounded-full bg-emerald-500/5 blur-3xl" />
      </div>
      <div className="relative mx-auto flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500"><FileText size={17} /></span>PositionPerfect</div>
        <span className="text-sm text-zinc-400">Step setup</span>
      </div>
      <OnboardingForm name={user.name} email={user.email} githubUsername={user.githubUsername} />
    </main>
  );
}
