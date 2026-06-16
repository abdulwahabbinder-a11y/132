import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneData } from "../types";

interface MapSequenceProps {
  scene: SceneData;
  mapboxToken?: string;
}

export const MapSequence: React.FC<MapSequenceProps> = ({ scene, mapboxToken }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  if (!scene.location_coordinates) return null;

  const { lat, lng, label } = scene.location_coordinates;

  const zoom = interpolate(frame, [0, durationInFrames], [3, 8], {
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const mapUrl = mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${lng},${lat},${zoom},0/1280x720@2x?access_token=${mapboxToken}`
    : `https://tile.openstreetmap.org/static/${lat}/${lng}/8/128/85.png`;

  return (
    <AbsoluteFill style={{ opacity }}>
      <img
        src={mapUrl}
        alt={label || "Map"}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "brightness(0.6) saturate(0.8)",
        }}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: 120,
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.75)",
            padding: "12px 28px",
            borderRadius: 4,
            borderLeft: "3px solid #e63946",
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: 28,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {label || `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`}
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
