import Link from "next/link";

const features = [
  {
    href: "/dashboard/lesson-planner",
    icon: "📅",
    iconBg: "#ede9fe",
    title: "Lesson Planner",
    desc: "Generate a personalized 7-day study plan per subject based on your grade, topics, and available time.",
    tag: "Planning",
  },
  {
    href: "/dashboard/doubt-solver",
    icon: "💬",
    iconBg: "#d1fae5",
    title: "Doubt Solver",
    desc: "Ask any academic question and get clear, step-by-step explanations with follow-up support.",
    tag: "Chat",
  },
  {
    href: "/dashboard/assignments",
    icon: "📝",
    iconBg: "#fef3c7",
    title: "Assignments",
    desc: "Generate MCQs, short & long answer questions — then submit for instant AI grading.",
    tag: "Practice",
  },
];

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-10">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
          style={{ background: "#ede9fe", color: "#7c3aed" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          AI-Powered Learning
        </div>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">Welcome to EduAI</h1>
        <p className="mt-2 text-gray-500 text-lg max-w-xl">
          Your personal AI tutor — plan, practice, and perfect your understanding across any subject.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="group bg-white rounded-2xl p-6 flex flex-col gap-4 transition-all hover:shadow-lg hover:-translate-y-0.5"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
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
                style={{ background: "#f3f4f6", color: "#6b7280" }}
              >
                {f.tag}
              </span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">
                {f.title}
              </h2>
              <p className="mt-1 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
            <div
              className="self-start text-xs font-semibold flex items-center gap-1"
              style={{ color: "#7c3aed" }}
            >
              Get started{" "}
              <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
