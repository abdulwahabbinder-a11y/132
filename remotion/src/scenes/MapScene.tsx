import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/**
 * Animated geopolitical map sequence.
 *
 * Uses the Mapbox Static Images API to fetch a dark cinematic basemap centered
 * on the scene's [lng, lat], then animates a cinematic push-in plus a pulsing
 * location marker. Falls back to a stylized grid when no token is provided.
 */
export const MapScene: React.FC<{
  coordinates: [number, number];
  mapboxToken: string;
  label?: string | null;
  durationInFrames: number;
}> = ({ coordinates, mapboxToken, label, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const [lng, lat] = coordinates;

  const zoom = 4.5;
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.25], {
    extrapolateRight: "clamp",
  });

  const pulse = spring({ frame, fps, config: { damping: 6, mass: 0.6 } });

  const mapUrl = mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/` +
      `${lng},${lat},${zoom},0/${Math.round(width / 2)}x${Math.round(
        height / 2
      )}@2x?access_token=${mapboxToken}`
    : null;

  return (
    <AbsoluteFill style={{ backgroundColor: "#070a12", overflow: "hidden" }}>
      {mapUrl ? (
        <Img
          src={mapUrl}
          style={{
            width,
            height,
            objectFit: "cover",
            transform: `scale(${scale})`,
          }}
        />
      ) : (
        <AbsoluteFill
          style={{
            backgroundImage:
              "linear-gradient(rgba(47,139,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(47,139,255,0.12) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            transform: `scale(${scale})`,
          }}
        />
      )}

      {/* Pulsing marker at the map center. */}
      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <div
          style={{
            width: 28 + pulse * 24,
            height: 28 + pulse * 24,
            borderRadius: "50%",
            background: "rgba(255,179,71,0.25)",
            border: "3px solid #ffb347",
            boxShadow: "0 0 40px rgba(255,179,71,0.6)",
          }}
        />
      </AbsoluteFill>

      {label && (
        <div
          style={{
            position: "absolute",
            bottom: 200,
            width: "100%",
            textAlign: "center",
            color: "#fff",
            fontSize: 54,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            textShadow: "0 4px 20px rgba(0,0,0,0.9)",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {label}
        </div>
      )}
    </AbsoluteFill>
  );
};
