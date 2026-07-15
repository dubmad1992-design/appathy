"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { publicNavItems } from "@/lib/constants";
import logo from "../../../images/logo.png";

const navLinks = publicNavItems.filter((i) => i.href !== "/");

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="px-3 pt-3 sm:px-5">
      <div className="shell">
        <div
          className="relative sticky top-3 z-40 flex h-16 items-center gap-4 overflow-visible rounded-[1.8rem] px-5 backdrop-blur-2xl transition-all duration-300"
          style={{
            border: "1px solid rgba(244,114,182,0.14)",
            background: scrolled
              ? "linear-gradient(180deg, rgba(8,10,22,0.96), rgba(6,8,18,0.94))"
              : "linear-gradient(180deg, rgba(10,12,26,0.90), rgba(7,9,20,0.86))",
            boxShadow: "0 24px 80px rgba(0,0,0,0.54), 0 0 0 1px rgba(244,114,182,0.06), inset 0 1px 0 rgba(255,255,255,0.06)"
          }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-[1.8rem] bg-[linear-gradient(180deg,rgba(241,236,232,0.08),transparent_45%),radial-gradient(circle_at_top,rgba(241,236,232,0.08),transparent_34%)]" />

          {/* Logo — left */}
          <Link href="/" className="relative z-10 shrink-0">
            <div
              className="relative h-8 sm:h-9"
              style={{ aspectRatio: `${logo.width} / ${logo.height}` }}
            >
              <Image
                src={logo}
                alt="Appathy"
                fill
                sizes="(max-width: 640px) 72px, 88px"
                className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.32)]"
                priority
              />
            </div>
          </Link>

          {/* Desktop nav — centre */}
          <nav className="relative z-10 hidden flex-1 items-center justify-center gap-0.5 md:flex">
            {navLinks.map((item) => (
              <Link
                className="group relative rounded-full px-4 py-2 text-sm font-medium text-[#d4ccc9] transition-all hover:text-[#f1ece8]"
                href={item.href}
                key={item.href}
              >
                <span className="relative z-10">{item.label}</span>
                <span className="absolute inset-x-2 bottom-1.5 h-px rounded-full bg-[#f472b6]/0 transition-colors group-hover:bg-[#f472b6]/30" />
                <span
                  className={`absolute inset-x-3 bottom-1.5 h-[2px] rounded-full bg-[#f472b6] shadow-[0_0_12px_rgba(244,114,182,0.70)] transition-opacity ${
                    pathname === item.href ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            ))}
          </nav>

          {/* CTA + mobile toggle — right */}
          <div className="relative z-10 ml-auto flex shrink-0 items-center gap-2">
            <Link
              href="/contact"
              className="hidden rounded-full border px-5 py-2 text-sm font-bold text-white transition hover:brightness-110 md:inline-flex"
              style={{
                borderColor: "rgba(255,255,255,0.16)",
                background: "linear-gradient(135deg, rgba(244,114,182,0.90), rgba(219,39,119,0.90))",
                boxShadow: "0 4px 20px rgba(236,72,153,0.30)"
              }}
            >
              Get a quote
            </Link>

            <button
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border text-[#f1ece8] transition hover:text-[#f472b6] md:hidden"
              style={{
                borderColor: "rgba(244,114,182,0.18)",
                background: "rgba(8,10,22,0.80)"
              }}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          {/* Mobile dropdown */}
          {mobileOpen && (
            <div
              className="absolute right-3 top-[calc(100%+8px)] w-[18rem] rounded-[1.4rem] border p-4 shadow-[0_20px_60px_rgba(0,0,0,0.52)] backdrop-blur-2xl"
              style={{
                borderColor: "rgba(244,114,182,0.14)",
                background: "rgba(8,10,22,0.97)"
              }}
            >
              <nav className="grid gap-1">
                {publicNavItems.map((item) => (
                  <Link
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-white/[0.04] ${
                      pathname === item.href ? "text-[#f472b6]" : "text-[#f1ece8] hover:text-[#f472b6]"
                    }`}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-3 border-t pt-3" style={{ borderColor: "rgba(244,114,182,0.10)" }}>
                <Link
                  href="/contact"
                  className="flex w-full items-center justify-center rounded-2xl border px-4 py-3 text-sm font-bold text-white transition hover:brightness-110"
                  style={{
                    borderColor: "rgba(255,255,255,0.16)",
                    background: "linear-gradient(135deg, rgba(244,114,182,0.90), rgba(219,39,119,0.90))"
                  }}
                >
                  Get a quote
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
