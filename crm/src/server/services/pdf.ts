import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { jsPDF } from "jspdf";
import { formatCurrency, formatDate } from "@/lib/utils";

type InvoicePdfInput = {
  invoice: {
    id: string;
    number: string;
    currency: string;
    issueDate: Date;
    dueDate: Date;
    subtotalAmount: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    balanceDue: number;
    paymentReference?: string | null;
    notes?: string | null;
    terms?: string | null;
  };
  company: {
    name: string;
    billingEmail?: string | null;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export async function generateInvoicePdf({ invoice, company, items }: InvoicePdfInput) {
  const doc = new jsPDF();
  const businessName = process.env.BUSINESS_NAME ?? "Appathy CRM";

  doc.setFontSize(22);
  doc.text(businessName, 14, 18);
  doc.setFontSize(12);
  doc.text(`Invoice ${invoice.number}`, 14, 30);
  doc.text(`Issued: ${formatDate(invoice.issueDate)}`, 14, 38);
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 14, 45);
  doc.text(`Bill to: ${company.name}`, 14, 57);
  if (company.billingEmail) {
    doc.text(company.billingEmail, 14, 64);
  }

  let y = 80;
  doc.setFontSize(11);
  doc.text("Description", 14, y);
  doc.text("Qty", 120, y);
  doc.text("Rate", 145, y);
  doc.text("Total", 175, y);
  y += 8;

  items.forEach((item) => {
    doc.text(item.description, 14, y);
    doc.text(String(item.quantity), 120, y);
    doc.text(formatCurrency(item.unitPrice, invoice.currency), 145, y);
    doc.text(formatCurrency(item.lineTotal, invoice.currency), 175, y, { align: "right" });
    y += 8;
  });

  y += 10;
  doc.text(`Subtotal: ${formatCurrency(invoice.subtotalAmount, invoice.currency)}`, 175, y, { align: "right" });
  y += 7;
  doc.text(`Tax: ${formatCurrency(invoice.taxAmount, invoice.currency)}`, 175, y, { align: "right" });
  y += 7;
  doc.text(`Discount: ${formatCurrency(invoice.discountAmount, invoice.currency)}`, 175, y, { align: "right" });
  y += 7;
  doc.setFontSize(13);
  doc.text(`Total: ${formatCurrency(invoice.totalAmount, invoice.currency)}`, 175, y, { align: "right" });
  y += 8;
  doc.text(`Balance due: ${formatCurrency(invoice.balanceDue, invoice.currency)}`, 175, y, { align: "right" });

  y += 16;
  doc.setFontSize(10);
  doc.text(`Payment reference: ${invoice.paymentReference ?? invoice.number}`, 14, y);
  y += 7;
  doc.text(`Payment details: ${process.env.PAYMENT_DETAILS ?? "Configured in settings"}`, 14, y, { maxWidth: 180 });
  y += 14;
  if (invoice.notes) {
    doc.text(`Notes: ${invoice.notes}`, 14, y, { maxWidth: 180 });
    y += 14;
  }
  if (invoice.terms) {
    doc.text(`Terms: ${invoice.terms}`, 14, y, { maxWidth: 180 });
  }

  const uploadDir = process.env.UPLOAD_DIR ?? "./public/uploads";
  const invoiceDir = path.resolve(process.cwd(), uploadDir, "invoices");
  await mkdir(invoiceDir, { recursive: true });
  const fileName = `${invoice.number}.pdf`;
  const filePath = path.join(invoiceDir, fileName);
  const buffer = Buffer.from(doc.output("arraybuffer"));

  await writeFile(filePath, buffer);

  return {
    buffer,
    fileName,
    relativePath: path.posix.join("/uploads", "invoices", fileName)
  };
}
