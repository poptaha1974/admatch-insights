import { Link, Outlet, createFileRoute, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { Bot, MessageSquarePlus, Trash2 } from "lucide-react";
import { useAdvisorChatStore } from "@/stores/advisorChat";
import { TopBar } from "@/components/TopBar";

export const Route = createFileRoute("/advisor")({ component: AdvisorLayout });

function AdvisorLayout() {
  const threads = useAdvisorChatStore((s) => s.threads);
  const createThread = useAdvisorChatStore((s) => s.createThread);
  const deleteThread = useAdvisorChatStore((s) => s.deleteThread);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const onNew = () => {
    const id = createThread();
    navigate({ to: "/advisor/$threadId", params: { threadId: id } });
  };

  const onDelete = (id: string) => {
    deleteThread(id);
    if (path === `/advisor/${id}`) navigate({ to: "/advisor" });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] -my-6 -mx-4 md:-mx-8">
      <div className="px-4 md:px-8 pt-6">
        <TopBar title="المستشار الذكي" subtitle="دردشة ذكية بالعامية المصرية — حفظ تلقائي في المتصفح" />
      </div>

      <div className="flex-1 min-h-0 flex gap-4 px-4 md:px-8 pb-4">
        {/* Threads sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-3 border-b border-border">
            <button
              onClick={onNew}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm py-2 hover:bg-primary/90 transition"
            >
              <MessageSquarePlus className="size-4" />
              محادثة جديدة
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {threads.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-6 px-3">
                لسه مفيش محادثات.
                <br />
                ابدأ واحدة جديدة 👆
              </div>
            )}
            {threads.map((t) => {
              const active = path === `/advisor/${t.id}`;
              return (
                <div
                  key={t.id}
                  className={`group relative rounded-md text-sm transition ${
                    active ? "bg-primary/15" : "hover:bg-muted"
                  }`}
                >
                  <Link
                    to="/advisor/$threadId"
                    params={{ threadId: t.id }}
                    className="block px-3 py-2 pr-8"
                  >
                    <div className={`truncate ${active ? "text-primary font-medium" : "text-foreground"}`}>
                      {t.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 num">
                      {new Date(t.updatedAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                      {" • "}
                      {t.messages.length} رسالة
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm("احذف المحادثة دي؟")) onDelete(t.id);
                    }}
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition"
                    aria-label="حذف"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="p-3 border-t border-border text-[11px] text-muted-foreground flex items-center gap-2">
            <Bot className="size-3.5" />
            محفوظ في المتصفح فقط
          </div>
        </aside>

        {/* Chat area */}
        <section className="flex-1 min-w-0 rounded-xl border border-border bg-card flex flex-col overflow-hidden">
          <Outlet />
        </section>
      </div>
    </div>
  );
}

// Re-export for child routes
export { useAdvisorChatStore };

// Helper hook used by child route
export function useActiveThreadId(): string | undefined {
  const params = useParams({ strict: false }) as { threadId?: string };
  return params.threadId;
}
