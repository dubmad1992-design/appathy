import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ProjectProfile } from "@/lib/studio-content";
import type { PortfolioImages } from "@/lib/portfolio-images";

const NEUTRAL_BORDER = "rgba(143,168,193,0.12)";
const NEUTRAL_BG = "linear-gradient(180deg, rgba(17,19,24,0.88), rgba(13,14,18,0.74))";

function getStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export type FeaturedProject = {
  slug: string;
  name: string;
  status: string;
  liveUrl: string | null;
  profile: ProjectProfile;
  images: PortfolioImages;
};

export function FeaturedProjectCard({ project }: { project: FeaturedProject }) {
  const { name, status, liveUrl, profile, images } = project;

  return (
    <Card className="overflow-hidden rounded-[2rem] p-0 xl:col-span-2" style={{ borderColor: NEUTRAL_BORDER, background: NEUTRAL_BG }}>
      <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative p-4 sm:p-5">
          <div
            className="relative overflow-hidden rounded-[1.6rem] border p-4 shadow-[0_28px_80px_rgba(0,0,0,0.42)]"
            style={{ borderColor: NEUTRAL_BORDER, background: "linear-gradient(180deg, rgba(13,14,18,0.92), rgba(17,19,24,0.82))" }}
          >
            <div className="absolute inset-x-8 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(143,168,193,0.12),transparent_72%)]" />
            <div className="relative overflow-hidden rounded-[1.35rem] border" style={{ borderColor: NEUTRAL_BORDER }}>
              <div className="relative aspect-[16/10] bg-[#09090b]">
                <Image
                  src={images.desktop}
                  alt={`${name} desktop preview`}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.03),rgba(9,9,11,0.16)_48%,rgba(9,9,11,0.36)_100%)]" />
                <div
                  className="absolute bottom-[6%] right-[4%] w-[19%] min-w-[88px] max-w-[172px] rounded-[1.7rem] border p-2 shadow-[0_22px_55px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                  style={{ borderColor: "rgba(143,168,193,0.14)", background: "linear-gradient(180deg, rgba(17,19,24,0.92), rgba(13,14,18,0.98))" }}
                >
                  <div className="overflow-hidden rounded-[1.25rem] border bg-[#09090b]" style={{ borderColor: NEUTRAL_BORDER }}>
                    <Image
                      src={images.mobile}
                      alt={`${name} mobile preview`}
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
                Featured build
              </span>
              <span className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#b9b0ad]" style={{ borderColor: NEUTRAL_BORDER, background: "rgba(17,19,24,0.6)" }}>
                {getStatusLabel(status)}
              </span>
            </div>

            <div>
              <h2 className="text-4xl font-semibold tracking-[-0.06em] text-[#f1ece8]">{name}</h2>
              <p className="mt-4 text-base leading-8 text-[#b9b0ad]">{profile.summary}</p>
              <p className="mt-4 text-sm leading-7 text-[#b9b0ad]">{profile.outcome}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {profile.featureList.slice(0, 4).map((feature) => (
                <div className="flex items-center gap-3 rounded-[1rem] border px-4 py-4" key={feature} style={{ borderColor: NEUTRAL_BORDER, background: "rgba(17,19,24,0.5)" }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: "#f472b6" }} />
                  <p className="text-sm font-semibold text-[#f1ece8]">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {profile.previewMetrics.map((metric) => (
                <div className="rounded-[1rem] border px-4 py-4" key={metric.label} style={{ borderColor: NEUTRAL_BORDER, background: "rgba(17,19,24,0.5)" }}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fa8c1]">{metric.label}</p>
                  <p className="mt-2 text-sm font-semibold text-[#f1ece8]">{metric.value}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {liveUrl ? (
                <Link
                  className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold text-[#f1ece8] transition hover:text-white"
                  href={liveUrl}
                  target="_blank"
                  style={{ borderColor: NEUTRAL_BORDER, background: "linear-gradient(180deg, rgba(111,135,158,0.34), rgba(111,135,158,0.22))" }}
                >
                  Visit live project
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : null}
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
  );
}
