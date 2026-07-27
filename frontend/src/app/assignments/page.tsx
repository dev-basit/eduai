"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { assignmentService } from "@/services";
import type { ApiError } from "@/services/http";
import type { Assignment, Difficulty, PlannerSubject } from "@/types";

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy",   label: "Easy"   },
  { value: "medium", label: "Medium" },
  { value: "hard",   label: "Hard"   },
];

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

function diffBadge(d: string) {
  if (d === "easy")   return { bg: "#dcfce7", text: "#166534" };
  if (d === "hard")   return { bg: "#fee2e2", text: "#991b1b" };
  return { bg: "#fef3c7", text: "#92400e" };
}

// ── History sidebar ────────────────────────────────────────────

function AssignmentHistory({ assignments, loading }: { assignments: Assignment[]; loading: boolean }) {
  return (
    <aside className="w-64 shrink-0 flex flex-col border-r overflow-y-auto"
      style={{ borderColor: "#e5e7eb", background: "#fafafa" }}
    >
      <div className="px-4 pt-6 pb-3">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Past Assignments</div>
      </div>

      {loading && (
        <div className="px-4 space-y-2 mt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "#f3f4f6" }} />
          ))}
        </div>
      )}

      {!loading && assignments.length === 0 && (
        <div className="px-4 text-center py-10">
          <div className="text-2xl mb-2">📝</div>
          <div className="text-xs text-gray-400">No assignments yet.</div>
        </div>
      )}

      {!loading && assignments.map((a) => {
        const badge = diffBadge(a.difficulty);
        return (
          <Link key={a.id} href={`/assignments/${a.id}`}
            className="block px-4 py-3 border-b transition-all hover:bg-gray-100"
            style={{ borderColor: "#f3f4f6" }}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: subjectColor(a.subject) }} />
              <div className="text-sm font-semibold text-gray-800 truncate">{a.subject}</div>
            </div>
            <div className="text-xs text-gray-500 truncate ml-4">{a.topic}</div>
            <div className="flex items-center gap-2 mt-1 ml-4">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                style={{ background: badge.bg, color: badge.text }}
              >{a.difficulty}</span>
              <span className="text-xs" style={{ color: "#9ca3af" }}>{relativeDate(a.created_at)}</span>
            </div>
          </Link>
        );
      })}
    </aside>
  );
}

// ── Form ───────────────────────────────────────────────────────

export default function AssignmentsPage() {
  const router = useRouter();

  const [assignments, setAssignments]       = useState<Assignment[]>([]);
  const [assignmentsLoading, setAL]         = useState(true);
  const [plannerSubjects, setPlannerSubjects] = useState<PlannerSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<PlannerSubject | null>(null);
  const [customSubject, setCustomSubject]   = useState("");
  const [topic, setTopic]                   = useState("");
  const [difficulty, setDifficulty]         = useState<Difficulty>("medium");
  const [numQuestions, setNumQuestions]     = useState(6);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState("");

  useEffect(() => {
    assignmentService.list()
      .then(setAssignments)
      .catch(() => {})
      .finally(() => setAL(false));

    assignmentService.getSubjects()
      .then((data) => {
        setPlannerSubjects(data);
        if (data.length > 0) {
          setSelectedSubject(data[0]);
          setDifficulty(data[0].suggested_difficulty);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubjectSelect = (s: PlannerSubject) => {
    setSelectedSubject(s);
    setCustomSubject("");
    setDifficulty(s.suggested_difficulty);
  };

  const subject    = customSubject.trim() || selectedSubject?.subject || "";
  const skillLevel = selectedSubject?.skill_summary ?? undefined;
  const canSubmit  = subject && topic.trim() && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const assignment = await assignmentService.generate({
        subject,
        topic: topic.trim(),
        difficulty,
        num_questions: numQuestions,
        ...(skillLevel ? { skill_level: skillLevel } : {}),
      });
      setAssignments((prev) => [assignment, ...prev]);
      router.push(`/assignments/${assignment.id}`);
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to generate assignment");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-screen" style={{ background: "#f1f2f6" }}>
      <AssignmentHistory assignments={assignments} loading={assignmentsLoading} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto py-10 px-6">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-3"
              style={{ background: "#ede9fe", color: "#7c3aed" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              AI Assignment Generator
            </div>
            <h1 className="text-2xl font-bold text-gray-900">New Assignment</h1>
            <p className="text-gray-500 text-sm mt-1">
              Generate questions tailored to your subject and get instant AI grading.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject <span className="text-red-400">*</span>
              </label>
              {plannerSubjects.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {plannerSubjects.map((s) => {
                      const active = selectedSubject?.subject === s.subject && !customSubject;
                      return (
                        <button key={s.subject} type="button" onClick={() => handleSubjectSelect(s)}
                          className="px-3.5 py-2 rounded-xl text-sm font-medium border transition-all"
                          style={active
                            ? { background: "#7c3aed", color: "#fff", borderColor: "#7c3aed" }
                            : { background: "#fff", color: "#374151", borderColor: "#e5e7eb" }}
                        >{s.subject}</button>
                      );
                    })}
                    <button type="button"
                      onClick={() => { setSelectedSubject(null); setCustomSubject(""); }}
                      className="px-3.5 py-2 rounded-xl text-sm font-medium border transition-all"
                      style={!selectedSubject && !customSubject
                        ? { background: "#7c3aed", color: "#fff", borderColor: "#7c3aed" }
                        : { background: "#fff", color: "#9ca3af", borderColor: "#e5e7eb" }}
                    >+ Other</button>
                  </div>
                  {!selectedSubject && (
                    <input
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Enter subject name"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      autoFocus
                    />
                  )}
                  {selectedSubject?.skill_summary && (
                    <div className="mt-2 text-xs px-3 py-2 rounded-lg"
                      style={{ background: "#f0fdf4", color: "#166534" }}
                    >
                      <span className="font-semibold">Your level: </span>{selectedSubject.skill_summary}
                    </div>
                  )}
                </>
              ) : (
                <input
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g., Mathematics, Physics"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  required
                />
              )}
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Topic <span className="text-red-400">*</span>
              </label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g., Quadratic Equations, Newton's Laws, Photosynthesis"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>

            {/* Difficulty */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Difficulty</label>
                {selectedSubject?.skill_summary && (
                  <span className="text-xs text-gray-400">auto-set from your planner level</span>
                )}
              </div>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button key={d.value} type="button" onClick={() => setDifficulty(d.value)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
                    style={difficulty === d.value
                      ? { background: "#7c3aed", color: "#fff", borderColor: "#7c3aed" }
                      : { background: "#fff", color: "#6b7280", borderColor: "#e5e7eb" }}
                  >{d.label}</button>
                ))}
              </div>
            </div>

            {/* Num questions */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Number of Questions</label>
                <span className="text-sm font-bold tabular-nums" style={{ color: "#7c3aed" }}>{numQuestions}</span>
              </div>
              <input type="range" min="3" max="15" step="1" className="w-full accent-violet-600"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>3</span><span>15</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <button type="submit" disabled={!canSubmit}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
              style={{ background: "#7c3aed" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Generating questions…
                </span>
              ) : "Generate Assignment →"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
