import { NextResponse } from "next/server";
import { clearSession, requireUser } from "@/lib/auth";
import { deleteUserData } from "@/lib/store";

export async function DELETE() {
  const user = await requireUser();
  await deleteUserData(user.id);
  clearSession();
  return NextResponse.json({ ok: true });
}
