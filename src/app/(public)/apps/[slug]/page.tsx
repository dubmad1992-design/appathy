import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProjectProfile } from "@/lib/studio-content";
import { BrowserWindow } from "@/components/site/browser-window";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const detailCardStyle = {
  borderColor: "rgba(143,168,193,0.14)",
  background: "linear-gradient(180deg, rgba(17,19,24,0.9), rgba(17,19,24,0.74))"
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const app = await prisma.app.findUnique({ where: { slug } });

  if (!app || !app.isPublic) {
    return { title: "Portfolio" };
  }

  return {
    title: app.name,
    description: app.shortDescription
  };
}

export default async function AppDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = await prisma.app.findUnique({ where: { slug } });

  if (!app || !app.isPublic) {
    notFound();
  }

  const profile = getProjectProfile(app.slug);

  const detailRows = [
    { label: "Status", value: app.status.replaceAll("_", " ") },
    { label: "Category", value: app.category },
    { label: "Runtime", value: app.runtime ?? "Custom build" },
    { label: "Port", value: app.port ? String(app.port) : "Not public" }
  ];

  const linkRows = [
    app.liveUrl ? { label: "Live site", href: app.liveUrl } : null,
    app.repositoryUrl ? { label: "Repository", href: app.repositoryUrl } : null,
    app.adminUrl ? { label: "Admin", href: app.adminUrl } : null,
    app.healthUrl ? { label: "Health check", href: app.healthUrl } : null
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  return (
    <section className="shell pb-18 pt-10 lg:pb-24 lg:pt-14">
      <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="section-kicker">{profile.strapline}</div>
            <h1 className="text-5xl font-semibold tracking-[-0.07em] text-[#f1ece8] sm:text-6xl">{app.name}</h1>
            <p className="max-w-3xl text-base leading-8 text-[#b9b0ad] sm:text-lg">{app.longDescription}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className={cn(
                buttonVariants({ size: "lg" }),
                "border text-[#f1ece8] shadow-none hover:text-[#f1ece8]"
              )}
              href="/contact"
              style={{
                borderColor: "rgba(143,168,193,0.16)",
                background: "linear-gradient(180deg, rgba(111,135,158,0.44), rgba(111,135,158,0.28))"
              }}
            >
              Start a similar project
            </Link>
            {app.liveUrl ? (
              <Link
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "text-[#f1ece8] hover:text-[#8fa8c1]"
                )}
                href={app.liveUrl}
                target="_blank"
                style={{ borderColor: "rgba(143,168,193,0.12)", background: "rgba(17,19,24,0.44)" }}
              >
                Visit live site
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {detailRows.map((row) => (
              <Card className="p-5" key={row.label} style={detailCardStyle}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8fa8c1]">{row.label}</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#f1ece8]">{row.value}</p>
              </Card>
            ))}
          </div>
        </div>

        <BrowserWindow
          badge={app.category}
          title={app.name}
          summary={profile.summary}
          navItems={profile.previewNav}
          metrics={profile.previewMetrics}
          featureList={profile.featureList}
          footer={profile.footer}
          className={cn("bg-gradient-to-br", profile.accentClass)}
        />
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <Card
          className="p-6 sm:p-7"
          style={{
            borderColor: "rgba(143,168,193,0.12)",
            background: "linear-gradient(180deg, rgba(17,19,24,0.9), rgba(17,19,24,0.74))"
          }}
        >
          <div className="space-y-5">
            <div>
              <div className="section-kicker">Why it matters</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#f1ece8]">{profile.outcome}</h2>
            </div>
            <p className="text-sm leading-7 text-[#b9b0ad]">
              {app.versionNotes ?? "Version notes are being tracked privately while the product continues to evolve."}
            </p>

            <div className="grid gap-3">
              {profile.featureList.map((item) => (
                <div
                  className="rounded-[1.35rem] border px-4 py-4"
                  key={item}
                  style={{ borderColor: "rgba(143,168,193,0.1)", background: "rgba(17,19,24,0.52)" }}
                >
                  <p className="text-sm leading-6 text-[#f1ece8]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid gap-5">
          <Card
            className="p-6 sm:p-7"
            style={{
              borderColor: "rgba(143,168,193,0.12)",
              background: "linear-gradient(180deg, rgba(17,19,24,0.9), rgba(17,19,24,0.74))"
            }}
          >
            <div className="space-y-4">
              <div className="section-kicker">Project links</div>
              <div className="grid gap-3">
                {linkRows.length ? (
                  linkRows.map((item) => (
                    <Link
                      className="flex items-center justify-between rounded-[1.35rem] border px-4 py-4 text-sm font-semibold text-[#f1ece8] transition hover:border-[rgba(143,168,193,0.28)] hover:text-[#8fa8c1]"
                      href={item.href}
                      key={item.label}
                      target="_blank"
                      style={{ borderColor: "rgba(143,168,193,0.1)", background: "rgba(17,19,24,0.52)" }}
                    >
                      <span>{item.label}</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  ))
                ) : (
                  <p className="text-sm leading-7 text-[#b9b0ad]">Live links for this project have not been published yet.</p>
                )}
              </div>
            </div>
          </Card>

          <Card
            className="p-6 sm:p-7"
            style={{
              borderColor: "rgba(244,114,182,0.16)",
              background: "radial-gradient(circle at bottom right, rgba(244,114,182,0.10), transparent 52%), linear-gradient(180deg, rgba(17,19,24,0.92), rgba(17,19,24,0.76))"
            }}
          >
            <div className="space-y-4">
              <div className="section-kicker">Project notes</div>
              <p className="text-sm leading-7 text-[#b9b0ad]">
                {app.internalNotes ??
                  "The delivery combines frontend presentation, sensible content structure, and the operational context needed to keep the product healthy after launch."}
              </p>
              <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#8fa8c1] hover:text-[#f1ece8]" href="/contact">
                Talk about a similar brief
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
