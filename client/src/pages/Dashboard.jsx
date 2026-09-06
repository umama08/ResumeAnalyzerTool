import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import {
  AnimatedCount,
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  ScoreBar,
  ScoreBadge,
  StatusBadge,
} from "../components/ui.jsx";
import { Briefcase, FileUp, Plus, TrendingUp, Users } from "lucide-react";

const STAT_ICONS = [
  { label: "Total Active Jobs", key: "totalJobs", icon: Briefcase, suffix: "", gradient: "from-blue-500 to-indigo-600" },
  { label: "Candidates Ingested", key: "totalCandidates", icon: Users, suffix: "", gradient: "from-violet-500 to-purple-700" },
  { label: "Average Skill Match", key: "averageMatch", icon: TrendingUp, suffix: "%", gradient: "from-mint-500 to-teal-700" },
  { label: "Shortlisted Candidates", key: "shortlisted", icon: FileUp, suffix: "", gradient: "from-amber-400 to-orange-600" },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .stats()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock label="Loading recruitment metrics..." />;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-700/40">Overview</p>
          <h1 className="mt-1 font-display text-4xl font-bold leading-tight text-ink-900">
            Screening Desk
          </h1>
        </div>
        <Link
          to="/jobs/new"
          className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-ink-900/20 hover:bg-ink-800 hover:shadow-lg transition-all"
        >
          <Plus size={16} />
          Create Job
        </Link>
      </div>

      <ErrorBanner message={error} />

      {/* Stat cards with animated count-up */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_ICONS.map(({ label, key, icon: Icon, suffix, gradient }) => (
          <StatCard
            key={key}
            label={label}
            value={data?.[key] ?? 0}
            suffix={suffix}
            Icon={Icon}
            gradient={gradient}
          />
        ))}
      </div>

      {/* Recent candidates */}
      <section className="rounded-3xl bg-white p-6 shadow-card border border-ink-900/[0.04]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900">Recent Candidates</h2>
            <p className="text-xs text-ink-700/50 mt-0.5">Latest parsed & scored candidate submissions</p>
          </div>
          <Link
            to="/candidates"
            className="rounded-full border border-mint-400/40 bg-mint-50 px-4 py-1.5 text-xs font-semibold text-mint-600 hover:bg-mint-100 transition-colors"
          >
            View Full Ranking →
          </Link>
        </div>

        {!data?.recent?.length ? (
          <EmptyState
            icon={Users}
            title="No candidates analyzed yet"
            body="Create a job, upload resumes, and run analysis to see ranked skill matches appear here."
            action={
              <Link
                to="/upload"
                className="inline-flex rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm"
              >
                Upload Resumes
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-ink-900/[0.06]">
            {data.recent.map((candidate, i) => (
              <Link
                key={candidate.id}
                to={`/candidates/${candidate.id}`}
                className="group flex flex-wrap items-center justify-between gap-3 py-3.5 transition-colors hover:bg-sand/50 -mx-2 px-3 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sand text-xs font-bold text-ink-700/60">
                    #{i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-ink-900 group-hover:text-mint-600 transition-colors">
                      {candidate.name || candidate.resumeFilename}
                    </p>
                    <p className="text-xs text-ink-700/50">{candidate.jobTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden w-28 sm:block">
                    <ScoreBar score={candidate.matchScore} />
                  </div>
                  <StatusBadge status={candidate.status} />
                  <ScoreBadge score={candidate.matchScore} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickAction
          to="/jobs/new"
          icon="📋"
          title="Create Job Requirement"
          desc="Define required skills & aliases to evaluate candidates against"
        />
        <QuickAction
          to="/upload"
          icon="📤"
          title="Upload Resumes"
          desc="Batch upload PDF or DOCX candidate resumes for skill extraction"
        />
        <QuickAction
          to="/candidates"
          icon="🏆"
          title="View Rankings & Shortlist"
          desc="Filter ranked candidate profiles and export shortlist reports"
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix, Icon, gradient }) {
  return (
    <div className="hover-lift rounded-3xl bg-white p-5 shadow-card border border-ink-900/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-700/40">{label}</p>
          <p className="mt-3 font-display text-4xl font-bold text-ink-900">
            <AnimatedCount value={value} suffix={suffix} />
          </p>
        </div>
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-md shadow-ink-900/10`}
        >
          <Icon size={22} color="white" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, icon, title, desc }) {
  return (
    <Link
      to={to}
      className="hover-lift group rounded-3xl border border-ink-900/[0.06] bg-white p-6 shadow-card transition-all"
    >
      <div className="mb-3 text-3xl">{icon}</div>
      <p className="font-bold text-ink-900 group-hover:text-mint-600 transition-colors">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-700/60">{desc}</p>
    </Link>
  );
}

