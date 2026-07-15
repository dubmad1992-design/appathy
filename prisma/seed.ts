import { AppStatus, EnquiryStatus, PrismaClient, PublishStatus, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.contactSubmission.deleteMany();
  await prisma.announcementUpdate.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.fAQ.deleteMany();
  await prisma.service.deleteMany();
  await prisma.app.deleteMany();
  await prisma.homepageContent.deleteMany();
  await prisma.siteSettings.deleteMany();
  await prisma.user.deleteMany();

  // Seed credentials are for local/e2e databases only — never reuse real ones.
  const seedPassword = process.env.SEED_ADMIN_PASSWORD ?? "e2e-local-admin-password";
  const passwordHash = await bcrypt.hash(seedPassword, 10);

  await prisma.user.create({
    data: {
      name: "Appathy Admin",
      email: "admin@appathy.local",
      passwordHash,
      role: Role.SUPER_ADMIN,
      status: UserStatus.active
    }
  });

  await prisma.user.createMany({
    data: [
      {
        name: "Nina Patel",
        email: "editor@appathy.dev",
        passwordHash,
        role: Role.EDITOR,
        status: UserStatus.active
      },
      {
        name: "Owen Reed",
        email: "viewer@appathy.dev",
        passwordHash,
        role: Role.VIEWER,
        status: UserStatus.active
      }
    ]
  });

  await prisma.siteSettings.create({
    data: {
      siteName: "Appathy",
      siteTagline: "Websites, forms, and systems for UK businesses.",
      contactEmail: "dubmad1992@gmail.com",
      seoTitleDefault: "Appathy | Websites, forms, and systems for UK businesses",
      seoDescription: "Appathy designs and builds websites, digital forms, and small internal tools for local UK businesses.",
      footerBlurb: "Appathy builds and looks after websites, forms, and systems for local businesses.",
      socialGithub: "https://github.com/appathy",
      status: PublishStatus.active
    }
  });

  await prisma.homepageContent.create({
    data: {
      heroEyebrow: "Independent web studio",
      heroTitle: "Websites, forms, and systems for UK businesses.",
      heroDescription:
        "Appathy designs and builds sites, digital forms, and small internal tools for local businesses that want to look sharp online and stop losing time to messy admin.",
      primaryCtaLabel: "Start a project",
      secondaryCtaLabel: "View the work",
      introTitle: "What Appathy does",
      introBody:
        "Appathy builds business and portfolio websites, moves paper processes into simple online forms, and connects the tools you already use — all hosted and kept running afterwards.",
      aboutTitle: "A practical web partner for real businesses",
      aboutBody:
        "Appathy is one person who designs, builds, hosts, and maintains the site or system end to end — no handoffs, no jargon, just a clear plan and a build that works.",
      contactTitle: "Tell me what needs building",
      contactBody:
        "If you need a new website, a form to replace a paper process, or a system tying a few tools together, send the outline and I will reply with the next step.",
      status: PublishStatus.published
    }
  });

  await prisma.app.createMany({
    data: [
      {
        name: "Appathy",
        slug: "appathy",
        category: "Platform",
        shortDescription: "Control panel and public website for managing products on the VPS.",
        longDescription:
          "Appathy is the control layer for the rest of the apps on the server. It combines a clean public-facing site, lightweight content management, and guided operational tooling in one place.",
        status: AppStatus.LIVE,
        versionNotes: "Refined control panel, live health checks, guided restart flow, and content editing.",
        internalNotes: "Primary control plane. Keep this lean and trustworthy.",
        logoUrl: "/uploads/appathy-mark.svg",
        screenshotUrls: ["/uploads/appathy-dashboard.png"],
        liveUrl: "https://appathy.uk",
        adminUrl: "https://appathy.uk/admin",
        repositoryUrl: "https://github.com/appathy/appathy",
        featured: true,
        isPublic: true,
        processName: "appathy",
        deployPath: "/root/appathy",
        runtime: "Next.js + PM2",
        port: 3004,
        healthUrl: "https://appathy.uk/api/health",
        sortOrder: 1
      },
      {
        name: "SCFCooling",
        slug: "scfcooling",
        category: "Business Website",
        shortDescription: "Lead-generation site and backend API for a cooling services business.",
        longDescription:
          "SCFCooling is a practical service website with a live enquiry flow and an API process managed through PM2.",
        status: AppStatus.LIVE,
        versionNotes: "Stable production service with PM2-managed API.",
        internalNotes: "Frontend is served by Nginx. API process is the managed runtime.",
        logoUrl: "/uploads/scfcooling-logo.svg",
        screenshotUrls: ["/uploads/scfcooling-home.png"],
        liveUrl: "http://185.230.217.175/SCFCooling/",
        repositoryUrl: "https://github.com/appathy/scfcooling",
        featured: true,
        isPublic: true,
        processName: "scfcooling-api",
        deployPath: "/var/www/SCFCooling-Form",
        runtime: "Static frontend + PM2 API",
        port: 3001,
        healthUrl: "http://185.230.217.175/SCFCooling/",
        sortOrder: 2
      }
    ]
  });

  await prisma.service.createMany({
    data: [
      {
        title: "App design and build",
        slug: "app-design-build",
        shortDescription: "Product-minded web apps with clear flows, strong structure, and maintainable code.",
        startingPrice: "From £1,500",
        ctaLabel: "Discuss an app",
        isVisible: true,
        sortOrder: 1,
        status: PublishStatus.active
      },
      {
        title: "Website refresh and launch",
        slug: "website-refresh-launch",
        shortDescription: "Simple, premium websites that explain the offer quickly and convert interest into enquiries.",
        startingPrice: "From £750",
        ctaLabel: "Refresh a site",
        isVisible: true,
        sortOrder: 2,
        status: PublishStatus.active
      },
      {
        title: "VPS app management",
        slug: "vps-app-management",
        shortDescription: "Control, visibility, and guided operations for the apps already running on your server.",
        startingPrice: "From £250 / month",
        ctaLabel: "Improve operations",
        isVisible: true,
        sortOrder: 3,
        status: PublishStatus.active
      }
    ]
  });

  await prisma.testimonial.createMany({
    data: [
      {
        quote: "Appathy made the whole product feel clearer, lighter, and easier to maintain without overcomplicating it.",
        authorName: "Marcus Hill",
        role: "Founder",
        company: "Northline Studio",
        isVisible: true,
        status: PublishStatus.published
      },
      {
        quote: "The backend became far more usable. We finally had one place to manage the moving parts without losing track.",
        authorName: "Leah Dawson",
        role: "Operations Lead",
        company: "Fieldcore Services",
        isVisible: true,
        status: PublishStatus.published
      }
    ]
  });

  await prisma.fAQ.createMany({
    data: [
      {
        question: "What does Appathy build?",
        answer: "Appathy builds apps, websites, internal tools, and lightweight control panels for teams that want simpler systems.",
        isVisible: true,
        sortOrder: 1,
        status: PublishStatus.published
      },
      {
        question: "Can Appathy manage apps already running on a VPS?",
        answer: "Yes. Appathy can act as a central control layer for deployed apps, including monitoring, guided restarts, and structured content management.",
        isVisible: true,
        sortOrder: 2,
        status: PublishStatus.published
      },
      {
        question: "Is the admin portal private?",
        answer: "Yes. The admin side is protected with authenticated access and role-based permissions.",
        isVisible: true,
        sortOrder: 3,
        status: PublishStatus.published
      }
    ]
  });

  await prisma.announcementUpdate.createMany({
    data: [
      {
        title: "Control panel rebuilt",
        body: "The Appathy backend now focuses on the apps running on this VPS, with guided operational actions and cleaner content editing.",
        isVisible: true,
        status: PublishStatus.published
      },
      {
        title: "Assistant actions enabled",
        body: "Restart with confirmation, health checks, and live log inspection are now available from the admin control panel.",
        isVisible: true,
        status: PublishStatus.published
      }
    ]
  });

  await prisma.contactSubmission.createMany({
    data: [
      {
        name: "Amira Stone",
        email: "amira@stoneworks.co",
        company: "Stoneworks",
        message: "We need a cleaner website plus a private portal for updating products and leads.",
        interestType: "Website + portal",
        internalNotes: "Strong fit for a studio site + admin layer.",
        status: EnquiryStatus.NEW
      },
      {
        name: "Jordan Blake",
        email: "jordan@peakflow.io",
        company: "Peakflow",
        message: "We already have a few apps live on a VPS and need one place to manage visibility, links, and basic operations.",
        interestType: "VPS management",
        internalNotes: "Mention managed app registry and guided AI actions.",
        status: EnquiryStatus.READ
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
