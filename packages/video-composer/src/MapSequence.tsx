import { motion } from "motion/react";

export function MapSequence({
  coordinates,
  frameProgress,
}: {
  coordinates: { latitude: number; longitude: number };
  frameProgress: number;
}) {
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN ?? "mapbox-placeholder";
  const markerX = 50 + ((coordinates.longitude + 180) / 360) * 440;
  const markerY = 50 + ((90 - coordinates.latitude) / 180) * 240;
  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${coordinates.longitude},${coordinates.latitude},3/640x360?access_token=${mapboxToken}`;

  return (
    <div
      style={{
        position: "absolute",
        right: 70,
        top: 60,
        width: 640,
        height: 360,
        borderRadius: 28,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
      }}
    >
      {/* In production, swap this static-map fallback for a Leaflet tile animation worker if interactive map rendering is required. */}
      <img
        src={staticMapUrl}
        alt="Map backdrop"
        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }}
      />
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1 + frameProgress * 0.08, opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          position: "absolute",
          left: markerX,
          top: markerY,
          width: 18,
          height: 18,
          borderRadius: 9999,
          background: "#22d3ee",
          boxShadow: "0 0 0 14px rgba(34,211,238,0.18)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 18,
          left: 18,
          padding: "10px 14px",
          borderRadius: 18,
          background: "rgba(2,6,23,0.75)",
          fontSize: 18,
          color: "white",
        }}
      >
        {coordinates.latitude.toFixed(2)}, {coordinates.longitude.toFixed(2)}
      </div>
    </div>
  );
}
