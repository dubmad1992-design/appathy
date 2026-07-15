import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Table, TableCell, TableHead } from "@/components/ui/table";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { formatCurrency } from "@/lib/utils";
import { createCompanyAction } from "@/server/actions/crm";
import { getCompaniesList } from "@/server/queries/customers";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser(PERMISSIONS.CUSTOMERS_VIEW);
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;
  const companies = await getCompaniesList(q);

  const totalOpenBalance = companies.reduce(
    (sum, company) => sum + company.invoices.reduce((invoiceSum, invoice) => invoiceSum + Number(invoice.balanceDue), 0),
    0
  );

  return (
    <div className="space-y-4">
      {error === "validation" ? (
        <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          We couldn&apos;t create that customer. Check the company fields and, if you added a primary contact, make sure their name and email are complete.
        </p>
      ) : null}
      <section className="grid gap-4 xl:grid-cols-4">
        <Card className="p-6">
          <div className="eyebrow">Customers</div>
          <p className="mt-4 text-4xl font-semibold">{companies.length}</p>
          <p className="mt-2 text-sm text-muted-foreground">Active company records in the CRM.</p>
        </Card>
        <Card className="p-6">
          <div className="eyebrow">Open balance</div>
          <p className="mt-4 text-4xl font-semibold">{formatCurrency(totalOpenBalance)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Outstanding invoice balance across the visible list.</p>
        </Card>
        <Card className="p-6">
          <div className="eyebrow">VIP / flagged</div>
          <p className="mt-4 text-4xl font-semibold">{companies.filter((company) => company.flags.length > 0).length}</p>
          <p className="mt-2 text-sm text-muted-foreground">Accounts with internal flags requiring closer attention.</p>
        </Card>
        <Card className="p-6">
          <div className="eyebrow">Search</div>
          <form className="mt-4 flex gap-2" method="get">
            <input className="h-10 flex-1 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={q} name="q" placeholder="Search companies" />
            <button className="rounded-2xl border border-border/70 px-4 text-sm font-semibold" type="submit">
              Search
            </button>
          </form>
          <p className="mt-2 text-sm text-muted-foreground">Search by company name, billing email, or exact tag.</p>
        </Card>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden p-6">
          <div className="mb-5">
            <div className="eyebrow">Customer accounts</div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">Companies, account health, and billing context</h1>
          </div>
          <Table>
            <thead>
              <tr>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Quotes</TableHead>
                <TableHead>Invoices</TableHead>
                <TableHead>Open balance</TableHead>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => {
                const openBalance = company.invoices.reduce((sum, invoice) => sum + Number(invoice.balanceDue), 0);
                return (
                  <tr className="border-t border-border/70" key={company.id}>
                    <TableCell>
                      <Link className="font-semibold hover:text-primary" href={`/customers/${company.id}`}>
                        {company.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{company.billingEmail ?? "No billing email"}</div>
                    </TableCell>
                    <TableCell>{company.status}</TableCell>
                    <TableCell>{company.contacts.length}</TableCell>
                    <TableCell>{company.quotes.length}</TableCell>
                    <TableCell>{company.invoices.length}</TableCell>
                    <TableCell>{formatCurrency(openBalance)}</TableCell>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>

        <Card className="p-6">
          <div className="eyebrow">New company</div>
          <h2 className="mt-3 text-xl font-semibold">Create a customer account</h2>
          <form action={createCompanyAction} className="mt-5 space-y-4">
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="name" placeholder="Company name" required />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="legalName" placeholder="Legal name" />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="billingEmail" placeholder="Billing email" required type="email" />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="billingPhone" placeholder="Billing phone" required />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="website" placeholder="Website URL or domain" />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="tags" placeholder="Tags, comma separated" />
            <textarea className="min-h-28 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" name="notesSummary" placeholder="Notes summary" />
            <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
              <p className="text-sm font-semibold">Primary contact</p>
              <p className="mt-1 text-xs text-muted-foreground">Optional, but adding this now makes quotes and invoices usable straight away.</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="primaryContactFirstName" placeholder="First name" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="primaryContactLastName" placeholder="Last name" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="primaryContactEmail" placeholder="Email" type="email" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="primaryContactPhone" placeholder="Phone" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm lg:col-span-2" name="primaryContactTitle" placeholder="Job title" />
              </div>
            </div>
            <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
              Create customer
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
