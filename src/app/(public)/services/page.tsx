import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getPublicServices } from "@/lib/data";
import { portfolioImagesBySlug } from "@/lib/portfolio-images";
import macauleyPreview from "../../../../images/macauley-desktop.png";

const ACCENT_RGB = "244,114,182";
const ACCENT_HEX = "#f472b6";

export const metadata: Metadata = {
  title: "Services",
  description: "Websites, digital forms, portals, system integration, and hosting — clear services built for UK businesses."
};

type Evidence = { name: string; label: string; note: string; href: string; portfolioSlug: string | null };

const process = [
  { step: "01", title: "Brief", body: "Tell me what you need. A short chat or a written brief both work." },
  { step: "02", title: "Plan", body: "I map out the scope, structure, and what good looks like for your case." },
  { step: "03", title: "Build", body: "Design and development together — no big reveals, regular check-ins." },
  { step: "04", title: "Launch", body: "Go live, hand over, and support anything that needs tuning after." }
];

export default async function ServicesPage() {
  const dbServices = await getPublicServices();
  const services = dbServices.map((service, index) => ({
    ...service,
    number: String(index + 1).padStart(2, "0"),
    bulletList: Array.isArray(service.bullets) ? (service.bullets as string[]) : [],
    evidenceList: Array.isArray(service.evidence) ? (service.evidence as Evidence[]) : []
  }));

  return (
    <div className="pb-20">

      {/* Hero */}
      <section className="shell relative py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-72 w-80 -translate-x-1/2 rounded-full bg-[#ec4899]/14 blur-[130px]" />
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <div className="section-kicker">Services</div>
            <h1 className="section-title text-balance font-bold">
              Digital work that looks sharp and runs clean.
            </h1>
            <p className="max-w-xl text-base leading-8 text-[#c4bab7]">
              Websites, forms, portals, and system work — each service is clear about what it does and who it&apos;s for.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/contact"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "border font-semibold text-white shadow-none transition hover:brightness-110"
                )}
                style={{
                  borderColor: "rgba(255,255,255,0.18)",
                  background: "linear-gradient(135deg, rgba(244,114,182,0.90), rgba(219,39,119,0.90))",
                  boxShadow: "0 8px 32px rgba(236,72,153,0.24)"
                }}
              >
                Get a quote
              </Link>
              <Link
                href="/apps"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "text-[#f1ece8] hover:text-[#f472b6]")}
                style={{ borderColor: "rgba(244,114,182,0.22)", background: "rgba(244,114,182,0.06)" }}
              >
                See the portfolio
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Service index pills */}
          <div className="grid gap-2">
            {services.map((s) => (
              <div
                key={s.slug}
                className="flex items-center gap-4 rounded-[1.2rem] border px-4 py-3"
                style={{
                  borderColor: `rgba(${ACCENT_RGB},0.24)`,
                  background: `radial-gradient(circle at left, rgba(${ACCENT_RGB},0.10), transparent 60%), rgba(10,11,20,0.6)`
                }}
              >
                <span className="text-[11px] font-bold tabular-nums" style={{ color: ACCENT_HEX }}>{s.number}</span>
                <span
                  className="h-2 w-2 rounded-full shrink-0 shadow-sm"
                  style={{ background: ACCENT_HEX, boxShadow: `0 0 8px ${ACCENT_HEX}80` }}
                />
                <span className="text-sm font-semibold text-[#f1ece8]">{s.title}</span>
                <span className="ml-auto text-xs text-[#b9b0ad]">{s.strapline}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service sections */}
      <div className="shell space-y-6">
        {services.map((service) => (
          <section
            key={service.slug}
            className="relative overflow-hidden rounded-[2rem] border"
            style={{
              borderColor: `rgba(${ACCENT_RGB},0.24)`,
              background: `radial-gradient(ellipse at top left, rgba(${ACCENT_RGB},0.12), transparent 42%), linear-gradient(180deg, rgba(12,14,24,0.96), rgba(8,10,18,0.90))`
            }}
          >
            {/* Background number */}
            <div
              className="pointer-events-none absolute -right-4 -top-6 select-none text-[10rem] font-black leading-none tracking-tighter opacity-[0.04]"
              style={{ color: ACCENT_HEX }}
            >
              {service.number}
            </div>

            <div className="grid gap-0 lg:grid-cols-[1fr_0.88fr]">

              {/* Left — service detail */}
              <div className="space-y-6 p-7 sm:p-9 lg:border-r" style={{ borderColor: `rgba(${ACCENT_RGB},0.12)` }}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em]"
                      style={{
                        color: ACCENT_HEX,
                        borderColor: `rgba(${ACCENT_RGB},0.28)`,
                        background: `rgba(${ACCENT_RGB},0.10)`
                      }}
                    >
                      {service.strapline}
                    </span>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: `rgba(${ACCENT_RGB},0.5)` }}>{service.number}</span>
                  </div>

                  <h2 className="text-4xl font-bold tracking-[-0.05em] text-[#f1ece8] sm:text-5xl">
                    {service.title}
                  </h2>
                  <p className="max-w-lg text-base leading-8 text-[#c4bab7]">{service.description}</p>
                </div>

                {/* Who it's for */}
                <div
                  className="rounded-[1.1rem] border px-4 py-3.5"
                  style={{ borderColor: `rgba(${ACCENT_RGB},0.22)`, background: `rgba(${ACCENT_RGB},0.07)` }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-1.5" style={{ color: ACCENT_HEX }}>
                    Best for
                  </p>
                  <p className="text-sm leading-6 text-[#c4bab7]">{service.whoFor}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {service.bulletList.map((bullet) => (
                    <div
                      key={bullet}
                      className="flex items-center gap-2.5 rounded-[1rem] border px-4 py-3"
                      style={{
                        borderColor: `rgba(${ACCENT_RGB},0.18)`,
                        background: `rgba(${ACCENT_RGB},0.07)`
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: ACCENT_HEX }} />
                      <span className="text-sm font-medium text-[#f1ece8]">{bullet}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
                  style={{
                    borderColor: "rgba(255,255,255,0.16)",
                    background: `linear-gradient(135deg, rgba(${ACCENT_RGB},0.82), rgba(${ACCENT_RGB},0.60))`,
                    boxShadow: `0 6px 24px rgba(${ACCENT_RGB},0.28)`
                  }}
                >
                  {service.ctaLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Right — portfolio evidence */}
              <div className="flex flex-col justify-center gap-4 p-7 sm:p-9">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.32em]"
                  style={{ color: ACCENT_HEX }}
                >
                  Seen in the work
                </p>

                <div className="grid gap-3">
                  {service.evidenceList.map((item) => {
                    const preview = (item.portfolioSlug && portfolioImagesBySlug[item.portfolioSlug]?.desktop) ?? macauleyPreview;
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="group flex gap-4 overflow-hidden rounded-[1.4rem] border transition hover:border-[rgba(143,168,193,0.24)]"
                        style={{
                          borderColor: `rgba(${ACCENT_RGB},0.12)`,
                          background: "rgba(17,19,24,0.56)"
                        }}
                      >
                        {/* Screenshot thumbnail */}
                        <div className="relative w-24 shrink-0 overflow-hidden rounded-l-[1.3rem] sm:w-28">
                          <Image
                            src={preview}
                            alt={`${item.name} preview`}
                            fill
                            className="object-cover object-top transition duration-500 group-hover:scale-105"
                            sizes="112px"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[rgba(17,19,24,0.18)]" />
                        </div>

                        {/* Text */}
                        <div className="flex flex-1 flex-col justify-center gap-1.5 py-4 pr-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em]"
                              style={{
                                color: ACCENT_HEX,
                                background: `rgba(${ACCENT_RGB},0.1)`
                              }}
                            >
                              {item.label}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[#f1ece8]">{item.name}</p>
                          <p className="text-xs leading-5 text-[#b9b0ad]">{item.note}</p>
                          <div
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold transition-colors group-hover:text-[#f1ece8]"
                            style={{ color: ACCENT_HEX }}
                          >
                            {item.href.startsWith("http") ? (
                              <>View project <ArrowUpRight className="h-3 w-3" /></>
                            ) : (
                              <>See all <ArrowRight className="h-3 w-3" /></>
                            )}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Process */}
      <section className="shell py-16 lg:py-20">
        <div className="mb-10 space-y-3">
          <div className="section-kicker">How it works</div>
          <h2 className="section-title">From brief to live in four steps.</h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-[2rem] border sm:grid-cols-2 lg:grid-cols-4"
          style={{ borderColor: "rgba(143,168,193,0.12)", background: "rgba(143,168,193,0.06)" }}
        >
          {process.map((item, i) => (
            <div
              key={item.step}
              className="relative space-y-4 p-7"
              style={{ background: "linear-gradient(180deg, rgba(17,19,24,0.92), rgba(13,14,18,0.82))" }}
            >
              <div className="pointer-events-none absolute right-5 top-5 text-[4rem] font-black leading-none tracking-tighter text-[#f1ece8]/[0.03]">
                {item.step}
              </div>
              <div
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold text-[#f1ece8]"
                style={{
                  borderColor: "rgba(143,168,193,0.16)",
                  background: "linear-gradient(180deg, rgba(111,135,158,0.32), rgba(80,108,130,0.22))"
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-[-0.04em] text-[#f1ece8]">{item.title}</h3>
                <p className="text-sm leading-6 text-[#b9b0ad]">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="shell">
        <Card
          className="panel rounded-[2rem] px-7 py-9 sm:px-10 sm:py-12"
          style={{ borderColor: "rgba(244,114,182,0.18)", background: "linear-gradient(135deg, rgba(12,14,24,0.96), rgba(8,10,18,0.88))" }}
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <div className="section-kicker">Start a project</div>
              <h2 className="text-3xl font-bold tracking-[-0.04em] text-[#f1ece8] sm:text-4xl">
                Ready to get something built?
              </h2>
              <p className="max-w-lg text-sm leading-7 text-[#c4bab7] sm:text-base">
                Tell me what you need and I&apos;ll come back with a clear plan. No commitment required upfront.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link
                href="/contact"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "justify-center border font-semibold text-white shadow-none transition hover:brightness-110"
                )}
                style={{
                  borderColor: "rgba(255,255,255,0.18)",
                  background: "linear-gradient(135deg, rgba(244,114,182,0.90), rgba(219,39,119,0.90))",
                  boxShadow: "0 8px 32px rgba(236,72,153,0.24)"
                }}
              >
                Get a quote
              </Link>
              <Link
                href="/apps"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "justify-center text-[#f1ece8] hover:text-[#f472b6]"
                )}
                style={{ borderColor: "rgba(244,114,182,0.22)", background: "rgba(244,114,182,0.06)" }}
              >
                See the work
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
