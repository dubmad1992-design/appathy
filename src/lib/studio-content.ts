export type StudioCaseStudy = {
  slug: string;
  name: string;
  category: string;
  summary: string;
  outcome: string;
  href: string;
  linkLabel: string;
  status: string;
  accentClass: string;
  imageSrc?: string;
  featureList: string[];
  metricLabel: string;
  metricValue: string;
  note: string;
};

export type ProjectProfile = {
  strapline: string;
  summary: string;
  outcome: string;
  featureList: string[];
  previewNav: string[];
  previewMetrics: Array<{ label: string; value: string }>;
  footer: string;
  accentClass: string;
};

export const homeStats = [
  { value: "Websites", label: "Clear, modern sites built around the offer." },
  { value: "Integrations", label: "Connect the tools you already use." },
  { value: "Digital forms", label: "Replace paper and messy admin." }
];

export const serviceThemes = [
  "Websites",
  "System integration",
  "Digital forms",
  "Dashboards",
  "Automation",
  "Support"
];

export const studioCapabilities = [
  "Service websites",
  "Portfolio websites",
  "Digital forms",
  "Internal dashboards",
  "System integrations",
  "Small web apps"
];

export const studioProcess = [
  {
    step: "01",
    title: "Review",
    body: "Look at what is working, what is clunky, and what needs to change."
  },
  {
    step: "02",
    title: "Design",
    body: "Shape a simpler flow with a cleaner front end."
  },
  {
    step: "03",
    title: "Build",
    body: "Develop the site, form, or tool so it works properly."
  },
  {
    step: "04",
    title: "Launch",
    body: "Go live, then improve it where needed."
  }
];

export const contactChecklist = [
  "New website",
  "Website refresh",
  "Digital forms",
  "System integration",
  "Portal or dashboard"
];

export const signatureCaseStudy: StudioCaseStudy = {
  slug: "macauley-raw",
  name: "Macauley Raw",
  category: "Reference project",
  summary: "A visual-first portfolio site with a stronger sense of style.",
  outcome: "A good example of a more design-led front end.",
  href: "https://macauleyraw.appathy.uk/",
  linkLabel: "Visit live project",
  status: "Live reference",
  accentClass: "from-[#08100e] via-[#102f28] to-[#050606]",
  imageSrc: "/uploads/main-hero.png",
  featureList: ["Art direction", "Portfolio browsing", "Distinct identity", "Contact route"],
  metricLabel: "Use case",
  metricValue: "Design-led portfolio site",
  note: "Useful as a visual reference."
};

export const projectProfilesBySlug: Record<string, ProjectProfile> = {
  appathy: {
    strapline: "Studio site and admin layer",
    summary: "A service site with private admin tools behind it.",
    outcome: "Public-facing pages plus useful internal support.",
    featureList: ["Homepage", "Lead flow", "Admin access", "Content updates", "Support"],
    previewNav: ["Services", "Portfolio", "Forms", "Contact"],
    previewMetrics: [
      { label: "Offer", value: "Web + systems" },
      { label: "Stack", value: "Next.js + Prisma" },
      { label: "Style", value: "Colourful" }
    ],
    footer: "Built to sell the service and support the work behind it.",
    accentClass: "from-[#ff8fb8] via-[#3d1424] to-[#0d0709]"
  },
  scfcooling: {
    strapline: "Business website and enquiry flow",
    summary: "A service website focused on clarity and enquiries.",
    outcome: "Simple customer journey with practical backend support.",
    featureList: ["Service pages", "Enquiry flow", "Backend API", "Support", "Deployment"],
    previewNav: ["Services", "Sectors", "Enquire", "Support"],
    previewMetrics: [
      { label: "Type", value: "Service website" },
      { label: "Focus", value: "Portfolio" },
      { label: "Support", value: "Live and managed" }
    ],
    footer: "A good example of clear front-end work backed by useful systems.",
    accentClass: "from-[#ff8fb8] via-[#3d1424] to-[#0d0709]"
  },
  tattoostudio: {
    strapline: "Business website for a tattoo studio",
    summary: "A dark, visual-first marketing site for 40s Ink Tattoo Studio in South Wales. Gallery filtering by style, artist profiles, reviews, FAQ, and a booking enquiry form.",
    outcome: "A complete front-end presence that looks the part and turns visitors into bookings.",
    featureList: ["Filterable gallery", "Artist profiles", "Booking enquiry form", "Mobile-first design"],
    previewNav: ["Gallery", "Artists", "Styles", "Book"],
    previewMetrics: [
      { label: "Type", value: "Business website" },
      { label: "Stack", value: "HTML · CSS · JS" },
      { label: "Status", value: "Live" }
    ],
    footer: "A strong example of design-led work for a service business.",
    accentClass: "from-[#ff8fb8] via-[#3d1424] to-[#0d0709]"
  },
  gaming: {
    strapline: "Brand website for a gaming organisation",
    summary: "A dark, energetic brand site for Appathy Esports — a UK-based competitive gaming organisation fielding squads in CS2 and Rocket League.",
    outcome: "A clear public home for the org that covers the roster, results, and news in one place.",
    featureList: ["Roster & results", "News updates", "Brand identity", "Mobile-friendly layout"],
    previewNav: ["Roster", "Results", "News", "About"],
    previewMetrics: [
      { label: "Type", value: "Brand website" },
      { label: "Stack", value: "HTML · CSS · JS" },
      { label: "Status", value: "Live" }
    ],
    footer: "A good example of a fast, identity-led brand build.",
    accentClass: "from-[#ff8fb8] via-[#3d1424] to-[#0d0709]"
  },
  linc: {
    strapline: "Multi-page B2B business website",
    summary: "A full marketing site for Linc Group, a telecoms, security, and energy provider serving businesses across Wales and the UK for over 35 years.",
    outcome: "A structured, multi-service site that makes an established B2B offer easy to navigate.",
    featureList: ["11 service pages", "Telecoms & connectivity", "CCTV & security", "Energy management"],
    previewNav: ["Telecoms", "Security", "Energy", "Portal"],
    previewMetrics: [
      { label: "Type", value: "Business website" },
      { label: "Stack", value: "HTML · CSS · JS" },
      { label: "Status", value: "Live" }
    ],
    footer: "A strong example of a larger, structured business site.",
    accentClass: "from-[#ff8fb8] via-[#3d1424] to-[#0d0709]"
  }
};

export function getProjectProfile(slug: string): ProjectProfile {
  return (
    projectProfilesBySlug[slug] ?? {
      strapline: "Custom web build",
      summary: "A tailored build shaped around the business and the workflow.",
      outcome: "Clearer for visitors and more useful behind the scenes.",
      featureList: ["Responsive front end", "Forms", "Clear structure", "Maintainable code"],
      previewNav: ["Services", "Process", "Support", "Contact"],
      previewMetrics: [
        { label: "Approach", value: "Tailored" },
        { label: "Output", value: "Website or tool" },
        { label: "Result", value: "Cleaner workflow" }
      ],
      footer: "Built around the problem first.",
      accentClass: "from-[#ff8fb8] via-[#3d1424] to-[#0d0709]"
    }
  );
}
