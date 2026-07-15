import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Table, TableCell, TableHead } from "@/components/ui/table";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { getInvoiceDetail } from "@/server/queries/invoices";
import { createPortalLinkAction, recordPaymentAction, sendInvoiceAction } from "@/server/actions/crm";

export default async function InvoiceDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ invoiceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser(PERMISSIONS.INVOICES_VIEW);
  const { invoiceId } = await params;
  const query = await searchParams;
  const invoice = await getInvoiceDetail(invoiceId);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        {query.sent ? <p className="mb-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">Invoice email sent successfully.</p> : null}
        {query.error ? <p className="mb-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">We couldn&apos;t send that invoice email.</p> : null}
        {typeof query.portal === "string" ? (
          <div className="mb-4 rounded-2xl border border-border/70 bg-background/70 p-4">
            <p className="text-sm font-semibold">Customer portal link</p>
            <input className="mt-2 h-11 w-full rounded-2xl border border-border/70 bg-background px-4 text-sm" readOnly value={query.portal} />
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">Invoice detail</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{invoice.number}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {invoice.company.name} • Due {formatDate(invoice.dueDate)}
            </p>
            {invoice.sourceQuote ? <p className="mt-2 text-xs text-muted-foreground">Converted from quote {invoice.sourceQuote.number}</p> : null}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Balance due</p>
            <p className="mt-2 text-3xl font-semibold">{formatCurrency(Number(invoice.balanceDue), invoice.currency)}</p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <a
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 px-4 text-sm font-semibold"
                href={`/api/invoices/${invoice.id}/pdf`}
                target="_blank"
              >
                Download PDF
              </a>
              <form action={sendInvoiceAction}>
                <input name="invoiceId" type="hidden" value={invoice.id} />
                <button className="inline-flex h-10 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
                  Send invoice
                </button>
              </form>
              <form action={createPortalLinkAction}>
                <input name="portalType" type="hidden" value="invoice" />
                <input name="entityId" type="hidden" value={invoice.id} />
                <input name="returnTo" type="hidden" value={`/invoices/${invoice.id}`} />
                <button className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 px-4 text-sm font-semibold" type="submit">
                  Create portal link
                </button>
              </form>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Line items</h2>
          <Table className="mt-4">
            <thead>
              <tr>
                <TableHead>Description</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Total</TableHead>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr className="border-t border-border/70" key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{Number(item.quantity)}</TableCell>
                  <TableCell>{formatCurrency(Number(item.unitPrice), invoice.currency)}</TableCell>
                  <TableCell>{formatCurrency(Number(item.lineTotal), invoice.currency)}</TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold">Record payment</h2>
          <form action={recordPaymentAction} className="mt-4 space-y-4">
            <input name="invoiceId" type="hidden" value={invoice.id} />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="amount" placeholder="Amount" required />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={new Date().toISOString().slice(0, 10)} name="paidAt" type="date" />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="method" placeholder="Payment method" required />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="reference" placeholder="Reference" />
            <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" name="reconciliationNote" placeholder="Reconciliation note" />
            <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
              Save payment
            </button>
          </form>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Payment history</h2>
          <div className="mt-4 space-y-3">
            {invoice.payments.length ? (
              invoice.payments.map((payment) => (
                <div className="rounded-2xl border border-border/70 p-4" key={payment.id}>
                  <p className="font-medium">{formatCurrency(Number(payment.amount), invoice.currency)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {payment.method} on {formatDate(payment.paidAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{payment.reference ?? "No reference"}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold">Communication log</h2>
          <div className="mt-4 space-y-3">
            {invoice.communicationLogs.length ? (
              invoice.communicationLogs.map((entry) => (
                <div className="rounded-2xl border border-border/70 p-4" key={entry.id}>
                  <p className="font-medium">{entry.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{entry.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No communication events logged yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
