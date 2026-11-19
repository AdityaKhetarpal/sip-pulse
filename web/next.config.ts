import type { NextConfig } from "next";

// A static export: the home page is plain HTML on the taste-skill kit (public/index.html, built by
// scripts/build-home.mjs); the inner pages are rendered by Next into out/<page>/index.html.
const nextConfig: NextConfig = { output: "export", trailingSlash: true, images: { unoptimized: true } };

export default nextConfig;
