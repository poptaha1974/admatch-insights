import { ResponsiveContainer, LineChart, Line } from "recharts";

type Props = {
  label: string;
  value: string;
  hint?: string;
  delta?: string;
  highlight?: "default" | "warning" | "success";
  spark?: number[];
};

export function KpiCard({ label, value, hint, delta, highlight = "default", spark }: Props) {
  const data = (spark ?? [4, 6, 5, 8, 7, 9, 11, 10, 13]).map((v, i) => ({ i, v }));
  const ringClass =
    highlight === "warning"
      ? "border-[oklch(0.72_0.18_55)] shadow-[0_0_0_1px_oklch(0.72_0.18_55_/_0.4),0_0_30px_-10px_oklch(0.72_0.18_55_/_0.6)]"
      : highlight === "success"
        ? "border-[oklch(0.72_0.18_145)] shadow-[0_0_30px_-12px_oklch(0.72_0.18_145_/_0.5)]"
        : "border-border";
  return (
    <div className={`rounded-xl bg-card border p-4 transition-colors ${ringClass}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold num">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
      <div className="flex items-end justify-between mt-3">
        {delta && <span className="text-xs text-[oklch(0.72_0.18_145)]">{delta}</span>}
        <div className="h-8 w-24">
          <ResponsiveContainer>
            <LineChart data={data}>
              <Line type="monotone" dataKey="v" stroke="oklch(0.76 0.16 295)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
