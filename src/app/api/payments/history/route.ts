import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getUserPayments } from "@/lib/store";

export async function GET() {
  const user = await requireUser();
  const payments = await getUserPayments(user.id);
  return NextResponse.json({ payments });
}