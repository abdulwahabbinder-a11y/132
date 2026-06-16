export const motionPresets = {
  editorialSpring: {
    type: "spring",
    stiffness: 92,
    damping: 18,
    mass: 0.9
  },
  lowerThirdReveal: {
    initial: { opacity: 0, y: 42, filter: "blur(12px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  },
  mapPush: {
    initial: { scale: 1.08, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] }
  }
} as const;
