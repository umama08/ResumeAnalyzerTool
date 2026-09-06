import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import {
  ErrorBanner,
  LoadingBlock,
  ScoreRing,
  SkillPills,
  StatusBadge,
} from "../components/ui.jsx";
import { ArrowLeft, Briefcase, Download, Mail, UserCheck } from "lucide-react";

export default function CandidateDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setData(await api.candidate(id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function changeStatus(status) {
    try {
      await api.updateStatus(id, status);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <LoadingBlock label="Loading candidate evaluation..." />;
  if (!data) return <ErrorBanner message={error || "Candidate not found."} />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to={`/candidates?jobId=${data.jobId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-mint-600 hover:text-mint-700 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to candidate rankings
      </Link>

      <ErrorBanner message={error} />

      {/* Main Candidate Card with Score Ring */}
      <section className="rounded-3xl bg-white p-6 md:p-8 shadow-card border border-ink-900/[0.05]">
        <div className="flex flex-col-reverse md:flex-row items-start justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-700/50">
                  Candidate Profile
                </span>
                <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-bold text-ink-700/70">
                  Rank #{data.rank}
                </span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-900 mt-1">
                {data.name || data.resumeFilename}
              </h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-ink-700/70">
                <span className="flex items-center gap-1.5 font-medium">
                  <Mail size={14} className="text-ink-700/40" />
                  {data.email || "Email not extracted"}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Briefcase size={14} className="text-ink-700/40" />
                  {data.job?.title || "Role Analysis"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <StatusBadge status={data.status} />
              <select
                value={data.status}
                onChange={(e) => changeStatus(e.target.value)}
                className="rounded-full border border-ink-900/15 bg-white px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-mint-500/20"
              >
                <option>Review</option>
                <option>Shortlisted</option>
                <option>Rejected</option>
              </select>

              {data.status !== "Shortlisted" ? (
                <button
                  onClick={() => changeStatus("Shortlisted")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-ink-800"
                >
                  <UserCheck size={14} />
                  Shortlist Candidate
                </button>
              ) : (
                <button
                  onClick={() =>
                    api.exportCsv({ ids: data.id }).catch((err) => setError(err.message))
                  }
                  className="inline-flex items-center gap-1.5 rounded-full bg-mint-100 px-4 py-2 text-xs font-semibold text-mint-600 hover:bg-mint-200/70"
                >
                  <Download size={14} />
                  Export Candidate
                </button>
              )}
            </div>
          </div>

          {/* Radial Animated Score Ring */}
          <div className="flex flex-col items-center justify-center self-center md:self-start bg-sand/40 p-4 rounded-2xl border border-ink-900/[0.04]">
            <ScoreRing score={data.matchScore} size={140} showLabel={true} />
            <p className="mt-2 text-center text-[11px] max-w-[160px] text-ink-700/60 leading-tight">
              Skill compatibility breakdown for required role criteria
            </p>
          </div>
        </div>
      </section>

      {/* Matched vs Missing Skills */}
      <div className="grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl bg-white p-6 shadow-card border border-ink-900/[0.04]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-ink-900">Matched Skills</h2>
            <span className="rounded-full bg-mint-50 px-2.5 py-0.5 text-xs font-semibold text-mint-600">
              {data.matchedSkills?.length || 0} skills
            </span>
          </div>
          <SkillPills skills={data.matchedSkills} tone="matched" />
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-card border border-ink-900/[0.04]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-ink-900">Missing Skills</h2>
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600">
              {data.missingSkills?.length || 0} gaps
            </span>
          </div>
          <SkillPills skills={data.missingSkills} tone="missing" />
        </article>
      </div>

      {/* Experience & Projects */}
      <div className="grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl bg-white p-6 shadow-card border border-ink-900/[0.04]">
          <h2 className="font-display text-xl font-bold text-ink-900">Experience Summary</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-700/80">
            {data.experience || "No explicit experience section detected on resume."}
          </p>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-card border border-ink-900/[0.04]">
          <h2 className="font-display text-xl font-bold text-ink-900">Projects & Key Work</h2>
          {data.projects?.length ? (
            <ul className="mt-3 space-y-2 text-sm text-ink-700/80">
              {data.projects.map((project) => (
                <li key={project} className="flex items-start gap-2">
                  <span className="text-mint-500 mt-1">•</span>
                  <span>{project}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-700/60 italic">
              No specific projects section detected.
            </p>
          )}
        </article>
      </div>
    </div>
  );
}

