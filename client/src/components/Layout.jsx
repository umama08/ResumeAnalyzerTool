import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Briefcase,
  FileUp,
  LayoutDashboard,
  Menu,
  Users,
  X,
  ScanSearch,
  Sparkles,
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/jobs", label: "Jobs", icon: Briefcase, end: false },
  { to: "/upload", label: "Upload Resumes", icon: FileUp, end: false },
  { to: "/candidates", label: "Candidates", icon: Users, end: false },
];

const PAGE_LABELS = {
  "/": "Dashboard Overview",
  "/jobs": "Job Descriptions",
  "/jobs/new": "Create Job",
  "/upload": "Resume Ingestion & Analysis",
  "/candidates": "Candidate Ranking & Matching",
};

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const pageLabel =
    Object.entries(PAGE_LABELS)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([path]) => location.pathname.startsWith(path))?.[1] ?? "Resume Analyzer";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "linear-gradient(180deg, #0b1f33 0%, #07111d 100%)" }}
      >
        <div className="flex h-full flex-col px-5 py-6">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="logo-mark">
                <ScanSearch size={18} color="white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-display text-xl font-semibold leading-none tracking-wide text-white">
                  Resume Analyzer
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-mint-400/80 font-medium">
                  Smart Talent Engine
                </p>
              </div>
            </div>
            <button
              className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white/[0.12] text-white shadow-sm font-semibold"
                      : "text-white/60 hover:bg-white/[0.06] hover:text-white/90"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                        isActive
                          ? "bg-mint-500/25 text-mint-400 shadow-inner"
                          : "text-white/40 group-hover:text-white/70"
                      }`}
                    >
                      <link.icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                    </span>
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-mint-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Disclaimer */}
          <div className="mt-auto rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-mint-400 text-xs font-semibold mb-1">
              <Sparkles size={13} />
              <span>Recruiter Copilot</span>
            </div>
            <p className="text-[11px] leading-relaxed text-white/50">
              Skill-match scores support recruiter decisions. They do not constitute automated hiring recommendations.
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Main content ── */}
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-black/[0.06] bg-sand/90 px-4 py-3.5 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-1.5 hover:bg-black/5 lg:hidden text-ink-900"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink-700/40 uppercase tracking-widest hidden sm:inline">
                App /
              </span>
              <p className="text-sm font-semibold text-ink-900">{pageLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-mint-400/40 bg-mint-50 px-3 py-1 text-xs font-semibold text-mint-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-500 animate-pulse" />
              Live Analysis Engine
            </span>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 px-4 py-7 lg:px-8">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

