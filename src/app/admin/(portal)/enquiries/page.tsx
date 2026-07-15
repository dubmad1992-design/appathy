import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { enquiryStatusTone } from "@/lib/constants";
import { updateEnquiryAction } from "@/app/admin/(portal)/actions";

export default async function AdminEnquiriesPage() {
  const enquiries = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <div className="eyebrow">Enquiries</div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Lead management without clutter.</h1>
      </Card>

      <div className="space-y-4">
        {enquiries.map((item) => (
          <Card className="p-6" key={item.id}>
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.email} • {item.company ?? "Independent"}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${enquiryStatusTone[item.status]}`}>{item.status}</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{item.message}</p>
              </div>
              <form action={updateEnquiryAction} className="space-y-3">
                <input name="id" type="hidden" value={item.id} />
                <div className="text-sm text-muted-foreground">Interest: {item.interestType}</div>
                <select className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" defaultValue={item.status} name="status">
                  <option value="NEW">NEW</option>
                  <option value="READ">READ</option>
                  <option value="REPLIED">REPLIED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
                <textarea
                  className="min-h-28 w-full rounded-[1.15rem] border border-input bg-background/88 px-4 py-3"
                  defaultValue={item.internalNotes ?? ""}
                  name="internalNotes"
                  placeholder="Internal notes"
                />
                <button className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background" type="submit">
                  Update enquiry
                </button>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
