"use client";
import { useState, useRef, useEffect } from "react";
import { conversationService } from "@/services";
import type { ApiError } from "@/services/http";
import type { Message } from "@/types";
import { ErrorBanner } from "@/components/ui";
import Link from "next/link";

interface ChatMsg {
  role: "human" | "ai";
  content: string;
}

export default function DoubtSolverPage() {
  const [subject, setSubject] = useState("");
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startSession = async () => {
    setStarting(true);
    setError("");
    try {
      const conv = await conversationService.create({ subject: subject || undefined });
      setConvId(conv.id);
      setMessages([
        {
          role: "ai",
          content: `Hi! I'm your AI tutor${subject ? ` for ${subject}` : ""}. What would you like to understand today?`,
        },
      ]);
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to start session.");
    } finally {
      setStarting(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !convId || loading) return;
    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "human", content: question }]);
    setLoading(true);
    try {
      const reply: Message = await conversationService.ask(convId, { question });
      setMessages((prev) => [...prev, { role: "ai", content: reply.content }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Sorry, I had trouble with that. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setConvId(null);
    setMessages([]);
    setInput("");
    setSubject("");
    setError("");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="px-8 py-4 flex items-center justify-between shrink-0"
        style={{ background: "#fff", borderBottom: "1px solid #f1f2f6" }}
      >
        <div>
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-lg font-bold text-gray-900 mt-0.5">AI Doubt Solver</h1>
        </div>
        {convId && (
          <button
            onClick={reset}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            New Session
          </button>
        )}
      </div>

      {!convId ? (
        /* Setup */
        <div className="flex-1 flex items-center justify-center p-8">
          <div
            className="bg-white rounded-2xl p-8 w-full max-w-sm"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
          >
            <div className="text-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
                style={{ background: "#ede9fe" }}
              >
                💬
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Start a Session</h2>
              <p className="text-sm text-gray-500 mt-1">
                Ask anything — get clear, step-by-step explanations.
              </p>
            </div>
            <input
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Subject (optional — e.g., Physics, Math)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startSession()}
            />
            {error && <ErrorBanner message={error} />}
            <button
              onClick={startSession}
              disabled={starting}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white mt-2 transition-all disabled:opacity-50"
              style={{ background: "#7c3aed" }}
            >
              {starting ? "Starting..." : "Start Doubt Session"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "human" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mr-2 mt-0.5"
                    style={{ background: "#7c3aed" }}
                  >
                    AI
                  </div>
                )}
                <div
                  className="max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                  style={
                    msg.role === "human"
                      ? { background: "#7c3aed", color: "#fff", borderBottomRightRadius: 4 }
                      : {
                          background: "#fff",
                          color: "#111827",
                          borderBottomLeftRadius: 4,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                        }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: "#7c3aed" }}
                >
                  AI
                </div>
                <div
                  className="px-4 py-3 rounded-2xl"
                  style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
                >
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="p-4 flex gap-3"
            style={{ background: "#fff", borderTop: "1px solid #f1f2f6" }}
          >
            <input
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Ask your doubt..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "#7c3aed" }}
            >
              Ask
            </button>
          </form>
        </>
      )}
    </div>
  );
}
