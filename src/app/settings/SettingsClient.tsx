"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle, Bell, CreditCard, Github, RotateCw, Shield, User } from "lucide-react";
import { PaymentRecord, UserProfile } from "@/lib/types";
import { formatDate } from "@/lib/formatDate";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayOptions = { key: string; amount: number; currency: string; name: string; description: string; order_id: string; handler: (response: RazorpayResponse) => Promise<void>; modal?: { ondismiss?: () => void } };
type RazorpayInstance = { open: () => void; on: (event: string, callback: (payload: { error?: { description?: string } }) => void) => void };
type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global { interface Window { Razorpay?: RazorpayConstructor } }

const roles = ["SDE", "Full Stack", "Frontend", "ML Engineer"];

function Field({ label, name, defaultValue, readOnly = false }: { label: string; name: string; defaultValue?: string; readOnly?: boolean }) {
  return <label className="grid gap-2 text-sm text-zinc-300"><span>{label}</span><input name={name} defaultValue={defaultValue} readOnly={readOnly} className={`field ${readOnly ? "text-zinc-500" : ""}`} /></label>;
}

function Toggle({ title, description, initial = true }: { title: string; description: string; initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <button type="button" onClick={() => setOn((value) => !value)} className="flex w-full items-center justify-between gap-4 text-left">
      <span><span className="block text-sm font-medium text-zinc-100">{title}</span><span className="text-sm text-zinc-500">{description}</span></span>
      <span className={`flex h-7 w-12 items-center rounded-full p-1 ${on ? "bg-indigo-500" : "bg-zinc-700"}`}><span className={`h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} /></span>
    </button>
  );
}

export default function SettingsClient({ user, razorpayConfigured }: { user: UserProfile; razorpayConfigured: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [paying, setPaying] = useState<"monthly" | "annual" | null>(null);
  const [mockCheckout, setMockCheckout] = useState<{ plan: "monthly" | "annual"; orderId: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");

  useEffect(() => {
    if (user.planType !== "pro") return;
    fetch("/api/payments/history").then((response) => response.json()).then((data) => setHistory(Array.isArray(data.payments) ? data.payments : [])).catch(() => setHistory([]));
  }, [user.planType]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setMessage(response.ok ? "✓ Saved" : "Could not update profile.");
    if (response.ok) setDirty(false);
    window.setTimeout(() => setMessage(""), 2000);
  }

  async function resync() {
    setSyncing(true);
    await fetch("/api/github/resync", { method: "POST" });
    setSyncing(false);
    router.push("/processing");
  }

  async function remove() {
    if (deleteEmail !== user.email) return;
    await fetch("/api/account", { method: "DELETE" });
    router.push("/");
  }

  async function loadRazorpay() {
    if (window.Razorpay) return true;
    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function startCheckout(plan: "monthly" | "annual") {
    setPaymentMessage("");
    setPaying(plan);
    try {
      const orderResponse = await fetch("/api/payments/razorpay-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error || "Could not create payment order.");
      if (order.mock) {
        setMockCheckout({ plan, orderId: order.id });
        return;
      }
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) throw new Error("Razorpay checkout could not be loaded.");
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "PositionPerfect AI",
        description: plan === "annual" ? "Annual Pro plan" : "Monthly Pro plan",
        order_id: order.id,
        handler: async (response) => {
          const verifyResponse = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan, order_id: response.razorpay_order_id, payment_id: response.razorpay_payment_id, signature: response.razorpay_signature }) });
          const result = await verifyResponse.json();
          if (!verifyResponse.ok) throw new Error(result.error || "Payment verification failed.");
          setPaymentMessage("Payment successful. Your account is now Pro.");
          router.refresh();
        },
        modal: { ondismiss: () => setPaymentMessage("Payment cancelled.") },
      });
      checkout.on("payment.failed", (error) => setPaymentMessage(error.error?.description || "Payment failed."));
      checkout.open();
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : "Could not start payment.");
    } finally {
      setPaying(null);
    }
  }

  async function confirmMockPayment() {
    if (!mockCheckout) return;
    setPaying(mockCheckout.plan);
    setPaymentMessage("");
    try {
      const paymentId = `mock_pay_${mockCheckout.orderId}`;
      const verifyResponse = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: mockCheckout.plan, order_id: mockCheckout.orderId, payment_id: paymentId, signature: "mock", mock: true }) });
      const result = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(result.error || "Payment verification failed.");
      setMockCheckout(null);
      setPaymentMessage("Test payment successful. Your account is now Pro.");
      router.refresh();
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : "Could not complete test payment.");
    } finally {
      setPaying(null);
    }
  }

  const usage = Math.min(user.resumesGeneratedThisMonth, 2);

  return (
    <div className="grid gap-8 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav className="sticky top-6 hidden h-max border-l border-zinc-800 text-sm lg:grid">
        {[["profile", User, "Profile"], ["integrations", Github, "Integrations"], ["billing", CreditCard, "Plan & Billing"], ["notifications", Bell, "Notifications"], ["danger", AlertTriangle, "Danger Zone"]].map(([id, Icon, label]) => {
          const I = Icon as typeof User;
          return <a key={id as string} href={`#${id}`} className={`flex items-center gap-3 border-l-2 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white ${id === "profile" ? "border-indigo-500 bg-indigo-500/10 text-indigo-200" : "border-transparent"} ${id === "danger" ? "mt-8 text-red-300" : ""}`}><I size={16} />{label as string}</a>;
        })}
      </nav>

      <div className="grid gap-8">
        <form id="profile" onSubmit={save} onChange={() => setDirty(true)} className="grid gap-6 rounded-lg border border-zinc-800 bg-[#111118] p-5">
          <div><h2 className="text-xl font-semibold">Profile</h2><p className="mt-1 text-sm text-zinc-500">Your information appears across all resumes.</p></div>
          <div className="flex items-center gap-4">{user.avatarUrl ? <Image src={user.avatarUrl} alt="" width={64} height={64} className="rounded-full" /> : <User size={52} />}<button type="button" className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200">Change photo</button></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Full Name" name="name" defaultValue={user.name} /><Field label="Email" name="email" defaultValue={user.email} readOnly /><Field label="Phone" name="phone" defaultValue={user.phone} /><Field label="City" name="city" defaultValue={user.city} /></div>
          <div><h3 className="mb-3 font-semibold">Education</h3><div className="grid gap-4 sm:grid-cols-2"><Field label="College" name="collegeName" defaultValue={user.collegeName} /><Field label="Degree & Branch" name="degree" defaultValue={user.degree} /><Field label="Graduation Year" name="graduationYear" defaultValue={user.graduationYear} /><Field label="CGPA" name="cgpa" defaultValue={user.cgpa} /></div></div>
          <div><h3 className="mb-3 font-semibold">Links</h3><div className="grid gap-4 sm:grid-cols-2"><Field label="LinkedIn" name="linkedinUrl" defaultValue={user.linkedinUrl} /><Field label="Portfolio" name="portfolioUrl" defaultValue={user.portfolioUrl} /></div></div>
          <div><h3 className="mb-3 font-semibold">Target Roles</h3><div className="flex flex-wrap gap-2">{roles.map((role) => <span key={role} className={`rounded-full border px-3 py-1 text-sm ${user.targetRoles?.join(" ").includes(role) ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-100" : "border-zinc-700 text-zinc-400"}`}>{user.targetRoles?.join(" ").includes(role) ? "✓ " : ""}{role}</span>)}</div></div>
          <p className="text-xs text-zinc-500">Email is linked to your GitHub account.</p>
          <div className="flex justify-end">{dirty || message ? <button className={`rounded-lg px-4 py-2 font-semibold ${message.includes("Saved") ? "bg-emerald-500" : "bg-indigo-500"} text-white`}>{message || "Save Changes"}</button> : null}</div>
        </form>

        <section id="integrations" className="rounded-lg border border-zinc-800 bg-[#111118] p-5">
          <h2 className="text-xl font-semibold">Integrations</h2><p className="mt-1 text-sm text-zinc-500">Connected services that power your resume generation.</p>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-zinc-800 p-4">
            <div className="flex items-center gap-3"><Github /><div><p className="font-semibold">GitHub</p><p className="text-sm text-zinc-500">Connected as @{user.githubUsername}</p><p className="text-sm text-zinc-500">Last synced: {user.lastGithubSyncAt ? formatDate(user.lastGithubSyncAt) : "Not yet"}</p></div></div>
            <div className="flex gap-2"><button onClick={resync} disabled={syncing} className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"><RotateCw className={syncing ? "animate-spin" : ""} size={15} />{syncing ? "Syncing..." : "Sync Now"}</button><button className="rounded-lg border border-zinc-700 px-3 py-2 text-sm">Disconnect</button></div>
          </div>
        </section>

        <section id="billing" className="rounded-lg border border-zinc-800 bg-[#111118] p-5">
          <h2 className="text-xl font-semibold">Plan & Billing</h2>
          {user.planType === "free" ? (
            <div className="mt-5 grid gap-5">
              <div className="rounded-lg border border-zinc-800 p-4"><p className="font-semibold">FREE PLAN</p><p className="mt-3 text-sm text-zinc-400">• 2 resumes / month<br />• 1 template<br />• Basic ATS score</p><div className="mt-4 h-2 rounded-full bg-zinc-800"><div className="h-full rounded-full bg-amber-500" style={{ width: `${(usage / 2) * 100}%` }} /></div><p className="mt-2 text-sm text-zinc-500">Resumes used this month: {usage} of 2</p></div>
              <div className="grid gap-4 sm:grid-cols-2"><button disabled={paying !== null} onClick={() => startCheckout("annual")} className="rounded-lg border border-indigo-500/50 p-5 text-left hover:bg-indigo-500/10"><span className="font-semibold">ANNUAL</span><br /><span className="text-2xl font-bold">₹799 / year</span><br /><span className="text-sm text-zinc-400">₹66 per month • Save 33%</span><span className="mt-5 block rounded bg-indigo-500 px-3 py-2 text-center text-sm font-semibold text-white">Get Pro Annual</span></button><button disabled={paying !== null} onClick={() => startCheckout("monthly")} className="rounded-lg border border-zinc-700 p-5 text-left hover:bg-white/5"><span className="font-semibold">MONTHLY</span><br /><span className="text-2xl font-bold">₹99 / month</span><span className="mt-5 block rounded bg-zinc-800 px-3 py-2 text-center text-sm font-semibold">Get Pro Monthly</span></button></div>
            </div>
          ) : (
            <div className="mt-5 grid gap-4"><div className="rounded-lg border border-emerald-500/30 p-4"><p className="font-semibold text-emerald-300">PRO PLAN ✓</p><p className="text-zinc-400">Renews on {user.planExpiryDate ? formatDate(user.planExpiryDate) : "your next billing date"}</p><p className="mt-3 text-sm text-zinc-300">• Unlimited resumes<br />• Full ATS breakdown<br />• Priority processing</p></div>{history.map((payment) => <p key={payment.id} className="rounded border border-zinc-800 p-3 text-sm">{formatDate(payment.paymentTimestamp)} · ₹{payment.amountPaid} · {payment.paymentStatus}</p>)}</div>
          )}
          {!razorpayConfigured ? <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">🧪 Demo mode: Razorpay keys are not configured. Upgrades are simulated, no real charge happens.</p> : null}
          {paymentMessage ? <p className="mt-3 text-sm text-zinc-300">{paymentMessage}</p> : null}
        </section>

        <section id="notifications" className="grid gap-5 rounded-lg border border-zinc-800 bg-[#111118] p-5">
          <div><h2 className="text-xl font-semibold">Notifications</h2><p className="mt-1 text-sm text-zinc-500">Control what the app tells you.</p></div>
          <Toggle title="GitHub sync reminders" description="Your GitHub hasn't been synced in 30 days" />
          <Toggle title="Resume generation complete" description="Your resume is ready to download" />
          <Toggle title="Plan usage alerts" description="You've used 1 of 2 free resumes" />
          <Toggle title="Product updates" description="New features and improvements" initial={false} />
        </section>

        <section id="danger" className="rounded-lg border border-red-500/30 bg-red-500/5 p-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-red-300"><Shield size={18} />Danger Zone</h2>
          <p className="mt-3 text-zinc-400">Permanently delete your account and all your resumes. This cannot be undone.</p>
          {!deleteConfirm ? <button onClick={() => setDeleteConfirm(true)} className="mt-4 rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-200">Delete My Account</button> : <div className="mt-4 grid gap-3 rounded-lg border border-red-500/30 p-4"><p className="text-sm text-red-100">Type your email to confirm:</p><input value={deleteEmail} onChange={(event) => setDeleteEmail(event.target.value)} className="field" /><div className="flex gap-2"><button onClick={() => setDeleteConfirm(false)} className="rounded border border-zinc-700 px-3 py-2 text-sm">Cancel</button><button onClick={remove} disabled={deleteEmail !== user.email} className="rounded bg-red-600 px-3 py-2 text-sm font-semibold disabled:opacity-40">Yes, permanently delete</button></div></div>}
        </section>

        {mockCheckout ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-[#16161f] p-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">Demo mode</p>
              <h3 className="mt-3 text-lg font-semibold">Confirm test payment</h3>
              <div className="mt-4 rounded-lg border border-zinc-800 p-4 text-sm">
                <div className="flex items-center justify-between"><span className="text-zinc-400">{mockCheckout.plan === "annual" ? "Annual Pro plan" : "Monthly Pro plan"}</span><span className="font-semibold">₹{mockCheckout.plan === "annual" ? 799 : 99}</span></div>
              </div>
              <p className="mt-3 text-xs text-zinc-500">Razorpay is not configured, so no real charge happens. This simulates a successful payment and upgrades your account to Pro.</p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setMockCheckout(null)} className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm text-zinc-300 hover:bg-white/5">Cancel</button>
                <button onClick={confirmMockPayment} disabled={paying !== null} className="flex-1 rounded-lg bg-indigo-500 py-2 text-sm font-semibold text-white disabled:opacity-60">{paying ? "Processing..." : "Simulate payment"}</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
