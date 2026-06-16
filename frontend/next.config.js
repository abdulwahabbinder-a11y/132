/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.wikimedia.org" },
      { protocol: "https", hostname: "**.pexels.com" },
      { protocol: "https", hostname: "**.pixabay.com" },
      { protocol: "https", hostname: "archive.org" },
    ],
  },
};

module.exports = nextConfig;
