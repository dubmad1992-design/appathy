import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminOverviewData } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { appStatusTone, enquiryStatusTone } from "@/lib/constants";

export default async function AdminDashboardPage() {
  const { apps, enquiries, metrics, announcements, testimonials } = await getAdminOverviewData();
  const services = await prisma.service.count();

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="eyebrow">Overview</div>
            <h1 className="text-4xl font-semibold tracking-tight">A focused backend for the apps running on this VPS.</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              Keep runtime visibility, content updates, and lead handling in one place without turning the admin into a maze.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link className="rounded-[1.4rem] border border-border/70 bg-card px-4 py-4 text-sm" href="/admin/apps">
              Open control
            </Link>
            <Link className="rounded-[1.4rem] border border-border/70 bg-card px-4 py-4 text-sm" href="/admin/content">
              Edit content
            </Link>
            <Link className="rounded-[1.4rem] border border-border/70 bg-card px-4 py-4 text-sm" href="/admin/enquiries">
              Review enquiries
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total apps", metrics.totalApps],
          ["Featured", metrics.featuredApps],
          ["Public", metrics.publicApps],
          ["Enquiries", metrics.totalEnquiries],
          ["Testimonials", testimonials]
        ].map(([label, value]) => (
          <Card className="p-5" key={String(label)}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Managed apps</h2>
            <p className="mt-2 text-sm text-muted-foreground">A quick view of what is live, visible, and ready for control actions.</p>
          </div>
          <div className="space-y-3">
            {apps.map((app) => (
              <div className="rounded-[1.5rem] border border-border/70 bg-card/70 p-4" key={app.id}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{app.name}</p>
                    <p className="text-sm text-muted-foreground">{app.deployPath ?? app.category}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${appStatusTone[app.status]}`}>{app.status.replaceAll("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Recent enquiries</h2>
            </div>
            <div className="space-y-3">
              {enquiries.map((item) => (
                <div className="rounded-[1.4rem] border border-border/70 p-4" key={item.id}>
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold">{item.name}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${enquiryStatusTone[item.status]}`}>{item.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.interestType}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Recent updates</h2>
            </div>
            <div className="space-y-3">
              {announcements.map((item) => (
                <div className="rounded-[1.4rem] border border-border/70 p-4" key={item.id}>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Content footprint</h2>
            <p className="mt-2 text-sm text-muted-foreground">A quick sense of what is already available to edit in the frontend.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.2rem] border border-border/70 px-4 py-3 text-sm">Services: {services}</div>
            <div className="rounded-[1.2rem] border border-border/70 px-4 py-3 text-sm">FAQ: {(await prisma.fAQ.count())}</div>
            <div className="rounded-[1.2rem] border border-border/70 px-4 py-3 text-sm">Media: {(await prisma.mediaAsset.count())}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
