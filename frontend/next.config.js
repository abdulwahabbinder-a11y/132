/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  async rewrites() {
    // Proxy /api/* to the FastAPI backend during local dev.
    const backend = process.env.BACKEND_URL || "http://localhost:8000";
    return [{ source: "/backend/:path*", destination: `${backend}/api/:path*` }];
  },
};

module.exports = nextConfig;
