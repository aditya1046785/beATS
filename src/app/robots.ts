import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: [
          "/dashboard",
          "/onboarding",
          "/processing",
          "/settings",
          "/resume/",
          "/auth/",
          "/api/",
        ],
      },
    ],
    sitemap: "https://beats.cerecrafts.in/sitemap.xml",
  };
}
