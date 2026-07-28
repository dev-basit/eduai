'use client';
import Link from 'next/link';

const features = [
  {
    icon: '📅',
    iconBg: '#ede9fe',
    title: 'Lesson Planner',
    desc: 'Get a personalized 7-day study plan built around your goals and skill level — refined by a quick diagnostic quiz.',
    tag: 'Planning',
  },
  {
    icon: '📚',
    iconBg: '#d1fae5',
    title: 'AI Resources',
    desc: 'Auto-generated study material with explanations, worked examples, key concepts, and quick-check questions.',
    tag: 'Study',
  },
  {
    icon: '📝',
    iconBg: '#fef3c7',
    title: 'Smart Assignments',
    desc: 'MCQ, short & long answer questions with instant AI grading and follow-up counter-questions to verify understanding.',
    tag: 'Practice',
  },
  {
    icon: '💬',
    iconBg: '#ffe4e6',
    title: 'Doubt Solver',
    desc: 'Ask any academic question and get clear, step-by-step explanations tailored to your assignment and plan context.',
    tag: 'Chat',
  },
];

const steps = [
  {
    num: '01',
    title: 'Choose your subject & goal',
    desc: 'Tell us what you want to learn and how much time you have per day.',
  },
  {
    num: '02',
    title: 'Take a quick diagnostic quiz',
    desc: 'A short quiz pinpoints exactly what you know — so the plan skips what you already mastered.',
  },
  {
    num: '03',
    title: 'Learn, practice & get help',
    desc: 'Follow your personalised plan, complete assignments, and ask the AI tutor anything.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa' }}>
      {/* Navbar */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: '#0d0d14', borderBottom: '1px solid #1a1a2e' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: '#7c3aed' }}
          >
            E
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-none">EduAI</div>
            <div className="text-xs" style={{ color: '#6b7280' }}>AI Learning Platform</div>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 cursor-pointer"
          style={{ background: '#7c3aed' }}
        >
          Go to Dashboard →
        </Link>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 py-16 sm:py-24" style={{ background: '#f7f8fa' }}>
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ background: '#ede9fe', color: '#7c3aed' }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#7c3aed' }} />
          AI-Powered Education
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight tracking-tight max-w-2xl mx-auto">
          Learn Smarter,<br />Not Harder.
        </h1>
        <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
          Personalized lesson plans, AI-graded assignments, and instant doubt solving — all in one place. No signup required.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/dashboard"
            className="px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 cursor-pointer"
            style={{ background: '#7c3aed', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}
          >
            Start Learning →
          </Link>
          <a
            href="#features"
            className="px-6 py-3.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-white transition-all cursor-pointer"
          >
            See Features ↓
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20" style={{ background: '#ffffff' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">Everything You Need to Succeed</h2>
            <p className="mt-3 text-gray-500">Four AI-powered tools working together around your learning journey.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 flex flex-col gap-4"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f2f6' }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: f.iconBg }}
                  >
                    {f.icon}
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: '#f3f4f6', color: '#6b7280' }}
                  >
                    {f.tag}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20" style={{ background: '#f7f8fa' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">Up and Running in 3 Steps</h2>
            <p className="mt-3 text-gray-500">No account, no setup — just open it and start learning.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div
                key={s.num}
                className="bg-white rounded-2xl p-6"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #f1f2f6' }}
              >
                <div
                  className="text-3xl font-black mb-4 leading-none"
                  style={{ color: '#ede9fe' }}
                >
                  {s.num}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 sm:py-24 text-center" style={{ background: '#1c1c1e' }}>
        <h2 className="text-3xl font-black text-white mb-3">Ready to start learning?</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Your personalized AI tutor is waiting. No login, no credit card — just open and go.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-8 py-4 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 cursor-pointer"
          style={{ background: '#7c3aed', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
        >
          Go to Dashboard →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0d0d14', borderTop: '1px solid #1a1a2e' }}>
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ background: '#7c3aed' }}
            >
              E
            </div>
            <div>
              <div className="text-white font-semibold text-sm leading-none">EduAI</div>
              <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>AI Learning Platform</div>
            </div>
          </div>
          <div className="text-xs text-center" style={{ color: '#4b5563' }}>
            Personalised lesson plans · AI-graded assignments · Instant doubt solving
          </div>
          <div
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: '#1a1a2e', color: '#7c3aed' }}
          >
            No signup required
          </div>
        </div>
        <div className="border-t px-6 py-4 text-center text-xs" style={{ borderColor: '#1a1a2e', color: '#374151' }}>
          © {new Date().getFullYear()} EduAI — AI-powered personalized education
        </div>
      </footer>
    </div>
  );
}
