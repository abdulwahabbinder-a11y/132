import { Img, interpolate, useCurrentFrame } from "remotion";
import type { LocationCoordinates } from "../lib/types";

export function MapSequence({
  coordinates,
  mapboxToken
}: {
  coordinates?: LocationCoordinates | null;
  mapboxToken?: string;
}) {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 90], [3.5, 6.2], {
    extrapolateRight: "clamp"
  });

  if (!coordinates) {
    return null;
  }

  const mapboxUrl = mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${coordinates.longitude},${coordinates.latitude},${zoom.toFixed(2)},0/900x500@2x?access_token=${mapboxToken}`
    : null;

  return (
    <div
      style={{
        position: "absolute",
        right: 64,
        top: 64,
        height: 360,
        width: 560,
        overflow: "hidden",
        borderRadius: 32,
        border: "1px solid rgba(255,255,255,0.15)",
        background: "#020617",
        boxShadow: "0 30px 80px rgba(0,0,0,0.45)"
      }}
    >
      {mapboxUrl ? (
        <Img
          src={mapboxUrl}
          style={{ height: "100%", width: "100%", objectFit: "cover", opacity: 0.8 }}
        />
      ) : (
        <div
          style={{
            position: "relative",
            height: "100%",
            width: "100%",
            background:
              "radial-gradient(circle at center, rgba(244,193,93,0.25), transparent 18rem)"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
              backgroundSize: "48px 48px"
            }}
          />
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          borderRadius: 16,
          background: "rgba(0,0,0,0.7)",
          padding: "12px 16px"
        }}
      >
        <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.25em", color: "#f4c15d" }}>
          Geopolitical map
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: "white" }}>
          {coordinates.label ?? "Location"}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "#cbd5e1" }}>
          {coordinates.latitude.toFixed(3)}, {coordinates.longitude.toFixed(3)}
        </p>
      </div>
    </div>
  );
}
