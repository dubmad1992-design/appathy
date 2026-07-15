import { NextResponse } from "next/server";
import { sendEnquiryNotification } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid submission." }, { status: 400 });
  }

  const { website, ...data } = parsed.data;

  if (website) {
    // Pretend success so bots don't adapt; nothing is stored or sent.
    return NextResponse.json({ success: true, data: null });
  }

  if (isRateLimited(clientIp(request))) {
    return NextResponse.json({ error: "Too many submissions. Please try again shortly." }, { status: 429 });
  }

  const submission = await prisma.contactSubmission.create({
    data
  });

  try {
    await sendEnquiryNotification(submission);
  } catch (error) {
    // The enquiry is already saved; a notification failure must not fail the submission.
    console.error("Enquiry notification failed:", error);
  }

  return NextResponse.json({ success: true, data: submission });
}
