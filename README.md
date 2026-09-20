# Resume Analyzer Tool

A full-stack resume screening MVP for recruiters and hiring teams in fintech and digital-payments environments.

The app helps a recruiter create a job, upload PDF/DOCX resumes, extract text, compare candidate skills with required skills, calculate a match score, identify missing skills, rank candidates, shortlist them, and export a CSV.

This is a **recruitment assistance tool**. Match scores describe skill overlap with a job's required skills. They are not hiring predictions or automated hiring decisions.

---

## Problem

Recruiters often receive large volumes of resumes for a single role and spend too much time manually checking whether each candidate lists the required technical skills.

## Solution

Resume Analyzer turns a batch of resumes into a ranked, skill-based shortlist:

1. Create a job and required skills.
2. Upload multiple resumes.
3. Extract readable text from PDF and DOCX files.
4. Normalize skill variants (`JS` → JavaScript, `NodeJS` → Node.js).
5. Score and rank candidates.
6. Review matched and missing skills.
7. Shortlist and export CSV.

---

## Features

- Job creation with title, description, required skills, location, experience, and employment type
- Drag-and-drop multi-file resume upload (PDF / DOCX)
- Resume text extraction with clear error messages
- Deterministic skill matching and normalization
- Match score: matched required skills ÷ total required skills × 100
- Candidate ranking, filters (All, 80%+, 60%+, Shortlisted)
- Missing-skill gap report
- Candidate status: Review, Shortlisted, Rejected
- CSV export of selected candidates
- Dashboard metrics and recent candidates
- Responsive SaaS-style dashboard UI
- Loading, empty, and error states

---


## Technology stack

| Layer | Tools |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express |
| Data | JSON file store (`server/data/db.json`) |
| Files | Local `server/uploads/` |
| Extraction | `pdf-parse`, `mammoth` |
| Tooling | Git, npm, Postman or curl |

The PRD allows MongoDB, PostgreSQL, or Supabase. This MVP uses a portable JSON database so the project runs without installing a separate database server. The data access layer in `server/db.js` can be swapped later.

---

## Installation

Prerequisites: Node.js 18+ and npm.

```bash
cd ResumeAnalyzerTool
npm run install:all
npm run samples
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:5000](http://localhost:5000)

`npm run samples` writes five test resumes (PDF and DOCX) to `server/samples/`.

---

## Environment variables

Copy `server/.env.example` to `server/.env` (already included for local development):

```text
PORT=5000
MAX_FILE_SIZE_MB=5
CLIENT_ORIGIN=http://localhost:5173
```


## API documentation

Base URL: `http://localhost:5000/api`

### Jobs

`POST /api/jobs`

```json
{
  "title": "Frontend Developer",
  "description": "We are looking for a frontend developer with experience building modern web applications.",
  "requiredSkills": ["React", "JavaScript", "HTML", "CSS", "Git", "Node.js"],
  "location": "Remote",
  "experience": "2 years",
  "employmentType": "Full-time"
}
```

`GET /api/jobs`  
`GET /api/jobs/:id`  
`DELETE /api/jobs/:id`

### Resumes

`POST /api/resumes/upload`  
`multipart/form-data` fields: `jobId`, `resumes` (one or more files)

`POST /api/resumes/analyze`

```json
{ "jobId": "<job-id>" }
```

### Candidates

`GET /api/candidates?jobId=&filter=all|80|60|shortlisted`  
`GET /api/candidates/:id`  
`PATCH /api/candidates/:id/status`

```json
{ "status": "Shortlisted" }
```

### Export and dashboard

`GET /api/candidates/export?ids=id1,id2`  
`GET /api/stats`  
`GET /api/health`

---

## Testing

### Analyzer self-check

```bash
node server/scripts/self-check.js
```

### Suggested UI test

1. Create **Frontend Developer** with skills React, JavaScript, HTML, CSS, Git, Node.js.
2. Upload the five files in `server/samples/`.
3. Confirm ranking is similar to:

| Candidate | Skills | Expected |
| --- | --- | --- |
| Ahmed Khan | React, JS, HTML, CSS, Git, Node | Very high |
| Sara Ali | React, JS, CSS, Git | High |
| Hina Ahmed | React, JS, Node | High |
| Usman Khan | HTML, CSS | Low |
| Ali Raza | Python, Django | Low |

### Error cases

- Unsupported file: `image.jpg` → unsupported file type
- Empty / unreadable file → unable to extract readable text
- Job with no skills → please add at least one required skill
- No matches → 0% and “No matching required skills found”
- Missing email → `Email: Not found`
- Duplicate filename for the same job → previous upload is replaced
- File over `MAX_FILE_SIZE_MB` → file too large

### API testing

Use Postman or curl against the routes above. Check 400 responses for missing job, missing skills, and unsupported files.

---

## Challenges

1. PDF and DOCX text extraction is inconsistent. Scanned/image PDFs contain little or no selectable text.
2. Skill aliases (`JS`, `Node JS`, `ReactJS`) must map to one canonical skill without false positives (for example, `Java` vs `JavaScript`).
3. Recruiter UX needs ranking, filters, status, and export without looking like a student CRUD form.

## Solutions

1. Extract with `pdf-parse` and `mammoth`, reject empty text, and show a specific retry message.
2. Use an alias table plus word-boundary matching for short tokens such as `JS`.
3. Build a sidebar dashboard, status badges, skill chips, and CSV export around a single job-centered workflow.

---

## Skills learned

- React SPA structure with routing and a recruiter dashboard layout
- Express REST APIs, multipart uploads, and file validation
- PDF/DOCX parsing
- Rule-based NLP-style skill normalization
- Ranking, filtering, and CSV export
- Responsive UI, empty/loading/error states
- Git-friendly project layout and documentation

---

## Future improvements

- AI/LLM semantic matching
- User authentication and multiple recruiter accounts
- PostgreSQL or MongoDB persistence
- Advanced analytics and bias monitoring
- Interview scheduling and email notifications
- Candidate comparison and job templates

---



