/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Yeh lazmi 'export' hona chahiye taake 'out' folder bane!
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
};

module.exports = nextConfig;
