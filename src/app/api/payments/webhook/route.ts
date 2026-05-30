import { NextRequest, NextResponse } from "next/server";
import { getUser, getUserPayments } from "@/lib/store";
import { recordSubscriptionPayment, verifyWebhookSignature } from "@/lib/payments";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as {
    event?: string;
    payload?: {
      payment?: { entity?: { order_id?: string; id?: string; amount?: number } };
      order?: { entity?: { receipt?: string } };
    };
  };

  const payment = event.payload?.payment?.entity;
  if (event.event !== "payment.captured" || !payment?.order_id || !payment.id) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const receipt = event.payload?.order?.entity?.receipt || "";
  const userId = receipt.split(":")[0];
  const user = (await getUser(userId)) || null;
  if (!user) return NextResponse.json({ ok: true, ignored: true });

  const existingPayments = await getUserPayments(user.id);
  if (existingPayments.some((item) => item.paymentId === payment.id)) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  await recordSubscriptionPayment({
    user,
    plan: payment.amount === 79900 ? "annual" : "monthly",
    orderId: payment.order_id,
    paymentId: payment.id,
    signature,
  });

  return NextResponse.json({ ok: true });
}