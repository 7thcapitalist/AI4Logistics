/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@ai4l/core",
    "@ai4l/db",
    "@ai4l/fiscal",
    "@ai4l/notifications",
    "@ai4l/ui",
  ],
  // Linting is a turbo task of its own (`pnpm lint`, root .eslintrc.cjs). Running
  // it again inside `next build` would need eslint-config-next, which this repo
  // does not use, and would fail the build for a reason the build is not about.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
