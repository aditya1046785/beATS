"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { UserProfile } from "@/lib/types";

export default function SettingsClient({ user }: { user: UserProfile }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setMessage(response.ok ? "Profile updated." : "Could not update profile.");
  }
  async function resync() {
    await fetch("/api/github/resync", { method: "POST" });
    router.push("/processing");
  }
  async function remove() {
    if (!window.confirm("Delete all your data permanently?")) return;
    await fetch("/api/account", { method: "DELETE" });
    router.push("/");
  }
  return (
    <div className="grid gap-6">
      <form onSubmit={save} className="grid gap-3 rounded border border-zinc-800 bg-zinc-950 p-5">
        <h2 className="text-xl font-semibold">Edit Profile</h2>
        <input name="name" defaultValue={user.name} required className="field" />
        <input name="phone" defaultValue={user.phone} required className="field" />
        <input name="city" defaultValue={user.city} required className="field" />
        <input name="collegeName" defaultValue={user.collegeName} required className="field" />
        <input name="degree" defaultValue={user.degree} required className="field" />
        <input name="graduationYear" defaultValue={user.graduationYear} required className="field" />
        <input name="cgpa" defaultValue={user.cgpa} required className="field" />
        <input name="linkedinUrl" defaultValue={user.linkedinUrl} className="field" />
        <input name="portfolioUrl" defaultValue={user.portfolioUrl} className="field" />
        <button className="rounded bg-blue-600 px-4 py-2 font-semibold">Save</button>
        {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
      </form>
      <section className="rounded border border-zinc-800 bg-zinc-950 p-5">
        <h2 className="text-xl font-semibold">My Plan</h2>
        <p className="mt-2 text-zinc-300">{user.planType === "pro" ? "Pro" : "Free"} plan. Usage this month: {user.resumesGeneratedThisMonth}</p>
        {user.planType === "free" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button className="rounded border border-blue-700 p-3 text-left">₹799/year<br /><span className="text-sm text-zinc-400">Save 33% — just ₹66/month</span></button>
            <button className="rounded border border-zinc-700 p-3 text-left">₹99/month</button>
          </div>
        ) : null}
      </section>
      <section className="rounded border border-zinc-800 bg-zinc-950 p-5">
        <h2 className="text-xl font-semibold">GitHub</h2>
        <button onClick={resync} className="mt-3 rounded bg-zinc-800 px-4 py-2">Re-sync GitHub</button>
      </section>
      <section className="rounded border border-red-900 bg-zinc-950 p-5">
        <h2 className="text-xl font-semibold">Danger Zone</h2>
        <button onClick={remove} className="mt-3 rounded bg-red-700 px-4 py-2">Delete My Account</button>
      </section>
    </div>
  );
}
