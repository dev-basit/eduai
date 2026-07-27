// Shared primitive UI components used across all pages.
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-2xl ${className}`}
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  back,
  backHref,
  title,
  subtitle,
}: {
  back?: string;
  backHref?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      {back && backHref && (
        <a
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-3"
        >
          ← {back}
        </a>
      )}
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="mt-1 text-gray-500 text-sm">{subtitle}</p>}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{children}</label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-shadow focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-shadow focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none ${props.className ?? ""}`}
    />
  );
}

export function PrimaryButton({
  children,
  loading,
  loadingText,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
}) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: loading || props.disabled ? "#a78bfa" : "#7c3aed" }}
      onMouseEnter={(e) => {
        if (!loading && !props.disabled)
          (e.currentTarget as HTMLElement).style.background = "#6d28d9";
      }}
      onMouseLeave={(e) => {
        if (!loading && !props.disabled)
          (e.currentTarget as HTMLElement).style.background = "#7c3aed";
      }}
    >
      {loading ? loadingText ?? "Loading..." : children}
    </button>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
      {message}
    </div>
  );
}

export function Badge({ children, color = "gray" }: { children: ReactNode; color?: "gray" | "violet" | "green" | "amber" | "red" }) {
  const styles: Record<string, { bg: string; text: string }> = {
    gray:   { bg: "#f3f4f6", text: "#6b7280" },
    violet: { bg: "#ede9fe", text: "#7c3aed" },
    green:  { bg: "#d1fae5", text: "#065f46" },
    amber:  { bg: "#fef3c7", text: "#92400e" },
    red:    { bg: "#fee2e2", text: "#991b1b" },
  };
  const s = styles[color];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.text }}
    >
      {children}
    </span>
  );
}
