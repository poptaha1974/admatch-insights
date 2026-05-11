import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const [range, setRange] = useState("30");
  const ranges = [
    { id: "30", label: "آخر 30 يوم" },
    { id: "90", label: "90 يوم" },
    { id: "365", label: "السنة" },
  ];
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex bg-card border border-border rounded-lg p-0.5">
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                range === r.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => toast.success("تمت المزامنة")}>
          <RefreshCw className="size-4 ml-1" /> مزامنة الآن
        </Button>
      </div>
    </div>
  );
}
