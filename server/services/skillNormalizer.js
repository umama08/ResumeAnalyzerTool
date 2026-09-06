const SKILL_ALIASES = [
  { canonical: "JavaScript", aliases: ["javascript", "java script", "js", "ecmascript", "es6", "es2015"] },
  { canonical: "TypeScript", aliases: ["typescript", "ts"] },
  { canonical: "Node.js", aliases: ["node.js", "nodejs", "node js", "node"] },
  { canonical: "React", aliases: ["react", "reactjs", "react.js", "react js"] },
  { canonical: "Next.js", aliases: ["next.js", "nextjs", "next js"] },
  { canonical: "HTML", aliases: ["html", "html5"] },
  { canonical: "CSS", aliases: ["css", "css3"] },
  { canonical: "Git", aliases: ["git"] },
  { canonical: "Redux", aliases: ["redux"] },
  { canonical: "Express", aliases: ["express", "express.js", "expressjs"] },
  { canonical: "Python", aliases: ["python", "py"] },
  { canonical: "Django", aliases: ["django"] },
  { canonical: "Flask", aliases: ["flask"] },
  { canonical: "Java", aliases: ["java"] },
  { canonical: "Spring", aliases: ["spring", "spring boot", "springboot"] },
  { canonical: "SQL", aliases: ["sql"] },
  { canonical: "PostgreSQL", aliases: ["postgresql", "postgres", "psql"] },
  { canonical: "MongoDB", aliases: ["mongodb", "mongo"] },
  { canonical: "MySQL", aliases: ["mysql"] },
  { canonical: "Redis", aliases: ["redis"] },
  { canonical: "Docker", aliases: ["docker"] },
  { canonical: "Kubernetes", aliases: ["kubernetes", "k8s"] },
  { canonical: "AWS", aliases: ["aws", "amazon web services"] },
  { canonical: "REST API", aliases: ["rest api", "restful", "rest apis", "rest"] },
  { canonical: "GraphQL", aliases: ["graphql"] },
  { canonical: "Tailwind CSS", aliases: ["tailwind", "tailwindcss", "tailwind css"] },
  { canonical: "Vue.js", aliases: ["vue", "vue.js", "vuejs"] },
  { canonical: "Angular", aliases: ["angular"] },
  { canonical: "C#", aliases: ["c#", "csharp", "c sharp"] },
  { canonical: "C++", aliases: ["c++", "cpp"] },
  { canonical: "Go", aliases: ["golang", "go lang"] },
  { canonical: "Kotlin", aliases: ["kotlin"] },
  { canonical: "Swift", aliases: ["swift"] },
  { canonical: "PHP", aliases: ["php"] },
  { canonical: "Laravel", aliases: ["laravel"] },
  { canonical: "Ruby", aliases: ["ruby"] },
  { canonical: "Ruby on Rails", aliases: ["ruby on rails", "rails"] },
  { canonical: "Figma", aliases: ["figma"] },
  { canonical: "Jira", aliases: ["jira"] },
  { canonical: "CI/CD", aliases: ["ci/cd", "cicd", "continuous integration"] },
  { canonical: "Kafka", aliases: ["kafka"] },
  { canonical: "Payment APIs", aliases: ["payment api", "payment apis", "stripe", "paypal"] },
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compact(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\s._-]+/g, "");
}

function findGroup(skill) {
  const raw = String(skill || "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const squeezed = compact(raw);

  return (
    SKILL_ALIASES.find((group) => {
      if (group.canonical.toLowerCase() === lower) return true;
      return group.aliases.some((alias) => alias === lower || compact(alias) === squeezed);
    }) || null
  );
}

function normalizeSkill(skill) {
  const group = findGroup(skill);
  if (group) return group.canonical;
  const trimmed = String(skill || "").trim();
  if (!trimmed) return "";
  return trimmed.replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function aliasesFor(skill) {
  const group = findGroup(skill);
  const canonical = normalizeSkill(skill);
  const aliases = new Set([canonical.toLowerCase(), String(skill).trim().toLowerCase()]);
  if (group) {
    group.aliases.forEach((alias) => aliases.add(alias));
  }
  return [...aliases].filter(Boolean);
}

function skillPattern(alias) {
  const escaped = escapeRegex(alias.trim());
  if (/^[a-z0-9]+$/i.test(alias) && alias.length <= 3) {
    return new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "i");
  }
  return new RegExp(`(^|[^A-Za-z0-9+.#])${escaped}([^A-Za-z0-9+.#]|$)`, "i");
}

function skillFoundInText(skill, text) {
  const haystack = String(text || "");
  return aliasesFor(skill).some((alias) => skillPattern(alias).test(haystack));
}

function parseSkillList(input) {
  if (Array.isArray(input)) {
    return [...new Set(input.map(normalizeSkill).filter(Boolean))];
  }
  return [
    ...new Set(
      String(input || "")
        .split(/[\n,;|]+/)
        .map((part) => normalizeSkill(part))
        .filter(Boolean)
    ),
  ];
}

module.exports = {
  SKILL_ALIASES,
  normalizeSkill,
  aliasesFor,
  skillFoundInText,
  parseSkillList,
};
