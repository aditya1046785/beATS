import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getUserPayments } from "@/lib/store";
import { recordSubscriptionPayment, verifyRazorpaySignature } from "@/lib/payments";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const body = await request.json();
  const { order_id, payment_id, signature, plan } = body as {
    order_id?: string;
    payment_id?: string;
    signature?: string;
    plan?: "monthly" | "annual";
  };

  if (!order_id || !payment_id || !signature || (plan !== "monthly" && plan !== "annual")) {
    return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
  }

  if (!verifyRazorpaySignature(order_id, payment_id, signature)) {
    return NextResponse.json({ error: "Payment signature could not be verified." }, { status: 400 });
  }

  const existingPayments = await getUserPayments(user.id);
  if (existingPayments.some((payment) => payment.paymentId === payment_id)) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const payment = await recordSubscriptionPayment({
    user,
    plan,
    orderId: order_id,
    paymentId: payment_id,
    signature,
  });

  return NextResponse.json({ ok: true, payment });
}