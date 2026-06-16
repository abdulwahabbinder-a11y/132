import React from "react";
import { motion } from "framer-motion";

/**
 * Typographic overlay using Motion.dev (Framer Motion) configuration to drive
 * smooth procedural entrance animations layered on top of Remotion's timeline.
 */
export const TitleOverlay: React.FC<{
  title: string;
  subtitle?: string;
}> = ({ title, subtitle }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(180deg, rgba(7,10,18,0.2), rgba(7,10,18,0.75))",
      }}
    >
      <motion.h1
        initial={{ opacity: 0, y: 40, letterSpacing: "0.4em" }}
        animate={{ opacity: 1, y: 0, letterSpacing: "0.05em" }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          color: "#fff",
          fontSize: 110,
          fontWeight: 900,
          textAlign: "center",
          maxWidth: "80%",
          fontFamily: "Inter, system-ui, sans-serif",
          textShadow: "0 6px 30px rgba(0,0,0,0.8)",
        }}
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          style={{
            color: "#ffb347",
            fontSize: 38,
            marginTop: 24,
            fontWeight: 600,
          }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
};
