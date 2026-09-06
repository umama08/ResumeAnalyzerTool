const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const YEAR_RE = /(\d+)\+?\s*(?:years?|yrs?)/i;

function cleanText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractFromPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const result = await pdfParse(buffer);
  return cleanText(result.text);
}

async function extractFromDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return cleanText(result.value);
}

async function extractResumeText(filePath, originalName) {
  const ext = path.extname(originalName || filePath).toLowerCase();
  try {
    if (ext === ".pdf") {
      return await extractFromPdf(filePath);
    }
    if (ext === ".docx") {
      return await extractFromDocx(filePath);
    }
    const error = new Error("Unsupported file type. Please upload PDF or DOCX.");
    error.code = "UNSUPPORTED_TYPE";
    throw error;
  } catch (err) {
    if (err.code === "UNSUPPORTED_TYPE") throw err;
    const error = new Error(
      "Unable to read this resume. Please upload a text-based PDF or DOCX file."
    );
    error.code = "EXTRACT_FAILED";
    throw error;
  }
}

function extractEmail(text) {
  const match = String(text || "").match(EMAIL_RE);
  return match ? match[0] : null;
}

function extractName(text, fallback) {
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines.slice(0, 8)) {
    if (EMAIL_RE.test(line)) continue;
    if (/^(skills?|experience|education|projects?|summary|contact|phone|linkedin)\b/i.test(line)) {
      continue;
    }
    if (line.length < 3 || line.length > 60) continue;
    if (/\d{3,}/.test(line)) continue;
    return line.replace(/^name\s*[:\-]\s*/i, "");
  }

  if (fallback) {
    return path
      .basename(fallback, path.extname(fallback))
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return "Unknown candidate";
}

function extractExperience(text) {
  const block = section(text, ["experience", "work experience", "professional experience"]);
  const source = block || text;
  const match = String(source || "").match(YEAR_RE);
  return match ? `${match[1]} years` : null;
}

function extractProjects(text) {
  const block = section(text, ["projects", "selected projects", "key projects"]);
  if (!block) return [];
  return block
    .split("\n")
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((line) => line && !/^(skills?|experience|education)\b/i.test(line))
    .slice(0, 8);
}

function section(text, headings) {
  const raw = String(text || "");
  const heading = headings.map(escape).join("|");
  const re = new RegExp(`(?:^|\\n)\\s*(?:${heading})\\s*:?\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:skills?|experience|education|projects?|summary|certifications?)\\s*:?\\s*\\n|$)`, "i");
  const match = raw.match(re);
  return match ? match[1].trim() : "";
}

function escape(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  extractResumeText,
  extractEmail,
  extractName,
  extractExperience,
  extractProjects,
  cleanText,
};
