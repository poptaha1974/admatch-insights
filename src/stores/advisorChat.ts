import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";

export type AdvisorThread = {
  id: string;
  title: string;
  updatedAt: number;
  createdAt: number;
  messages: UIMessage[];
};

type Store = {
  threads: AdvisorThread[];
  createThread: (title?: string) => string;
  deleteThread: (id: string) => void;
  renameThread: (id: string, title: string) => void;
  setMessages: (id: string, messages: UIMessage[]) => void;
  appendMessage: (id: string, message: UIMessage) => void;
  getThread: (id: string) => AdvisorThread | undefined;
};

export const useAdvisorChatStore = create<Store>()(
  persist(
    (set, get) => ({
      threads: [],
      getThread: (id) => get().threads.find((t) => t.id === id),
      createThread: (title = "محادثة جديدة") => {
        const id = nanoid(10);
        const now = Date.now();
        set((s) => ({
          threads: [
            { id, title, messages: [], createdAt: now, updatedAt: now },
            ...s.threads,
          ],
        }));
        return id;
      },
      deleteThread: (id) =>
        set((s) => ({ threads: s.threads.filter((t) => t.id !== id) })),
      renameThread: (id, title) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === id ? { ...t, title, updatedAt: Date.now() } : t,
          ),
        })),
      setMessages: (id, messages) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === id ? { ...t, messages, updatedAt: Date.now() } : t,
          ),
        })),
      appendMessage: (id, message) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === id
              ? { ...t, messages: [...t.messages, message], updatedAt: Date.now() }
              : t,
          ),
        })),
    }),
    {
      name: "admatch-advisor-threads",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as unknown as Storage),
      ),
      partialize: (s) => ({ threads: s.threads }),
    },
  ),
);

export function deriveTitleFromText(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return "محادثة جديدة";
  return clean.length > 36 ? clean.slice(0, 36) + "…" : clean;
}
