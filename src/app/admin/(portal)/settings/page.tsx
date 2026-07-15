import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { updateSettingsAction } from "@/app/admin/(portal)/actions";

export default async function AdminSettingsPage() {
  const [settings, media] = await Promise.all([
    prisma.siteSettings.findFirst(),
    prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" } })
  ]);

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <div className="eyebrow">Platform</div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Site settings and shared assets</h1>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Site settings</h2>
          <form action={updateSettingsAction} className="mt-5 grid gap-4">
            {[
              ["siteName", settings?.siteName ?? ""],
              ["siteTagline", settings?.siteTagline ?? ""],
              ["contactEmail", settings?.contactEmail ?? ""],
              ["contactPhone", settings?.contactPhone ?? ""],
              ["socialLinkedIn", settings?.socialLinkedIn ?? ""],
              ["socialX", settings?.socialX ?? ""],
              ["socialGithub", settings?.socialGithub ?? ""],
              ["seoTitleDefault", settings?.seoTitleDefault ?? ""],
              ["seoDescription", settings?.seoDescription ?? ""],
              ["footerBlurb", settings?.footerBlurb ?? ""],
              ["analyticsSnippet", settings?.analyticsSnippet ?? ""]
            ].map(([name, value]) => (
              <label className="space-y-2 text-sm" key={String(name)}>
                <span className="font-medium">{name}</span>
                <textarea className="min-h-16 w-full rounded-[1.15rem] border border-input bg-background/88 px-4 py-3" defaultValue={String(value)} name={String(name)} />
              </label>
            ))}
            <button className="w-fit rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background" type="submit">
              Save settings
            </button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold">Media library</h2>
          <div className="mt-5 grid gap-3">
            {media.length ? (
              media.map((item) => (
                <div className="rounded-[1.4rem] border border-border/70 p-4" key={item.id}>
                  <p className="font-semibold">{item.fileName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.url}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                Upload API is ready to support managed assets. No media records yet.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
