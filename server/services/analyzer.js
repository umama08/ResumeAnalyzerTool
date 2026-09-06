const { normalizeSkill, skillFoundInText, parseSkillList } = require("./skillNormalizer");
const { extractEmail, extractName, extractExperience, extractProjects } = require("./extractor");

function analyzeResume({ requiredSkills, extractedText, filename }) {
  const skills = parseSkillList(requiredSkills);
  const text = String(extractedText || "");

  if (!skills.length) {
    const error = new Error("Please add at least one required skill.");
    error.code = "NO_SKILLS";
    throw error;
  }

  const matched = [];
  const missing = [];

  for (const skill of skills) {
    if (skillFoundInText(skill, text)) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  const score = Math.round((matched.length / skills.length) * 1000) / 10;
  const displayScore = Math.round(score);

  return {
    name: extractName(text, filename),
    email: extractEmail(text),
    experience: extractExperience(text),
    projects: extractProjects(text),
    matchScore: displayScore,
    matchScoreExact: score,
    matchedSkills: matched,
    missingSkills: missing,
    requiredSkills: skills.map(normalizeSkill),
  };
}

module.exports = { analyzeResume };
