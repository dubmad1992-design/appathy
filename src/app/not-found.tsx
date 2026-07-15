import Link from "next/link";
import { PublicFooter } from "@/components/site/public-footer";
import { PublicHeader } from "@/components/site/public-header";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="public-site min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="public-site-backdrop" />
        <div className="public-site-glow public-site-glow-left" />
        <div className="public-site-glow public-site-glow-right" />
        <div className="public-site-glow public-site-glow-bottom" />
        <div className="public-site-beam" />
        <div className="public-site-noise" />
      </div>
      <div className="relative z-10">
        <PublicHeader />
        <main className="shell flex flex-col items-center justify-center py-32 text-center">
          <div className="section-kicker">404</div>
          <h1 className="section-title mt-4 text-[#f1ece8]">That page does not exist.</h1>
          <p className="mt-4 max-w-md text-base leading-8 text-[#b9b0ad]">
            The link may be old or mistyped. Everything worth seeing is a click away.
          </p>
          <div className="mt-8 flex gap-3">
            <Link className={buttonVariants({ size: "lg" })} href="/">
              Back to home
            </Link>
            <Link className={buttonVariants({ size: "lg", variant: "outline" })} href="/contact">
              Contact Appathy
            </Link>
          </div>
        </main>
        <PublicFooter />
      </div>
    </div>
  );
}
