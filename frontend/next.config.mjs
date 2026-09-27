/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.discordapp.com" }],
  },
};

export default nextConfig;
