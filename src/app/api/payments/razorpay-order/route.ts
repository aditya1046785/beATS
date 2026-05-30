import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const { plan } = await request.json();
  const amount = plan === "annual" ? 79900 : 9900;
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Razorpay keys are not configured." }, { status: 500 });
  }
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency: "INR", receipt: `${user.id}:${crypto.randomUUID()}` }),
  });
  if (!response.ok) return NextResponse.json({ error: "Could not create payment order." }, { status: 500 });
  const order = await response.json();
  return NextResponse.json({ ...order, keyId: process.env.RAZORPAY_KEY_ID });
}
