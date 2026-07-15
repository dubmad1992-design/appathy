import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { saveFaqAction, saveServiceAction, saveTestimonialAction, updateHomepageAction } from "@/app/admin/(portal)/actions";

export default async function AdminContentPage() {
  const [homepage, services, faqs, testimonials] = await Promise.all([
    prisma.homepageContent.findFirst(),
    prisma.service.findMany({ orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }] }),
    prisma.fAQ.findMany({ orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }] }),
    prisma.testimonial.findMany({ orderBy: { updatedAt: "desc" } })
  ]);

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <div className="eyebrow">Content</div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Keep the public site clear, short, and current.</h1>
      </Card>

      <Card className="p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold">Homepage copy</h2>
        </div>
        <form action={updateHomepageAction} className="grid gap-4" data-testid="homepage-content-form">
          {[
            ["heroEyebrow", "Hero eyebrow", homepage?.heroEyebrow ?? ""],
            ["heroTitle", "Hero title", homepage?.heroTitle ?? ""],
            ["heroDescription", "Hero description", homepage?.heroDescription ?? ""],
            ["primaryCtaLabel", "Primary CTA", homepage?.primaryCtaLabel ?? ""],
            ["secondaryCtaLabel", "Secondary CTA", homepage?.secondaryCtaLabel ?? ""],
            ["introTitle", "Intro title", homepage?.introTitle ?? ""],
            ["introBody", "Intro body", homepage?.introBody ?? ""],
            ["aboutTitle", "About title", homepage?.aboutTitle ?? ""],
            ["aboutBody", "About body", homepage?.aboutBody ?? ""],
            ["contactTitle", "Contact title", homepage?.contactTitle ?? ""],
            ["contactBody", "Contact body", homepage?.contactBody ?? ""]
          ].map(([name, label, value]) => (
            <label className="space-y-2 text-sm" key={String(name)}>
              <span className="font-medium">{label}</span>
              <textarea
                aria-label={String(label)}
                className="min-h-20 w-full rounded-[1.15rem] border border-input bg-background/88 px-4 py-3"
                data-testid={`homepage-${String(name)}`}
                defaultValue={String(value)}
                name={String(name)}
              />
            </label>
          ))}
          <button className="w-fit rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background" data-testid="homepage-save" type="submit">
            Save homepage content
          </button>
        </form>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Services</h2>
          <div className="mt-5 space-y-5">
            {services.map((item) => {
              const bullets = Array.isArray(item.bullets) ? (item.bullets as string[]) : [];
              const evidence = Array.isArray(item.evidence)
                ? (item.evidence as Array<{ name: string; label: string; note: string; href: string; portfolioSlug: string | null }>)
                : [];
              return (
                <form action={saveServiceAction} className="rounded-[1.5rem] border border-border/70 p-4" key={item.id}>
                  <input name="id" type="hidden" value={item.id} />
                  <input name="slug" type="hidden" value={item.slug} />
                  <div className="space-y-3">
                    <input className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" defaultValue={item.title} name="title" placeholder="Title" />
                    <input className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" defaultValue={item.strapline} name="strapline" placeholder="Strapline" />
                    <textarea className="min-h-16 w-full rounded-[1.15rem] border border-input bg-background/88 px-4 py-3" defaultValue={item.shortDescription} name="shortDescription" placeholder="Short description (homepage card)" />
                    <textarea className="min-h-24 w-full rounded-[1.15rem] border border-input bg-background/88 px-4 py-3" defaultValue={item.description} name="description" placeholder="Full description (services page)" />
                    <textarea className="min-h-16 w-full rounded-[1.15rem] border border-input bg-background/88 px-4 py-3" defaultValue={item.whoFor} name="whoFor" placeholder="Who it's for" />
                    <textarea className="min-h-20 w-full rounded-[1.15rem] border border-input bg-background/88 px-4 py-3" defaultValue={bullets.join("\n")} name="bullets" placeholder="Bullets, one per line" />
                    <textarea
                      className="min-h-24 w-full rounded-[1.15rem] border border-input bg-background/88 px-4 py-3 font-mono text-xs"
                      defaultValue={evidence.map((e) => `${e.name}|${e.label}|${e.note}|${e.href}|${e.portfolioSlug ?? ""}`).join("\n")}
                      name="evidence"
                      placeholder="Evidence, one per line: name|label|note|href|portfolioSlug"
                    />
                    <input className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" defaultValue={item.startingPrice ?? ""} name="startingPrice" placeholder="Starting price" />
                    <input className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" defaultValue={item.ctaLabel} name="ctaLabel" placeholder="CTA label" />
                    <input name="sortOrder" type="hidden" value={item.sortOrder} />
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input defaultChecked={item.isVisible} name="isVisible" type="checkbox" />
                      Visible
                    </label>
                    <button className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background" type="submit">
                      Save
                    </button>
                  </div>
                </form>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold">FAQ</h2>
          <div className="mt-5 space-y-5">
            {faqs.map((item) => (
              <form action={saveFaqAction} className="rounded-[1.5rem] border border-border/70 p-4" key={item.id}>
                <input name="id" type="hidden" value={item.id} />
                <input name="sortOrder" type="hidden" value={item.sortOrder} />
                <div className="space-y-3">
                  <input className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" defaultValue={item.question} name="question" />
                  <textarea className="min-h-24 w-full rounded-[1.15rem] border border-input bg-background/88 px-4 py-3" defaultValue={item.answer} name="answer" />
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input defaultChecked={item.isVisible} name="isVisible" type="checkbox" />
                    Visible
                  </label>
                  <button className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background" type="submit">
                    Save
                  </button>
                </div>
              </form>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold">Testimonials</h2>
          <div className="mt-5 space-y-5">
            {testimonials.map((item) => (
              <form action={saveTestimonialAction} className="rounded-[1.5rem] border border-border/70 p-4" key={item.id}>
                <input name="id" type="hidden" value={item.id} />
                <div className="space-y-3">
                  <textarea className="min-h-24 w-full rounded-[1.15rem] border border-input bg-background/88 px-4 py-3" defaultValue={item.quote} name="quote" />
                  <input className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" defaultValue={item.authorName} name="authorName" />
                  <input className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" defaultValue={item.role} name="role" />
                  <input className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" defaultValue={item.company} name="company" />
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input defaultChecked={item.isVisible} name="isVisible" type="checkbox" />
                    Visible
                  </label>
                  <button className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background" type="submit">
                    Save
                  </button>
                </div>
              </form>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
