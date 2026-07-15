import { AppStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.app.upsert({
    where: { slug: "gaming" },
    update: {},
    create: {
      name: "Appathy Esports",
      slug: "gaming",
      category: "Personal project",
      shortDescription: "Home for Appathy's competitive gaming brand — roster, results, and latest news.",
      longDescription:
        "A brand site for Appathy Esports, a UK-based competitive gaming organisation fielding squads in CS2 and Rocket League. Covers the roster, results, news, and tryout routes for the org.",
      status: AppStatus.LIVE,
      liveUrl: "https://appathy.uk/gaming/",
      featured: true,
      isPublic: true,
      deployPath: "/var/www/gaming",
      runtime: "Static site",
      screenshotUrls: [],
      sortOrder: 3
    }
  });

  await prisma.app.upsert({
    where: { slug: "linc" },
    update: {},
    create: {
      name: "Linc Group",
      slug: "linc",
      category: "Business website",
      shortDescription: "Multi-page B2B website for a telecoms, security, and energy provider serving businesses across Wales and the UK.",
      longDescription:
        "A full multi-page marketing site for Linc Group, covering connectivity and full fibre, telecoms, CCTV and security, energy management, EPOS and merchant services, business mobiles, guest WiFi, print, and a customer portal entry point — built to demonstrate a larger, structured business site.",
      status: AppStatus.LIVE,
      liveUrl: "https://appathy.uk/linc/",
      featured: true,
      isPublic: true,
      deployPath: "/var/www/linc",
      runtime: "Static site",
      screenshotUrls: [],
      sortOrder: 4
    }
  });

  console.log("Upserted gaming and linc App rows.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
