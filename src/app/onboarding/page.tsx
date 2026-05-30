import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.onboardingComplete && !user.githubProcessed) redirect("/processing");
  if (user.onboardingComplete && user.githubProcessed) redirect("/dashboard");
  return (
    <main className="min-h-screen bg-[#080808] px-6 py-10 text-white">
      <div className="mx-auto mb-6 max-w-3xl">
        <p className="text-blue-300">Welcome! Let&apos;s set up your profile.</p>
        <h1 className="mt-2 text-3xl font-bold">Basic Details</h1>
      </div>
      <OnboardingForm name={user.name} />
    </main>
  );
}
