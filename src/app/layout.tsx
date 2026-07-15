import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "@/app/globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { getSiteSettings } from "@/lib/data";

const sans = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans"
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono"
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = settings.seoTitleDefault || "Appathy";
  const description = settings.seoDescription || "Websites, forms, and systems for UK businesses, designed and built by Appathy.";

  return {
    metadataBase: new URL("https://appathy.uk"),
    title: { default: title, template: "%s | Appathy" },
    description,
    openGraph: {
      title,
      description,
      url: "https://appathy.uk",
      siteName: "Appathy",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
      locale: "en_GB",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"]
    }
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
