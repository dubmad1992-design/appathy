import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { getSiteSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Appathy collects, uses, and protects the personal information you share through this site."
};

const cardStyle = {
  borderColor: "rgba(143,168,193,0.12)",
  background: "linear-gradient(180deg, rgba(17,19,24,0.9), rgba(17,19,24,0.74))"
};

export default async function PrivacyPage() {
  const settings = await getSiteSettings();

  const sections = [
    {
      heading: "Who we are",
      body: `Appathy ("we", "us") is a UK-based software studio operating at appathy.uk. We are the data controller for the personal information collected through this site. You can reach us about anything in this policy at ${settings.contactEmail}.`
    },
    {
      heading: "What we collect and why",
      body: "When you send an enquiry through the contact form we collect your name, email address, company or business name (if you provide one), the type of project you are interested in, and your message. We use this solely to respond to your enquiry and discuss your project. We do not use it for marketing lists, we do not sell it, and we do not share it with third parties except the email provider that delivers the notification to us."
    },
    {
      heading: "How it is stored",
      body: "Enquiries are stored in a database on our own UK-hosted server and a copy is delivered to our business email inbox. Access is limited to the people who need it to respond to you."
    },
    {
      heading: "How long we keep it",
      body: "We keep enquiry details for as long as needed to deal with your enquiry and any project that follows, and no longer than 24 months after our last contact, unless we are working together under a contract that requires records to be kept for longer."
    },
    {
      heading: "Cookies",
      body: "The public site sets no tracking or analytics cookies. A single session cookie is used only for administrators signing in to manage the site's content; it is strictly necessary for that function and is not used to track visitors."
    },
    {
      heading: "Your rights",
      body: `Under UK GDPR you can ask us for a copy of the information we hold about you, ask us to correct it, or ask us to delete it. Email ${settings.contactEmail} and we will respond within one month. If you are unhappy with how we handle your information you have the right to complain to the Information Commissioner's Office (ico.org.uk).`
    },
    {
      heading: "Changes to this policy",
      body: "If how we handle personal information changes, this page will be updated. This policy was last updated on 15 July 2026."
    }
  ];

  return (
    <section className="shell pb-18 pt-10 lg:pb-24 lg:pt-14">
      <div className="max-w-4xl space-y-4">
        <div className="section-kicker">Privacy</div>
        <h1 className="section-title text-[#f1ece8]">Privacy policy.</h1>
        <p className="text-base leading-8 text-[#b9b0ad]">
          Plain English, because that is how we would want it explained to us.
        </p>
      </div>

      <div className="mt-10 grid gap-4">
        {sections.map((section, index) => (
          <Card className="p-6 sm:p-7" key={section.heading} style={cardStyle}>
            <div className="grid gap-4 lg:grid-cols-[0.16fr_0.84fr]">
              <div className="section-kicker">{String(index + 1).padStart(2, "0")}</div>
              <div>
                <p className="text-2xl font-semibold tracking-[-0.04em] text-[#f1ece8]">{section.heading}</p>
                <p className="mt-3 text-sm leading-7 text-[#b9b0ad] sm:text-base">{section.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
