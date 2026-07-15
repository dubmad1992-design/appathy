import type { Metadata } from "next";
import { getVisibleFaqs } from "@/lib/data";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Common questions about working with Appathy on websites, digital forms, and systems for your business."
};

export default async function FaqPage() {
  const faqs = await getVisibleFaqs();

  return (
    <section className="shell pb-18 pt-10 lg:pb-24 lg:pt-14">
      <div className="max-w-4xl space-y-4">
        <div className="section-kicker">FAQ</div>
        <h1 className="section-title text-[#f1ece8]">A few common questions.</h1>
        <p className="text-base leading-8 text-[#b9b0ad]">Simple answers before a project starts.</p>
      </div>

      <div className="mt-10 grid gap-4">
        {faqs.map((item, index) => (
          <Card
            className="p-6 sm:p-7"
            key={item.id}
            style={{ borderColor: "rgba(143,168,193,0.12)", background: "linear-gradient(180deg, rgba(17,19,24,0.9), rgba(17,19,24,0.74))" }}
          >
            <div className="grid gap-4 lg:grid-cols-[0.16fr_0.84fr]">
              <div className="section-kicker">{String(index + 1).padStart(2, "0")}</div>
              <div>
                <p className="text-2xl font-semibold tracking-[-0.04em] text-[#f1ece8]">{item.question}</p>
                <p className="mt-3 text-sm leading-7 text-[#b9b0ad] sm:text-base">{item.answer}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
