import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { resolvePortalAccessToken } from "@/server/services/portal";

export default async function PortalAccessPage({
  params,
  searchParams
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const access = await resolvePortalAccessToken(token);

  if (!access) {
    notFound();
  }

  const invoice = access.invoice;
  const quote = access.quote;

  return (
    <main className="shell py-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <Card className="p-6">
          <div className="eyebrow">Customer portal</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {invoice ? `Invoice ${invoice.number}` : quote ? `Quote ${quote.number}` : "Portal access"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {access.company?.name ?? invoice?.company.name ?? quote?.company.name} {access.contact ? `• ${access.contact.firstName} ${access.contact.lastName}` : null}
          </p>
          {query.accepted ? <p className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">Quote accepted successfully.</p> : null}
        </Card>

        {invoice ? (
          <Card className="p-6">
            <div className="grid gap-4 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Issued</p>
                <p className="mt-2 font-semibold">{formatDate(invoice.issueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due</p>
                <p className="mt-2 font-semibold">{formatDate(invoice.dueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="mt-2 font-semibold">{formatCurrency(Number(invoice.totalAmount), invoice.currency)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance due</p>
                <p className="mt-2 font-semibold">{formatCurrency(Number(invoice.balanceDue), invoice.currency)}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {invoice.items.map((item) => (
                <div className="rounded-2xl border border-border/70 p-4" key={item.id}>
                  <p className="font-medium">{item.description}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {Number(item.quantity)} × {formatCurrency(Number(item.unitPrice), invoice.currency)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" href={`/api/portal/${token}/pdf`} target="_blank">
                Download PDF
              </Link>
            </div>
          </Card>
        ) : null}

        {quote ? (
          <Card className="p-6">
            <div className="grid gap-4 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Issued</p>
                <p className="mt-2 font-semibold">{formatDate(quote.issueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valid until</p>
                <p className="mt-2 font-semibold">{formatDate(quote.expiryDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="mt-2 font-semibold">{quote.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="mt-2 font-semibold">{formatCurrency(Number(quote.totalAmount), quote.currency)}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {quote.items.map((item) => (
                <div className="rounded-2xl border border-border/70 p-4" key={item.id}>
                  <p className="font-medium">{item.description}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {Number(item.quantity)} × {formatCurrency(Number(item.unitPrice), quote.currency)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {quote.status === "SENT" || quote.status === "DRAFT" ? (
                <form action={`/api/portal/${token}/accept`} method="post">
                  <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
                    Accept quote
                  </button>
                </form>
              ) : null}
              {quote.convertedInvoice ? (
                <p className="text-sm text-muted-foreground">This quote has already been converted into an invoice.</p>
              ) : null}
            </div>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
