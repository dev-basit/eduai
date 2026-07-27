'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { assignmentService } from '@/services';
import type { ApiError } from '@/services/http';
import type { Assignment, AssignmentSubmission, CounterCheckResponse, QuestionResult } from '@/types';

type Phase = 'loading' | 'answering' | 'grading' | 'reviewing' | 'verifying' | 'complete';

// ── Score helpers ──────────────────────────────────────────────

function computeScore(results: QuestionResult[]) {
  const earned = results.reduce((s, q) => s + (q.score ?? 0), 0);
  const total = results.reduce((s, q) => s + (q.max_score ?? 0), 0);
  const pct = total > 0 ? (earned / total) * 100 : 0;
  return { earned, total, pct };
}

// ── Score ring ─────────────────────────────────────────────────

function ScoreRing({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';
  const r = 42;
  const circ = 2 * Math.PI * r;
  const display = Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f2f6" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black" style={{ color }}>
            {display}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Answering phase ────────────────────────────────────────────

function AnsweringPhase({
  assignment,
  onSubmit,
  loading,
  error,
}: {
  assignment: Assignment;
  onSubmit: (answers: Record<string, string>) => void;
  loading: boolean;
  error: string;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const c = assignment.content;
  const answered = Object.values(answers).filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/assignments" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← New Assignment
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mt-2">{c.title}</h1>
        <div className="flex flex-wrap gap-2 mt-2">
          {[c.subject, c.topic, assignment.difficulty, `${c.total_marks} marks`].map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
              style={{ background: '#f3f4f6', color: '#6b7280' }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div
        className="text-sm rounded-xl px-4 py-3 mb-6 leading-relaxed"
        style={{ background: '#ede9fe', color: '#5b21b6' }}
      >
        {c.instructions}
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>
            {answered} of {c.questions?.length ?? 0} answered
          </span>
        </div>
        <div className="h-1 rounded-full" style={{ background: '#e5e7eb' }}>
          <div
            className="h-1 rounded-full transition-all"
            style={{
              width: `${(answered / (c.questions?.length ?? 1)) * 100}%`,
              background: '#7c3aed',
            }}
          />
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {c.questions?.map((q, i) => (
          <div
            key={q.id}
            className="bg-white rounded-2xl p-5"
            style={{
              boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
              border: `1px solid ${answers[String(q.id)] ? '#c4b5fd' : '#f3f4f6'}`,
            }}
          >
            <div className="flex items-start gap-3 mb-4">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: '#7c3aed' }}
              >
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800">{q.question}</p>
                  <span className="text-xs text-gray-400 shrink-0">{q.marks} marks</span>
                </div>
              </div>
            </div>

            {q.type === 'mcq' && q.options ? (
              <div className="ml-9 space-y-2">
                {q.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={opt}
                      checked={answers[String(q.id)] === opt}
                      onChange={() => setAnswers({ ...answers, [String(q.id)]: opt })}
                      className="accent-violet-600 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                className="ml-9 w-[calc(100%-2.25rem)] border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                rows={q.type === 'long' ? 5 : 3}
                placeholder={q.type === 'short' ? 'Short answer…' : 'Detailed answer…'}
                value={answers[String(q.id)] ?? ''}
                onChange={(e) => setAnswers({ ...answers, [String(q.id)]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <button
        onClick={() => onSubmit(answers)}
        disabled={loading || answered === 0}
        className="w-full py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
        style={{ background: '#7c3aed' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            AI is checking your answers…
          </span>
        ) : (
          'Submit for AI Grading →'
        )}
      </button>
    </div>
  );
}

// ── Reviewing phase ────────────────────────────────────────────

function ReviewingPhase({
  submission,
  onCounterSubmit,
  onSkip,
  loading,
  error,
}: {
  submission: AssignmentSubmission;
  onCounterSubmit: (counterAnswers: Record<string, string>) => void;
  onSkip: () => void;
  loading: boolean;
  error: string;
}) {
  const fb = submission.feedback;
  const [counterAnswers, setCounterAnswers] = useState<Record<string, string>>({});
  const { earned, total, pct } = computeScore(fb.question_results);

  const correctResults = fb.question_results.filter((qr) => qr.is_correct && qr.counter_question);
  const hasCounters = correctResults.length > 0;
  const gradeColor = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';
  const gradeBg = pct >= 80 ? '#f0fdf4' : pct >= 60 ? '#fffbeb' : '#fef2f2';
  const gradeText = pct >= 80 ? '#166534' : pct >= 60 ? '#92400e' : '#991b1b';

  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* Score summary */}
      <div
        className="bg-white rounded-2xl p-6 mb-6 flex items-center gap-6"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
      >
        <ScoreRing score={earned} maxScore={total} />
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-3xl font-black" style={{ color: gradeColor }}>{fb.grade}</span>
            <span className="text-sm font-medium px-3 py-1 rounded-full"
              style={{ background: gradeBg, color: gradeText }}
            >
              {earned} / {total} marks
            </span>
          </div>
          <div className="text-xs text-gray-400 mb-1">
            {fb.question_results.filter((q: QuestionResult) => q.is_correct).length} of{' '}
            {fb.question_results.length} questions fully correct
          </div>
          <p className="text-sm text-gray-500">{fb.overall_feedback}</p>
        </div>
      </div>

      {/* Per-question results */}
      <div className="space-y-4 mb-6">
        {fb.question_results.map((qr: QuestionResult) => {
          const isPartial = !qr.is_correct && qr.score > 0;
          const borderColor = qr.is_correct ? '#bbf7d0' : isPartial ? '#fde68a' : '#fecaca';
          const iconBg = qr.is_correct ? '#16a34a' : isPartial ? '#d97706' : '#dc2626';
          const scoreColor = qr.is_correct ? '#16a34a' : isPartial ? '#d97706' : '#dc2626';
          return (
            <div
              key={qr.question_id}
              className="bg-white rounded-2xl p-5"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: `1px solid ${borderColor}` }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                  style={{ background: iconBg }}
                >
                  {qr.is_correct ? '✓' : isPartial ? '½' : '✗'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-gray-800">{qr.question}</p>
                    <span className="text-sm font-bold shrink-0" style={{ color: scoreColor }}>
                      {qr.score}/{qr.max_score}
                    </span>
                  </div>

                  {/* Your answer */}
                  <div className="text-xs text-gray-500 mb-1">
                    <span className="font-medium">Your answer: </span>
                    {qr.student_answer || '(blank)'}
                  </div>

                  {/* Wrong: show correct answer */}
                  {!qr.is_correct && (
                    <div
                      className="mt-2 px-3 py-2.5 rounded-xl text-xs leading-relaxed"
                      style={{ background: '#fef2f2', color: '#991b1b' }}
                    >
                      <div className="font-semibold mb-1">Correct answer</div>
                      <div>{qr.correct_answer}</div>
                      {qr.feedback && <div className="mt-1.5 text-red-400 italic">{qr.feedback}</div>}
                    </div>
                  )}

                  {/* Correct: show counter question input */}
                  {qr.is_correct && qr.counter_question && (
                    <div
                      className="mt-3 px-3 py-3 rounded-xl"
                      style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
                    >
                      <div className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                        <span>✓ Correct!</span>
                        <span className="text-emerald-500">Now prove you really know it:</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mb-2">{qr.counter_question}</p>
                      <textarea
                        className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none bg-white"
                        rows={2}
                        placeholder="Your answer…"
                        value={counterAnswers[String(qr.question_id)] ?? ''}
                        onChange={(e) =>
                          setCounterAnswers({ ...counterAnswers, [String(qr.question_id)]: e.target.value })
                        }
                      />
                    </div>
                  )}

                  {qr.is_correct && !qr.counter_question && (
                    <div className="text-xs text-emerald-600 mt-1">{qr.feedback}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {hasCounters ? (
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
          >
            Skip verification
          </button>
          <button
            onClick={() => onCounterSubmit(counterAnswers)}
            disabled={loading || Object.keys(counterAnswers).length === 0}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
            style={{ background: '#7c3aed' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Checking…
              </span>
            ) : (
              'Submit Counter Answers →'
            )}
          </button>
        </div>
      ) : (
        <button
          onClick={onSkip}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#7c3aed' }}
        >
          View Final Results →
        </button>
      )}
    </div>
  );
}

// ── Complete phase ─────────────────────────────────────────────

function CompletePhase({
  submission,
  counterCheck,
}: {
  submission: AssignmentSubmission;
  counterCheck: CounterCheckResponse | null;
}) {
  const fb = submission.feedback;
  const { earned, total, pct } = computeScore(fb.question_results);
  const gradeColor = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';
  const gradeBg = pct >= 80 ? '#f0fdf4' : pct >= 60 ? '#fffbeb' : '#fef2f2';
  const gradeText = pct >= 80 ? '#166534' : pct >= 60 ? '#92400e' : '#991b1b';

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Link
        href="/assignments"
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors block mb-6"
      >
        ← New Assignment
      </Link>

      {/* Final score */}
      <div
        className="bg-white rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-center gap-6"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
      >
        <ScoreRing score={earned} maxScore={total} />
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-3xl font-black" style={{ color: gradeColor }}>{fb.grade}</span>
            <span className="text-sm font-medium px-3 py-1 rounded-full"
              style={{ background: gradeBg, color: gradeText }}
            >
              {earned} / {total} marks
            </span>
          </div>
          <div className="text-xs text-gray-400 mb-1">
            {fb.question_results.filter((q: QuestionResult) => q.is_correct).length} of{' '}
            {fb.question_results.length} questions fully correct
          </div>
          <p className="text-sm text-gray-500">{fb.overall_feedback}</p>
        </div>
      </div>

      {/* Understanding verification results */}
      {counterCheck && counterCheck.results.length > 0 && (
        <div className="mb-6">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Understanding Check
          </div>
          <div className="space-y-3">
            {counterCheck.results.map((cr) => (
              <div
                key={cr.question_id}
                className="bg-white rounded-xl p-4"
                style={{
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  border: `1px solid ${cr.understood ? '#bbf7d0' : '#fecaca'}`,
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm shrink-0">{cr.understood ? '🎯' : '⚠️'}</span>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{cr.counter_question}</p>
                    <p
                      className="text-xs font-medium"
                      style={{ color: cr.understood ? '#166534' : '#991b1b' }}
                    >
                      {cr.understood ? 'Genuine understanding confirmed' : 'May need more practice'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 italic">{cr.feedback}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {counterCheck.overall_understanding && (
            <div
              className="mt-3 px-4 py-3 rounded-xl text-xs leading-relaxed"
              style={{ background: '#ede9fe', color: '#5b21b6' }}
            >
              <span className="font-semibold">AI Assessment: </span>
              {counterCheck.overall_understanding}
            </div>
          )}
        </div>
      )}

      {/* Strengths / Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Strengths</div>
          <ul className="space-y-1.5">
            {fb.strengths?.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-500 font-bold mt-0.5 shrink-0">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Work On</div>
          <ul className="space-y-1.5">
            {fb.areas_for_improvement?.map((a: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-amber-500 font-bold mt-0.5 shrink-0">→</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Link
        href="/assignments"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white"
        style={{ background: '#7c3aed' }}
      >
        New Assignment
      </Link>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────

export default function AssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [counterCheck, setCounterCheck] = useState<CounterCheckResponse | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    assignmentService
      .getById(id)
      .then(async (a) => {
        setAssignment(a);
        try {
          const existing = await assignmentService.getLatestSubmission(id);
          setSubmission(existing);
          setPhase('complete');
        } catch {
          setPhase('answering');
        }
      })
      .catch(() => setPhase('loading'));
  }, [id]);

  const handleSubmit = async (answers: Record<string, string>) => {
    setActionLoading(true);
    setError('');
    setPhase('grading');
    try {
      const result = await assignmentService.submit(id, { answers });
      setSubmission(result);
      setPhase('reviewing');
    } catch (err) {
      setError((err as ApiError).message ?? 'Submission failed');
      setPhase('answering');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCounterSubmit = async (counterAnswers: Record<string, string>) => {
    if (!submission) return;
    setActionLoading(true);
    setError('');
    try {
      const result = await assignmentService.verifyUnderstanding(id, submission.id, counterAnswers);
      setCounterCheck(result);
      setPhase('complete');
    } catch (err) {
      setError((err as ApiError).message ?? 'Verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = () => setPhase('complete');

  if (phase === 'loading') {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <span className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-violet-500 animate-spin" />
          Loading assignment…
        </div>
      </div>
    );
  }

  if (phase === 'grading') {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-64 gap-4">
        <span className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-violet-500 animate-spin" />
        <p className="text-gray-500 text-sm">AI is grading your answers…</p>
      </div>
    );
  }

  if (!assignment) {
    return <div className="p-8 text-red-500 text-sm">Assignment not found.</div>;
  }

  return (
    <div style={{ background: '#f1f2f6', minHeight: '100vh' }}>
      {phase === 'answering' && (
        <AnsweringPhase
          assignment={assignment}
          onSubmit={handleSubmit}
          loading={actionLoading}
          error={error}
        />
      )}
      {phase === 'reviewing' && submission && (
        <ReviewingPhase
          submission={submission}
          onCounterSubmit={handleCounterSubmit}
          onSkip={handleSkip}
          loading={actionLoading}
          error={error}
        />
      )}
      {phase === 'complete' && submission && (
        <CompletePhase submission={submission} counterCheck={counterCheck} />
      )}
    </div>
  );
}
