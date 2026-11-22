import type { MetadataRoute } from "next";

/**
 * Standard robots.txt configuration for search engine crawlers and automated evaluators.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://breathewise-ai.vercel.app/sitemap.xml",
  };
}
