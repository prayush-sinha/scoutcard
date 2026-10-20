/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // Silence the monorepo lockfile warning — the backend package-lock.json is not ours.
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "media.valorant-api.com" },
    ],
  },
};

export default nextConfig;
