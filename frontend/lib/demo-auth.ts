/** Preview/demo sessions when Supabase is not configured */

export type DemoRole = "admin" | "user";

export interface DemoSession {
  role: DemoRole;
  email: string;
}

const DEMO_SESSION_KEY = "docuforge_demo_session";
const LEGACY_ADMIN_KEY = "docuforge_demo_admin";

export function isPlaceholderSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return url.includes("placeholder") || !url || url.includes("your-project");
}

export function setDemoSession(session: DemoSession): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  }
}

export function getDemoSession(): DemoSession | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(DEMO_SESSION_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as DemoSession;
      if (parsed.role && parsed.email) return parsed;
    } catch {
      /* fall through */
    }
  }

  if (localStorage.getItem(LEGACY_ADMIN_KEY) === "1") {
    return { role: "admin", email: "support@docuforge.pro" };
  }

  return null;
}

export function isDemoSession(): boolean {
  return getDemoSession() !== null;
}

export function isDemoAdminSession(): boolean {
  return getDemoSession()?.role === "admin";
}

export function isDemoUserSession(): boolean {
  return getDemoSession()?.role === "user";
}

export function clearDemoSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(DEMO_SESSION_KEY);
    localStorage.removeItem(LEGACY_ADMIN_KEY);
  }
}

/** @deprecated use clearDemoSession */
export function clearDemoAdminSession(): void {
  clearDemoSession();
}

/** @deprecated use setDemoSession */
export function setDemoAdminSession(): void {
  setDemoSession({ role: "admin", email: "support@docuforge.pro" });
}

export interface DemoLoginResult {
  ok: boolean;
  role?: DemoRole;
}

export async function demoLogin(
  email: string,
  password: string
): Promise<DemoLoginResult> {
  const res = await fetch("/api/demo-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) return { ok: false };

  const data = (await res.json()) as { role?: DemoRole };
  const role = data.role === "admin" ? "admin" : "user";
  setDemoSession({ role, email });
  return { ok: true, role };
}

export function demoRedirectForRole(
  role: DemoRole,
  redirectTo: string
): string {
  if (role === "admin") {
    return redirectTo === "/admin" || redirectTo === "/create"
      ? redirectTo
      : "/admin";
  }

  if (
    redirectTo === "/dashboard" ||
    redirectTo === "/create" ||
    redirectTo === "/projects" ||
    redirectTo === "/shorts/wizard"
  ) {
    return redirectTo;
  }

  return "/dashboard";
}
