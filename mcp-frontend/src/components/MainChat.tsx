"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useChat } from "@/contexts/ChatContext";

const MainChat = () => {
  const { activeSession, streamingMessage, sendMessage, loading } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, streamingMessage]);

  const handleSend = async () => {
    const query = input.trim();
    if (!query || loading) return;
    setInput("");
    await sendMessage(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  const messages = activeSession?.messages ?? [];
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col flex-1 px-4 xl:px-0">
      {/* Messages or empty state */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <span className="text-[24px] sm:text-[36px] text-text text-center">
            What can I help with?
          </span>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-y-auto py-6 gap-4 max-w-[768px] w-full mx-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-[20px] text-base ${
                  msg.role === "user"
                    ? "bg-primary text-surface"
                    : "bg-surface-alt text-text"
                }`}
              >
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-[22px] font-title font-medium mt-4 mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-[20px] font-title font-medium mt-4 mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-[18px] font-semibold mt-3 mb-1">{children}</h3>,
                      p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      hr: () => <hr className="border-border my-3" />,
                      code: ({ children }) => <code className="bg-border px-1 rounded text-sm font-mono">{children}</code>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {streamingMessage !== null && (
            <div className="flex justify-start">
              <div className="max-w-[75%] px-4 py-3 rounded-[20px] bg-surface-alt text-text text-base">
                {streamingMessage === "" ? (
                  <span className="italic text-text-mid">Thinking...</span>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-[22px] font-title font-medium mt-4 mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-[20px] font-title font-medium mt-4 mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-[18px] font-semibold mt-3 mb-1">{children}</h3>,
                      p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      hr: () => <hr className="border-border my-3" />,
                      code: ({ children }) => <code className="bg-border px-1 rounded text-sm font-mono">{children}</code>,
                    }}
                  >
                    {streamingMessage}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="flex justify-center py-4">
        <div className="flex items-center w-full xl:w-[768px] h-[48px] sm:h-[56px] px-4 gap-3 bg-surface border border-primary-light rounded-[20px] shadow-md">
          <input
            className="flex-1 bg-transparent outline-none text-text placeholder:text-text/50"
            placeholder="Ask anything"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="flex items-center justify-center text-primary hover:text-primary-light transition disabled:opacity-40"
          >
            <SendHorizontal size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainChat;
