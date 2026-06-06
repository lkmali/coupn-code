import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Emit a fully static site to UI/out on `next build`, so the Express backend
  // can serve it from the same origin (no separate Next server, no extra port).
  // Safe here because the app is 100% client-side (no SSR / server actions /
  // route handlers / dynamic params).
  output: "export",
  // Static export cannot run the on-the-fly image optimizer.
  images: { unoptimized: true },
  // Pin the workspace root to this UI app (the backend repo above also has a
  // lockfile, which otherwise makes Next guess the wrong root).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
