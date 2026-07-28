'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/dashboard/lesson-planner', label: 'Lesson Planner', icon: '📅' },
  { href: '/dashboard/resources', label: 'Resources', icon: '📚' },
  { href: '/dashboard/assignments', label: 'Assignments', icon: '📝' },
  { href: '/dashboard/doubt-solver', label: 'Doubt Solver', icon: '💬' },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const path = usePathname();

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full min-h-screen" style={{ background: '#0d0d14' }}>
      {/* Mobile close button */}
      {onClose && (
        <div className="md:hidden flex justify-end px-4 pt-4 pb-0">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none cursor-pointer transition-colors"
          >
            ×
          </button>
        </div>
      )}
      {/* Logo */}
      <div className="px-5 py-5">
        <Link href="/" onClick={onClose} className="flex items-center gap-2.5 cursor-pointer">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: '#7c3aed' }}
          >
            E
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-none">EduAI</div>
            <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
              AI Learning Platform
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        <div className="text-xs font-medium px-3 pb-2 pt-1" style={{ color: '#4b5563' }}>
          FEATURES
        </div>
        {nav.map((item) => {
          const active = item.href === '/dashboard' ? path === '/dashboard' : path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={active ? { background: '#7c3aed', color: '#ffffff' } : { color: '#9ca3af' }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = '#1a1a2e';
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 mx-3 mb-4 rounded-lg" style={{ background: '#1a1a2e' }}>
        <div className="text-xs font-medium" style={{ color: '#7c3aed' }}>
          Guest Mode
        </div>
        <div className="text-xs mt-0.5" style={{ color: '#4b5563' }}>
          No login required
        </div>
      </div>
    </aside>
  );
}
