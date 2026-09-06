const assert = require("assert");
const { analyzeResume } = require("../services/analyzer");
const { normalizeSkill } = require("../services/skillNormalizer");

assert.equal(normalizeSkill("JS"), "JavaScript");
assert.equal(normalizeSkill("nodejs"), "Node.js");
assert.equal(normalizeSkill("ReactJS"), "React");

const required = ["React", "JavaScript", "HTML", "CSS", "Git", "Node.js"];

const ahmed = analyzeResume({
  requiredSkills: required,
  extractedText: "Ahmed Khan\nahmed.khan@email.com\nSkills: React, JS, HTML, CSS, Git, Node\nExperience: 4 years\nProjects:\nPayment Dashboard",
  filename: "ahmed.pdf",
});
assert.equal(ahmed.matchScore, 100);
assert.equal(ahmed.email, "ahmed.khan@email.com");
assert.equal(ahmed.missingSkills.length, 0);

const sara = analyzeResume({
  requiredSkills: required,
  extractedText: "Sara Ali\nReact JavaScript CSS Git",
  filename: "sara.pdf",
});
assert.equal(sara.matchScore, 67);
assert.deepEqual(sara.missingSkills, ["HTML", "Node.js"]);

const ali = analyzeResume({
  requiredSkills: required,
  extractedText: "Ali Raza\nPython Django",
  filename: "ali.pdf",
});
assert.equal(ali.matchScore, 0);
assert.equal(ali.matchedSkills.length, 0);

console.log("Analyzer self-check passed.");
