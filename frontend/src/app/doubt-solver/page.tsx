"use client";
import { useState, useRef, useEffect } from "react";
import { conversationService, assignmentService, lessonPlanService } from "@/services";
import type { ApiError } from "@/services/http";
import type { Assignment, AssignmentSubmission, LessonPlan, Message } from "@/types";
import { ErrorBanner } from "@/components/ui";
import Link from "next/link";

type ContextType = "assignment" | "lesson_plan";
type SetupStep = "pick_type" | "pick_item" | "pick_question";

interface ChatMsg {
  role: "human" | "ai";
  content: string;
}

// ── Suggested question generators ─────────────────────────────

function suggestionsForAssignment(
  assignment: Assignment,
  submission: AssignmentSubmission | null
): string[] {
  const suggestions: string[] = [];

  if (submission) {
    const wrong = submission.feedback.question_results.filter((q) => !q.is_correct);
    for (const q of wrong.slice(0, 2)) {
      suggestions.push(`Why is the answer to "${q.question.slice(0, 60)}…" ${q.correct_answer}?`);
    }
    for (const area of (submission.feedback.areas_for_improvement ?? []).slice(0, 2)) {
      suggestions.push(`Can you explain ${area} in simple terms?`);
    }
  }

  suggestions.push(`Explain the key concepts in ${assignment.topic} for a ${assignment.difficulty} level.`);
  suggestions.push(`Give me a worked example on ${assignment.topic}.`);
  return suggestions.slice(0, 5);
}

function suggestionsForPlan(plan: LessonPlan): string[] {
  const topics = Array.from(
    new Set(plan.plan.daily_plans.flatMap((d) => d.topics))
  ).slice(0, 4);

  const suggestions: string[] = [];
  for (const t of topics.slice(0, 2)) {
    suggestions.push(`Explain "${t}" in simple terms.`);
    suggestions.push(`Give me a worked example of ${t}.`);
  }
  suggestions.push(`What are the most important concepts I need to know for ${plan.subject}?`);
  return suggestions.slice(0, 5);
}

// ── Sub-components ─────────────────────────────────────────────

function ContextCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-gray-200 rounded-2xl p-5 hover:border-violet-400 hover:shadow-sm transition-all group"
      style={{ background: "#fff" }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
        style={{ background: "#ede9fe" }}
      >
        {icon}
      </div>
      <div className="font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">
        {title}
      </div>
      <div className="text-sm text-gray-500 mt-1">{description}</div>
    </button>
  );
}

function ItemCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left border rounded-xl p-4 transition-all"
      style={{
        background: selected ? "#ede9fe" : "#fff",
        borderColor: selected ? "#7c3aed" : "#e5e7eb",
      }}
    >
      {children}
    </button>
  );
}

// ── Main page ──────────────────────────────────────────────────

export default function DoubtSolverPage() {
  const [step, setStep] = useState<SetupStep>("pick_type");
  const [contextType, setContextType] = useState<ContextType | null>(null);

  // item lists
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // selected item
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);

  // suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // chat
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

  // Load items when type is picked
  const pickType = async (type: ContextType) => {
    setContextType(type);
    setStep("pick_item");
    setLoadingItems(true);
    setError("");
    try {
      if (type === "assignment") {
        const data = await assignmentService.list();
        setAssignments(data);
      } else {
        const data = await lessonPlanService.list();
        setPlans(data);
      }
    } catch {
      setError("Failed to load items.");
    } finally {
      setLoadingItems(false);
    }
  };

  const startOpenSession = async () => {
    setStarting(true);
    setError("");
    try {
      const conv = await conversationService.create({});
      setConvId(conv.id);
      setMessages([{ role: "ai", content: "Hi! I'm your AI tutor. What would you like to understand today?" }]);
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to start session.");
    } finally {
      setStarting(false);
    }
  };

  const pickAssignment = async (a: Assignment) => {
    setSelectedAssignment(a);
    let sub: AssignmentSubmission | null = null;
    try {
      sub = await assignmentService.getLatestSubmission(a.id);
    } catch {
      // no submission yet — that's fine
    }
    setSelectedSubmission(sub);
    setSuggestions(suggestionsForAssignment(a, sub));
    setStep("pick_question");
  };

  const pickPlan = (p: LessonPlan) => {
    setSelectedPlan(p);
    setSuggestions(suggestionsForPlan(p));
    setStep("pick_question");
  };

  const startSession = async () => {
    if (!contextType) return;
    const subject =
      contextType === "assignment"
        ? selectedAssignment?.subject
        : selectedPlan?.subject;
    const contextId =
      contextType === "assignment" ? selectedAssignment?.id : selectedPlan?.id;

    setStarting(true);
    setError("");
    try {
      const conv = await conversationService.create({
        subject,
        context_type: contextType,
        context_id: contextId,
      });
      setConvId(conv.id);

      const greeting =
        contextType === "assignment" && selectedAssignment
          ? `Hi! I'm your AI tutor. I can see your ${selectedAssignment.topic} assignment. What would you like me to explain?`
          : `Hi! I'm your AI tutor. I can see your ${selectedPlan?.subject} lesson plan. What would you like to understand?`;

      if (input.trim()) {
        setMessages([{ role: "human", content: input.trim() }]);
        setLoading(true);
        try {
          const reply: Message = await conversationService.ask(conv.id, { question: input.trim() });
          setMessages([
            { role: "human", content: input.trim() },
            { role: "ai", content: reply.content },
          ]);
        } catch {
          setMessages([
            { role: "human", content: input.trim() },
            { role: "ai", content: "Sorry, I had trouble with that. Please try again." },
          ]);
        } finally {
          setLoading(false);
        }
        setInput("");
      } else {
        setMessages([{ role: "ai", content: greeting }]);
      }
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
    setStep("pick_type");
    setContextType(null);
    setSelectedAssignment(null);
    setSelectedSubmission(null);
    setSelectedPlan(null);
    setSuggestions([]);
    setConvId(null);
    setMessages([]);
    setInput("");
    setError("");
  };

  // ── Render ──────────────────────────────────────────────────

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
        {(convId || step !== "pick_type") && (
          <button
            onClick={reset}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            New Session
          </button>
        )}
      </div>

      {!convId ? (
        <div className="flex-1 overflow-y-auto flex items-start justify-center p-8">
          <div className="w-full max-w-lg">

            {/* Step 1 — pick type */}
            {step === "pick_type" && (
              <div>
                <div className="text-center mb-8">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
                    style={{ background: "#ede9fe" }}
                  >
                    💬
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">What do you need help with?</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Pick a context so I can give you tailored explanations.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <ContextCard
                    icon="📝"
                    title="Assignment"
                    description="Get help understanding a topic from one of your assignments"
                    onClick={() => pickType("assignment")}
                  />
                  <ContextCard
                    icon="📅"
                    title="Lesson Planner"
                    description="Ask about topics from your personalised study plan"
                    onClick={() => pickType("lesson_plan")}
                  />
                </div>
                <button
                  onClick={startOpenSession}
                  disabled={starting}
                  className="w-full border border-gray-200 rounded-2xl p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left flex items-center gap-4 group disabled:opacity-50"
                  style={{ background: "#fff" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: "#f3f4f6" }}
                  >
                    💬
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm group-hover:text-gray-700 transition-colors">
                      {starting ? "Starting…" : "Open Chat"}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      No context — ask anything freely
                    </div>
                  </div>
                </button>
                {error && <div className="mt-4"><ErrorBanner message={error} /></div>}
              </div>
            )}

            {/* Step 2 — pick item */}
            {step === "pick_item" && (
              <div>
                <button
                  onClick={() => setStep("pick_type")}
                  className="text-sm text-gray-400 hover:text-gray-600 mb-5 flex items-center gap-1"
                >
                  ← Back
                </button>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {contextType === "assignment" ? "Pick an Assignment" : "Pick a Lesson Plan"}
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  I&apos;ll use this to understand your context and progress.
                </p>

                {loadingItems ? (
                  <div className="text-sm text-gray-400 text-center py-12">Loading…</div>
                ) : contextType === "assignment" ? (
                  assignments.length === 0 ? (
                    <div className="text-sm text-gray-400 text-center py-12">
                      No assignments yet.{" "}
                      <Link href="/assignments" className="text-violet-600 hover:underline">
                        Create one first.
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assignments.map((a) => (
                        <ItemCard
                          key={a.id}
                          selected={selectedAssignment?.id === a.id}
                          onClick={() => pickAssignment(a)}
                        >
                          <div className="font-medium text-gray-900 text-sm">{a.topic}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {a.subject} · {a.difficulty} · {a.num_questions} questions
                          </div>
                        </ItemCard>
                      ))}
                    </div>
                  )
                ) : plans.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-12">
                    No lesson plans yet.{" "}
                    <Link href="/lesson-planner" className="text-violet-600 hover:underline">
                      Create one first.
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {plans.map((p) => (
                      <ItemCard
                        key={p.id}
                        selected={selectedPlan?.id === p.id}
                        onClick={() => pickPlan(p)}
                      >
                        <div className="font-medium text-gray-900 text-sm">{p.subject}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {p.days} days · {p.goal}
                        </div>
                        {p.topics && p.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {p.topics.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: "#ede9fe", color: "#6d28d9" }}
                              >
                                {t}
                              </span>
                            ))}
                            {p.topics.length > 3 && (
                              <span className="text-xs text-gray-400">+{p.topics.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </ItemCard>
                    ))}
                  </div>
                )}
                {error && <div className="mt-4"><ErrorBanner message={error} /></div>}
              </div>
            )}

            {/* Step 3 — pick / type question */}
            {step === "pick_question" && (
              <div>
                <button
                  onClick={() => setStep("pick_item")}
                  className="text-sm text-gray-400 hover:text-gray-600 mb-5 flex items-center gap-1"
                >
                  ← Back
                </button>

                {/* context badge */}
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl mb-6 text-sm"
                  style={{ background: "#ede9fe", color: "#5b21b6" }}
                >
                  <span>{contextType === "assignment" ? "📝" : "📅"}</span>
                  <span className="font-medium">
                    {contextType === "assignment"
                      ? selectedAssignment?.topic
                      : selectedPlan?.subject}
                  </span>
                  {contextType === "assignment" && selectedSubmission && (
                    <span className="ml-auto text-xs opacity-70">
                      Score: {selectedSubmission.score}/{selectedSubmission.max_score}
                    </span>
                  )}
                </div>

                <h2 className="text-base font-semibold text-gray-900 mb-1">What would you like to ask?</h2>
                <p className="text-sm text-gray-500 mb-4">Pick a suggestion or type your own question.</p>

                {/* suggestions */}
                <div className="space-y-2 mb-5">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(s)}
                      className="w-full text-left text-sm px-4 py-3 rounded-xl border border-gray-200 hover:border-violet-400 hover:bg-violet-50 transition-all text-gray-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* free input */}
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  placeholder="Or type your own question…"
                  rows={3}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />

                {error && <div className="mt-3"><ErrorBanner message={error} /></div>}

                <button
                  onClick={startSession}
                  disabled={starting || !input.trim()}
                  className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: "#7c3aed" }}
                >
                  {starting ? "Starting…" : "Ask Tutor"}
                </button>
              </div>
            )}
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

          {/* context pill inside chat */}
          {contextType && (
            <div
              className="px-6 py-2 flex items-center gap-2 text-xs"
              style={{ background: "#faf5ff", borderTop: "1px solid #ede9fe" }}
            >
              <span>{contextType === "assignment" ? "📝" : "📅"}</span>
              <span className="text-violet-700 font-medium">
                {contextType === "assignment" ? selectedAssignment?.topic : selectedPlan?.subject}
              </span>
              <span className="text-violet-400">· context-aware session</span>
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="p-4 flex gap-3"
            style={{ background: "#fff", borderTop: "1px solid #f1f2f6" }}
          >
            <input
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Ask a follow-up question…"
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
