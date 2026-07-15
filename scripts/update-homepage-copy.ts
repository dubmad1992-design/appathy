import { PrismaClient, PublishStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.homepageContent.findFirst();

  const data = {
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
  };

  if (existing) {
    await prisma.homepageContent.update({ where: { id: existing.id }, data });
  } else {
    await prisma.homepageContent.create({ data });
  }

  const existingSettings = await prisma.siteSettings.findFirst();
  const settingsData = {
    siteTagline: "Websites, forms, and systems for UK businesses.",
    seoTitleDefault: "Appathy | Websites, forms, and systems for UK businesses",
    seoDescription:
      "Appathy designs and builds websites, digital forms, and small internal tools for local UK businesses.",
    footerBlurb: "Appathy builds and looks after websites, forms, and systems for local businesses."
  };

  if (existingSettings) {
    await prisma.siteSettings.update({ where: { id: existingSettings.id }, data: settingsData });
  }

  console.log("Homepage copy and site settings updated.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
