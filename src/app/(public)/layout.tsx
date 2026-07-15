import { PublicFooter } from "@/components/site/public-footer";
import { PublicHeader } from "@/components/site/public-header";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
        <main>{children}</main>
        <PublicFooter />
      </div>
    </div>
  );
}
