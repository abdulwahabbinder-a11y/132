/** Video duration options per format */

export const VIRAL_DURATION_SECONDS = [
  { value: 15, label: "15 sec" },
  { value: 30, label: "30 sec" },
  { value: 60, label: "1 min" },
  { value: 90, label: "90 sec" },
] as const;

export const DOCUMENTARY_DURATION_MINUTES = [
  { value: 3, label: "3 min" },
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
] as const;

export const LISTICLE_DURATION_MINUTES = [
  { value: 2, label: "2 min" },
  { value: 3, label: "3 min" },
  { value: 5, label: "5 min" },
  { value: 8, label: "8 min" },
  { value: 10, label: "10 min" },
] as const;

export type VideoFormat = "viral" | "documentary" | "listicle";

export function defaultDurationForFormat(format: VideoFormat): number {
  switch (format) {
    case "viral":
      return 60;
    case "documentary":
      return 5;
    case "listicle":
      return 3;
    default:
      return 60;
  }
}

export function durationUnit(format: VideoFormat): "seconds" | "minutes" {
  return format === "viral" ? "seconds" : "minutes";
}

export function formatDurationLabel(format: VideoFormat, value: number): string {
  if (format === "viral") {
    if (value < 60) return `${value} seconds`;
    if (value === 60) return "1 minute";
    return `${value} seconds`;
  }
  return value === 1 ? "1 minute" : `${value} minutes`;
}
