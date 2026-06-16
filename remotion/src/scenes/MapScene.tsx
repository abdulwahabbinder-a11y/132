import React from "react";
import { AbsoluteFill, Audio } from "remotion";
import { motion } from "framer-motion";
import { MapWaypoint, SceneProps } from "../types";
import { MapAnimation } from "../components/MapAnimation";

type Props = {
  scene: SceneProps;
  mapPath: MapWaypoint[];
  mapboxToken: string;
};

/**
 * Geopolitical map scene — uses the global camera path but biases the centre
 * toward this scene's `location_coordinates`.
 */
export const MapScene: React.FC<Props> = ({ scene, mapPath, mapboxToken }) => {
  const localPath: MapWaypoint[] =
    scene.location_coordinates
      ? [
          {
            lng: scene.location_coordinates[0],
            lat: scene.location_coordinates[1],
            zoom: 6.2,
            bearing: 0,
            pitch: 35,
          },
          {
            lng: scene.location_coordinates[0],
            lat: scene.location_coordinates[1],
            zoom: 7.5,
            bearing: 18,
            pitch: 55,
          },
        ]
      : mapPath;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0f1a" }}>
      <MapAnimation waypoints={localPath} mapboxToken={mapboxToken} />

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
        style={{
          position: "absolute",
          top: 80,
          left: 80,
          background: "rgba(0,0,0,0.55)",
          padding: "12px 22px",
          borderRadius: 8,
          color: "#fff",
          fontFamily: "Inter",
          fontSize: 32,
          fontWeight: 600,
        }}
      >
        {scene.location_coordinates
          ? `Lat ${scene.location_coordinates[1].toFixed(3)} · Lng ${scene.location_coordinates[0].toFixed(3)}`
          : "Geopolitical context"}
      </motion.div>

      {scene.narration_audio_url && <Audio src={scene.narration_audio_url} />}
    </AbsoluteFill>
  );
};
