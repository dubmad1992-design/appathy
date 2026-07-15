import { PrismaClient, PublishStatus } from "@prisma/client";

const prisma = new PrismaClient();

const faqs = [
  {
    question: "What does Appathy build?",
    answer: "Websites, digital forms, client portals, and small systems that connect the tools you already use — for local and UK-wide businesses.",
    sortOrder: 1
  },
  {
    question: "How long does a project take?",
    answer: "A straightforward business website usually takes 2-4 weeks from brief to launch. Forms, portals, and integrations depend on scope — you'll get a clear timeline before anything starts.",
    sortOrder: 2
  },
  {
    question: "How much does it cost?",
    answer: "It depends on what you need, so there's no fixed price list. Send over a brief and you'll get a clear quote back — no obligation, no jargon.",
    sortOrder: 3
  },
  {
    question: "Do you host and maintain the site afterwards?",
    answer: "Yes. Domain, DNS, SSL, and hosting are set up and kept running as part of the service, and I'm on hand for updates or changes after launch.",
    sortOrder: 4
  },
  {
    question: "Can you connect to tools I already use?",
    answer: "Usually, yes. If you're using a CRM, booking system, or job tracker that isn't talking to your website, that's exactly the kind of integration work Appathy does.",
    sortOrder: 5
  }
];

async function main() {
  await prisma.fAQ.deleteMany();
  await prisma.fAQ.createMany({
    data: faqs.map((faq) => ({ ...faq, isVisible: true, status: PublishStatus.published }))
  });
  console.log(`Replaced FAQ list with ${faqs.length} entries.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
