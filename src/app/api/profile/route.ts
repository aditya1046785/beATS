import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { saveUser } from "@/lib/store";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const body = await request.json();
  await saveUser({
    ...user,
    name: body.name,
    phone: body.phone,
    city: body.city,
    collegeName: body.collegeName,
    degree: body.degree,
    graduationYear: body.graduationYear,
    cgpa: body.cgpa,
    linkedinUrl: body.linkedinUrl || "",
    portfolioUrl: body.portfolioUrl || "",
  });
  return NextResponse.json({ ok: true });
}
