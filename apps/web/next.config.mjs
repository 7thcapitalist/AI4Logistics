/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@ai4l/core",
    "@ai4l/db",
    "@ai4l/fiscal",
    "@ai4l/notifications",
    "@ai4l/ui",
  ],
};

export default nextConfig;
