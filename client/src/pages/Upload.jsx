import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { ErrorBanner, LoadingBlock } from "../components/ui.jsx";
import {
  FileText,
  FileUp,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";

export default function Upload() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState(params.get("jobId") || "");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    api
      .jobs()
      .then((list) => {
        setJobs(list);
        if (!jobId && list[0]) setJobId(list[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === jobId),
    [jobs, jobId]
  );

  function formatFileSize(bytes) {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function onFiles(list) {
    const incoming = Array.from(list || []);
    const accepted = [];
    const rejected = [];
    incoming.forEach((file) => {
      const ext = file.name.toLowerCase();
      if (ext.endsWith(".pdf") || ext.endsWith(".docx")) accepted.push(file);
      else rejected.push(file.name);
    });
    if (rejected.length) {
      setError(
        `Unsupported file type. Please upload PDF or DOCX files only. Rejected: ${rejected.join(
          ", "
        )}`
      );
    } else {
      setError("");
    }
    setFiles((current) => {
      const names = new Set(current.map((file) => file.name));
      return [...current, ...accepted.filter((file) => !names.has(file.name))];
    });
  }

  async function uploadAndAnalyze() {
    if (!jobId) return setError("Please select a target job position for analysis.");
    setError("");
    setInfo("");

    try {
      if (files.length) {
        setBusy("Ingesting and parsing resume files...");
        const upload = await api.uploadResumes(jobId, files);
        if (upload.errors?.length) {
          setError(upload.errors.map((item) => `${item.filename}: ${item.error}`).join(" "));
        }
        if (!upload.uploaded?.length && upload.errors?.length) {
          setBusy("");
          return;
        }
      }

      setBusy("Running skill normalizer and ranking candidate profiles...");
      await api.analyze(jobId);
      setFiles([]);
      navigate(`/candidates?jobId=${jobId}`);
    } catch (err) {
      setError(err.message || "Failed to process resumes.");
    } finally {
      setBusy("");
    }
  }

  if (loading) return <LoadingBlock label="Loading job positions..." />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-700/40">
          Document Ingestion
        </p>
        <h1 className="font-display text-4xl font-bold text-ink-900 mt-1">Upload Resumes</h1>
      </div>

      {!jobs.length ? (
        <div className="rounded-3xl bg-white p-8 shadow-card border border-ink-900/[0.04] text-center">
          <p className="text-sm text-ink-700/70">
            Create a target job position before uploading candidate resumes.
          </p>
          <Link
            to="/jobs/new"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm"
          >
            Create Job Requirement
          </Link>
        </div>
      ) : (
        <div className="space-y-6 rounded-3xl bg-white p-6 md:p-8 shadow-card border border-ink-900/[0.04]">
          <ErrorBanner message={error} />
          {info ? (
            <div className="rounded-2xl bg-mint-50 px-4 py-3 text-sm text-mint-600 font-medium">
              {info}
            </div>
          ) : null}

          {/* Target Job Selection */}
          <label className="block space-y-2 text-sm">
            <span className="font-semibold text-ink-900">Select Target Role</span>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="w-full rounded-2xl border border-ink-900/15 bg-white px-4 py-3 text-sm font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-mint-500/20 shadow-xs"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.requiredSkills.length} required skills)
                </option>
              ))}
            </select>
          </label>

          {selectedJob ? (
            <div className="rounded-2xl bg-sand/60 p-4 border border-ink-900/[0.04]">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-700/50 mb-1.5">
                Evaluation Criteria
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedJob.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-ink-800 shadow-2xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Premium Animated Drag-and-Drop Zone */}
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              onFiles(e.dataTransfer.files);
            }}
            className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all ${
              isDragging
                ? "drop-zone-active border-mint-500 bg-mint-50/50"
                : "border-ink-900/15 bg-sand/40 hover:border-mint-500/60 hover:bg-sand/70"
            }`}
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md shadow-ink-900/5 group-hover:scale-105 transition-transform">
              <UploadCloud
                size={32}
                className={`text-mint-600 transition-transform ${
                  isDragging ? "animate-bounce" : "animate-float"
                }`}
              />
            </div>
            <p className="font-display text-2xl font-bold text-ink-900">
              Drag & drop candidate resumes
            </p>
            <p className="mt-2 text-sm text-ink-700/60 max-w-sm">
              Supports <span className="font-semibold text-ink-900">PDF</span> and{" "}
              <span className="font-semibold text-ink-900">DOCX</span> files. Select multiple files to parse simultaneously.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white shadow-sm group-hover:bg-ink-800 transition-colors">
              <FileUp size={14} />
              Browse Files
            </span>
            <input
              type="file"
              multiple
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
          </label>

          {/* Attached Files List */}
          {files.length ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-ink-700/60 uppercase tracking-wider">
                <span>Selected Documents ({files.length})</span>
                <button
                  onClick={() => setFiles([])}
                  className="text-rose-600 hover:text-rose-700 font-medium"
                >
                  Clear all
                </button>
              </div>
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {files.map((file) => (
                  <li
                    key={file.name}
                    className="flex items-center justify-between rounded-2xl bg-sand/70 px-4 py-3 border border-ink-900/[0.04] transition-all hover:bg-sand"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-mint-600 shadow-2xs">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-ink-700/50">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      className="rounded-lg p-1.5 text-ink-700/40 hover:bg-rose-50 hover:text-rose-600 transition-colors ml-2"
                      onClick={() =>
                        setFiles(files.filter((item) => item.name !== file.name))
                      }
                      title="Remove file"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Actions & Progress Feedback */}
          <div className="pt-3 border-t border-ink-900/[0.06] flex flex-wrap items-center justify-between gap-4">
            <button
              disabled={Boolean(busy)}
              onClick={uploadAndAnalyze}
              className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-ink-900/20 hover:bg-ink-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Sparkles size={16} />
              {busy || "Upload & Run Match Analysis"}
            </button>

            {busy ? (
              <div className="flex items-center gap-3 text-sm font-medium text-mint-600 bg-mint-50 px-4 py-2 rounded-full border border-mint-400/30">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-mint-600/30 border-t-mint-600" />
                <span>{busy}</span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

