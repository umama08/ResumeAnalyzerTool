import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import SkillInput from "../components/SkillInput.jsx";
import { ErrorBanner } from "../components/ui.jsx";
import { api } from "../services/api.js";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function JobForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    requiredSkills: [],
    location: "",
    experience: "",
    employmentType: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const job = await api.createJob(form);
      navigate(`/upload?jobId=${job.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-sm font-medium text-mint-600 hover:text-mint-700 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to job listings
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-700/40">
          Role Specification
        </p>
        <h1 className="font-display text-4xl font-bold text-ink-900 mt-1">Create Job Requirement</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 rounded-3xl bg-white p-6 md:p-8 shadow-card border border-ink-900/[0.04]">
        <ErrorBanner message={error} />

        <Field label="Job Title" required>
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
            className="w-full rounded-2xl border border-ink-900/15 bg-white px-4 py-3 text-sm font-medium text-ink-900 outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 transition-all"
          />
        </Field>

        <Field label="Job Description & Responsibilities" required>
          <textarea
            required
            rows={5}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe key responsibilities and technologies used..."
            className="w-full rounded-2xl border border-ink-900/15 bg-white px-4 py-3 text-sm leading-relaxed text-ink-900 outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 transition-all"
          />
        </Field>

        <Field label="Required Skills (Type skill and press Enter or comma)" required>
          <SkillInput value={form.requiredSkills} onChange={(skills) => update("requiredSkills", skills)} />
        </Field>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Location">
            <input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="e.g. Remote / Karachi"
              className="w-full rounded-2xl border border-ink-900/15 bg-white px-4 py-3 text-sm font-medium text-ink-900 outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 transition-all"
            />
          </Field>

          <Field label="Minimum Experience">
            <input
              value={form.experience}
              onChange={(e) => update("experience", e.target.value)}
              placeholder="e.g. 3 years"
              className="w-full rounded-2xl border border-ink-900/15 bg-white px-4 py-3 text-sm font-medium text-ink-900 outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 transition-all"
            />
          </Field>

          <Field label="Employment Type">
            <select
              value={form.employmentType}
              onChange={(e) => update("employmentType", e.target.value)}
              className="w-full rounded-2xl border border-ink-900/15 bg-white px-4 py-3 text-sm font-medium text-ink-900 outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 transition-all"
            >
              <option value="">Select type</option>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Internship</option>
            </select>
          </Field>
        </div>

        <div className="pt-2">
          <button
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-ink-900/20 hover:bg-ink-800 disabled:opacity-50 transition-all"
          >
            <Sparkles size={16} />
            {saving ? "Saving Job..." : "Save Job Requirement"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-ink-900">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

