import Link from "next/link";
import { getSiteSettings } from "@/lib/data";
import { publicNavItems } from "@/lib/constants";

export async function PublicFooter() {
  const settings = await getSiteSettings();

  return (
    <footer className="pb-8 pt-12">
      <div className="shell">
        <div
          className="rounded-[1.8rem] border px-6 py-8 sm:px-8"
          style={{
            borderColor: "rgba(244,114,182,0.12)",
            background: "linear-gradient(180deg, rgba(10,12,24,0.90), rgba(7,9,18,0.82))"
          }}
        >
          <div className="grid gap-8 sm:grid-cols-[1fr_auto]">
            {/* Brand + tagline */}
            <div className="space-y-3">
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-bold tracking-[-0.04em] text-[#f1ece8]">Appathy</span>
                <span className="text-lg font-bold tracking-[-0.04em] text-[#f472b6]">.uk</span>
              </div>
              <p className="max-w-xs text-sm leading-6 text-[#b9b0ad]">{settings.footerBlurb}</p>
              <a
                href={`mailto:${settings.contactEmail}`}
                className="inline-block text-sm text-[#f472b6] transition hover:text-[#f1ece8]"
              >
                {settings.contactEmail}
              </a>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-2 sm:items-end">
              {publicNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-[#b9b0ad] transition hover:text-[#f472b6]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div
            className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-xs text-[#b9b0ad]"
            style={{ borderColor: "rgba(244,114,182,0.08)" }}
          >
            <span>© {new Date().getFullYear()} Appathy. All rights reserved.</span>
            <Link className="transition hover:text-[#f472b6]" href="/privacy">
              Privacy policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
