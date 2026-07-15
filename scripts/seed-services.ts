import { PrismaClient, PublishStatus } from "@prisma/client";

const prisma = new PrismaClient();

type Evidence = { name: string; label: string; note: string; href: string; portfolioSlug: string | null };

const services: Array<{
  slug: string;
  title: string;
  strapline: string;
  shortDescription: string;
  description: string;
  whoFor: string;
  bullets: string[];
  ctaLabel: string;
  sortOrder: number;
  evidence: Evidence[];
}> = [
  {
    slug: "websites",
    title: "Websites",
    strapline: "Business & portfolio sites",
    shortDescription:
      "A professional site that looks sharp, loads fast, and makes it easy for visitors to understand what you do and get in touch.",
    description:
      "A site that looks sharp, loads fast, and makes it easy for visitors to understand your offer and get in touch. Built around your business, not a template.",
    whoFor: "Local businesses, trades, freelancers, and studios who need to look professional online and turn visitors into actual enquiries.",
    bullets: ["Structure & layout", "Visual design", "Fully responsive", "Lead capture & forms"],
    ctaLabel: "Plan a website",
    sortOrder: 1,
    evidence: [
      { name: "Macauley Raw", label: "Portfolio site", note: "Art-directed portfolio with a strong visual identity and clean contact route.", href: "https://macauleyraw.appathy.uk/", portfolioSlug: null },
      { name: "40s Ink Tattoo Studio", label: "Business website", note: "Dark, visual-first site with gallery filtering, artist profiles and a booking form.", href: "https://appathy.uk/tattoostudio/", portfolioSlug: "tattoostudio" },
      { name: "Linc Group", label: "B2B business website", note: "Multi-page telecoms, security, and energy site for a 35-year-old business.", href: "https://appathy.uk/linc/", portfolioSlug: "linc" }
    ]
  },
  {
    slug: "forms",
    title: "Digital forms",
    strapline: "Move paper & email online",
    shortDescription: "Replace paper forms, WhatsApp messages, and email chains with clean online forms that get tracked automatically.",
    description:
      "Replace paper trails, WhatsApp messages, and email chains with clean online forms. Submissions are tracked, staff get notified instantly, and nothing falls through the gaps.",
    whoFor: "Businesses still handling job requests, bookings, or enquiries through paper, spreadsheets, or email — where things regularly get missed or delayed.",
    bullets: ["Online form builds", "Admin submission views", "Status tracking", "Follow-up flows"],
    ctaLabel: "Digitise a process",
    sortOrder: 2,
    evidence: [
      { name: "40s Ink Tattoo Studio", label: "Booking enquiry form", note: "Customer-facing booking request form with validation and follow-up route.", href: "https://appathy.uk/tattoostudio/", portfolioSlug: "tattoostudio" },
      { name: "SCF Cooling", label: "Enquiry & job sheet flow", note: "Service enquiry form feeding into a managed job sheet system.", href: "https://scfcooling.co.uk", portfolioSlug: "scfcooling" }
    ]
  },
  {
    slug: "portals",
    title: "Portals & dashboards",
    strapline: "Private tools behind the scenes",
    shortDescription: "Secure admin areas, client portals, and internal dashboards without the cost of off-the-shelf platforms.",
    description:
      "Admin areas, client portals, and internal dashboards that give your team exactly the right visibility — without the cost and complexity of off-the-shelf platforms.",
    whoFor: "Teams that need a secure, password-protected area to manage jobs, content, clients, or reports without paying for bloated SaaS software.",
    bullets: ["Admin areas", "Role-based access", "Content editing", "Operational views & reporting"],
    ctaLabel: "Design a portal",
    sortOrder: 3,
    evidence: [
      { name: "Appathy CRM", label: "Internal portal", note: "Full admin CMS with user roles, content editing, enquiry management and app monitoring.", href: "https://appathy.uk", portfolioSlug: null }
    ]
  },
  {
    slug: "integrations",
    title: "System integration",
    strapline: "Connect what's already there",
    shortDescription: "Connect the tools you already use so data flows properly and nothing needs to be entered twice.",
    description:
      "Most businesses already have the tools — they just don't talk to each other. I connect them so data flows automatically and your team stops entering the same thing twice.",
    whoFor: "Businesses using multiple systems — CRMs, booking tools, job trackers — that don't connect, causing double-entry, missed updates, and manual workarounds.",
    bullets: ["CRM & tool links", "Shared data flows", "Workflow handoff", "Internal API builds"],
    ctaLabel: "Discuss integration",
    sortOrder: 4,
    evidence: [
      { name: "SCF Cooling", label: "Backend API", note: "Custom API connecting the front-end site to job management and reporting workflows.", href: "https://scfcooling.co.uk", portfolioSlug: "scfcooling" }
    ]
  },
  {
    slug: "domains-hosting",
    title: "Domains & hosting",
    strapline: "Keep the site live and looked after",
    shortDescription: "Domain registration, DNS, SSL, and ongoing hosting support so the site stays live without you thinking about it.",
    description:
      "Domain registration, DNS, SSL certificates, server setup and ongoing hosting support. Everything that keeps the lights on without you needing to think about it.",
    whoFor: "Anyone who needs help getting a domain registered, pointed correctly, and their site kept live and secure without dealing with technical setup themselves.",
    bullets: ["Domain setup & transfers", "DNS configuration", "SSL certificates", "VPS hosting & support"],
    ctaLabel: "Sort hosting",
    sortOrder: 5,
    evidence: [
      { name: "All live projects", label: "Hosted & managed", note: "Every project on this portfolio is deployed and maintained on a managed VPS with SSL and DNS.", href: "/apps", portfolioSlug: "scfcooling" }
    ]
  }
];

async function main() {
  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {
        title: service.title,
        strapline: service.strapline,
        shortDescription: service.shortDescription,
        description: service.description,
        whoFor: service.whoFor,
        bullets: service.bullets,
        evidence: service.evidence,
        ctaLabel: service.ctaLabel,
        sortOrder: service.sortOrder,
        isVisible: true,
        status: PublishStatus.active
      },
      create: {
        slug: service.slug,
        title: service.title,
        strapline: service.strapline,
        shortDescription: service.shortDescription,
        description: service.description,
        whoFor: service.whoFor,
        bullets: service.bullets,
        evidence: service.evidence,
        ctaLabel: service.ctaLabel,
        sortOrder: service.sortOrder,
        isVisible: true,
        status: PublishStatus.active
      }
    });
  }

  console.log(`Upserted ${services.length} services.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
