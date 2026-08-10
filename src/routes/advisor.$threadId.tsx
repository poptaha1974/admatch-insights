import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { UIMessage } from "ai";
import { z } from "zod";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useAdvisorChatStore, deriveTitleFromText } from "@/stores/advisorChat";
import { usePlannerStore } from "@/stores/planner";
import { Sparkles, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/advisor/$threadId")({
  validateSearch: searchSchema,
  component: ChatPage,
});

function makeMessage(role: "user" | "assistant", text: string): UIMessage {
  return {
    id: crypto.randomUUID(),
    role,
    parts: [{ type: "text", text }],
  } as UIMessage;
}

function getText(m: UIMessage): string {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

function ChatPage() {
  const { threadId } = useParams({ from: "/advisor/$threadId" });
  const { q } = Route.useSearch();
  const navigate = useNavigate();

  const thread = useAdvisorChatStore((s) => s.threads.find((t) => t.id === threadId));
  const appendMessage = useAdvisorChatStore((s) => s.appendMessage);
  const renameThread = useAdvisorChatStore((s) => s.renameThread);

  const { inputs, outputs } = usePlannerStore();
  const ctx = useMemo(() => ({ ...inputs, ...outputs }), [inputs, outputs]);

  const [status, setStatus] = useState<"ready" | "submitted" | "error">("ready");
  const [backendDown, setBackendDown] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const autoSentRef = useRef<string | null>(null);

  // Redirect if thread missing (e.g. deleted)
  useEffect(() => {
    if (!thread) {
      navigate({ to: "/advisor", replace: true });
    }
  }, [thread, navigate]);

  const sendUserMessage = async (text: string) => {
    if (!text.trim() || !thread) return;
    const userMsg = makeMessage("user", text.trim());
    appendMessage(threadId, userMsg);
    if (thread.messages.length === 0) {
      renameThread(threadId, deriveTitleFromText(text));
    }
    setStatus("submitted");

    const history = [...thread.messages, userMsg].map((m) => ({
      role: m.role,
      content: getText(m),
    }));
    let backendFailed = false;

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(`/api/advisor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, messages: history, plannerData: ctx }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { content?: string; reply?: string };
      const replyText = data.content ?? data.reply ?? null;
      if (!replyText) throw new Error("empty reply");
      appendMessage(threadId, makeMessage("assistant", replyText));
      setBackendDown(false);
    } catch {
      backendFailed = true;
      setBackendDown(true);
      appendMessage(
        threadId,
        makeMessage(
          "assistant",
          "تعذر الوصول إلى /api/advisor/chat حالياً. لا يمكنني إصدار تحليل موثوق بدون بيانات backend live.",
        ),
      );
    }
    setStatus("ready");
    if (backendFailed) toast.message("Backend غير متاح");
    requestAnimationFrame(() => promptRef.current?.focus());
  };

  // Auto-send `q` search param once, then clear it
  useEffect(() => {
    if (!thread || !q || autoSentRef.current === threadId) return;
    autoSentRef.current = threadId;
    void sendUserMessage(q);
    navigate({
      to: "/advisor/$threadId",
      params: { threadId },
      search: {},
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread, q, threadId]);

  // Initial focus
  useEffect(() => {
    promptRef.current?.focus();
  }, [threadId]);

  if (!thread) return null;

  const handleExport = () => {
    const payload = {
      threadId: thread.id,
      title: thread.title,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      exportedAt: Date.now(),
      messages: thread.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: getText(m),
      })),
      plannerData: ctx,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle = (thread.title || "chat").replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 40);
    a.href = url;
    a.download = `admatch-${safeTitle}-${thread.id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير المحادثة");
  };

  return (
    <div key={threadId} className="flex-1 min-h-0 flex flex-col">
      <div className="px-4 py-2 border-b border-border flex items-center justify-between gap-2">
        <div className="text-sm font-medium truncate">{thread.title}</div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={thread.messages.length === 0}
          className="gap-1.5 shrink-0"
        >
          <Download className="size-3.5" />
          تصدير JSON
        </Button>
      </div>
      {backendDown && (
        <div className="px-4 py-2 border-b border-border bg-[oklch(0.72_0.18_55_/_0.08)] text-[11px] text-[oklch(0.82_0.18_55)] flex items-center gap-2">
          <AlertCircle className="size-3.5" />
          الـ Backend مش متاح حالياً — لا يتم توليد ردود افتراضية.
        </div>
      )}

      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="max-w-3xl mx-auto w-full">
          {thread.messages.length === 0 ? (
            <ConversationEmptyState
              icon={<Sparkles className="size-8 text-primary" />}
              title="ابدأ المحادثة"
              description="اسألني أي حاجة عن حملاتك أو منتجاتك."
            />
          ) : (
            thread.messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent>
                  {m.role === "assistant" ? (
                    <MessageResponse>{getText(m)}</MessageResponse>
                  ) : (
                    <div className="whitespace-pre-wrap">{getText(m)}</div>
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>بفكر…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border p-3 bg-background/40">
        <div className="max-w-3xl mx-auto">
          <PromptInput
            onSubmit={(message) => {
              if (status !== "ready") return;
              void sendUserMessage(message.text);
            }}
          >
            <PromptInputTextarea
              ref={promptRef}
              placeholder="اكتب سؤالك… (Enter للإرسال • Shift+Enter لسطر جديد)"
              dir="rtl"
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
