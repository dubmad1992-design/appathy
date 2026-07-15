import Link from "next/link";
import { CompanyContactSelectFields } from "@/components/crm/company-contact-select-fields";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createPortalLinkAction, createQuoteAction, convertQuoteAction } from "@/server/actions/crm";
import { getCrmLookups } from "@/server/queries/lookups";
import { getQuotesList } from "@/server/queries/quotes";

export default async function QuotesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser(PERMISSIONS.QUOTES_VIEW);
  const params = await searchParams;
  const [quotes, lookups] = await Promise.all([getQuotesList(), getCrmLookups()]);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-6">
        <div className="eyebrow">Quotes</div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Quotes, approvals, and quote-to-invoice conversion</h1>
        {params.saved ? <p className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">Quote saved.</p> : null}
        {params.portal && typeof params.portal === "string" ? (
          <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4">
            <p className="text-sm font-semibold">Customer portal link</p>
            <input className="mt-2 h-11 w-full rounded-2xl border border-border/70 bg-background px-4 text-sm" readOnly value={params.portal} />
          </div>
        ) : null}
        <div className="mt-5 space-y-4">
          {quotes.map((quote) => (
            <div className="rounded-3xl border border-border/70 p-5" key={quote.id}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-semibold">{quote.number}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{quote.company.name}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Issued {formatDate(quote.issueDate)} • Expires {formatDate(quote.expiryDate)} • {quote.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{formatCurrency(Number(quote.totalAmount), quote.currency)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{quote.items.length} line item(s)</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {quote.items.map((item) => (
                  <div className="rounded-2xl border border-border/70 p-3" key={item.id}>
                    <p className="font-medium">{item.description}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {Number(item.quantity)} × {formatCurrency(Number(item.unitPrice), quote.currency)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <form action={createPortalLinkAction}>
                  <input name="portalType" type="hidden" value="quote" />
                  <input name="entityId" type="hidden" value={quote.id} />
                  <input name="returnTo" type="hidden" value="/quotes" />
                  <button className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 px-4 text-sm font-semibold" type="submit">
                    Create portal link
                  </button>
                </form>
                {quote.convertedInvoice ? (
                  <Link className="inline-flex h-10 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" href={`/invoices/${quote.convertedInvoice.id}`}>
                    View invoice
                  </Link>
                ) : (
                  <form action={convertQuoteAction}>
                    <input name="quoteId" type="hidden" value={quote.id} />
                    <button className="inline-flex h-10 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
                      Convert to invoice
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="eyebrow">New quote</div>
        <h2 className="mt-3 text-xl font-semibold">Create a proposal</h2>
        <form action={createQuoteAction} className="mt-5 space-y-4">
          <CompanyContactSelectFields
            companies={lookups.companies}
            companyPlaceholder="Company"
            contacts={lookups.contacts}
            contactPlaceholder="Contact"
            className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm"
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={new Date().toISOString().slice(0, 10)} name="issueDate" type="date" />
            <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10)} name="expiryDate" type="date" />
            <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="GBP" name="currency" placeholder="Currency" />
            <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="itemDescription" placeholder="Line item description" required />
            <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="1" name="itemQuantity" placeholder="Quantity" />
            <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="itemUnitPrice" placeholder="Unit price" required />
            <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="20" name="itemTaxRate" placeholder="Tax rate" />
            <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="0" name="itemDiscountAmount" placeholder="Discount" />
          </div>
          <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" name="notes" placeholder="Proposal notes" />
          <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" name="terms" placeholder="Terms" />
          <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
            Save draft quote
          </button>
        </form>
      </Card>
    </div>
  );
}
