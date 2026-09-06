const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require("docx");

const outDir = path.join(__dirname, "..", "samples");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const resumes = [
  {
    file: "ahmed-khan",
    name: "Ahmed Khan",
    email: "ahmed.khan@email.com",
    title: "Frontend Developer",
    skills: ["React", "JavaScript", "HTML", "CSS", "Git", "Node.js"],
    experience: "4 years",
    projects: ["E-commerce Website", "Payment Dashboard"],
    summary: "Frontend developer with experience building modern web applications and payment interfaces.",
  },
  {
    file: "sara-ali",
    name: "Sara Ali",
    email: "sara.ali@email.com",
    title: "UI Engineer",
    skills: ["React", "JavaScript", "CSS", "Git"],
    experience: "3 years",
    projects: ["Wallet onboarding flow", "Marketing site redesign"],
    summary: "UI engineer focused on React interfaces for consumer fintech products.",
  },
  {
    file: "ali-raza",
    name: "Ali Raza",
    email: "ali.raza@email.com",
    title: "Backend Developer",
    skills: ["Python", "Django"],
    experience: "5 years",
    projects: ["Lending API", "Risk scoring service"],
    summary: "Backend developer specializing in Python and Django services.",
  },
  {
    file: "hina-ahmed",
    name: "Hina Ahmed",
    email: "hina.ahmed@email.com",
    title: "Full Stack Developer",
    skills: ["React", "JavaScript", "Node.js"],
    experience: "2 years",
    projects: ["Checkout widget", "Internal admin panel"],
    summary: "Full stack developer building React clients and Node.js APIs.",
  },
  {
    file: "usman-khan",
    name: "Usman Khan",
    email: "usman.khan@email.com",
    title: "Junior Web Designer",
    skills: ["HTML", "CSS"],
    experience: "1 year",
    projects: ["Landing pages", "Email templates"],
    summary: "Junior designer with HTML and CSS experience.",
  },
];

function linesFor(resume) {
  return [
    resume.name,
    resume.title,
    resume.email,
    "",
    "Summary:",
    resume.summary,
    "",
    "Skills:",
    resume.skills.join(", "),
    "",
    "Experience:",
    `${resume.experience} of professional experience.`,
    "",
    "Projects:",
    ...resume.projects.map((project) => `- ${project}`),
  ];
}

function writePdf(resume) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const filePath = path.join(outDir, `${resume.file}.pdf`);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    linesFor(resume).forEach((line, index) => {
      if (index === 0) doc.fontSize(20).text(line);
      else doc.fontSize(12).text(line || " ");
    });
    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

async function writeDocx(resume) {
  const children = linesFor(resume).map((line, index) =>
    new Paragraph({
      heading: index === 0 ? HeadingLevel.HEADING_1 : undefined,
      children: [new TextRun(line || " ")],
    })
  );

  const doc = new Document({
    sections: [{ children }],
  });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(outDir, `${resume.file}.docx`), buffer);
}

async function run() {
  for (const resume of resumes) {
    await writePdf(resume);
    await writeDocx(resume);
  }
  console.log(`Wrote ${resumes.length} PDF and DOCX samples to ${outDir}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
