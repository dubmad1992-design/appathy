"use server";

import { AppStatus, EnquiryStatus, PublishStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canManageApps, canManageContent, canManageSettings, canManageUsers } from "@/lib/permissions";
import { hashPassword, requireAuth } from "@/lib/auth";

function getBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function getString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function requireAppsAccess() {
  const user = await requireAuth();
  if (!canManageApps(user.role)) {
    throw new Error("Unauthorized");
  }
  return user;
}

async function requireContentAccess() {
  const user = await requireAuth();
  if (!canManageContent(user.role)) {
    throw new Error("Unauthorized");
  }
  return user;
}

async function requireSettingsAccess() {
  const user = await requireAuth();
  if (!canManageSettings(user.role)) {
    throw new Error("Unauthorized");
  }
  return user;
}

async function requireUsersAccess() {
  const user = await requireAuth();
  if (!canManageUsers(user.role)) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function saveAppAction(formData: FormData) {
  await requireAppsAccess();

  const id = getString(formData.get("id"));
  const screenshots = getString(formData.get("screenshots"))
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const data = {
    name: getString(formData.get("name")),
    slug: getString(formData.get("slug")),
    category: getString(formData.get("category")),
    shortDescription: getString(formData.get("shortDescription")),
    longDescription: getString(formData.get("longDescription")),
    status: (getString(formData.get("status")) || "IN_DEVELOPMENT") as AppStatus,
    versionNotes: getString(formData.get("versionNotes")) || null,
    internalNotes: getString(formData.get("internalNotes")) || null,
    logoUrl: getString(formData.get("logoUrl")) || null,
    screenshotUrls: screenshots,
    liveUrl: getString(formData.get("liveUrl")) || null,
    stagingUrl: getString(formData.get("stagingUrl")) || null,
    adminUrl: getString(formData.get("adminUrl")) || null,
    repositoryUrl: getString(formData.get("repositoryUrl")) || null,
    featured: getBoolean(formData.get("featured")),
    isPublic: getBoolean(formData.get("isPublic")),
    processName: getString(formData.get("processName")) || null,
    deployPath: getString(formData.get("deployPath")) || null,
    runtime: getString(formData.get("runtime")) || null,
    port: getString(formData.get("port")) ? Number(getString(formData.get("port"))) : null,
    healthUrl: getString(formData.get("healthUrl")) || null,
    sortOrder: Number(getString(formData.get("sortOrder")) || "0")
  };

  if (id) {
    await prisma.app.update({ where: { id }, data });
  } else {
    await prisma.app.create({ data });
  }

  revalidatePath("/admin/apps");
  revalidatePath("/apps");
  revalidatePath("/");
}

export async function updateHomepageAction(formData: FormData) {
  await requireContentAccess();

  const existing = await prisma.homepageContent.findFirst();
  const data = {
    heroEyebrow: getString(formData.get("heroEyebrow")),
    heroTitle: getString(formData.get("heroTitle")),
    heroDescription: getString(formData.get("heroDescription")),
    primaryCtaLabel: getString(formData.get("primaryCtaLabel")),
    secondaryCtaLabel: getString(formData.get("secondaryCtaLabel")),
    introTitle: getString(formData.get("introTitle")),
    introBody: getString(formData.get("introBody")),
    aboutTitle: getString(formData.get("aboutTitle")),
    aboutBody: getString(formData.get("aboutBody")),
    contactTitle: getString(formData.get("contactTitle")),
    contactBody: getString(formData.get("contactBody")),
    status: PublishStatus.published
  };

  if (existing) {
    await prisma.homepageContent.update({ where: { id: existing.id }, data });
  } else {
    await prisma.homepageContent.create({ data });
  }

  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/admin/content");
}

export async function saveServiceAction(formData: FormData) {
  await requireContentAccess();

  const id = getString(formData.get("id"));
  const bullets = getString(formData.get("bullets"))
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const evidence = getString(formData.get("evidence"))
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, label, note, href, portfolioSlug] = line.split("|").map((part) => part.trim());
      return { name, label, note, href, portfolioSlug: portfolioSlug || null };
    });

  const data = {
    title: getString(formData.get("title")),
    slug: getString(formData.get("slug")),
    strapline: getString(formData.get("strapline")),
    shortDescription: getString(formData.get("shortDescription")),
    description: getString(formData.get("description")),
    whoFor: getString(formData.get("whoFor")),
    bullets,
    evidence,
    startingPrice: getString(formData.get("startingPrice")) || null,
    ctaLabel: getString(formData.get("ctaLabel")) || "Start a project",
    isVisible: getBoolean(formData.get("isVisible")),
    sortOrder: Number(getString(formData.get("sortOrder")) || "0"),
    status: PublishStatus.active
  };

  if (id) {
    await prisma.service.update({ where: { id }, data });
  } else {
    await prisma.service.create({ data });
  }

  revalidatePath("/services");
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function saveFaqAction(formData: FormData) {
  await requireContentAccess();

  const id = getString(formData.get("id"));
  const data = {
    question: getString(formData.get("question")),
    answer: getString(formData.get("answer")),
    isVisible: getBoolean(formData.get("isVisible")),
    sortOrder: Number(getString(formData.get("sortOrder")) || "0"),
    status: PublishStatus.published
  };

  if (id) {
    await prisma.fAQ.update({ where: { id }, data });
  } else {
    await prisma.fAQ.create({ data });
  }

  revalidatePath("/faq");
  revalidatePath("/admin/content");
}

export async function saveTestimonialAction(formData: FormData) {
  await requireContentAccess();

  const id = getString(formData.get("id"));
  const data = {
    quote: getString(formData.get("quote")),
    authorName: getString(formData.get("authorName")),
    role: getString(formData.get("role")),
    company: getString(formData.get("company")),
    isVisible: getBoolean(formData.get("isVisible")),
    status: PublishStatus.published
  };

  if (id) {
    await prisma.testimonial.update({ where: { id }, data });
  } else {
    await prisma.testimonial.create({ data });
  }

  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function updateEnquiryAction(formData: FormData) {
  await requireAppsAccess();

  const id = getString(formData.get("id"));

  await prisma.contactSubmission.update({
    where: { id },
    data: {
      status: (getString(formData.get("status")) || "READ") as EnquiryStatus,
      internalNotes: getString(formData.get("internalNotes")) || null
    }
  });

  revalidatePath("/admin/enquiries");
  revalidatePath("/admin/dashboard");
}

export async function saveUserAction(formData: FormData) {
  await requireUsersAccess();

  const id = getString(formData.get("id"));
  const password = getString(formData.get("password"));
  const role = (getString(formData.get("role")) || "VIEWER") as Role;
  const data = {
    name: getString(formData.get("name")),
    email: getString(formData.get("email")),
    role,
    status: getBoolean(formData.get("disabled")) ? "disabled" : "active"
  } as const;

  if (id) {
    await prisma.user.update({
      where: { id },
      data: {
        ...data,
        ...(password ? { passwordHash: await hashPassword(password) } : {})
      }
    });
  } else {
    await prisma.user.create({
      data: {
        ...data,
        passwordHash: await hashPassword(password || "ChangeMe123!")
      }
    });
  }

  revalidatePath("/admin/users");
}

export async function updateSettingsAction(formData: FormData) {
  await requireSettingsAccess();

  const existing = await prisma.siteSettings.findFirst();
  const data = {
    siteName: getString(formData.get("siteName")),
    siteTagline: getString(formData.get("siteTagline")),
    contactEmail: getString(formData.get("contactEmail")),
    contactPhone: getString(formData.get("contactPhone")) || null,
    socialLinkedIn: getString(formData.get("socialLinkedIn")) || null,
    socialX: getString(formData.get("socialX")) || null,
    socialGithub: getString(formData.get("socialGithub")) || null,
    seoTitleDefault: getString(formData.get("seoTitleDefault")),
    seoDescription: getString(formData.get("seoDescription")),
    footerBlurb: getString(formData.get("footerBlurb")),
    analyticsSnippet: getString(formData.get("analyticsSnippet")) || null,
    status: PublishStatus.active
  };

  if (existing) {
    await prisma.siteSettings.update({ where: { id: existing.id }, data });
  } else {
    await prisma.siteSettings.create({ data });
  }

  revalidatePath("/");
  revalidatePath("/admin/settings");
}
