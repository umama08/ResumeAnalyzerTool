import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  ScoreBadge,
  ScoreBar,
  SkillPills,
  StatusBadge,
} from "../components/ui.jsx";
import { Download, Filter, Users } from "lucide-react";

const FILTERS = [
  { id: "all", label: "All Candidates" },
  { id: "80", label: "High Match (80%+)" },
  { id: "60", label: "Medium (60%+)" },
  { id: "shortlisted", label: "Shortlisted" },
];

export default function Candidates() {
  const [params, setParams] = useSearchParams();
  const jobId = params.get("jobId") || "";
  const filter = params.get("filter") || "all";
  const [jobs, setJobs] = useState([]);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [jobList, candidates] = await Promise.all([
        api.jobs(),
        api.candidates({ jobId, filter: filter === "all" ? "" : filter }),
      ]);
      setJobs(jobList);
      setRows(candidates);
      setSelected((current) => current.filter((id) => candidates.some((row) => row.id === id)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [jobId, filter]);

  const allIds = useMemo(() => rows.map((row) => row.id), [rows]);

  function setQuery(next) {
    const merged = { jobId, filter, ...next };
    const search = new URLSearchParams();
    if (merged.jobId) search.set("jobId", merged.jobId);
    if (merged.filter && merged.filter !== "all") search.set("filter", merged.filter);
    setParams(search);
  }

  async function changeStatus(id, status) {
    try {
      await api.updateStatus(id, status);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function exportSelected() {
    try {
      if (!selected.length) {
        setError("Select at least one candidate to export.");
        return;
      }
      await api.exportCsv({ ids: selected.join(",") });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-700/40">
            Talent Ranking
          </p>
          <h1 className="font-display text-4xl font-bold text-ink-900 mt-1">Candidates</h1>
        </div>
        <button
          onClick={exportSelected}
          className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-ink-900/20 hover:bg-ink-800 hover:shadow-lg transition-all"
        >
          <Download size={16} />
          Export Shortlist ({selected.length})
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white/70 p-3 rounded-2xl border border-ink-900/[0.06] backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-700/50 pl-2">
          <Filter size={14} />
          <span>Filters:</span>
        </div>
        <select
          value={jobId}
          onChange={(e) => setQuery({ jobId: e.target.value })}
          className="rounded-full border border-ink-900/15 bg-white px-4 py-2 text-xs font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-mint-500/20 shadow-xs"
        >
          <option value="">All Jobs</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-1.5 ml-auto">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              onClick={() => setQuery({ filter: item.id })}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                filter === item.id
                  ? "bg-ink-900 text-white shadow-sm"
                  : "bg-white text-ink-700 hover:bg-sand border border-ink-900/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <LoadingBlock label="Ranking candidates against requirements..." />
      ) : !rows.length ? (
        <EmptyState
          icon={Users}
          title="No candidates found"
          body="Upload resumes for a job and run analysis to generate match scores and skill-gap reports."
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
        <div className="overflow-x-auto rounded-3xl bg-white shadow-card border border-ink-900/[0.05]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-ink-900/10 bg-sand/40 text-xs font-bold uppercase tracking-wider text-ink-700/60">
              <tr>
                <th className="px-5 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selected.length === allIds.length}
                    onChange={(e) => setSelected(e.target.checked ? allIds : [])}
                    className="rounded border-ink-900/20 text-mint-600 focus:ring-mint-500"
                  />
                </th>
                <th className="px-3 py-4 w-16 text-center">Rank</th>
                <th className="px-4 py-4">Candidate & Job</th>
                <th className="px-5 py-4 min-w-[140px]">Match Score</th>
                <th className="px-4 py-4 min-w-[130px]">Status</th>
                <th className="px-4 py-4">Matched Skills</th>
                <th className="px-4 py-4">Missing Skills</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/[0.05]">
              {rows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-sand/30 transition-colors">
                  <td className="px-5 py-5">
                    <input
                      type="checkbox"
                      checked={selected.includes(row.id)}
                      onChange={(e) =>
                        setSelected((current) =>
                          e.target.checked
                            ? [...current, row.id]
                            : current.filter((id) => id !== row.id)
                        )
                      }
                      className="rounded border-ink-900/20 text-mint-600 focus:ring-mint-500 mt-1"
                    />
                  </td>
                  <td className="px-3 py-5 text-center">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sand text-xs font-bold text-ink-700/70">
                      #{row.rank}
                    </span>
                  </td>
                  <td className="px-4 py-5">
                    <Link
                      to={`/candidates/${row.id}`}
                      className="font-semibold text-ink-900 hover:text-mint-600 transition-colors text-base"
                    >
                      {row.name || row.resumeFilename}
                    </Link>
                    <p className="text-xs text-ink-700/60 mt-0.5">{row.email || "Email not extracted"}</p>
                    <span className="inline-block mt-1 text-[11px] font-medium text-ink-700/50 bg-sand/60 px-2 py-0.5 rounded-md">
                      {row.jobTitle}
                    </span>
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex flex-col gap-1.5 min-w-[120px]">
                      <ScoreBadge score={row.matchScore} />
                      <ScoreBar score={row.matchScore} />
                      {row.matchScore === 0 ? (
                        <p className="mt-0.5 text-[11px] text-rose-700 font-medium">
                          No matching skills.
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="space-y-1.5">
                      <StatusBadge status={row.status} />
                      <select
                        value={row.status}
                        onChange={(e) => changeStatus(row.id, e.target.value)}
                        className="block w-full rounded-full border border-ink-900/10 px-2.5 py-1 text-xs font-medium text-ink-800 bg-white"
                      >
                        <option>Review</option>
                        <option>Shortlisted</option>
                        <option>Rejected</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-5 max-w-[220px]">
                    <SkillPills skills={row.matchedSkills} limit={4} />
                  </td>
                  <td className="px-4 py-5 max-w-[220px]">
                    <SkillPills skills={row.missingSkills} tone="missing" limit={4} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

