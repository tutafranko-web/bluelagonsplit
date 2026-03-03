import { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog-data";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://maxnautica.hr";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["hr", "en"];
  const staticPages = [
    { path: "", changeFreq: "weekly" as const, priority: 1.0 },
    { path: "/tours", changeFreq: "monthly" as const, priority: 0.9 },
    { path: "/tours/split-tour", changeFreq: "monthly" as const, priority: 0.9 },
    { path: "/tours/trogir-tour", changeFreq: "monthly" as const, priority: 0.9 },
    { path: "/private-tours", changeFreq: "monthly" as const, priority: 0.7 },
    { path: "/restaurant", changeFreq: "monthly" as const, priority: 0.7 },
    { path: "/gallery", changeFreq: "monthly" as const, priority: 0.6 },
    { path: "/pricing", changeFreq: "monthly" as const, priority: 0.8 },
    { path: "/about", changeFreq: "monthly" as const, priority: 0.6 },
    { path: "/contact", changeFreq: "monthly" as const, priority: 0.6 },
    { path: "/blog", changeFreq: "weekly" as const, priority: 0.7 },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const page of staticPages) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFreq,
        priority: page.priority,
      });
    }
  }

  for (const post of blogPosts) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
