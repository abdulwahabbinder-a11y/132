import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { LocationCoordinates } from "../types";

interface Props {
  coordinates: LocationCoordinates;
  frame: number;
  fps: number;
}

/**
 * GeopoliticalMap renders an animated map sequence using Mapbox Static API.
 * The map zooms in over the scene duration for a cinematic flyover effect.
 */
export const GeopoliticalMap: React.FC<Props> = ({ coordinates, frame, fps }) => {
  const { lat, lng, zoom: targetZoom, label } = coordinates;
  const MAPBOX_TOKEN = process.env.REMOTION_MAPBOX_TOKEN || "";

  // Animate zoom from world view to target
  const animatedZoom = interpolate(frame, [0, fps * 3], [1.5, targetZoom], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const roundedZoom = Math.round(animatedZoom * 10) / 10;

  // Build Mapbox Static API URL
  const mapStyle = "mapbox/dark-v11";
  const width = 2560;
  const height = 1080;
  const mapUrl = MAPBOX_TOKEN
    ? `https://api.mapbox.com/styles/v1/${mapStyle}/static/${lng},${lat},${roundedZoom},0/${width}x${height}?access_token=${MAPBOX_TOKEN}&attribution=false&logo=false`
    : null;

  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity }}>
      {mapUrl ? (
        <img
          src={mapUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          alt={label}
        />
      ) : (
        // Fallback when no Mapbox token
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #0a1628 0%, #1a2a3a 50%, #0a1a2a 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
            <div style={{ fontSize: 24, fontFamily: "sans-serif" }}>{label}</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>
              {lat.toFixed(4)}°, {lng.toFixed(4)}°
            </div>
          </div>
        </div>
      )}

      {/* Map overlay gradient for cinematic look */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Animated pin marker */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            opacity: interpolate(frame, [fps * 2, fps * 2.5], [0, 1], { extrapolateRight: "clamp" }),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#ef4444",
              border: "3px solid white",
              boxShadow: "0 0 0 6px rgba(239,68,68,0.3), 0 0 0 12px rgba(239,68,68,0.1)",
            }}
          />
          <div
            style={{
              background: "rgba(0,0,0,0.75)",
              color: "white",
              padding: "4px 12px",
              borderRadius: 4,
              fontSize: 18,
              fontFamily: "sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
