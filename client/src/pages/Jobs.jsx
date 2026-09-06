import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { EmptyState, ErrorBanner, LoadingBlock, ScoreBar } from "../components/ui.jsx";
import { Briefcase, Plus, Trash2, Upload, Users, Eye } from "lucide-react";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  async function load() {
    setError("");
    try {
      setJobs(await api.jobs());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    if (!confirm("Delete this job and all its candidate evaluations?")) return;
    setDeleting(id);
    try {
      await api.deleteJob(id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return <LoadingBlock label="Loading active job roles..." />;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-700/40">
            Role Requirements
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold text-ink-900">Job Positions</h1>
        </div>
        <Link
          to="/jobs/new"
          className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-ink-900/20 hover:bg-ink-800 transition-all"
        >
          <Plus size={16} strokeWidth={2.5} /> Create Job
        </Link>
      </div>

      <ErrorBanner message={error} />

      {!jobs.length ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs created yet"
          body="Add a role position with required skills, then upload candidate resumes for skill-based ranking."
          action={
            <Link
              to="/jobs/new"
              className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm"
            >
              <Plus size={16} />
              Create First Job
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-card border border-ink-900/[0.05]">
          {/* Desktop Table Header */}
          <div className="hidden grid-cols-[1.6fr_0.5fr_0.65fr_0.8fr_auto] gap-4 border-b border-ink-900/[0.07] bg-sand/40 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-ink-700/60 md:grid">
            <span>Job Title & Skills</span>
            <span>Candidates</span>
            <span>Created</span>
            <span>Avg Match Score</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-ink-900/[0.05]">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="grid gap-4 px-6 py-5 hover:bg-sand/30 transition-colors md:grid-cols-[1.6fr_0.5fr_0.65fr_0.8fr_auto] md:items-center"
              >
                {/* Job Info */}
                <div>
                  <h3 className="font-bold text-ink-900 text-base">{job.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {job.location && (
                      <span className="text-xs font-medium text-ink-700/60 bg-sand px-2 py-0.5 rounded-md">
                        {job.location}
                      </span>
                    )}
                    {job.requiredSkills.slice(0, 5).map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex rounded-full bg-mint-50 px-2 py-0.5 text-[11px] font-semibold text-mint-600 ring-1 ring-mint-400/20"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 5 && (
                      <span className="text-[11px] font-semibold text-ink-700/50">
                        +{job.requiredSkills.length - 5} more
                      </span>
                    )}
                  </div>
                  {/* Mobile Stats */}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-700/60 md:hidden">
                    <span className="font-semibold">{job.candidateCount} candidates</span>
                    <span>·</span>
                    <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    {job.averageMatch != null && (
                      <>
                        <span>·</span>
                        <span className="font-bold text-mint-600">{job.averageMatch}% avg match</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Candidates Count */}
                <div className="hidden md:block">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-xs font-bold text-ink-900">
                    <Users size={13} className="text-ink-700/50" />
                    {job.candidateCount}
                  </span>
                </div>

                {/* Date */}
                <p className="hidden text-xs font-medium text-ink-700/60 md:block">
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>

                {/* Avg Match Score & ScoreBar */}
                <div className="hidden md:block">
                  {job.averageMatch == null ? (
                    <span className="text-xs text-ink-700/40 italic">No candidates yet</span>
                  ) : (
                    <div className="space-y-1 min-w-[100px]">
                      <span className="text-xs font-bold text-ink-900">{job.averageMatch}% match</span>
                      <ScoreBar score={job.averageMatch} />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 md:justify-end">
                  <Link
                    to={`/upload?jobId=${job.id}`}
                    className="inline-flex items-center gap-1 rounded-full bg-mint-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-mint-600 transition-colors"
                  >
                    <Upload size={13} />
                    Analyze
                  </Link>
                  <Link
                    to={`/candidates?jobId=${job.id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-ink-900/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-ink-900 hover:bg-sand transition-colors"
                  >
                    <Eye size={13} />
                    View
                  </Link>
                  <button
                    onClick={() => remove(job.id)}
                    disabled={deleting === job.id}
                    className="rounded-full p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                    title="Delete job"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

