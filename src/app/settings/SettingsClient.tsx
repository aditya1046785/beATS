"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { PaymentRecord, UserProfile } from "@/lib/types";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void>;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, callback: (payload: { error?: { description?: string } }) => void) => void;
};

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export default function SettingsClient({ user }: { user: UserProfile }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [paying, setPaying] = useState<"monthly" | "annual" | null>(null);

  useEffect(() => {
    if (user.planType !== "pro") return;
    fetch("/api/payments/history")
      .then((response) => response.json())
      .then((data) => setHistory(Array.isArray(data.payments) ? data.payments : []))
      .catch(() => setHistory([]));
  }, [user.planType]);

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
      const orderResponse = await fetch("/api/payments/razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error || "Could not create payment order.");

      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) throw new Error("Razorpay checkout could not be loaded.");

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "PositionPerfect AI",
        description: plan === "annual" ? "Annual Pro plan" : "Monthly Pro plan",
        order_id: order.id,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plan,
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });
          const result = await verifyResponse.json();
          if (!verifyResponse.ok) throw new Error(result.error || "Payment verification failed.");
          setPaymentMessage("Payment successful. Your account is now Pro.");
          router.refresh();
        },
        modal: {
          ondismiss: () => setPaymentMessage("Payment cancelled."),
        },
      };
      const checkout = new window.Razorpay(options);
      checkout.on("payment.failed", (error: { error?: { description?: string } }) => {
        setPaymentMessage(error.error?.description || "Payment failed.");
      });
      checkout.open();
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : "Could not start payment.");
    } finally {
      setPaying(null);
    }
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
        {user.planExpiryDate ? <p className="mt-1 text-sm text-zinc-500">Expires on {new Date(user.planExpiryDate).toLocaleDateString()}</p> : null}
        {user.planType === "free" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button type="button" disabled={paying !== null} onClick={() => startCheckout("annual")} className="rounded border border-blue-700 p-3 text-left disabled:opacity-60">₹799/year<br /><span className="text-sm text-zinc-400">Save 33% — just ₹66/month</span></button>
            <button type="button" disabled={paying !== null} onClick={() => startCheckout("monthly")} className="rounded border border-zinc-700 p-3 text-left disabled:opacity-60">₹99/month</button>
          </div>
        ) : null}
        {paymentMessage ? <p className="mt-3 text-sm text-zinc-300">{paymentMessage}</p> : null}
        {user.planType === "pro" ? (
          <div className="mt-5 grid gap-3">
            <h3 className="text-lg font-semibold">Payment History</h3>
            {history.length ? history.map((payment) => (
              <div key={payment.id} className="rounded border border-zinc-800 bg-black/40 p-3 text-sm">
                <p className="font-medium">{payment.planType === "annual" ? "Annual" : "Monthly"} · {payment.paymentStatus}</p>
                <p className="text-zinc-400">Paid on {new Date(payment.paymentTimestamp).toLocaleString()}</p>
                <p className="text-zinc-500">Valid until {new Date(payment.subscriptionEndDate).toLocaleDateString()}</p>
              </div>
            )) : <p className="text-sm text-zinc-500">No payment records found.</p>}
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
