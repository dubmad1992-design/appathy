import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apps = await prisma.app.findMany({
    where: { isPublic: true },
    select: { slug: true, updatedAt: true }
  });

  const base = "https://appathy.uk";
  const core = ["", "/apps", "/services", "/contact", "/faq"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date()
  }));

  const appPages = apps.map((app) => ({
    url: `${base}/apps/${app.slug}`,
    lastModified: app.updatedAt
  }));

  return [...core, ...appPages];
}
