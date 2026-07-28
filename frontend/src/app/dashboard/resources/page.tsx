"use client";
import { useEffect, useState } from "react";
import { resourceService } from "@/services";
import type { Resource, ResourceSection } from "@/types";

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

const SECTION_COLORS = ["#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

// ── Section card (mirrors DayCard) ────────────────────────────

function SectionCard({ section, index }: { section: ResourceSection; index: number }) {
  const [open, setOpen] = useState(index < 2);
  const color = SECTION_COLORS[index % SECTION_COLORS.length];

  return (
    <div className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #f3f4f6" }}
    >
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: color }}
          >{index + 1}</span>
          <div>
            <div className="font-semibold text-gray-900 text-sm">{section.title}</div>
            <div className="text-xs text-gray-400 mt-0.5">{section.topic}</div>
          </div>
        </div>
        <span className="text-gray-400 text-sm">{open ? "↑" : "↓"}</span>
      </button>

      {open && (
        <div className="px-5 pb-6 border-t" style={{ borderColor: "#f3f4f6" }}>
          {/* Explanation */}
          <div className="pt-4 mb-5">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Explanation</div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{section.explanation}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            {/* Key Concepts */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Key Concepts</div>
              <ul className="space-y-1.5">
                {section.key_concepts?.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="shrink-0 mt-0.5 font-bold" style={{ color }}>•</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Examples */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Worked Examples</div>
              <div className="space-y-2">
                {section.examples?.map((ex, i) => (
                  <div key={i} className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3.5 py-2.5 leading-relaxed whitespace-pre-line"
                    style={{ border: "1px solid #f3f4f6" }}
                  >
                    <span className="text-xs font-bold mr-1.5" style={{ color }}>Ex {i + 1}.</span>
                    {ex}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Check */}
          <div className="rounded-xl px-4 py-3" style={{ background: "#ede9fe", border: "1px solid #ddd6fe" }}>
            <div className="text-xs font-bold mb-1" style={{ color: "#5b21b6" }}>Quick Check</div>
            <p className="text-sm font-medium" style={{ color: "#4c1d95" }}>{section.quick_check}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Resource detail panel ──────────────────────────────────────

function ResourceDetail({ resource }: { resource: Resource }) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <span className="text-xs font-bold px-3 py-1 rounded-full text-white inline-block mb-2"
          style={{ background: subjectColor(resource.subject) }}
        >{resource.subject}</span>
        <div className="text-xs text-gray-400 mt-1">{resource.sections.length} sections · {relativeDate(resource.created_at)}</div>
      </div>

      <div className="space-y-2.5">
        {resource.sections.map((s, i) => (
          <SectionCard key={i} section={s} index={i} />
        ))}
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────

function ResourceSidebar({
  resources, selectedId, onSelect, loading, mobileOpen,
}: {
  resources: Resource[]; selectedId: string | null;
  onSelect: (r: Resource) => void; loading: boolean; mobileOpen: boolean;
}) {
  return (
    <aside
      className={`${mobileOpen ? 'flex' : 'hidden'} md:flex w-full md:w-64 shrink-0 flex-col border-r overflow-y-auto`}
      style={{ borderColor: "#e5e7eb", background: "#fafafa", ...(mobileOpen ? { maxHeight: '45vh' } : {}) }}
    >
      <div className="px-4 pt-6 pb-3">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">My Resources</div>
      </div>

      {loading && (
        <div className="px-4 space-y-2 mt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "#f3f4f6" }} />
          ))}
        </div>
      )}

      {!loading && resources.length === 0 && (
        <div className="px-4 text-center py-10">
          <div className="text-2xl mb-2">📚</div>
          <div className="text-xs text-gray-400">No resources yet.</div>
          <div className="text-xs text-gray-400 mt-1">Generate a lesson plan to get resources.</div>
        </div>
      )}

      {!loading && resources.map((r) => {
        const active = selectedId === r.id;
        return (
          <button key={r.id} onClick={() => onSelect(r)}
            className="w-full text-left px-4 py-3 transition-all border-b"
            style={{
              borderColor: "#f3f4f6",
              ...(active ? { background: "#ede9fe", borderLeft: "3px solid #7c3aed" } : {}),
            }}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: subjectColor(r.subject) }} />
              <div className="text-sm font-semibold text-gray-800 truncate">{r.subject}</div>
            </div>
            <div className="text-xs ml-4" style={{ color: "#9ca3af" }}>
              {r.sections.length} sections · {relativeDate(r.created_at)}
            </div>
          </button>
        );
      })}
    </aside>
  );
}

// ── Main page ──────────────────────────────────────────────────

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    resourceService.list()
      .then((data) => {
        setResources(data);
        if (data.length > 0) setSelected(data[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-full min-h-screen" style={{ background: "#f1f2f6" }}>
      {/* Mobile toggle */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-2.5 shrink-0 border-b bg-white"
        style={{ borderColor: '#e5e7eb' }}
      >
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">My Resources</span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-xs font-semibold cursor-pointer"
          style={{ color: '#7c3aed' }}
        >
          {mobileOpen ? 'Hide ↑' : `List${resources.length > 0 ? ` (${resources.length})` : ''} ↓`}
        </button>
      </div>
      <ResourceSidebar
        resources={resources}
        selectedId={selected?.id ?? null}
        onSelect={(r) => { setSelected(r); setMobileOpen(false); }}
        loading={loading}
        mobileOpen={mobileOpen}
      />

      <main className="flex-1 overflow-y-auto">
        {!loading && !selected && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="text-4xl mb-3">📚</div>
            <div className="text-lg font-semibold text-gray-700">No resources yet</div>
            <div className="text-sm text-gray-400 mt-1">
              Resources are auto-generated when you create a lesson plan.
            </div>
          </div>
        )}
        {selected && <ResourceDetail resource={selected} />}
      </main>
    </div>
  );
}
