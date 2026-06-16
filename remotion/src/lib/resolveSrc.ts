import { staticFile } from "remotion";

/**
 * Resolve an asset path that may be:
 *  - a remote URL (served by the backend `/static` mount or a CDN)
 *  - a path inside the Remotion `public/` folder
 */
export function resolveSrc(src: string | null | undefined): string | null {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/static/")) return src;
  try {
    return staticFile(src);
  } catch {
    return src;
  }
}
