"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";

const roles = [
  "Software Development Engineer (SDE)",
  "Frontend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps / Cloud Engineer",
  "Android / iOS Developer",
];

type FormState = Record<string, string>;

function Field({ label, name, value, onChange, required = false, type = "text" }: { label: string; name: string; value: string; onChange: (name: string, value: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      <input name={name} required={required} type={type} value={value} onChange={(event) => onChange(name, event.target.value)} className="field h-12" />
    </label>
  );
}

export default function OnboardingForm({ name, email, githubUsername }: { name: string; email: string; githubUsername: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roleError, setRoleError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({ name, phone: "", city: "", collegeName: "", degree: "", graduationYear: String(new Date().getFullYear()), cgpa: "", linkedinUrl: "", portfolioUrl: "" });
  const years = useMemo(() => Array.from({ length: 7 }, (_, index) => String(new Date().getFullYear() + index)), []);
  const progress = (step / 3) * 100;

  function update(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function next() {
    if (step === 2 && selectedRoles.length === 0) {
      setRoleError(true);
      window.setTimeout(() => setRoleError(false), 500);
      return;
    }
    setStep((current) => Math.min(3, current + 1));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 3) {
      next();
      return;
    }
    setSubmitting(true);
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, targetRoles: selectedRoles }),
    });
    setSubmitting(false);
    if (response.ok) router.push("/processing");
  }

  return (
    <form onSubmit={submit} className="relative mx-auto mt-10 grid min-h-[calc(100vh-8rem)] w-full max-w-5xl grid-rows-[auto_1fr_auto] gap-8">
      <div>
        <div className="mb-3 flex justify-between text-sm text-zinc-400"><span>Step {step} of 3</span><span>{Math.round(progress)}%</span></div>
        <div className="h-1 overflow-hidden rounded-full bg-zinc-800"><div className="h-full bg-indigo-500 transition-all duration-200 ease-in-out" style={{ width: `${progress}%` }} /></div>
      </div>

      <section className="mx-auto grid w-full max-w-xl content-center">
        {step === 1 ? (
          <div className="grid gap-5">
            <div>
              <h1 className="text-3xl font-bold">Let&apos;s start with the basics.</h1>
              <p className="mt-2 text-zinc-400">This goes on every resume — your name, contact, and college.</p>
            </div>
            <Field label="Full Name" name="name" required value={form.name} onChange={update} />
            <Field label="Phone Number" name="phone" required value={form.phone} onChange={update} />
            <Field label="City / Location" name="city" required value={form.city} onChange={update} />
            <div className="pt-2 text-sm font-semibold text-zinc-400">Your college</div>
            <Field label="College / University" name="collegeName" required value={form.collegeName} onChange={update} />
            <Field label="Degree & Branch" name="degree" required value={form.degree} onChange={update} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>Graduation Year</span>
                <select name="graduationYear" required value={form.graduationYear} onChange={(event) => update("graduationYear", event.target.value)} className="field h-12">
                  {years.map((year) => <option key={year}>{year}</option>)}
                </select>
              </label>
              <Field label="CGPA" name="cgpa" required type="number" value={form.cgpa} onChange={update} />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-5">
            <div>
              <h1 className="text-3xl font-bold">Where can people find your work?</h1>
              <p className="mt-2 text-zinc-400">These appear in your resume header. Add what you have.</p>
            </div>
            <Field label="LinkedIn Profile URL (Optional)" name="linkedinUrl" value={form.linkedinUrl} onChange={update} />
            <Field label="Portfolio / Website (Optional)" name="portfolioUrl" value={form.portfolioUrl} onChange={update} />
            <div className={`grid gap-3 rounded-lg border border-zinc-800 p-4 ${roleError ? "soft-shake border-red-500/60" : ""}`}>
              <p className="text-sm font-semibold text-zinc-200">What kind of roles are you targeting?</p>
              <div className="grid gap-2">
                {roles.map((role) => {
                  const selected = selectedRoles.includes(role);
                  return (
                    <button key={role} type="button" onClick={() => setSelectedRoles((current) => selected ? current.filter((item) => item !== role) : [...current, role])} className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 text-left text-sm ${selected ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-100" : "border-zinc-800 text-zinc-300 hover:bg-white/5"}`}>
                      <span className={`flex h-5 w-5 items-center justify-center rounded border ${selected ? "border-indigo-400 bg-indigo-500 text-white" : "border-zinc-700"}`}>{selected ? <Check size={13} /> : null}</span>
                      {role}
                    </button>
                  );
                })}
              </div>
              {roleError ? <p className="text-sm text-red-300">Select at least one role.</p> : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-5">
            <div>
              <h1 className="text-3xl font-bold">One last thing — and then we&apos;re off.</h1>
              <p className="mt-2 text-zinc-400">We&apos;ll analyze your GitHub now. This only happens once.</p>
            </div>
            <div className="grid gap-3 rounded-lg border border-zinc-800 bg-[#111118] p-5 text-sm">
              {[form.name, `${form.phone} • ${email}`, `${form.collegeName} — ${form.degree}, ${form.graduationYear}`, `Target roles: ${selectedRoles.join(", ")}`, `GitHub: ${githubUsername}`].map((item) => (
                <p key={item} className="flex items-center justify-between gap-4 text-zinc-200"><span>{item}</span><Check className="text-emerald-400" size={17} /></p>
              ))}
            </div>
            <div className="flex gap-3 rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4 text-sm text-indigo-100">
              <RotateCw className="mt-0.5 shrink-0" size={18} />
              <p>We&apos;ll now analyze your GitHub repositories to understand your skills. This takes about 30 seconds.</p>
            </div>
          </div>
        ) : null}
      </section>

      <div className="mx-auto flex w-full max-w-xl items-center justify-between">
        <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} className="inline-flex items-center gap-2 rounded-lg px-4 py-3 text-zinc-300 hover:bg-white/5" disabled={step === 1}><ChevronLeft size={17} />Back</button>
        <button disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white hover:bg-indigo-400 disabled:opacity-60">
          {step === 3 ? (submitting ? "Starting..." : "Analyze My GitHub") : "Continue"}<ChevronRight size={17} />
        </button>
      </div>
    </form>
  );
}
