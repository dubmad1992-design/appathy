import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getHomepageContent, getVisibleTestimonials, getPublicServices } from "@/lib/data";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ACCENT_HEX = "#f472b6";
const ACCENT_RGB = "244,114,182";

const trustItems = [
  "Live projects for UK businesses",
  "Websites · Forms · Systems",
  "Fast turnaround",
  "UK-based",
];

export default async function HomePage() {
  const [homepage, testimonials, services] = await Promise.all([
    getHomepageContent(),
    getVisibleTestimonials(),
    getPublicServices()
  ]);

  return (
    <div className="pb-20">

      {/* Hero */}
      <section className="shell relative py-16 lg:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-80 w-96 -translate-x-1/2 rounded-full bg-[#ec4899]/14 blur-[130px]" />
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.32em]"
            style={{ borderColor: "rgba(244,114,182,0.28)", background: "rgba(244,114,182,0.08)", color: "#f9a8d4" }}
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#f472b6] shadow-[0_0_10px_rgba(244,114,182,0.9)]" />
            {homepage.heroEyebrow}
          </div>

          <h1 className="mt-4 text-balance text-4xl font-bold tracking-[-0.04em] text-[#f1ece8] sm:text-5xl lg:text-[4rem] lg:leading-[1.1]">
            {homepage.heroTitle}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#c8bfbd] sm:text-lg">
            {homepage.heroDescription}
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              className={cn(
                buttonVariants({ size: "lg" }),
                "min-w-[168px] justify-center border font-semibold text-white shadow-none transition hover:brightness-110"
              )}
              href="/contact"
              style={{
                borderColor: "rgba(255,255,255,0.18)",
                background: "linear-gradient(135deg, rgba(244,114,182,0.90), rgba(219,39,119,0.90))",
                boxShadow: "0 8px 32px rgba(236,72,153,0.28)"
              }}
            >
              {homepage.primaryCtaLabel}
            </Link>
            <Link
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "min-w-[168px] justify-center text-[#f1ece8] hover:text-[#f472b6]"
              )}
              href="/apps"
              style={{ borderColor: "rgba(244,114,182,0.22)", background: "rgba(244,114,182,0.06)" }}
            >
              {homepage.secondaryCtaLabel}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {trustItems.map((item) => (
              <span
                key={item}
                className="rounded-full border px-3 py-1.5 text-xs font-medium text-[#b9b0ad]"
                style={{ borderColor: "rgba(143,168,193,0.24)", background: "rgba(143,168,193,0.08)" }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="shell relative py-10 lg:py-14">
          <div className="mb-8 space-y-3">
            <div className="section-kicker">What clients say</div>
            <h2 className="section-title">Feedback from the work.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <Card
                key={t.id}
                className="flex flex-col justify-between rounded-[1.4rem] p-6"
                style={{ borderColor: "rgba(143,168,193,0.18)", background: "linear-gradient(180deg, rgba(14,16,28,0.92), rgba(10,11,20,0.80))" }}
              >
                <p className="text-sm leading-7 text-[#c4bab7]">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: "#f472b6" }} />
                  <div>
                    <p className="text-sm font-semibold text-[#f1ece8]">{t.authorName}</p>
                    <p className="mt-0.5 text-xs text-[#8fa8c1]">{t.role}{t.company ? `, ${t.company}` : ""}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      <section className="shell relative py-10 lg:py-14">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-10 left-12 h-44 w-44 rounded-full bg-[#ec4899]/12 blur-3xl" />
        </div>
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="section-kicker">Services</div>
            <h2 className="section-title">What Appathy offers.</h2>
            <p className="section-copy max-w-2xl">Clear, focused services built around real business needs. Pick what fits and get in touch.</p>
          </div>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#f472b6] hover:text-[#f1ece8] transition-colors" href="/services">
            See full details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link
              href="/services"
              key={service.slug}
              className="group relative overflow-hidden rounded-[1.4rem] border p-6 transition-all hover:scale-[1.01]"
              style={{
                borderColor: `rgba(${ACCENT_RGB},0.24)`,
                background: `radial-gradient(circle at top left, rgba(${ACCENT_RGB},0.12), transparent 52%), linear-gradient(180deg, rgba(14,16,28,0.94), rgba(10,11,20,0.88))`
              }}
            >
              {/* Colored top accent bar */}
              <div
                className="absolute inset-x-0 top-0 h-[2px] rounded-t-[1.4rem]"
                style={{ background: `linear-gradient(90deg, transparent, ${ACCENT_HEX}, transparent)` }}
              />
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: ACCENT_HEX }}>
                  {service.strapline}
                </div>
                <h3 className="text-xl font-bold tracking-[-0.03em] text-[#f1ece8]">{service.title}</h3>
                <p className="text-sm leading-6 text-[#c4bab7]">{service.shortDescription}</p>
                <div
                  className="rounded-[0.75rem] border px-3 py-2.5"
                  style={{ borderColor: `rgba(${ACCENT_RGB},0.18)`, background: `rgba(${ACCENT_RGB},0.07)` }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: ACCENT_HEX }}>Best for</p>
                  <p className="text-xs leading-5 text-[#b9b0ad]">{service.whoFor}</p>
                </div>
              </div>
              <div
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold transition-colors group-hover:text-[#f1ece8]"
                style={{ color: ACCENT_HEX }}
              >
                {service.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA panel */}
      <section className="shell relative pt-8 lg:pt-10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-14 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-[#ec4899]/16 blur-3xl" />
        </div>
        <Card
          className="panel rounded-[1.8rem] px-6 py-8 sm:px-8 sm:py-10"
          style={{ borderColor: "rgba(244,114,182,0.16)", background: "linear-gradient(135deg,rgba(14,16,28,0.94),rgba(10,11,20,0.84))" }}
        >
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <div className="section-kicker">Start a project</div>
              <h2 className="text-3xl font-bold tracking-[-0.04em] text-[#f1ece8] sm:text-4xl">Need a site, form, or system update?</h2>
              <p className="max-w-2xl text-sm leading-7 text-[#c4bab7] sm:text-base">
                Tell me what you need and I&apos;ll come back with a clear plan. No obligation, no jargon.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "justify-center border font-semibold text-white shadow-none transition hover:brightness-110"
                )}
                href="/contact"
                style={{
                  borderColor: "rgba(255,255,255,0.18)",
                  background: "linear-gradient(135deg, rgba(244,114,182,0.90), rgba(219,39,119,0.90))",
                  boxShadow: "0 8px 32px rgba(236,72,153,0.24)"
                }}
              >
                Start a project
              </Link>
              <Link
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "justify-center text-[#f1ece8] hover:text-[#f472b6]"
                )}
                style={{ borderColor: "rgba(244,114,182,0.22)", background: "rgba(244,114,182,0.06)" }}
                href="/services"
              >
                Browse services
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
