import { staticFile } from "remotion";

/**
 * Resolve pipeline asset paths for Remotion render.
 * - http(s) URLs pass through unchanged
 * - Relative paths (jobs/{id}/...) resolve via staticFile() from public/
 */
export function assetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.replace(/^\//, "");
  return staticFile(normalized);
}
