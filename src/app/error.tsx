"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="public-site min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="public-site-backdrop" />
        <div className="public-site-glow public-site-glow-left" />
        <div className="public-site-glow public-site-glow-right" />
        <div className="public-site-beam" />
        <div className="public-site-noise" />
      </div>
      <main className="shell relative z-10 flex min-h-screen flex-col items-center justify-center py-24 text-center">
        <div className="section-kicker">Something went wrong</div>
        <h1 className="section-title mt-4 text-[#f1ece8]">That was not supposed to happen.</h1>
        <p className="mt-4 max-w-md text-base leading-8 text-[#b9b0ad]">
          An unexpected error interrupted the page. Trying again usually sorts it.
        </p>
        <div className="mt-8 flex gap-3">
          <Button onClick={reset} size="lg">
            Try again
          </Button>
          <Link className={buttonVariants({ size: "lg", variant: "outline" })} href="/">
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
