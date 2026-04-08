import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/sidebar';

export default function AdminLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col bg-stone-100/80 lg:flex-row lg:overflow-hidden">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-[1px] lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-30 flex shrink-0 items-center gap-3 border-b border-stone-200/80 bg-white/95 px-4 py-3 shadow-sm shadow-stone-200/30 backdrop-blur lg:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white p-2.5 text-stone-800 shadow-sm hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            onClick={() => setMobileNavOpen(true)}
            aria-expanded={mobileNavOpen}
            aria-controls="admin-sidebar"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation</span>
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Locals</p>
            <p className="text-sm font-bold text-stone-900">Admin</p>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
