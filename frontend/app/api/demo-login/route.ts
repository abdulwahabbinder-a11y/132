import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const adminEmail = process.env.DEMO_ADMIN_EMAIL || "support@docuforge.pro";
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ error: "Demo admin not configured" }, { status: 503 });
  }

  if (email === adminEmail && password === adminPassword) {
    return NextResponse.json({ ok: true, role: "admin" });
  }

  return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
}
