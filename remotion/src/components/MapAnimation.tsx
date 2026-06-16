import React, { useEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import mapboxgl from "mapbox-gl";
import { MapWaypoint } from "../types";

type Props = {
  waypoints: MapWaypoint[];
  mapboxToken: string;
};

/**
 * Interpolates a Mapbox GL camera between waypoints as a fly-through,
 * synced to the Remotion frame clock. Motion.dev/Framer Motion easing
 * values are mirrored via Remotion's interpolate for deterministic frames.
 */
export const MapAnimation: React.FC<Props> = ({ waypoints, mapboxToken }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !mapboxToken) return;
    mapboxgl.accessToken = mapboxToken;
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: waypoints[0] ? [waypoints[0].lng, waypoints[0].lat] : [0, 20],
      zoom: waypoints[0]?.zoom ?? 2,
      interactive: false,
    });
  }, [mapboxToken, waypoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || waypoints.length === 0) return;

    const tNorm = interpolate(frame, [0, durationInFrames], [0, 1], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    });
    const segCount = waypoints.length - 1;
    const segIdx = Math.min(Math.floor(tNorm * segCount), segCount - 1);
    const segT = tNorm * segCount - segIdx;

    const a = waypoints[segIdx];
    const b = waypoints[segIdx + 1] ?? a;

    map.jumpTo({
      center: [a.lng + (b.lng - a.lng) * segT, a.lat + (b.lat - a.lat) * segT],
      zoom: a.zoom + (b.zoom - a.zoom) * segT,
      bearing: a.bearing + (b.bearing - a.bearing) * segT,
      pitch: a.pitch + (b.pitch - a.pitch) * segT,
    });
  }, [frame, durationInFrames, waypoints]);

  return (
    <AbsoluteFill>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </AbsoluteFill>
  );
};
