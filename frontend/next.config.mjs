/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // Silence the monorepo lockfile warning — the backend package-lock.json is not ours.
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.discordapp.com" }],
  },
};

export default nextConfig;
