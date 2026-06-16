import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const adminEmail = process.env.DEMO_ADMIN_EMAIL || "support@docuforge.pro";
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
  const userEmail = process.env.DEMO_USER_EMAIL || "demo@docuforge.pro";
  const userPassword = process.env.DEMO_USER_PASSWORD;

  if (!adminPassword || !userPassword) {
    return NextResponse.json({ error: "Demo accounts not configured" }, { status: 503 });
  }

  if (email === adminEmail && password === adminPassword) {
    return NextResponse.json({ ok: true, role: "admin" });
  }

  if (email === userEmail && password === userPassword) {
    return NextResponse.json({ ok: true, role: "user" });
  }

  return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
}
