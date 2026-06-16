/** Preview/demo admin session (when Supabase is not configured) */
const DEMO_SESSION_KEY = "docuforge_demo_admin";

export function isPlaceholderSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return url.includes("placeholder") || !url || url.includes("your-project");
}

export function setDemoAdminSession(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(DEMO_SESSION_KEY, "1");
  }
}

export function isDemoAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEMO_SESSION_KEY) === "1";
}

export function clearDemoAdminSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(DEMO_SESSION_KEY);
  }
}

export async function demoLogin(email: string, password: string): Promise<boolean> {
  const res = await fetch("/api/demo-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return false;
  setDemoAdminSession();
  return true;
}
