import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { motion } from "framer-motion";

interface GeoPoint {
  lon: number;
  lat: number;
  label?: string | null;
}

interface Props {
  points: GeoPoint[];
  mapboxToken: string;
  zoom?: number;
  width?: number;
  height?: number;
}

/**
 * Animated map sequence rendered via the Mapbox Static Images API so we don't
 * need WebGL / `mapbox-gl` headless inside Remotion. Pans between consecutive
 * coordinates with a smooth Motion.dev transition.
 */
export const MapSequence: React.FC<Props> = ({
  points,
  mapboxToken,
  zoom = 4,
  width = 1280,
  height = 720,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  if (!points.length || !mapboxToken) return null;

  const segLen = durationInFrames / Math.max(1, points.length);
  const idx = Math.min(points.length - 1, Math.floor(frame / segLen));
  const next = points[Math.min(points.length - 1, idx + 1)] ?? points[idx];
  const cur = points[idx];

  const localT = (frame - idx * segLen) / segLen;
  const lon = cur.lon + (next.lon - cur.lon) * localT;
  const lat = cur.lat + (next.lat - cur.lat) * localT;

  const markersPath = points
    .map((p) => `pin-s-circle+ff5500(${p.lon},${p.lat})`)
    .join(",");

  const url =
    `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/` +
    `${markersPath}/${lon},${lat},${zoom},0/${width}x${height}@2x?access_token=${mapboxToken}`;

  const opacity = interpolate(frame, [0, 15, durationInFrames - 15, durationInFrames], [0, 0.92, 0.92, 0]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "flex-end",
        padding: 60,
        pointerEvents: "none",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          width: 560,
          height: 320,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 30px 60px rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        <Img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {cur.label ? (
          <div
            style={{
              position: "absolute",
              left: 16,
              top: 12,
              padding: "4px 10px",
              background: "rgba(0,0,0,0.7)",
              color: "#fff",
              fontSize: 18,
              fontFamily: "Inter, sans-serif",
              borderRadius: 4,
            }}
          >
            {cur.label}
          </div>
        ) : null}
      </motion.div>
    </AbsoluteFill>
  );
};
