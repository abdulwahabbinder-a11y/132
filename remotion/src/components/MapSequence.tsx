import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { LocationCoordinates, MapSequence as MapSeq } from "../types";

/**
 * Animated geopolitical map overlay. Uses the Mapbox Static Images API to fetch
 * a frame for the active coordinate and animates a marker + fly-to feel. When no
 * Mapbox token is present, renders a stylised graticule placeholder so the
 * sequence still composes.
 */
export const MapSequence: React.FC<{
  map: MapSeq;
  location: LocationCoordinates;
}> = ({ map, location }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const appear = spring({ frame, fps, config: { stiffness: 90, damping: 16 } });
  const zoom = interpolate(appear, [0, 1], [map.zoom - 1.2, map.zoom]);

  const staticUrl =
    map.mapbox_token &&
    `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/` +
      `pin-l+e6b34a(${location.lng},${location.lat})/` +
      `${location.lng},${location.lat},${zoom.toFixed(2)},0/` +
      `1280x550@2x?access_token=${map.mapbox_token}`;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          width: width * 0.42,
          height: height * 0.6,
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 30px 80px -30px rgba(0,0,0,0.9)",
          transform: `scale(${interpolate(appear, [0, 1], [0.9, 1])})`,
          opacity: appear,
          background: "#0e1726",
        }}
      >
        {staticUrl ? (
          <Img src={staticUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Graticule />
        )}
      </div>
      {location.label && (
        <div
          style={{
            marginTop: 18,
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: 30,
            color: "#fff",
            opacity: appear,
            textShadow: "0 2px 12px rgba(0,0,0,0.8)",
          }}
        >
          {location.label}
        </div>
      )}
    </AbsoluteFill>
  );
};

const Graticule: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundImage:
        "linear-gradient(rgba(91,157,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(91,157,255,0.18) 1px, transparent 1px)",
      backgroundSize: "40px 40px",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "#e6b34a",
        boxShadow: "0 0 0 8px rgba(230,179,74,0.25)",
      }}
    />
  </AbsoluteFill>
);
