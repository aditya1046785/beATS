"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const roles = [
  "Software Development Engineer (SDE)",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps / Cloud Engineer",
  "Android / iOS Developer",
  "Other",
];

export default function OnboardingForm({ name }: { name: string }) {
  const router = useRouter();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const years = Array.from({ length: 6 }, (_, index) => String(new Date().getFullYear() + index));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, string>;
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, targetRoles: selectedRoles }),
    });
    if (response.ok) router.push("/processing");
  }

  return (
    <form onSubmit={submit} className="mx-auto grid w-full max-w-3xl gap-4 rounded border border-zinc-800 bg-zinc-950 p-6">
      <input name="name" required defaultValue={name} placeholder="Full Name" className="field" />
      <input name="phone" required placeholder="Phone Number" className="field" />
      <input name="city" required placeholder="City / Location" className="field" />
      <input name="collegeName" required placeholder="College / University Name" className="field" />
      <input name="degree" required placeholder="Branch / Degree" className="field" />
      <select name="graduationYear" required className="field">
        {years.map((year) => <option key={year}>{year}</option>)}
      </select>
      <input name="cgpa" required type="number" step="0.01" placeholder="CGPA" className="field" />
      <input name="linkedinUrl" placeholder="LinkedIn Profile URL (optional)" className="field" />
      <input name="portfolioUrl" placeholder="Portfolio / Personal Website URL (optional)" className="field" />
      <div className="grid gap-2">
        <p className="text-sm text-zinc-300">Target Job Roles</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {roles.map((role) => (
            <label key={role} className="flex gap-2 text-sm text-zinc-200">
              <input
                type="checkbox"
                name="targetRoles"
                value={role}
                checked={selectedRoles.includes(role)}
                onChange={() =>
                  setSelectedRoles((current) =>
                    current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
                  )
                }
              />
              {role}
            </label>
          ))}
        </div>
      </div>
      <button className="rounded bg-blue-600 px-4 py-3 font-semibold text-white">Continue</button>
    </form>
  );
}
