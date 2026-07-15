import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Table, TableCell, TableHead } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CustomerDocumentsPanel } from "@/components/crm/customer-documents-panel";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS, ROLE_KEYS } from "@/lib/constants/permissions";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  createCustomerContactAction,
  createCustomerInvoiceAction,
  createCustomerNoteAction,
  createCustomerQuoteAction,
  createCustomerSubscriptionAction,
  deleteCustomerContactAction,
  deleteCompanyAction,
  updateCompanyAction,
  updateCustomerContactAction,
  updateCustomerInvoiceAction,
  updateCustomerNoteAction,
  updateCustomerQuoteAction,
  updateCustomerSubscriptionAction
} from "@/server/actions/crm";
import { getCompanyDetail } from "@/server/queries/customers";

type LineItemValue = {
  description?: string | null;
  quantity?: string | number | { toString(): string } | null;
  unitPrice?: string | number | { toString(): string } | null;
  taxRate?: string | number | { toString(): string } | null;
  discountAmount?: string | number | { toString(): string } | null;
};

function buildLineItemRows(items: LineItemValue[], mode: "create" | "edit") {
  const rows = items.length
    ? items.map((item) => ({
        description: item.description ?? "",
        quantity: item.quantity == null ? "1" : String(item.quantity),
        unitPrice: item.unitPrice == null ? "" : String(item.unitPrice),
        taxRate: item.taxRate == null ? "20" : String(item.taxRate),
        discountAmount: item.discountAmount == null ? "0" : String(item.discountAmount)
      }))
    : [
        {
          description: "",
          quantity: "1",
          unitPrice: "",
          taxRate: "20",
          discountAmount: "0"
        }
      ];

  if (mode === "create") {
    rows.push(
      { description: "", quantity: "", unitPrice: "", taxRate: "", discountAmount: "" },
      { description: "", quantity: "", unitPrice: "", taxRate: "", discountAmount: "" }
    );
  } else {
    rows.push({ description: "", quantity: "", unitPrice: "", taxRate: "", discountAmount: "" });
  }

  return rows;
}

function LineItemFields({ items, mode }: { items: LineItemValue[]; mode: "create" | "edit" }) {
  const rows = buildLineItemRows(items, mode);

  return (
    <div className="space-y-3">
      {rows.map((item, index) => (
        <div className="grid gap-3 rounded-2xl border border-border/70 p-3 lg:grid-cols-[1.6fr_0.5fr_0.7fr_0.5fr_0.6fr]" key={`${mode}-${index}`}>
          <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={item.description} name="itemDescription" placeholder={index === 0 ? "Line item description" : "Optional extra line item"} />
          <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={item.quantity} name="itemQuantity" placeholder="Qty" />
          <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={item.unitPrice} name="itemUnitPrice" placeholder="Rate" />
          <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={item.taxRate} name="itemTaxRate" placeholder="Tax %" />
          <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={item.discountAmount} name="itemDiscountAmount" placeholder="Discount" />
        </div>
      ))}
    </div>
  );
}

export default async function CustomerDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser(PERMISSIONS.CUSTOMERS_VIEW);
  const { customerId } = await params;
  const query = await searchParams;
  const company = await getCompanyDetail(customerId);

  if (!company) {
    notFound();
  }

  const openBalance = company.invoices.reduce((sum, invoice) => sum + Number(invoice.balanceDue), 0);
  const overdueInvoices = company.invoices.filter((invoice) => invoice.status === "OVERDUE").length;
  const activeSubscriptions = company.subscriptions.filter((subscription) => subscription.status === "ACTIVE").length;
  const canAdminManage = user.roles.includes(ROLE_KEYS.ADMIN);
  const canManageContacts = user.permissions.includes(PERMISSIONS.COMPANIES_MANAGE);
  const canDelete = canAdminManage;
  const primaryContactId = company.contacts.find((contact) => contact.isPrimary)?.id ?? "";
  const contactSaved = Boolean(query.contactSaved);
  const contactDeleted = Boolean(query.contactDeleted);
  const contactError = typeof query.contactError === "string" ? query.contactError : undefined;
  const quoteSaved = Boolean(query.quoteSaved);
  const quoteError = typeof query.quoteError === "string" ? query.quoteError : undefined;
  const invoiceSaved = Boolean(query.invoiceSaved);
  const invoiceError = typeof query.invoiceError === "string" ? query.invoiceError : undefined;
  const subscriptionSaved = Boolean(query.subscriptionSaved);
  const subscriptionError = typeof query.subscriptionError === "string" ? query.subscriptionError : undefined;
  const noteSaved = Boolean(query.noteSaved);
  const noteError = typeof query.noteError === "string" ? query.noteError : undefined;

  return (
    <div className="space-y-4">
      <Card className="p-6">
        {query.saved ? <p className="mb-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">Customer profile updated.</p> : null}
        {query.error ? (
          <p className="mb-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
            We couldn&apos;t save that customer update. Check the billing email and website fields and try again.
          </p>
        ) : null}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="eyebrow">Customer profile</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{company.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{company.notesSummary ?? "No summary added yet."}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {company.billingEmail ?? "No billing email"} • {company.billingPhone ?? "No billing phone"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {company.flags.map((flag) => (
              <Badge key={flag} tone={flag.includes("OVERDUE") ? "danger" : "warning"}>
                {flag}
              </Badge>
            ))}
            {!company.flags.length ? <Badge tone="neutral">No flags</Badge> : null}
          </div>
        </div>
      </Card>

      <section className="grid gap-4 xl:grid-cols-4">
        <Card className="p-6">
          <div className="eyebrow">Open balance</div>
          <p className="mt-4 text-4xl font-semibold">{formatCurrency(openBalance)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Current outstanding balance on linked invoices.</p>
        </Card>
        <Card className="p-6">
          <div className="eyebrow">Overdue invoices</div>
          <p className="mt-4 text-4xl font-semibold">{overdueInvoices}</p>
          <p className="mt-2 text-sm text-muted-foreground">Invoices currently marked overdue for this account.</p>
        </Card>
        <Card className="p-6">
          <div className="eyebrow">Active subscriptions</div>
          <p className="mt-4 text-4xl font-semibold">{activeSubscriptions}</p>
          <p className="mt-2 text-sm text-muted-foreground">Recurring services still active on the account.</p>
        </Card>
        <Card className="p-6">
          <div className="eyebrow">Contacts</div>
          <p className="mt-4 text-4xl font-semibold">{company.contacts.length}</p>
          <p className="mt-2 text-sm text-muted-foreground">People linked to this company profile.</p>
        </Card>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6">
          <div className="eyebrow">Account management</div>
          <h2 className="mt-3 text-xl font-semibold">Edit customer details</h2>
          <form action={updateCompanyAction} className="mt-5 space-y-4">
            <input name="companyId" type="hidden" value={company.id} />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={company.name} name="name" placeholder="Company name" required />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={company.legalName ?? ""} name="legalName" placeholder="Legal name" />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={company.billingEmail ?? ""} name="billingEmail" placeholder="Billing email" required type="email" />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={company.billingPhone ?? ""} name="billingPhone" placeholder="Billing phone" required />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={company.website ?? ""} name="website" placeholder="Website URL or domain" />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={company.tags.join(", ")} name="tags" placeholder="Tags, comma separated" />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={company.flags.join(", ")} name="flags" placeholder="Flags, comma separated" />
            <textarea className="min-h-28 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" defaultValue={company.notesSummary ?? ""} name="notesSummary" placeholder="Notes summary" />
            <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
              Save customer
            </button>
          </form>

          {canDelete ? (
            <div className="mt-8 rounded-3xl border border-danger/30 bg-danger/5 p-5">
              <h3 className="text-lg font-semibold">Danger zone</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Deleting this customer will remove linked contacts, invoices, quotes, subscriptions, documents, and communication history.
              </p>
              <form action={deleteCompanyAction} className="mt-4 space-y-3">
                <input name="companyId" type="hidden" value={company.id} />
                <input className="h-11 w-full rounded-2xl border border-danger/30 bg-background px-4 text-sm" name="confirmName" placeholder={`Type "${company.name}" to confirm deletion`} required />
                <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-danger px-4 text-sm font-semibold text-white" type="submit">
                  Delete customer permanently
                </button>
              </form>
            </div>
          ) : null}
        </Card>

        <Card className="p-6" id="contacts">
          <h2 className="text-xl font-semibold">Contacts and addresses</h2>
          {contactSaved ? <p className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">Contact details saved.</p> : null}
          {contactDeleted ? <p className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">Contact removed from this customer.</p> : null}
          {contactError ? (
            <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
              We couldn&apos;t save that contact. Check the required fields and make sure the email address is valid.
            </p>
          ) : null}

          {canManageContacts ? (
            <form action={createCustomerContactAction} className="mt-4 space-y-4 rounded-3xl border border-border/70 bg-muted/20 p-4">
              <input name="companyId" type="hidden" value={company.id} />
              <div>
                <p className="text-sm font-semibold">Add contact</p>
                <p className="mt-1 text-xs text-muted-foreground">Create the billing or relationship contact this team will work with.</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="firstName" placeholder="First name" required />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="lastName" placeholder="Last name" required />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="email" placeholder="Email" required type="email" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="phone" placeholder="Phone" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="title" placeholder="Job title" />
                <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="ACTIVE" name="status">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="LEAD">LEAD</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input defaultChecked={!company.contacts.length} name="isPrimary" type="checkbox" />
                Mark as primary contact
              </label>
              <button className="inline-flex h-10 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
                Save contact
              </button>
            </form>
          ) : null}

          <div className="mt-4 space-y-4">
            {company.contacts.map((contact) => (
              <div className="rounded-2xl border border-border/70 p-4" key={contact.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{contact.email}</p>
                    <p className="text-sm text-muted-foreground">{contact.phone ?? "No phone recorded"}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {contact.status !== "ACTIVE" ? <Badge tone="warning">{contact.status}</Badge> : null}
                    {contact.isPrimary ? <Badge tone="success">Primary</Badge> : null}
                  </div>
                </div>
                {contact.addresses.length ? (
                  <div className="mt-3 space-y-2">
                    {contact.addresses.map((address) => (
                      <div className="rounded-2xl bg-muted/30 p-3 text-sm" key={address.id}>
                        {address.line1}, {address.city}, {address.postalCode}, {address.country}
                      </div>
                    ))}
                  </div>
                ) : null}
                {canManageContacts ? (
                  <form action={updateCustomerContactAction} className="mt-4 space-y-4">
                    <input name="companyId" type="hidden" value={company.id} />
                    <input name="contactId" type="hidden" value={contact.id} />
                    <div className="grid gap-4 lg:grid-cols-2">
                      <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={contact.firstName} name="firstName" placeholder="First name" required />
                      <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={contact.lastName} name="lastName" placeholder="Last name" required />
                      <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={contact.email} name="email" placeholder="Email" required type="email" />
                      <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={contact.alternateEmail ?? ""} name="alternateEmail" placeholder="Alternate email" type="email" />
                      <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={contact.phone ?? ""} name="phone" placeholder="Phone" />
                      <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={contact.mobile ?? ""} name="mobile" placeholder="Mobile" />
                      <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={contact.title ?? ""} name="title" placeholder="Job title" />
                      <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={contact.department ?? ""} name="department" placeholder="Department" />
                      <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={contact.billingPreference ?? ""} name="billingPreference" placeholder="Billing preference" />
                      <select className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={contact.status} name="status">
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="LEAD">LEAD</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                      <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm lg:col-span-2" defaultValue={contact.tags.join(", ")} name="tags" placeholder="Tags, comma separated" />
                      <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm lg:col-span-2" defaultValue={contact.flags.join(", ")} name="flags" placeholder="Flags, comma separated" />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input defaultChecked={contact.isPrimary} name="isPrimary" type="checkbox" />
                        Primary contact
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 px-4 text-sm font-semibold" type="submit">
                          Save contact changes
                        </button>
                        <button
                          className="inline-flex h-10 items-center justify-center rounded-2xl border border-danger/30 px-4 text-sm font-semibold text-danger"
                          formAction={deleteCustomerContactAction}
                          type="submit"
                        >
                          Delete contact
                        </button>
                      </div>
                    </div>
                  </form>
                ) : null}
              </div>
            ))}
            {!company.contacts.length ? <p className="text-sm text-muted-foreground">No contacts linked yet.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]" id="quotes">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Quotes</h2>
          {quoteSaved ? <p className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">Quote workspace updated.</p> : null}
          {quoteError ? <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">We couldn&apos;t save that quote. Check the quote fields and try again.</p> : null}
          <div className="mt-4 space-y-3">
            {company.quotes.length ? (
              company.quotes.map((quote) => (
                <div className="rounded-2xl border border-border/70 p-4" key={quote.id}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-medium">{quote.number}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {quote.status} • valid until {formatDate(quote.expiryDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(Number(quote.totalAmount), quote.currency)}</p>
                      <Link className="mt-1 inline-block text-xs text-primary" href={quote.convertedInvoice ? `/invoices/${quote.convertedInvoice.id}` : "/quotes"}>
                        {quote.convertedInvoice ? "View invoice" : "Open quotes workspace"}
                      </Link>
                    </div>
                  </div>

                  {canAdminManage && !quote.convertedInvoice ? (
                    <details className="mt-4 rounded-2xl border border-border/70 bg-muted/15 p-4">
                      <summary className="cursor-pointer list-none text-sm font-semibold">Manage quote</summary>
                      <form action={updateCustomerQuoteAction} className="mt-4 space-y-4">
                        <input name="companyId" type="hidden" value={company.id} />
                        <input name="quoteId" type="hidden" value={quote.id} />
                        <select className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={quote.contactId ?? ""} name="contactId">
                          <option value="">Primary billing contact</option>
                          {company.contacts.map((contact) => (
                            <option key={contact.id} value={contact.id}>
                              {contact.firstName} {contact.lastName}
                            </option>
                          ))}
                        </select>
                        <div className="grid gap-4 lg:grid-cols-3">
                          <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={String(quote.issueDate).slice(0, 10)} name="issueDate" type="date" />
                          <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={String(quote.expiryDate).slice(0, 10)} name="expiryDate" type="date" />
                          <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={quote.currency} name="currency" placeholder="Currency" />
                        </div>
                        <LineItemFields items={quote.items} mode="edit" />
                        <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" defaultValue={quote.notes ?? ""} name="notes" placeholder="Proposal notes" />
                        <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" defaultValue={quote.terms ?? ""} name="terms" placeholder="Terms" />
                        <button className="inline-flex h-10 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
                          Save quote changes
                        </button>
                      </form>
                    </details>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No quotes created for this customer yet.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="eyebrow">New quote</div>
          <h3 className="mt-3 text-xl font-semibold">Create a quote from this customer profile</h3>
          {canAdminManage ? (
            <form action={createCustomerQuoteAction} className="mt-5 space-y-4">
              <input name="companyId" type="hidden" value={company.id} />
              <select className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={primaryContactId} name="contactId">
                <option value="">Primary billing contact</option>
                {company.contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
                  </option>
                ))}
              </select>
              <div className="grid gap-4 lg:grid-cols-3">
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={new Date().toISOString().slice(0, 10)} name="issueDate" type="date" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10)} name="expiryDate" type="date" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="GBP" name="currency" placeholder="Currency" />
              </div>
              <LineItemFields items={[]} mode="create" />
              <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" name="notes" placeholder="Proposal notes" />
              <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" name="terms" placeholder="Terms" />
              <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
                Create quote
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Only admins can create and manage quotes from the customer workspace.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]" id="invoices">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Invoices</h2>
          {invoiceSaved ? <p className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">Invoice workspace updated.</p> : null}
          {invoiceError ? <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">We couldn&apos;t save that invoice. Check the invoice fields and try again.</p> : null}
          <Table className="mt-4">
            <thead>
              <tr>
                <TableHead>Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Balance</TableHead>
              </tr>
            </thead>
            <tbody>
              {company.invoices.map((invoice) => (
                <tr className="border-t border-border/70" key={invoice.id}>
                  <TableCell>
                    <Link className="font-semibold hover:text-primary" href={`/invoices/${invoice.id}`}>
                      {invoice.number}
                    </Link>
                  </TableCell>
                  <TableCell>{invoice.status}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>{formatCurrency(Number(invoice.totalAmount), invoice.currency)}</TableCell>
                  <TableCell>{formatCurrency(Number(invoice.balanceDue), invoice.currency)}</TableCell>
                </tr>
              ))}
            </tbody>
          </Table>

          {canAdminManage && company.invoices.length ? (
            <div className="mt-5 space-y-3">
              {company.invoices.map((invoice) => (
                <details className="rounded-2xl border border-border/70 bg-muted/15 p-4" key={invoice.id}>
                  <summary className="cursor-pointer list-none text-sm font-semibold">
                    Manage {invoice.number} • {invoice.status}
                  </summary>
                  <form action={updateCustomerInvoiceAction} className="mt-4 space-y-4">
                    <input name="companyId" type="hidden" value={company.id} />
                    <input name="invoiceId" type="hidden" value={invoice.id} />
                    <select className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={invoice.contactId ?? ""} name="contactId">
                      <option value="">Billing contact</option>
                      {company.contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.firstName} {contact.lastName}
                        </option>
                      ))}
                    </select>
                    <div className="grid gap-4 lg:grid-cols-3">
                      <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={String(invoice.issueDate).slice(0, 10)} name="issueDate" type="date" />
                      <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={String(invoice.dueDate).slice(0, 10)} name="dueDate" type="date" />
                      <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={invoice.currency} name="currency" placeholder="Currency" />
                    </div>
                    <LineItemFields items={invoice.items} mode="edit" />
                    <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" defaultValue={invoice.notes ?? ""} name="notes" placeholder="Invoice notes" />
                    <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" defaultValue={invoice.terms ?? ""} name="terms" placeholder="Terms and payment details" />
                    <div className="flex flex-wrap items-center gap-3">
                      <button className="inline-flex h-10 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
                        Save invoice changes
                      </button>
                      <Link className="text-sm text-primary" href={`/invoices/${invoice.id}`}>
                        Open invoice detail
                      </Link>
                    </div>
                  </form>
                </details>
              ))}
            </div>
          ) : null}
        </Card>

        <Card className="p-6">
          <div className="eyebrow">New invoice</div>
          <h3 className="mt-3 text-xl font-semibold">Create a draft invoice from this customer profile</h3>
          {canAdminManage ? (
            <form action={createCustomerInvoiceAction} className="mt-5 space-y-4">
              <input name="companyId" type="hidden" value={company.id} />
              <select className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={primaryContactId} name="contactId">
                <option value="">Billing contact</option>
                {company.contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
                  </option>
                ))}
              </select>
              <div className="grid gap-4 lg:grid-cols-3">
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={new Date().toISOString().slice(0, 10)} name="issueDate" type="date" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={new Date().toISOString().slice(0, 10)} name="dueDate" type="date" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="GBP" name="currency" placeholder="Currency" />
              </div>
              <LineItemFields items={[]} mode="create" />
              <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" name="notes" placeholder="Invoice notes" />
              <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" name="terms" placeholder="Terms and payment details" />
              <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
                Create invoice
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Only admins can create and manage invoices from the customer workspace.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]" id="subscriptions">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Subscriptions</h2>
          {subscriptionSaved ? <p className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">Subscription workspace updated.</p> : null}
          {subscriptionError ? <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">We couldn&apos;t save that subscription. Check the recurring service fields and try again.</p> : null}
          <div className="mt-4 space-y-3">
            {company.subscriptions.length ? (
              company.subscriptions.map((subscription) => (
                <div className="rounded-2xl border border-border/70 p-4" key={subscription.id}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-medium">{subscription.serviceName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {subscription.status} • Next billing {formatDate(subscription.nextBillingDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(Number(subscription.amount), company.currency)}</p>
                      <Link className="mt-1 inline-block text-xs text-primary" href={`/subscriptions/${subscription.id}`}>
                        Open subscription detail
                      </Link>
                    </div>
                  </div>

                  {canAdminManage ? (
                    <details className="mt-4 rounded-2xl border border-border/70 bg-muted/15 p-4">
                      <summary className="cursor-pointer list-none text-sm font-semibold">Manage subscription</summary>
                      <form action={updateCustomerSubscriptionAction} className="mt-4 space-y-4">
                        <input name="companyId" type="hidden" value={company.id} />
                        <input name="subscriptionId" type="hidden" value={subscription.id} />
                        <select className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.contactId ?? ""} name="contactId">
                          <option value="">Contact</option>
                          {company.contacts.map((contact) => (
                            <option key={contact.id} value={contact.id}>
                              {contact.firstName} {contact.lastName}
                            </option>
                          ))}
                        </select>
                        <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.serviceName} name="serviceName" placeholder="Service name" required />
                        <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" defaultValue={subscription.description ?? ""} name="description" placeholder="Description" />
                        <div className="grid gap-4 lg:grid-cols-3">
                          <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.status} name="status">
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="PAUSED">PAUSED</option>
                            <option value="CANCELLED">CANCELLED</option>
                            <option value="EXPIRED">EXPIRED</option>
                          </select>
                          <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.frequency} name="frequency">
                            <option value="MONTHLY">MONTHLY</option>
                            <option value="QUARTERLY">QUARTERLY</option>
                            <option value="ANNUALLY">ANNUALLY</option>
                            <option value="CUSTOM">CUSTOM</option>
                          </select>
                          <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.intervalCount} name="intervalCount" placeholder="Interval count" />
                          <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={String(subscription.amount)} name="amount" placeholder="Amount" />
                          <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={String(subscription.taxRate)} name="taxRate" placeholder="Tax rate" />
                          <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={String(subscription.startDate).slice(0, 10)} name="startDate" type="date" />
                          <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={String(subscription.nextBillingDate).slice(0, 10)} name="nextBillingDate" type="date" />
                          <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.cancelledAt ? String(subscription.cancelledAt).slice(0, 10) : ""} name="cancelledAt" type="date" />
                          <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm lg:col-span-3" defaultValue={subscription.reminderOffsets.join(", ")} name="reminderOffsets" placeholder="Reminder offsets, comma separated" />
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <label className="inline-flex items-center gap-2">
                            <input defaultChecked={subscription.autoGenerateInvoice} name="autoGenerateInvoice" type="checkbox" />
                            Auto-generate invoice
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input defaultChecked={subscription.autoSendReminders} name="autoSendReminders" type="checkbox" />
                            Auto-send reminders
                          </label>
                        </div>
                        <button className="inline-flex h-10 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
                          Save subscription changes
                        </button>
                      </form>
                    </details>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No subscriptions linked to this customer yet.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="eyebrow">New subscription</div>
          <h3 className="mt-3 text-xl font-semibold">Create a recurring service profile</h3>
          {canAdminManage ? (
            <form action={createCustomerSubscriptionAction} className="mt-5 space-y-4">
              <input name="companyId" type="hidden" value={company.id} />
              <select className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={primaryContactId} name="contactId">
                <option value="">Contact</option>
                {company.contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
                  </option>
                ))}
              </select>
              <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="serviceName" placeholder="Service name" required />
              <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" name="description" placeholder="Description" />
              <div className="grid gap-4 lg:grid-cols-3">
                <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="ACTIVE" name="status">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PAUSED">PAUSED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
                <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="MONTHLY" name="frequency">
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="QUARTERLY">QUARTERLY</option>
                  <option value="ANNUALLY">ANNUALLY</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="1" name="intervalCount" placeholder="Interval count" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="amount" placeholder="Amount" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="20" name="taxRate" placeholder="Tax rate" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={new Date().toISOString().slice(0, 10)} name="startDate" type="date" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={new Date().toISOString().slice(0, 10)} name="nextBillingDate" type="date" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="cancelledAt" type="date" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm lg:col-span-3" defaultValue="14, 7, 0, -3, -7" name="reminderOffsets" placeholder="Reminder offsets, comma separated" />
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input defaultChecked name="autoGenerateInvoice" type="checkbox" />
                  Auto-generate invoice
                </label>
                <label className="inline-flex items-center gap-2">
                  <input defaultChecked name="autoSendReminders" type="checkbox" />
                  Auto-send reminders
                </label>
              </div>
              <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
                Create subscription
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Only admins can create and manage subscriptions from the customer workspace.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Timeline</h2>
          <div className="mt-4 space-y-3">
            {company.communicationLogs.length ? (
              company.communicationLogs.map((entry) => (
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

        <Card className="p-6" id="notes">
          <h2 className="text-xl font-semibold">Internal notes</h2>
          {noteSaved ? <p className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">Internal notes updated.</p> : null}
          {noteError ? <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">We couldn&apos;t save that note. Check the note body and linked record selections.</p> : null}
          {canAdminManage ? (
            <form action={createCustomerNoteAction} className="mt-4 space-y-4">
              <input name="companyId" type="hidden" value={company.id} />
              <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" name="body" placeholder="Add an internal note" />
              <div className="grid gap-4 lg:grid-cols-3">
                <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="contactId">
                  <option value="">Related contact</option>
                  {company.contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </option>
                  ))}
                </select>
                <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="invoiceId">
                  <option value="">Related invoice</option>
                  {company.invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.number}
                    </option>
                  ))}
                </select>
                <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="subscriptionId">
                  <option value="">Related subscription</option>
                  {company.subscriptions.map((subscription) => (
                    <option key={subscription.id} value={subscription.id}>
                      {subscription.serviceName}
                    </option>
                  ))}
                </select>
              </div>
              <button className="inline-flex h-10 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
                Save note
              </button>
            </form>
          ) : null}
          <div className="mt-4 space-y-3">
            {company.notes.length ? (
              company.notes.map((note) => (
                <div className="rounded-2xl border border-border/70 p-4" key={note.id}>
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-medium">
                        {note.author.firstName} {note.author.lastName}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(note.createdAt)}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {note.contact ? <Badge tone="neutral">{note.contact.firstName} {note.contact.lastName}</Badge> : null}
                        {note.invoice ? <Badge tone="warning">{note.invoice.number}</Badge> : null}
                        {note.subscription ? <Badge tone="success">{note.subscription.serviceName}</Badge> : null}
                      </div>
                    </div>
                  </div>
                  {canAdminManage ? (
                    <form action={updateCustomerNoteAction} className="mt-4 space-y-4">
                      <input name="companyId" type="hidden" value={company.id} />
                      <input name="noteId" type="hidden" value={note.id} />
                      <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" defaultValue={note.body} name="body" placeholder="Internal note" />
                      <div className="grid gap-4 lg:grid-cols-3">
                        <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={note.contactId ?? ""} name="contactId">
                          <option value="">Related contact</option>
                          {company.contacts.map((contact) => (
                            <option key={contact.id} value={contact.id}>
                              {contact.firstName} {contact.lastName}
                            </option>
                          ))}
                        </select>
                        <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={note.invoiceId ?? ""} name="invoiceId">
                          <option value="">Related invoice</option>
                          {company.invoices.map((invoice) => (
                            <option key={invoice.id} value={invoice.id}>
                              {invoice.number}
                            </option>
                          ))}
                        </select>
                        <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={note.subscriptionId ?? ""} name="subscriptionId">
                          <option value="">Related subscription</option>
                          {company.subscriptions.map((subscription) => (
                            <option key={subscription.id} value={subscription.id}>
                              {subscription.serviceName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 px-4 text-sm font-semibold" type="submit">
                        Save note changes
                      </button>
                    </form>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">{note.body}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No internal notes recorded yet.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Documents</h2>
          <div className="mt-4">
            <CustomerDocumentsPanel companyId={company.id} documents={company.documents} />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold">Open tasks</h2>
          <div className="mt-4 space-y-3">
            {company.tasks.length ? (
              company.tasks.map((task) => (
                <div className="rounded-2xl border border-border/70 p-4" key={task.id}>
                  <p className="font-medium">{task.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{task.description ?? "No description"}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : "Unassigned"} • {task.status}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No open tasks linked to this customer.</p>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}
