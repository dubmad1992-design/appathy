import { Card } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
};

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {helper ? <p className="mt-2 text-sm text-muted-foreground">{helper}</p> : null}
    </Card>
  );
}
