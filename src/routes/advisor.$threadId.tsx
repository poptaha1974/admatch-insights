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
import { generateFallbackReply } from "@/lib/advisorFallback";
import { Sparkles, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/advisor/$threadId")({
  validateSearch: searchSchema,
  component: ChatPage,
});

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

function makeMessage(role: "user" | "assistant", text: string): UIMessage {
  return {
    id: crypto.randomUUID(),
    role,
    parts: [{ type: "text", text }],
  } as UIMessage;
}

function getText(m: UIMessage): string {
  return m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
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

    let replyText: string | null = null;
    let usedFallback = false;

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(`${API_URL}/api/advisor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, messages: history, plannerData: ctx }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { content?: string; reply?: string };
      replyText = data.content ?? data.reply ?? null;
      if (!replyText) throw new Error("empty reply");
      setBackendDown(false);
    } catch {
      usedFallback = true;
      setBackendDown(true);
      replyText = generateFallbackReply(text, ctx);
    }

    appendMessage(threadId, makeMessage("assistant", replyText!));
    setStatus("ready");
    if (usedFallback) {
      toast.message("Backend غير متاح", {
        description: "تم توليد الرد محلياً. شغّل FastAPI backend عشان تستخدم Gemini.",
      });
    }
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

  return (
    <div key={threadId} className="flex-1 min-h-0 flex flex-col">
      {backendDown && (
        <div className="px-4 py-2 border-b border-border bg-[oklch(0.72_0.18_55_/_0.08)] text-[11px] text-[oklch(0.82_0.18_55)] flex items-center gap-2">
          <AlertCircle className="size-3.5" />
          الـ Backend مش متاح حالياً — الردود مولّدة محلياً (وضع تجريبي).
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
