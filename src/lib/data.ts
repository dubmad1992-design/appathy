import { prisma } from "@/lib/prisma";

export async function getSiteSettings() {
  return (
    (await prisma.siteSettings.findFirst()) ??
    prisma.siteSettings.create({
      data: {
        siteName: "Appathy",
        siteTagline: "Websites, forms, and systems for UK businesses."
      }
    })
  );
}

export async function getHomepageContent() {
  return (
    (await prisma.homepageContent.findFirst()) ??
    prisma.homepageContent.create({
      data: {}
    })
  );
}

export async function getPublicApps() {
  return prisma.app.findMany({
    where: { isPublic: true },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { updatedAt: "desc" }]
  });
}

export async function getFeaturedApps() {
  return prisma.app.findMany({
    where: { isPublic: true, featured: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
  });
}

export async function getPublicServices() {
  return prisma.service.findMany({
    where: { isVisible: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
  });
}

export async function getVisibleFaqs() {
  return prisma.fAQ.findMany({
    where: { isVisible: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
  });
}

export async function getVisibleTestimonials() {
  return prisma.testimonial.findMany({
    where: { isVisible: true },
    orderBy: { updatedAt: "desc" }
  });
}

export async function getAnnouncements() {
  return prisma.announcementUpdate.findMany({
    where: { isVisible: true },
    orderBy: { createdAt: "desc" },
    take: 4
  });
}

export async function getPublicSiteData() {
  const [settings, homepage, featuredApps, services, faqs, testimonials, announcements] = await Promise.all([
    getSiteSettings(),
    getHomepageContent(),
    getFeaturedApps(),
    getPublicServices(),
    getVisibleFaqs(),
    getVisibleTestimonials(),
    getAnnouncements()
  ]);

  return {
    settings,
    homepage,
    featuredApps,
    services,
    faqs,
    testimonials,
    announcements
  };
}

export async function getAdminOverviewData() {
  const [apps, enquiries, testimonials, announcements] = await Promise.all([
    prisma.app.findMany({ orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }] }),
    prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.testimonial.count(),
    prisma.announcementUpdate.findMany({ orderBy: { createdAt: "desc" }, take: 5 })
  ]);

  return {
    apps,
    enquiries,
    testimonials,
    announcements,
    metrics: {
      totalApps: apps.length,
      featuredApps: apps.filter((app) => app.featured).length,
      publicApps: apps.filter((app) => app.isPublic).length,
      totalEnquiries: enquiries.length,
      unreadEnquiries: enquiries.filter((item) => item.status === "NEW").length
    }
  };
}
