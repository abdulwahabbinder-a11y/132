type GeoPoliticalMapProps = {
  token: string;
  lat: number;
  lng: number;
};

export function GeoPoliticalMap({ token, lat, lng }: GeoPoliticalMapProps) {
  const src = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+3b82f6(${lng},${lat})/${lng},${lat},3.2,0/540x280?access_token=${token}`;
  return (
    <img
      src={src}
      alt="Geopolitical location map"
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}
