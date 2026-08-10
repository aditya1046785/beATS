import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getUserPayments } from "@/lib/store";
import { recordSubscriptionPayment, verifyRazorpaySignature } from "@/lib/payments";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const body = await request.json();
  const { order_id, payment_id, signature, plan, mock } = body as {
    order_id?: string;
    payment_id?: string;
    signature?: string;
    plan?: "monthly" | "annual";
    mock?: boolean;
  };

  if (plan !== "monthly" && plan !== "annual") {
    return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
  }

  // Demo mode: no real Razorpay signature to verify. Only accept orders our own
  // server minted (mock_ prefix), and refuse mock payments once real keys exist.
  if (mock) {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Mock payments are disabled while Razorpay is configured." }, { status: 400 });
    }
    if (!order_id || !order_id.startsWith("mock_") || !payment_id) {
      return NextResponse.json({ error: "Invalid demo payment order." }, { status: 400 });
    }
  } else {
    if (!order_id || !payment_id || !signature) {
      return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
    }
    if (!verifyRazorpaySignature(order_id, payment_id, signature)) {
      return NextResponse.json({ error: "Payment signature could not be verified." }, { status: 400 });
    }
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
    signature: signature || "mock",
    paymentStatus: mock ? "test" : "paid",
  });

  return NextResponse.json({ ok: true, payment });
}