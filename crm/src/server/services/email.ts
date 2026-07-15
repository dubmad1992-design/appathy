import nodemailer from "nodemailer";
import { prisma } from "@/lib/db/prisma";
import type { TemplateContext } from "@/types";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateKey?: string;
  companyId?: string | null;
  contactId?: string | null;
  invoiceId?: string | null;
  subscriptionId?: string | null;
  reminderJobId?: string | null;
};

function resolvePath(input: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return "";
  }, input);
}

export function renderTemplate(template: string, context: TemplateContext) {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expression: string) => {
    const value = resolvePath(context, expression.trim());
    return value == null ? "" : String(value);
  });
}

async function sendWithResend(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return null;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message ?? "Resend request failed.");
  }

  return {
    provider: "resend",
    providerId: payload.id as string | undefined
  };
}

async function sendWithSmtp(input: SendEmailInput) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.RESEND_FROM_EMAIL ?? process.env.BUSINESS_EMAIL;

  if (!host || !user || !pass || !from) {
    return null;
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });

  const result = await transport.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text
  });

  return {
    provider: "smtp",
    providerId: result.messageId
  };
}

export async function sendEmail(input: SendEmailInput) {
  let provider = process.env.EMAIL_PROVIDER ?? "resend";
  let result: { provider: string; providerId?: string | null } | null = null;

  try {
    if (provider === "resend") {
      result = await sendWithResend(input);
    }

    if (!result) {
      provider = "smtp";
      result = await sendWithSmtp(input);
    }

    if (!result) {
      provider = "console";
      result = { provider, providerId: null };
      console.log(`[email:${provider}]`, input.subject, input.to);
    }

    await prisma.emailLog.create({
      data: {
        companyId: input.companyId ?? undefined,
        contactId: input.contactId ?? undefined,
        invoiceId: input.invoiceId ?? undefined,
        subscriptionId: input.subscriptionId ?? undefined,
        reminderJobId: input.reminderJobId ?? undefined,
        templateKey: input.templateKey,
        provider: result.provider,
        providerId: result.providerId ?? null,
        toAddress: input.to,
        subject: input.subject,
        htmlBody: input.html,
        textBody: input.text ?? null,
        status: "SENT"
      }
    });

    return result;
  } catch (error) {
    await prisma.emailLog.create({
      data: {
        companyId: input.companyId ?? undefined,
        contactId: input.contactId ?? undefined,
        invoiceId: input.invoiceId ?? undefined,
        subscriptionId: input.subscriptionId ?? undefined,
        reminderJobId: input.reminderJobId ?? undefined,
        templateKey: input.templateKey,
        provider,
        toAddress: input.to,
        subject: input.subject,
        htmlBody: input.html,
        textBody: input.text ?? null,
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown email error"
      }
    });
    throw error;
  }
}
