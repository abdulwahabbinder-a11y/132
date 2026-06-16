/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.wikimedia.org" },
      { protocol: "https", hostname: "**.archive.org" },
      { protocol: "https", hostname: "**.pexels.com" },
      { protocol: "https", hostname: "**.pixabay.com" },
    ],
  },
};

module.exports = nextConfig;
