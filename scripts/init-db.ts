import { mkdir, writeFile } from "fs/promises";
import path from "path";
import initSqlJs from "sql.js";

const schemaSql = `
CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'VIEWER',
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "App" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "longDescription" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'IN_DEVELOPMENT',
  "versionNotes" TEXT,
  "internalNotes" TEXT,
  "logoUrl" TEXT,
  "screenshotUrls" JSONB NOT NULL,
  "liveUrl" TEXT,
  "stagingUrl" TEXT,
  "adminUrl" TEXT,
  "repositoryUrl" TEXT,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "processName" TEXT,
  "deployPath" TEXT,
  "runtime" TEXT,
  "port" INTEGER,
  "healthUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "App_slug_key" ON "App"("slug");

CREATE TABLE "Service" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "startingPrice" TEXT,
  "ctaLabel" TEXT NOT NULL DEFAULT 'Start a project',
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

CREATE TABLE "Testimonial" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "quote" TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "status" TEXT NOT NULL DEFAULT 'published',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "FAQ" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'published',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ContactSubmission" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "company" TEXT,
  "message" TEXT NOT NULL,
  "interestType" TEXT NOT NULL,
  "internalNotes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "SiteSettings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "siteName" TEXT NOT NULL DEFAULT 'Appathy',
  "siteTagline" TEXT NOT NULL DEFAULT 'Apps, websites, and digital systems designed to feel calm and work hard.',
  "logoUrl" TEXT,
  "contactEmail" TEXT NOT NULL DEFAULT 'hello@appathy.dev',
  "contactPhone" TEXT,
  "analyticsSnippet" TEXT,
  "seoTitleDefault" TEXT NOT NULL DEFAULT 'Appathy | Apps, websites, and digital systems',
  "seoDescription" TEXT NOT NULL DEFAULT 'Appathy builds clean, useful apps and digital platforms for modern businesses.',
  "socialLinkedIn" TEXT,
  "socialX" TEXT,
  "socialGithub" TEXT,
  "footerBlurb" TEXT NOT NULL DEFAULT 'Appathy builds focused digital products with clear structure and reliable execution.',
  "themeAccent" TEXT NOT NULL DEFAULT '#0f766e',
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "HomepageContent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "heroEyebrow" TEXT NOT NULL DEFAULT 'Independent software studio',
  "heroTitle" TEXT NOT NULL DEFAULT 'Clean digital products for teams that need clarity, speed, and follow-through.',
  "heroDescription" TEXT NOT NULL DEFAULT 'Appathy designs and manages apps, websites, and internal platforms that feel simple on the surface and dependable underneath.',
  "primaryCtaLabel" TEXT NOT NULL DEFAULT 'Start a project',
  "secondaryCtaLabel" TEXT NOT NULL DEFAULT 'See apps',
  "introTitle" TEXT NOT NULL DEFAULT 'What Appathy does',
  "introBody" TEXT NOT NULL DEFAULT 'I build and support software products with a sharp focus on usability, maintainability, and quiet confidence.',
  "aboutTitle" TEXT NOT NULL DEFAULT 'A focused product partner',
  "aboutBody" TEXT NOT NULL DEFAULT 'Appathy works with founders, operators, and growing teams who need a hands-on engineer to shape software that is useful from day one.',
  "contactTitle" TEXT NOT NULL DEFAULT 'Tell me what needs building',
  "contactBody" TEXT NOT NULL DEFAULT 'Share the problem, product, or improvement you are thinking about. I will reply with the clearest next step.',
  "status" TEXT NOT NULL DEFAULT 'published',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fileName" TEXT NOT NULL,
  "altText" TEXT,
  "url" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "AnnouncementUpdate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "status" TEXT NOT NULL DEFAULT 'published',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);`;

async function main() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(schemaSql);

  const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const relativePath = databaseUrl.startsWith("file:") ? databaseUrl.slice(5) : "prisma/dev.db";
  const filePath = path.resolve(process.cwd(), relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, Buffer.from(db.export()));
  console.log(`Created SQLite database at ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
