import { cn } from "@/lib/utils";

type BrowserWindowProps = {
  badge: string;
  title: string;
  summary: string;
  navItems: string[];
  metrics: Array<{ label: string; value: string }>;
  featureList: string[];
  footer: string;
  className?: string;
};

export function BrowserWindow({ badge, title, summary, navItems, metrics, featureList, footer, className }: BrowserWindowProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.8rem] border shadow-[0_32px_90px_rgba(0,0,0,0.4)] backdrop-blur-xl",
        className
      )}
      style={{ borderColor: "rgba(143,168,193,0.12)", background: "linear-gradient(180deg, rgba(17,19,24,0.88), rgba(9,10,14,0.82))" }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(241,236,232,0.04),transparent_18%),radial-gradient(circle_at_top,rgba(143,168,193,0.08),transparent_24%)]" />
      <div className="relative border-b px-5 py-4" style={{ borderColor: "rgba(143,168,193,0.12)" }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8fa8c1]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#8fa8c1]/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#8fa8c1]/30" />
          </div>
          <div
            className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f1ece8]"
            style={{ borderColor: "rgba(143,168,193,0.12)", background: "rgba(17,19,24,0.68)" }}
          >
            {badge}
          </div>
        </div>
      </div>

      <div className="relative grid gap-6 px-5 py-5 sm:px-6 sm:py-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <span
                className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b9b0ad]"
                style={{ borderColor: "rgba(143,168,193,0.12)", background: "rgba(17,19,24,0.62)" }}
                key={item}
              >
                {item}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[#f1ece8] sm:text-[2rem]">{title}</h3>
            <p className="max-w-xl text-sm leading-7 text-[#b9b0ad] sm:text-base">{summary}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                className="rounded-[1.2rem] border px-4 py-4"
                key={metric.label}
                style={{ borderColor: "rgba(143,168,193,0.12)", background: "rgba(17,19,24,0.76)" }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8fa8c1]">{metric.label}</p>
                <p className="mt-2 text-sm font-semibold text-[#f1ece8]">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.4rem] border p-4 sm:p-5" style={{ borderColor: "rgba(143,168,193,0.12)", background: "rgba(17,19,24,0.76)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8fa8c1]">Included</p>
          <div className="mt-4 grid gap-3">
            {featureList.map((feature, index) => (
              <div className="rounded-[1.1rem] border px-4 py-3" key={feature} style={{ borderColor: "rgba(143,168,193,0.08)", background: "rgba(9,10,14,0.34)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#f472b6]">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-2 text-sm leading-6 text-[#f1ece8]">{feature}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-[#b9b0ad]">{footer}</p>
        </div>
      </div>
    </div>
  );
}
