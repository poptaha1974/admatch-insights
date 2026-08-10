import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Megaphone, GitBranch, Wallet, Calculator, Bot, Plug } from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  star?: boolean;
};
const items: NavItem[] = [
  { to: "/", label: "نظرة عامة", icon: LayoutDashboard },
  { to: "/campaigns", label: "الحملات", icon: Megaphone },
  { to: "/funnel", label: "المسار والجماهير", icon: GitBranch },
  { to: "/finance", label: "الماليات", icon: Wallet },
  { to: "/planner", label: "المخطط المالي", icon: Calculator, star: true },
  { to: "/advisor", label: "المستشار الذكي", icon: Bot, badge: "AI", star: true },
  { to: "/integrations", label: "الربط", icon: Plug },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-l border-sidebar-border bg-sidebar h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-primary/60 grid place-items-center text-primary-foreground font-bold">
            A
          </div>
          <div>
            <div className="font-semibold text-sm">AdMatch</div>
            <div className="text-xs text-muted-foreground">ERP لتجار COD</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const active = path === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active ? "bg-primary/15 text-primary" : "text-sidebar-foreground hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="size-4" />
                <span>{it.label}</span>
                {it.star && <span className="text-[10px] text-primary">★</span>}
              </span>
              {it.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    it.badge === "AI"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {it.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <div className="rounded-lg bg-card border border-border p-3 flex items-center gap-3">
          <div className="size-9 rounded-full bg-gradient-to-br from-primary/60 to-primary/30 grid place-items-center text-sm font-bold">
            إ
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">د. إيهاب طه</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-[oklch(0.72_0.18_145)] animate-pulse" />
              مباشر
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
