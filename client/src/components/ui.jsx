import { useEffect, useRef, useState } from "react";

/* ─── StatusBadge ─── */
export function StatusBadge({ status }) {
  const styles = {
    Review: "bg-amber-100/90 text-amber-800 ring-1 ring-amber-200/60",
    Shortlisted: "bg-mint-100 text-mint-600 ring-1 ring-mint-400/30",
    Rejected: "bg-rose-100/90 text-rose-700 ring-1 ring-rose-200/60",
  };
  const dots = {
    Review: "bg-amber-500",
    Shortlisted: "bg-mint-500",
    Rejected: "bg-rose-500",
  };
  const label = status || "Review";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
        styles[label] || "bg-slate-100 text-slate-700"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[label] || "bg-slate-400"}`} />
      {label}
    </span>
  );
}

/* ─── ScoreBadge ─── */
export function ScoreBadge({ score }) {
  if (score == null) return <span className="text-sm text-ink-700/50">Not analyzed</span>;
  const tone =
    score >= 80 ? "text-mint-600" : score >= 60 ? "text-amber-700" : "text-rose-700";
  return <span className={`text-lg font-bold tabular-nums ${tone}`}>{score}%</span>;
}

/* ─── ScoreBar ─── */
export function ScoreBar({ score, className = "" }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score ?? 0), 80);
    return () => clearTimeout(t);
  }, [score]);

  if (score == null) return null;

  const barColorClass =
    score >= 80 ? "score-bar-high" : score >= 60 ? "score-bar-medium" : "score-bar-low";

  return (
    <div className={`score-bar-track w-full h-2 ${className}`}>
      <div
        className={`score-bar ${barColorClass} h-full`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

/* ─── ScoreRing ─── */
export function ScoreRing({ score, size = 130, showLabel = true }) {
  const r = (size - 18) / 2;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(circ - ((score ?? 0) / 100) * circ);
    }, 100);
    return () => clearTimeout(t);
  }, [score, circ]);

  const color =
    score == null
      ? "#94a3b8"
      : score >= 80
      ? "#0f766e"
      : score >= 60
      ? "#d97706"
      : "#be123c";

  const glowColor =
    score == null
      ? "rgba(148, 163, 184, 0.15)"
      : score >= 80
      ? "rgba(15, 118, 110, 0.25)"
      : score >= 60
      ? "rgba(217, 119, 6, 0.25)"
      : "rgba(190, 18, 60, 0.25)";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="drop-shadow-sm">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(11,31,51,0.07)"
            strokeWidth={10}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="score-ring-circle"
            style={{ filter: `drop-shadow(0 4px 8px ${glowColor})` }}
          />
          <text
            x="50%"
            y="47%"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.24}
            fontWeight="700"
            fill="#0b1f33"
            fontFamily="IBM Plex Sans, sans-serif"
          >
            {score ?? "—"}
            {score != null ? "%" : ""}
          </text>
          {showLabel && (
            <text
              x="50%"
              y="68%"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={size * 0.09}
              fontWeight="600"
              fill="#1b425c"
              letterSpacing="0.06em"
              fontFamily="IBM Plex Sans, sans-serif"
              className="uppercase opacity-60"
            >
              Match Score
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}

/* ─── EmptyState ─── */
export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="rounded-3xl border border-dashed border-ink-900/15 bg-white/80 backdrop-blur-sm p-10 text-center shadow-card transition-all">
      {Icon ? (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sand/90 text-ink-700/50 shadow-inner">
          <Icon size={26} strokeWidth={1.75} />
        </div>
      ) : null}
      <h3 className="font-display text-2xl font-semibold text-ink-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-700/65">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/* ─── ErrorBanner ─── */
export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm">
      <span className="mt-0.5 flex-shrink-0 text-rose-500">⚠</span>
      <span>{message}</span>
    </div>
  );
}

/* ─── SuccessBanner ─── */
export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-mint-400/30 bg-mint-50 px-4 py-3 text-sm text-mint-600 shadow-sm">
      <span className="mt-0.5 flex-shrink-0">✓</span>
      <span>{message}</span>
    </div>
  );
}

/* ─── LoadingBlock ─── */
export function LoadingBlock({ label = "Loading..." }) {
  return (
    <div className="space-y-5 rounded-3xl bg-white p-10 shadow-card">
      <div className="flex items-center justify-center gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-ink-900/10 border-t-mint-500" />
        <p className="text-sm font-medium text-ink-700/70">{label}</p>
      </div>
      <div className="space-y-3 px-4 max-w-lg mx-auto">
        <div className="animate-pulse h-3.5 rounded-full bg-ink-900/[0.08] w-full" />
        <div className="animate-pulse h-3.5 rounded-full bg-ink-900/[0.06] w-5/6 mx-auto" />
        <div className="animate-pulse h-3.5 rounded-full bg-ink-900/[0.04] w-2/3 mx-auto" />
      </div>
    </div>
  );
}

/* ─── SkillPills ─── */
export function SkillPills({ skills, tone = "matched", limit }) {
  if (!skills?.length) {
    return (
      <p className="text-xs italic text-ink-700/50">
        {tone === "missing" ? "No missing required skills." : "None detected."}
      </p>
    );
  }

  const displayed = limit ? skills.slice(0, limit) : skills;
  const remaining = limit && skills.length > limit ? skills.length - limit : 0;
  const isMatched = tone === "matched";

  const badgeCls = isMatched
    ? "bg-mint-50 text-mint-600 ring-1 ring-mint-400/30 hover:bg-mint-100/80"
    : "bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100/80";

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayed.map((skill) => (
        <span
          key={skill}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${badgeCls}`}
        >
          <span className={`text-[10px] ${isMatched ? "text-mint-500" : "text-rose-500"}`}>
            {isMatched ? "✓" : "✕"}
          </span>
          {skill}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
          +{remaining} more
        </span>
      )}
    </div>
  );
}

/* ─── AnimatedCount ─── */
export function AnimatedCount({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const target = Number(value) || 0;
    const duration = 750;
    const start = performance.now();
    const from = 0;

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return (
    <span className="stat-value tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

