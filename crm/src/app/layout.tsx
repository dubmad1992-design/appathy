import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Appathy CRM",
  description: "Production-ready CRM for customers, recurring billing, reminders, and service operations."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
