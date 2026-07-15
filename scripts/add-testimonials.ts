import { PrismaClient, PublishStatus } from "@prisma/client";

const prisma = new PrismaClient();

const testimonials = [
  {
    quote: "We went from a booking form nobody used to actually taking enquiries online. Simple change, made a real difference.",
    authorName: "Dan Pearce",
    role: "Owner",
    company: "40s Ink Tattoo Studio"
  },
  {
    quote: "Appathy took a vague brief and turned it into a site that actually looks like us. Quick turnaround, no chasing needed.",
    authorName: "Sian Cooke",
    role: "Director",
    company: "Cooke & Rees Trade Services"
  }
];

async function main() {
  await prisma.testimonial.createMany({
    data: testimonials.map((t) => ({ ...t, isVisible: true, status: PublishStatus.published }))
  });
  console.log(`Added ${testimonials.length} testimonials.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
