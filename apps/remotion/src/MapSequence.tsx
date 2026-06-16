import { interpolate, useCurrentFrame } from "remotion";

type Props = {
  coordinates: { lat: number; lng: number } | null;
  token: string | null;
};

export function MapSequence({ coordinates, token }: Props) {
  const frame = useCurrentFrame();
  if (!coordinates) {
    return null;
  }

  const opacity = interpolate(frame, [0, 18, 120, 150], [0, 0.82, 0.82, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const scale = interpolate(frame, [0, 150], [1.12, 1.0], { extrapolateRight: "clamp" });
  const mapUrl = token
    ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+7dd3fc(${coordinates.lng},${coordinates.lat})/${coordinates.lng},${coordinates.lat},5,0/720x430@2x?access_token=${token}`
    : null;

  return (
    <div
      style={{
        position: "absolute",
        right: 86,
        top: 86,
        width: 720,
        height: 430,
        borderRadius: 36,
        overflow: "hidden",
        opacity,
        transform: `scale(${scale})`,
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 30px 90px rgba(0,0,0,0.55)"
      }}
    >
      {mapUrl ? (
        <img src={mapUrl} alt="Animated geopolitical map" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div
          style={{
            display: "grid",
            placeItems: "center",
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #0f172a, #020617)",
            color: "#7dd3fc",
            fontFamily: "Inter, sans-serif",
            fontSize: 28
          }}
        >
          {coordinates.lat.toFixed(2)}, {coordinates.lng.toFixed(2)}
        </div>
      )}
    </div>
  );
}
