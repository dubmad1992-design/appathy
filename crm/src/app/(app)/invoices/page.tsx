import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Table, TableCell, TableHead } from "@/components/ui/table";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getInvoiceList } from "@/server/queries/invoices";

export default async function InvoicesPage() {
  await requireUser(PERMISSIONS.INVOICES_VIEW);
  const invoices = await getInvoiceList();

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="eyebrow">Invoices</div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Drafts, sent invoices, balances, and payment status</h1>
        </div>
        <Link className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" href="/invoices/new">
          Create invoice
        </Link>
      </div>
      <Table>
        <thead>
          <tr>
            <TableHead>Invoice</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Issued</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Balance due</TableHead>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr className="border-t border-border/70" key={invoice.id}>
              <TableCell>
                <Link className="font-semibold hover:text-primary" href={`/invoices/${invoice.id}`}>
                  {invoice.number}
                </Link>
              </TableCell>
              <TableCell>{invoice.company.name}</TableCell>
              <TableCell>{invoice.status}</TableCell>
              <TableCell>{formatDate(invoice.issueDate)}</TableCell>
              <TableCell>{formatCurrency(Number(invoice.totalAmount), invoice.currency)}</TableCell>
              <TableCell>{formatCurrency(Number(invoice.balanceDue), invoice.currency)}</TableCell>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
