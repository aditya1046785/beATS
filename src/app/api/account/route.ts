import { NextResponse } from "next/server";
import { clearSession, requireUser } from "@/lib/auth";
import { updateData } from "@/lib/store";

export async function DELETE() {
  const user = await requireUser();
  await updateData((data) => {
    data.users = data.users.filter((item) => item.id !== user.id);
    data.repositories = data.repositories.filter((item) => item.userId !== user.id);
    data.resumes = data.resumes.filter((item) => item.userId !== user.id);
    data.payments = data.payments.filter((item) => item.userId !== user.id);
  });
  clearSession();
  return NextResponse.json({ ok: true });
}
