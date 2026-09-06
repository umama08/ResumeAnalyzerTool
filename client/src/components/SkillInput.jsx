import { useState } from "react";
import { X } from "lucide-react";

export default function SkillInput({ value, onChange }) {
  const [draft, setDraft] = useState("");
  const skills = value || [];

  function addSkill(raw) {
    const next = raw
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (!next.length) return;
    const merged = [...skills];
    next.forEach((skill) => {
      if (!merged.some((item) => item.toLowerCase() === skill.toLowerCase())) {
        merged.push(skill);
      }
    });
    onChange(merged);
    setDraft("");
  }

  return (
    <div>
      <div className="flex min-h-[48px] flex-wrap gap-2 rounded-2xl border border-ink-900/10 bg-white px-3 py-2">
        {skills.map((skill) => (
          <button
            type="button"
            key={skill}
            className="inline-flex items-center gap-1 rounded-full bg-ink-900 px-2.5 py-1 text-xs text-white"
            onClick={() => onChange(skills.filter((item) => item !== skill))}
          >
            {skill}
            <X size={12} />
          </button>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (["Enter", ","].includes(e.key)) {
              e.preventDefault();
              addSkill(draft);
            }
            if (e.key === "Backspace" && !draft && skills.length) {
              onChange(skills.slice(0, -1));
            }
          }}
          onBlur={() => addSkill(draft)}
          placeholder={skills.length ? "Add another skill" : "React, JavaScript, HTML..."}
          className="min-w-[160px] flex-1 bg-transparent py-1 text-sm outline-none"
        />
      </div>
      <p className="mt-1 text-xs text-ink-700/60">Press Enter or comma to add. Variations like JS and NodeJS are normalized during analysis.</p>
    </div>
  );
}
