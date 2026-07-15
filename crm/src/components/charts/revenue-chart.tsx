import { formatCurrency } from "@/lib/utils";

export function RevenueChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const highest = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-3">
        {data.map((item) => (
          <div className="flex flex-col items-center gap-3" key={item.label}>
            <div className="flex h-48 w-full items-end rounded-[1.6rem] bg-muted/55 p-2">
              <div
                className="w-full rounded-[1.2rem] bg-gradient-to-t from-primary/25 via-primary/60 to-primary"
                style={{ height: `${Math.max(10, (item.value / highest) * 100)}%` }}
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-sm font-medium">{formatCurrency(item.value)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
