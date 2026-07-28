'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="h-full flex">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — overlay on mobile, inline on md+ */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-50 transition-transform duration-200 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ background: '#0d0d14', borderBottom: '1px solid #1a1a2e' }}
        >
          <button
            onClick={() => setOpen(true)}
            className="text-gray-300 hover:text-white transition-colors cursor-pointer text-xl leading-none"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
              style={{ background: '#7c3aed' }}
            >
              E
            </div>
            <span className="text-white font-semibold text-sm">EduAI</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
