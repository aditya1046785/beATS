import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const user = await requireDashboardUser();
  return (
    <main className="min-h-screen bg-[#080808] px-6 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <Link className="text-sm text-blue-300" href="/dashboard">Back to Dashboard</Link>
        <h1 className="mb-5 mt-3 text-3xl font-bold">Settings</h1>
        <SettingsClient user={user} />
      </div>
    </main>
  );
}
