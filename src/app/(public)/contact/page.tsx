import type { Metadata } from "next";
import { ContactForm } from "@/components/site/contact-form";
import { getSiteSettings } from "@/lib/data";
import { contactChecklist } from "@/lib/studio-content";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contact",
  description: "Tell Appathy what you need built — a website, digital forms, system integration, or a portal — and get a clear next step."
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <section className="shell pb-18 pt-10 lg:pb-24 lg:pt-14">
      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="grid gap-6">

          {/* Heading card */}
          <Card
            className="p-7 sm:p-8"
            style={{
              borderColor: "rgba(143,168,193,0.12)",
              background: "linear-gradient(180deg, rgba(17,19,24,0.92), rgba(17,19,24,0.76))"
            }}
          >
            <div className="space-y-4">
              <div className="section-kicker">Contact</div>
              <h1 className="text-5xl font-semibold tracking-[-0.07em] text-[#f1ece8] sm:text-6xl">Tell me what you need.</h1>
              <p className="text-base leading-8 text-[#b9b0ad] sm:text-lg">
                A website refresh, digital forms, system integration, or a portal.
              </p>
            </div>
          </Card>

          {/* Common projects */}
          <Card
            className="p-6 sm:p-7"
            style={{
              borderColor: "rgba(143,168,193,0.12)",
              background: "linear-gradient(180deg, rgba(17,19,24,0.92), rgba(17,19,24,0.76))"
            }}
          >
            <div className="space-y-4">
              <div className="section-kicker">Common projects</div>
              <div className="grid gap-3">
                {contactChecklist.map((item) => (
                  <div
                    className="rounded-[1.2rem] border px-4 py-3"
                    key={item}
                    style={{ borderColor: "rgba(143,168,193,0.1)", background: "rgba(17,19,24,0.52)" }}
                  >
                    <p className="text-sm leading-6 text-[#f1ece8]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Direct contact */}
          <Card
            className="p-6 sm:p-7"
            style={{
              borderColor: "rgba(143,168,193,0.12)",
              background: "linear-gradient(180deg, rgba(17,19,24,0.92), rgba(17,19,24,0.76))"
            }}
          >
            <div className="space-y-3">
              <div className="section-kicker">Direct contact</div>
              <p className="text-sm leading-7 text-[#b9b0ad]">If you already know the brief, just send it over.</p>
              <p className="text-lg font-semibold text-[#f1ece8]">{settings.contactEmail}</p>
              {settings.contactPhone ? (
                <p className="text-sm text-[#b9b0ad]">{settings.contactPhone}</p>
              ) : null}
            </div>
          </Card>
        </div>

        {/* Form card */}
        <Card
          className="p-6 sm:p-8"
          style={{
            borderColor: "rgba(143,168,193,0.12)",
            background: "linear-gradient(180deg, rgba(17,19,24,0.9), rgba(17,19,24,0.74))"
          }}
        >
          <div className="mb-6">
            <div className="section-kicker">Project form</div>
            <p className="mt-3 text-sm leading-7 text-[#b9b0ad]">Share the basics and I will come back with the next step.</p>
          </div>
          <ContactForm />
        </Card>
      </div>
    </section>
  );
}
