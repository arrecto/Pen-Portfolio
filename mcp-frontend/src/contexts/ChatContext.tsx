"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Message = { role: "user" | "assistant"; content: string };

export type Session = { id: string; title: string; messages: Message[] };

type ChatContextType = {
  sessions: Session[];
  activeSession: Session | null;
  streamingMessage: string | null;
  newChat: () => void;
  setActiveSessionId: (id: string) => void;
  sendMessage: (query: string) => Promise<void>;
  loading: boolean;
};

const ChatContext = createContext<ChatContextType>({
  sessions: [],
  activeSession: null,
  streamingMessage: null,
  newChat: () => {},
  setActiveSessionId: () => {},
  sendMessage: async () => {},
  loading: false,
});

export const useChat = () => useContext(ChatContext);

const STORAGE_KEY = "pen_chat_sessions";
const ACTIVE_KEY = "pen_active_session";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedActive = localStorage.getItem(ACTIVE_KEY);
    if (saved) setSessions(JSON.parse(saved));
    if (savedActive) setActiveSessionIdState(savedActive);
  }, []);

  const persist = (updated: Session[]) => {
    setSessions(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const newChat = () => {
    const withoutEmpties = sessions.filter((s) => s.messages.length > 0);
    const id = crypto.randomUUID();
    const session: Session = { id, title: "New Chat", messages: [] };
    const updated = [session, ...withoutEmpties];
    persist(updated);
    setActiveSessionIdState(id);
    localStorage.setItem(ACTIVE_KEY, id);
  };

  const setActiveSessionId = (id: string) => {
    setActiveSessionIdState(id);
    localStorage.setItem(ACTIVE_KEY, id);
  };

  const sendMessage = async (query: string) => {
    let sessionId = activeSessionId;
    let currentSessions = sessions;

    if (!sessionId) {
      const id = crypto.randomUUID();
      const session: Session = { id, title: query.slice(0, 40), messages: [] };
      currentSessions = [session, ...sessions];
      persist(currentSessions);
      setActiveSessionIdState(id);
      localStorage.setItem(ACTIVE_KEY, id);
      sessionId = id;
    }

    const userMessage: Message = { role: "user", content: query };
    const withUser = currentSessions.map((s) =>
      s.id === sessionId
        ? {
            ...s,
            title: s.messages.length === 0 ? query.slice(0, 40) : s.title,
            messages: [...s.messages, userMessage],
          }
        : s
    );
    persist(withUser);

    setLoading(true);
    setStreamingMessage("");

    let fullContent = "";

    try {
      const response = await fetch(`${BASE_URL}/client/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, query }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const { text } = JSON.parse(raw);
            fullContent += text;
            setStreamingMessage(fullContent);
          } catch {}
        }
      }

      const assistantMessage: Message = { role: "assistant", content: fullContent || "No response." };
      const withReply = withUser.map((s) =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, assistantMessage] }
          : s
      );
      persist(withReply);
    } finally {
      setStreamingMessage(null);
      setLoading(false);
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  return (
    <ChatContext.Provider
      value={{ sessions, activeSession, streamingMessage, newChat, setActiveSessionId, sendMessage, loading }}
    >
      {children}
    </ChatContext.Provider>
  );
};
