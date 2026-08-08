import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const user = await requireDashboardUser();
  return (
    <main className="min-h-screen bg-[#0a0a0f] px-5 py-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-5">
          <Link className="text-sm text-indigo-300" href="/dashboard">← Dashboard</Link>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <SettingsClient user={user} />
      </div>
    </main>
  );
}
