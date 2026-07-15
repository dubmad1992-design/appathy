import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { renderTemplate } from "@/server/services/email";
import { saveBusinessSettingsAction, saveEmailTemplateAction, saveReminderRuleAction } from "@/server/actions/crm";

const templateTokens = [
  "{{business.name}}",
  "{{contact.firstName}}",
  "{{contact.lastName}}",
  "{{company.name}}",
  "{{invoice.number}}",
  "{{invoice.totalAmount}}",
  "{{invoice.balanceDue}}",
  "{{invoice.dueDate}}",
  "{{subscription.serviceName}}",
  "{{subscription.nextBillingDate}}"
];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser(PERMISSIONS.SETTINGS_VIEW);
  const params = await searchParams;
  const [business, billing, templates, reminderRules] = await Promise.all([
    prisma.setting.findUnique({ where: { category_key: { category: "business", key: "profile" } } }),
    prisma.setting.findUnique({ where: { category_key: { category: "billing", key: "defaults" } } }),
    prisma.emailTemplate.findMany({ orderBy: { key: "asc" } }),
    prisma.reminderRule.findMany({ orderBy: [{ kind: "asc" }, { daysOffset: "desc" }] })
  ]);

  const businessValue = (business?.value ?? {}) as Record<string, string>;
  const billingValue = (billing?.value ?? {}) as Record<string, string | number>;
  const previewContext = {
    business: {
      name: businessValue.name ?? "Appathy CRM"
    },
    contact: {
      firstName: "Billing",
      lastName: "Contact"
    },
    company: {
      name: "Client Account"
    },
    invoice: {
      number: "INV-00042",
      totalAmount: "GBP 630.00",
      balanceDue: "GBP 315.00",
      dueDate: "15 Apr 2026"
    },
    subscription: {
      serviceName: "Managed service plan",
      nextBillingDate: "01 Apr 2026"
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <div className="eyebrow">Admin settings</div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Business profile, invoice defaults, and payment details</h1>
          {params.saved ? <p className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">Settings saved.</p> : null}
          {params.error ? <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">We couldn&apos;t save that admin setting.</p> : null}
          <form action={saveBusinessSettingsAction} className="mt-6 space-y-4">
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={businessValue.name} name="name" placeholder="Business name" />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={businessValue.email} name="email" placeholder="Billing email" />
            <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={businessValue.phone} name="phone" placeholder="Phone" />
            <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" defaultValue={businessValue.address} name="address" placeholder="Address" />
            <div className="grid gap-4 lg:grid-cols-2">
              <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={businessValue.registrationNumber} name="registrationNumber" placeholder="Registration number" />
              <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={businessValue.vatNumber} name="vatNumber" placeholder="VAT number" />
              <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={String(billingValue.invoicePrefix ?? "")} name="invoicePrefix" placeholder="Invoice prefix" />
              <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={String(billingValue.defaultCurrency ?? "GBP")} name="defaultCurrency" placeholder="Currency" />
              <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={String(billingValue.defaultTaxRate ?? 20)} name="defaultTaxRate" placeholder="Tax rate" />
              <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={String(billingValue.paymentTermsDays ?? 14)} name="paymentTermsDays" placeholder="Payment terms" />
            </div>
            <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" defaultValue={String(billingValue.paymentDetails ?? "")} name="paymentDetails" placeholder="Payment details" />
            <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
              Save settings
            </button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="eyebrow">Template tokens</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Available merge fields</h2>
          <p className="mt-2 text-sm text-muted-foreground">Use these placeholders inside subjects and email bodies.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {templateTokens.map((token) => (
              <code className="rounded-full border border-border/70 px-3 py-1 text-xs" key={token}>
                {token}
              </code>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6" id="email-templates">
        <div className="eyebrow">Email templates</div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">Edit billing and reminder messages</h2>
        <div className="mt-5 space-y-4">
          {templates.map((template) => (
            <form action={saveEmailTemplateAction} className="rounded-3xl border border-border/70 p-5" id={`template-${template.key}`} key={template.id}>
              <input name="templateId" type="hidden" value={template.id} />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{template.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{template.key}</p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input defaultChecked={template.isActive} name="isActive" type="checkbox" />
                  Active
                </label>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={template.name} name="name" placeholder="Template name" />
                  <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={template.subject} name="subject" placeholder="Email subject" />
                  <textarea className="min-h-40 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" defaultValue={template.bodyHtml} name="bodyHtml" placeholder="HTML body" />
                  <textarea className="min-h-32 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" defaultValue={template.bodyText} name="bodyText" placeholder="Plain-text body" />
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-sm font-semibold">Preview</p>
                  <div className="mt-3 space-y-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Subject</p>
                      <p className="mt-1">{renderTemplate(template.subject, previewContext)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Rendered text</p>
                      <pre className="mt-1 whitespace-pre-wrap rounded-2xl bg-background/80 p-3 text-xs">
                        {renderTemplate(template.bodyText, previewContext)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Rendered HTML source</p>
                      <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-2xl bg-background/80 p-3 text-xs">
                        {renderTemplate(template.bodyHtml, previewContext)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              <button className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl border border-border/70 px-4 text-sm font-semibold" type="submit">
                Save template
              </button>
            </form>
          ))}
        </div>
      </Card>

      <Card className="p-6" id="reminder-rules">
        <div className="eyebrow">Reminder rules</div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">Renewal and invoice automation schedule</h2>
        <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            {reminderRules.map((rule) => (
              <form action={saveReminderRuleAction} className="rounded-2xl border border-border/70 p-4" key={rule.id}>
                <input name="ruleId" type="hidden" value={rule.id} />
                <div className="grid gap-3 lg:grid-cols-[1.1fr_0.7fr_1fr_auto] lg:items-center">
                  <select className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={rule.kind} name="kind">
                    <option value="INVOICE_PRE_DUE">INVOICE_PRE_DUE</option>
                    <option value="INVOICE_DUE_TODAY">INVOICE_DUE_TODAY</option>
                    <option value="INVOICE_OVERDUE">INVOICE_OVERDUE</option>
                    <option value="SUBSCRIPTION_RENEWAL">SUBSCRIPTION_RENEWAL</option>
                    <option value="FAILED_PAYMENT">FAILED_PAYMENT</option>
                    <option value="INTERNAL_ALERT">INTERNAL_ALERT</option>
                  </select>
                  <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={String(rule.daysOffset)} name="daysOffset" />
                  <select className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={rule.templateKey} name="templateKey">
                    {templates.map((template) => (
                      <option key={template.id} value={template.key}>
                        {template.key}
                      </option>
                    ))}
                  </select>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input defaultChecked={rule.isActive} name="isActive" type="checkbox" />
                    Active
                  </label>
                </div>
                <button className="mt-4 inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 px-4 text-sm font-semibold" type="submit">
                  Update rule
                </button>
              </form>
            ))}
          </div>

          <form action={saveReminderRuleAction} className="rounded-2xl border border-border/70 p-4">
            <h3 className="text-lg font-semibold">Add reminder rule</h3>
            <div className="mt-4 space-y-4">
              <select className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="SUBSCRIPTION_RENEWAL" name="kind">
                <option value="INVOICE_PRE_DUE">INVOICE_PRE_DUE</option>
                <option value="INVOICE_DUE_TODAY">INVOICE_DUE_TODAY</option>
                <option value="INVOICE_OVERDUE">INVOICE_OVERDUE</option>
                <option value="SUBSCRIPTION_RENEWAL">SUBSCRIPTION_RENEWAL</option>
                <option value="FAILED_PAYMENT">FAILED_PAYMENT</option>
                <option value="INTERNAL_ALERT">INTERNAL_ALERT</option>
              </select>
              <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="14" name="daysOffset" placeholder="Days offset" />
              <select className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={templates[0]?.key} name="templateKey">
                {templates.map((template) => (
                  <option key={template.id} value={template.key}>
                    {template.key}
                  </option>
                ))}
              </select>
              <label className="inline-flex items-center gap-2 text-sm">
                <input defaultChecked name="isActive" type="checkbox" />
                Active immediately
              </label>
              <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
                Add reminder rule
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
