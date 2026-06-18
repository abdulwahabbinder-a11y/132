/** Safe post-login redirect — only same-origin paths */
export function getSafeRedirect(
  raw: string | null | undefined,
  fallback = "/create"
): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (raw.startsWith("/auth/")) return fallback;
  return raw;
}
