import nodemailer from "nodemailer";
import type { ContactSubmission } from "@prisma/client";

function transportFromEnv() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass }
  });
}

export async function sendEnquiryNotification(submission: ContactSubmission) {
  const transport = transportFromEnv();
  const to = process.env.ENQUIRY_NOTIFY_EMAIL ?? process.env.SMTP_USER;

  if (!transport || !to) {
    console.log("[email:console] enquiry notification (SMTP not configured)", submission.id, submission.email);
    return;
  }

  const lines = [
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Company: ${submission.company ?? "-"}`,
    `Interest: ${submission.interestType}`,
    "",
    submission.message,
    "",
    `View in admin: https://appathy.uk/admin/enquiries`
  ];

  await transport.sendMail({
    from: `"Appathy site" <${process.env.SMTP_USER}>`,
    to,
    replyTo: `"${submission.name}" <${submission.email}>`,
    subject: `New enquiry from ${submission.name}${submission.company ? ` (${submission.company})` : ""}`,
    text: lines.join("\n")
  });
}
