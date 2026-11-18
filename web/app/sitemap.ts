import type { MetadataRoute } from "next";

const SITE = "https://sip-pulse.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/falls", "/money", "/method"].map((path) => ({ url: `${SITE}${path}`, lastModified: "2026-11-18", changeFrequency: "monthly", priority: path ? 0.7 : 1 }));
}
