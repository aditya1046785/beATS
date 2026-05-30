import crypto from "crypto";
import { addPaymentRecord, saveUser } from "./store";
import { PaymentRecord, UserProfile } from "./types";

export function getPlanDetails(plan: "monthly" | "annual") {
  return {
    amountPaid: plan === "annual" ? 79900 : 9900,
    durationMonths: plan === "annual" ? 12 : 1,
  };
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  if (!process.env.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function recordSubscriptionPayment(input: {
  user: UserProfile;
  plan: "monthly" | "annual";
  orderId: string;
  paymentId: string;
  signature: string;
  paymentStatus?: string;
}) {
  const now = new Date();
  const baseline = input.user.planType === "pro" && input.user.planExpiryDate ? new Date(input.user.planExpiryDate) : now;
  const start = baseline.getTime() > now.getTime() ? baseline : now;
  const end = new Date(start);
  end.setMonth(end.getMonth() + (input.plan === "annual" ? 12 : 1));

  const payment: PaymentRecord = {
    id: crypto.randomUUID(),
    userId: input.user.id,
    planType: input.plan,
    amountPaid: getPlanDetails(input.plan).amountPaid,
    paymentTimestamp: now.toISOString(),
    subscriptionStartDate: start.toISOString(),
    subscriptionEndDate: end.toISOString(),
    paymentStatus: input.paymentStatus || "paid",
    orderId: input.orderId,
    paymentId: input.paymentId,
    signature: input.signature,
    currency: "INR",
  };

  await addPaymentRecord(payment);
  await saveUser({
    ...input.user,
    planType: "pro",
    planExpiryDate: end.toISOString(),
  });

  return payment;
}