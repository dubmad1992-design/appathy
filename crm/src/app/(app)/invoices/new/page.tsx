import { CompanyContactSelectFields } from "@/components/crm/company-contact-select-fields";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { createInvoiceAction } from "@/server/actions/crm";
import { getCrmLookups } from "@/server/queries/lookups";

export default async function NewInvoicePage() {
  await requireUser(PERMISSIONS.INVOICES_MANAGE);
  const lookups = await getCrmLookups();

  return (
    <Card className="max-w-4xl p-6">
      <div className="eyebrow">New invoice</div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Create a draft invoice</h1>
      <form action={createInvoiceAction} className="mt-6 grid gap-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <CompanyContactSelectFields
            companies={lookups.companies}
            contacts={lookups.contacts}
            contactPlaceholder="Billing contact"
            className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm"
          />
          <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={new Date().toISOString().slice(0, 10)} name="issueDate" type="date" />
          <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={new Date().toISOString().slice(0, 10)} name="dueDate" type="date" />
          <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="GBP" name="currency" placeholder="Currency" />
          <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="20" name="itemTaxRate" placeholder="Tax rate" />
        </div>
        <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="itemDescription" placeholder="Line item description" required />
        <div className="grid gap-4 lg:grid-cols-3">
          <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="1" name="itemQuantity" placeholder="Quantity" />
          <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="itemUnitPrice" placeholder="Unit price" required />
          <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="0" name="itemDiscountAmount" placeholder="Discount" />
        </div>
        <textarea className="min-h-28 rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" name="notes" placeholder="Invoice notes" />
        <textarea className="min-h-28 rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" name="terms" placeholder="Terms and payment details" />
        <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
          Save draft invoice
        </button>
      </form>
    </Card>
  );
}
