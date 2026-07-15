import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getPublicApps } from "@/lib/data";
import { getProjectProfile, signatureCaseStudy } from "@/lib/studio-content";
import { portfolioImagesBySlug, featuredSlugOrder } from "@/lib/portfolio-images";
import { FeaturedProjectCard } from "@/components/site/featured-project-card";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import macauleyDesktopPreview from "../../../../images/macauley-desktop.png";
import macauleyPhonePreview from "../../../../images/macauley-mobile.png";

const NEUTRAL_BORDER = "rgba(143,168,193,0.12)";
const NEUTRAL_BG = "linear-gradient(180deg, rgba(17,19,24,0.88), rgba(13,14,18,0.74))";

function getStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Websites, business sites, and internal systems built by Appathy for UK businesses — see the live work and case studies."
};

export default async function AppsPage() {
  const apps = await getPublicApps();
  const work = apps
    .map((app) => ({ ...app, profile: getProjectProfile(app.slug) }))
    .filter((app) => app.slug !== "appathy");

  const featuredWork = featuredSlugOrder
    .map((slug) => work.find((app) => app.slug === slug))
    .filter((app): app is (typeof work)[number] => Boolean(app) && Boolean(portfolioImagesBySlug[app!.slug]));

  const remainingWork = work.filter((app) => !featuredSlugOrder.includes(app.slug));

  return (
    <section className="shell pb-18 pt-10 lg:pb-24 lg:pt-14">
      <div className="relative overflow-hidden rounded-[2rem] border px-6 py-8 sm:px-8 sm:py-10 lg:px-10" style={{ borderColor: NEUTRAL_BORDER, background: NEUTRAL_BG }}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(143,168,193,0.14),transparent_60%)]" />
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div className="space-y-5">
            <div className="section-kicker">Portfolio</div>
            <h1 className="section-title">Websites, service journeys, and private systems built to help businesses look better and run smoother.</h1>
            <p className="max-w-2xl text-base leading-8 text-[#b9b0ad]">
              The examples below show the kind of work Appathy can provide: polished public websites, clearer enquiry routes, mobile-friendly layouts, and useful systems behind the scenes.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-[#b9b0ad]">
              <span className="rounded-full border px-3 py-2" style={{ borderColor: NEUTRAL_BORDER, background: "rgba(17,19,24,0.56)" }}>
                {String(work.length + 1).padStart(2, "0")} service-led examples
              </span>
              <span className="rounded-full border px-3 py-2" style={{ borderColor: NEUTRAL_BORDER, background: "rgba(17,19,24,0.56)" }}>
                Websites, forms, and workflows
              </span>
              <span className="rounded-full border px-3 py-2" style={{ borderColor: NEUTRAL_BORDER, background: "rgba(17,19,24,0.56)" }}>
                Live references and practical outcomes
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "What we build", value: "High-end websites" },
              { label: "What we improve", value: "Enquiries + conversion" },
              { label: "What supports it", value: "Forms, admin, systems" }
            ].map((item) => (
              <Card
                className="rounded-[1.45rem] p-5"
                key={item.label}
                style={{ borderColor: NEUTRAL_BORDER, background: "linear-gradient(180deg, rgba(17,19,24,0.84), rgba(17,19,24,0.68))" }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8fa8c1]">{item.label}</p>
                <p className="mt-3 text-lg font-semibold tracking-[-0.04em] text-[#f1ece8]">{item.value}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <Card className="overflow-hidden rounded-[2rem] p-0" style={{ borderColor: NEUTRAL_BORDER, background: NEUTRAL_BG }}>
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative p-4 sm:p-5">
              <div className="relative overflow-hidden rounded-[1.6rem] border p-4 shadow-[0_28px_80px_rgba(0,0,0,0.42)]" style={{ borderColor: NEUTRAL_BORDER, background: "linear-gradient(180deg, rgba(13,14,18,0.92), rgba(17,19,24,0.82))" }}>
                <div className="absolute inset-x-8 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(143,168,193,0.12),transparent_72%)]" />
                <div className="relative overflow-hidden rounded-[1.35rem] border" style={{ borderColor: NEUTRAL_BORDER }}>
                  <div className="relative aspect-[16/10] bg-[#09090b]">
                    <Image
                      src={macauleyDesktopPreview}
                      alt="Macauley Raw desktop preview"
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      priority
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.02),rgba(9,9,11,0.18)_50%,rgba(9,9,11,0.42)_100%)]" />
                    <div
                      className="absolute bottom-[6%] right-[4%] w-[19%] min-w-[88px] max-w-[172px] rounded-[1.7rem] border p-2 shadow-[0_22px_55px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                      style={{ borderColor: "rgba(143,168,193,0.14)", background: "linear-gradient(180deg, rgba(17,19,24,0.92), rgba(13,14,18,0.98))" }}
                    >
                      <div className="overflow-hidden rounded-[1.25rem] border bg-[#09090b]" style={{ borderColor: NEUTRAL_BORDER }}>
                        <Image
                          src={macauleyPhonePreview}
                          alt="Macauley Raw mobile preview"
                          className="h-auto w-full object-cover"
                          sizes="(max-width: 768px) 110px, 172px"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
              <div className="space-y-5">
                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f472b6]" style={{ borderColor: "rgba(244,114,182,0.24)", background: "rgba(244,114,182,0.08)" }}>
                    Featured work
                  </span>
                  <span className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#b9b0ad]" style={{ borderColor: NEUTRAL_BORDER, background: "rgba(17,19,24,0.6)" }}>
                    {signatureCaseStudy.status}
                  </span>
                </div>

                <div>
                  <h2 className="text-4xl font-semibold tracking-[-0.06em] text-[#f1ece8]">{signatureCaseStudy.name}</h2>
                  <p className="mt-4 text-base leading-8 text-[#b9b0ad]">{signatureCaseStudy.summary}</p>
                  <p className="mt-4 text-sm leading-7 text-[#b9b0ad]">{signatureCaseStudy.outcome}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {signatureCaseStudy.featureList.map((feature) => (
                    <div className="flex items-center gap-3 rounded-[1rem] border px-4 py-4" key={feature} style={{ borderColor: NEUTRAL_BORDER, background: "rgba(17,19,24,0.5)" }}>
                      <span className="h-2 w-2 rounded-full" style={{ background: "#f472b6" }} />
                      <p className="text-sm font-semibold text-[#f1ece8]">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8fa8c1]">{signatureCaseStudy.metricLabel}</p>
                  <p className="mt-2 text-sm text-[#f1ece8]">{signatureCaseStudy.metricValue}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold text-[#f1ece8] transition hover:text-white"
                    href={signatureCaseStudy.href}
                    target="_blank"
                    style={{ borderColor: NEUTRAL_BORDER, background: "linear-gradient(180deg, rgba(111,135,158,0.34), rgba(111,135,158,0.22))" }}
                  >
                    {signatureCaseStudy.linkLabel}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <Link
                    className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold text-[#f1ece8] transition hover:brightness-110"
                    href="/contact"
                    style={{ borderColor: "rgba(244,114,182,0.32)", background: "linear-gradient(180deg, rgba(244,114,182,0.62), rgba(219,39,119,0.68))" }}
                  >
                    Want something like this?
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-10 grid gap-5 xl:grid-cols-2">
        {featuredWork.map((app) => (
          <FeaturedProjectCard
            key={app.id}
            project={{
              slug: app.slug,
              name: app.name,
              status: app.status,
              liveUrl: app.liveUrl,
              profile: app.profile,
              images: portfolioImagesBySlug[app.slug]
            }}
          />
        ))}

        {remainingWork.map((app) => (
          <Card
            className="rounded-[1.8rem] p-6 sm:p-7"
            key={app.id}
            style={{ borderColor: NEUTRAL_BORDER, background: "linear-gradient(180deg, rgba(17,19,24,0.88), rgba(17,19,24,0.72))" }}
          >
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8fa8c1]">{app.category}</p>
                  <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[#f1ece8]">{app.name}</h2>
                </div>
                <span className="rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#b9b0ad]" style={{ borderColor: NEUTRAL_BORDER, background: "rgba(17,19,24,0.5)" }}>
                  {getStatusLabel(app.status)}
                </span>
              </div>

              <p className="text-sm leading-7 text-[#b9b0ad]">{app.profile.summary}</p>

              <div className="grid gap-3 sm:grid-cols-2">
                {app.profile.featureList.slice(0, 4).map((feature) => (
                  <div className="flex items-center gap-3 rounded-[1rem] border px-4 py-4" key={feature} style={{ borderColor: NEUTRAL_BORDER, background: "rgba(17,19,24,0.5)" }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: "#f472b6" }} />
                    <p className="text-sm font-medium text-[#f1ece8]">{feature}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {app.profile.previewMetrics.map((metric) => (
                  <div className="rounded-[1rem] border px-4 py-4" key={metric.label} style={{ borderColor: NEUTRAL_BORDER, background: "rgba(17,19,24,0.5)" }}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fa8c1]">{metric.label}</p>
                    <p className="mt-2 text-sm font-semibold text-[#f1ece8]">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link className={cn(buttonVariants({ variant: "outline" }), "border text-[#f1ece8] hover:text-[#8fa8c1]")} href={`/apps/${app.slug}`} style={{ borderColor: NEUTRAL_BORDER, background: "rgba(17,19,24,0.44)" }}>
                  Read case study
                </Link>
                {app.liveUrl ? (
                  <Link
                    className={cn(buttonVariants({}), "border text-[#f1ece8] hover:text-white")}
                    href={app.liveUrl}
                    target="_blank"
                    style={{ borderColor: NEUTRAL_BORDER, background: "linear-gradient(180deg, rgba(111,135,158,0.34), rgba(111,135,158,0.22))" }}
                  >
                    Visit live project
                    <ArrowUpRight className="ml-1.5 h-4 w-4" />
                  </Link>
                ) : null}
                <Link
                  className={cn(buttonVariants({}), "border text-[#f1ece8] transition hover:brightness-110 hover:text-[#f1ece8]")}
                  href="/contact"
                  style={{ borderColor: "rgba(244,114,182,0.32)", background: "linear-gradient(180deg, rgba(244,114,182,0.62), rgba(219,39,119,0.68))" }}
                >
                  Want something like this?
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-10 rounded-[2rem] border px-6 py-8 backdrop-blur-xl sm:px-8 sm:py-10" style={{ borderColor: NEUTRAL_BORDER, background: "linear-gradient(135deg, rgba(17,19,24,0.92), rgba(17,19,24,0.72))" }}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-kicker">Ready to build?</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#f1ece8] sm:text-3xl">Want a site or system like these?</h2>
            <p className="mt-2 text-sm leading-7 text-[#b9b0ad]">Send over your brief and I&apos;ll come back with a plan. No commitment needed.</p>
          </div>
          <Link
            className="inline-flex shrink-0 items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold text-[#f1ece8] transition hover:brightness-110"
            href="/contact"
            style={{ borderColor: "rgba(244,114,182,0.32)", background: "linear-gradient(180deg, rgba(244,114,182,0.62), rgba(219,39,119,0.68))" }}
          >
            Start a project
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
