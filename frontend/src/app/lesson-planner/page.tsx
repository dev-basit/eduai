"use client";
import { useEffect, useState } from "react";
import { lessonPlanService } from "@/services";
import type { ApiError } from "@/services/http";
import type { DailyPlan, LessonPlan, LessonPlanCreateDTO, PlannerQuestion, PlannerQuiz } from "@/types";

// ── helpers ────────────────────────────────────────────────────

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function subjectColor(subject: string) {
  const colors = ["#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626"];
  let h = 0;
  for (let i = 0; i < subject.length; i++) h = subject.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

// ── Plan history sidebar ───────────────────────────────────────

function PlanHistory({
  plans, selectedId, onSelect, onNew, loading,
}: {
  plans: LessonPlan[]; selectedId: string | null;
  onSelect: (p: LessonPlan) => void; onNew: () => void; loading: boolean;
}) {
  return (
    <aside
      className="w-64 shrink-0 flex flex-col border-r overflow-y-auto"
      style={{ borderColor: "#e5e7eb", background: "#fafafa" }}
    >
      <div className="px-4 pt-6 pb-3 flex items-center justify-between">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">My Plans</div>
        <button
          onClick={onNew}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg"
          style={{ background: "#ede9fe", color: "#7c3aed" }}
        >
          + New
        </button>
      </div>

      {loading && (
        <div className="px-4 space-y-2 mt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "#f3f4f6" }} />
          ))}
        </div>
      )}

      {!loading && plans.length === 0 && (
        <div className="px-4 text-center py-10">
          <div className="text-2xl mb-2">📅</div>
          <div className="text-xs text-gray-400">No plans yet.</div>
        </div>
      )}

      {!loading && plans.map((p) => {
        const active = selectedId === p.id;
        const topics = p.topics ?? [];
        const visibleTopics = topics.slice(0, 3);
        const extraCount = topics.length - visibleTopics.length;
        return (
          <button key={p.id} onClick={() => onSelect(p)}
            className="w-full text-left px-4 py-3 transition-all border-b"
            style={{
              borderColor: "#f3f4f6",
              ...(active ? { background: "#ede9fe", borderLeft: "3px solid #7c3aed" } : {}),
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: subjectColor(p.subject) }} />
              <div className="text-sm font-semibold text-gray-800 truncate">{p.subject}</div>
            </div>
            {visibleTopics.length > 0 && (
              <div className="flex flex-wrap gap-1 ml-4 mb-1">
                {visibleTopics.map((t) => (
                  <span key={t} className="text-xs px-1.5 py-0.5 rounded-md truncate max-w-[80px]"
                    style={{ background: active ? "#ddd6fe" : "#f3f4f6", color: active ? "#5b21b6" : "#6b7280" }}
                  >{t}</span>
                ))}
                {extraCount > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-md"
                    style={{ background: active ? "#ddd6fe" : "#f3f4f6", color: active ? "#5b21b6" : "#6b7280" }}
                  >+{extraCount}</span>
                )}
              </div>
            )}
            <div className="text-xs mt-0.5 ml-4" style={{ color: active ? "#7c3aed" : "#9ca3af" }}>
              {relativeDate(p.created_at)}
            </div>
          </button>
        );
      })}
    </aside>
  );
}

// ── Step 1: Form ───────────────────────────────────────────────

type FormState = { subject: string; topicsRaw: string; goal: string; study_hours_per_day: number; days: number };

function PlanForm({ onQuizReady }: {
  onQuizReady: (form: FormState, quiz: PlannerQuiz) => void;
}) {
  const [form, setForm] = useState<FormState>({
    subject: "", topicsRaw: "", goal: "", study_hours_per_day: 2, days: 7,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topics = form.topicsRaw.split(",").map((t) => t.trim()).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const quiz = await lessonPlanService.generateQuiz({
        subject: form.subject,
        goal: form.goal,
        ...(topics.length > 0 && { topics }),
      });
      onQuizReady(form, quiz);
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to generate quiz. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-10 px-6">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-3"
          style={{ background: "#ede9fe", color: "#7c3aed" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          Step 1 of 3 — Your Details
        </div>
        <h1 className="text-2xl font-bold text-gray-900">New Study Plan</h1>
        <p className="text-gray-500 text-sm mt-1">
          Tell us what you want to learn — we'll quiz you first to personalise the plan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Subject <span className="text-red-400">*</span>
          </label>
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="e.g., Mathematics, Physics, English Literature"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Topics to cover
            <span className="text-gray-400 font-normal ml-1">(optional — comma-separated)</span>
          </label>
          <input
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="e.g., Quadratic equations, Integration, Trigonometry"
            value={form.topicsRaw}
            onChange={(e) => setForm({ ...form, topicsRaw: e.target.value })}
          />
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {topics.map((t, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "#ede9fe", color: "#7c3aed" }}>{t}</span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Your goal <span className="text-red-400">*</span>
          </label>
          <textarea
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            rows={3}
            placeholder="e.g., Prepare for my board exam in 3 weeks — struggling with quadratics and logs"
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-semibold text-gray-700">Study time per day</label>
            <span className="text-sm font-bold tabular-nums" style={{ color: "#7c3aed" }}>
              {form.study_hours_per_day} hrs
            </span>
          </div>
          <input type="range" min="0.5" max="8" step="0.5" className="w-full accent-violet-600"
            value={form.study_hours_per_day}
            onChange={(e) => setForm({ ...form, study_hours_per_day: parseFloat(e.target.value) })}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>30 min</span><span>8 hrs</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">Number of days</label>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setForm({ ...form, days: Math.max(1, form.days - 1) })}
                className="w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center"
                style={{ background: "#f3f4f6", color: "#374151" }}
              >−</button>
              <input
                type="number" min="1" max="60"
                className="w-14 text-center border border-gray-200 rounded-lg py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                style={{ color: "#7c3aed" }}
                value={form.days}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(60, parseInt(e.target.value) || 1));
                  setForm({ ...form, days: v });
                }}
              />
              <button type="button" onClick={() => setForm({ ...form, days: Math.min(60, form.days + 1) })}
                className="w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center"
                style={{ background: "#f3f4f6", color: "#374151" }}
              >+</button>
            </div>
          </div>
          <div className="flex gap-2">
            {[3, 5, 7, 14, 30].map((d) => (
              <button key={d} type="button"
                onClick={() => setForm({ ...form, days: d })}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={form.days === d
                  ? { background: "#7c3aed", color: "#fff" }
                  : { background: "#f3f4f6", color: "#6b7280" }}
              >{d}d</button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
          style={{ background: "#7c3aed" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Generating your knowledge check…
            </span>
          ) : "Continue to Knowledge Check →"}
        </button>
      </form>
    </div>
  );
}

// ── Step 2: Quiz ───────────────────────────────────────────────

function PlanQuiz({ quiz, form, onPlanReady }: {
  quiz: PlannerQuiz;
  form: FormState;
  onPlanReady: (plan: LessonPlan) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const answered = Object.keys(answers).length;
  const total = quiz.questions.length;
  const pct = Math.round((answered / total) * 100);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    const topics = form.topicsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    const dto: LessonPlanCreateDTO = {
      subject: form.subject,
      goal: form.goal,
      days: form.days,
      study_hours_per_day: form.study_hours_per_day,
      ...(topics.length > 0 && { topics }),
      quiz_questions: quiz.questions,
      quiz_answers: answers,
    };
    try {
      const plan = await lessonPlanService.generate(dto);
      onPlanReady(plan);
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to generate plan. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-3"
          style={{ background: "#ede9fe", color: "#7c3aed" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          Step 2 of 3 — Knowledge Check
        </div>
        <h2 className="text-xl font-bold text-gray-900">{form.subject} — Quick Assessment</h2>
        <p className="text-sm text-gray-500 mt-1">{quiz.instructions}</p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>{answered} of {total} answered</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: "#e5e7eb" }}>
          <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: "#7c3aed" }} />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4 mb-6">
        {quiz.questions.map((q, i) => (
          <QuizCard key={q.id} q={q} index={i} answer={answers[q.id] ?? ""}
            onChange={(val) => setAnswers({ ...answers, [q.id]: val })}
          />
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || answered === 0}
        className="w-full py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
        style={{ background: "#7c3aed" }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Analysing your answers & building your plan…
          </span>
        ) : answered === 0
          ? "Answer at least one question to continue"
          : "Submit & Generate My Personalised Plan →"}
      </button>
    </div>
  );
}

function QuizCard({ q, index, answer, onChange }: {
  q: PlannerQuestion; index: number; answer: string; onChange: (v: string) => void;
}) {
  const diffColor = q.difficulty === "easy"
    ? { bg: "#dcfce7", text: "#166534" }
    : q.difficulty === "medium"
    ? { bg: "#fef3c7", text: "#92400e" }
    : { bg: "#fee2e2", text: "#991b1b" };

  return (
    <div className="bg-white rounded-2xl border p-5 transition-all"
      style={{ borderColor: answer ? "#c4b5fd" : "#f3f4f6", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-start gap-3 mb-4">
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: "#7c3aed" }}
        >{index + 1}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: diffColor.bg, color: diffColor.text }}
            >{q.difficulty}</span>
            <span className="text-xs text-gray-400">{q.topic}</span>
            <span className="text-xs text-gray-300 ml-auto">{q.points} pt{q.points > 1 ? "s" : ""}</span>
          </div>
          <p className="text-sm font-medium text-gray-800 leading-relaxed">{q.question}</p>
        </div>
      </div>

      {q.type === "mcq" && q.options ? (
        <div className="space-y-2 ml-9">
          {q.options.map((opt) => (
            <label key={opt} className="flex items-center gap-3 cursor-pointer group">
              <input type="radio" name={`q-${q.id}`} value={opt}
                checked={answer === opt}
                onChange={() => onChange(opt)}
                className="accent-violet-600 w-4 h-4 shrink-0"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt}</span>
            </label>
          ))}
        </div>
      ) : (
        <textarea
          className="ml-9 w-[calc(100%-2.25rem)] border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          rows={2}
          placeholder="Your answer…"
          value={answer}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

// ── Step 3: Plan Detail ────────────────────────────────────────

const DAY_COLORS = ["#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

function DayCard({ day, index }: { day: DailyPlan; index: number }) {
  const [open, setOpen] = useState(index < 2);
  const color = DAY_COLORS[index % DAY_COLORS.length];

  return (
    <div className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #f3f4f6" }}
    >
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: color }}
          >{index + 1}</span>
          <div>
            <div className="font-semibold text-gray-900 text-sm">{day.day}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {day.topics?.slice(0, 2).join(" · ")}
              {(day.topics?.length ?? 0) > 2 && ` +${day.topics!.length - 2}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: "#f3f4f6", color: "#6b7280" }}
          >{day.duration_minutes} min</span>
          <span className="text-gray-400 text-sm">{open ? "↑" : "↓"}</span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: "#f3f4f6" }}>
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: "Activities", items: day.activities, icon: "▶" },
              { label: "Resources", items: day.resources, icon: "🔗" },
              { label: "Objectives", items: day.learning_objectives, icon: "✓" },
            ].map(({ label, items, icon }) => (
              <div key={label}>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</div>
                <ul className="space-y-1.5">
                  {items?.map((item, j) => (
                    <li key={j} className="text-xs text-gray-600 flex items-start gap-2 leading-relaxed">
                      <span className="shrink-0 mt-0.5 text-gray-300">{icon}</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlanDetail({ plan, onNew, onImprove }: {
  plan: LessonPlan; onNew: () => void;
  onImprove: (plan: LessonPlan) => void;
}) {
  const p = plan.plan;
  const [improving, setImproving] = useState(false);
  const [improveError, setImproveError] = useState("");

  const handleImprove = async () => {
    setImproving(true);
    setImproveError("");
    try {
      const improved = await lessonPlanService.improve(plan.id);
      onImprove(improved);
    } catch (err) {
      setImproveError((err as ApiError).message ?? "No submitted assignments found for this subject yet.");
    } finally {
      setImproving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <span className="text-xs font-bold px-3 py-1 rounded-full text-white inline-block mb-2"
            style={{ background: subjectColor(plan.subject) }}
          >{plan.subject}</span>
          <p className="text-sm text-gray-500 max-w-xl leading-relaxed">{plan.goal}</p>
          <div className="text-xs text-gray-400 mt-1.5">
            {plan.days} days · {plan.study_hours_per_day} hrs/day · {relativeDate(plan.created_at)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <button onClick={onNew}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl"
            style={{ background: "#ede9fe", color: "#7c3aed" }}
          >+ New Plan</button>
          <button onClick={handleImprove} disabled={improving}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl disabled:opacity-50 transition-all"
            style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}
            title="Regenerate this plan using your assignment results"
          >
            {improving ? (
              <><span className="w-3 h-3 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />Improving…</>
            ) : (
              <><span>⚡</span>Improve with Assignments</>
            )}
          </button>
        </div>
      </div>

      {improveError && (
        <div className="mb-4 text-xs px-4 py-3 rounded-xl"
          style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}
        >{improveError}</div>
      )}

      {/* Skill summary (if quiz was taken) */}
      {p.skill_summary && (
        <div className="rounded-2xl px-5 py-4 mb-4 text-sm leading-relaxed"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}
        >
          <span className="font-semibold">Your level · </span>{p.skill_summary}
        </div>
      )}

      {/* Week overview */}
      <div className="rounded-2xl px-5 py-4 mb-5 text-sm leading-relaxed"
        style={{ background: "#ede9fe", color: "#5b21b6" }}
      >
        <span className="font-semibold">This week · </span>{p.week_overview}
      </div>

      {/* Daily plans */}
      <div className="space-y-2.5 mb-5">
        {p.daily_plans?.map((day, i) => <DayCard key={i} day={day} index={i} />)}
      </div>

      {/* Goals + Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #f3f4f6" }}
        >
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Weekly Goals</div>
          <ul className="space-y-2">
            {p.weekly_goals?.map((g, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="text-emerald-500 font-bold mt-0.5 shrink-0">✓</span>{g}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl p-5"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #f3f4f6" }}
        >
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Study Tips</div>
          <ul className="space-y-2">
            {p.tips?.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="shrink-0">💡</span>{t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────

type Mode = "form" | "quiz" | "view";

export default function LessonPlannerPage() {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selected, setSelected] = useState<LessonPlan | null>(null);
  const [mode, setMode] = useState<Mode>("form");

  // Quiz state passed between steps
  const [pendingForm, setPendingForm] = useState<FormState | null>(null);
  const [quiz, setQuiz] = useState<PlannerQuiz | null>(null);

  useEffect(() => {
    lessonPlanService.list()
      .then((data) => {
        setPlans(data);
        if (data.length > 0) { setSelected(data[0]); setMode("view"); }
      })
      .catch(() => {})
      .finally(() => setPlansLoading(false));
  }, []);

  const handleQuizReady = (form: FormState, generatedQuiz: PlannerQuiz) => {
    setPendingForm(form);
    setQuiz(generatedQuiz);
    setMode("quiz");
  };

  const handlePlanReady = (plan: LessonPlan) => {
    setPlans((prev) => [plan, ...prev]);
    setSelected(plan);
    setPendingForm(null);
    setQuiz(null);
    setMode("view");
  };

  const handleNew = () => {
    setSelected(null);
    setPendingForm(null);
    setQuiz(null);
    setMode("form");
  };

  const handleImprove = (improved: LessonPlan) => {
    setPlans((prev) => [improved, ...prev]);
    setSelected(improved);
    setMode("view");
  };

  return (
    <div className="flex h-full min-h-screen" style={{ background: "#f1f2f6" }}>
      <PlanHistory
        plans={plans}
        selectedId={mode === "view" ? (selected?.id ?? null) : null}
        onSelect={(p) => { setSelected(p); setMode("view"); }}
        onNew={handleNew}
        loading={plansLoading}
      />

      <main className="flex-1 overflow-y-auto">
        {mode === "form" && <PlanForm onQuizReady={handleQuizReady} />}
        {mode === "quiz" && quiz && pendingForm && (
          <PlanQuiz quiz={quiz} form={pendingForm} onPlanReady={handlePlanReady} />
        )}
        {mode === "view" && selected && <PlanDetail plan={selected} onNew={handleNew} onImprove={handleImprove} />}
      </main>
    </div>
  );
}
