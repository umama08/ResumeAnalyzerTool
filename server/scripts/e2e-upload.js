const fs = require("fs");
const path = require("path");
const http = require("http");

async function request(method, urlPath, { json, formFiles, formFields } = {}) {
  return new Promise((resolve, reject) => {
    const payload = json ? Buffer.from(JSON.stringify(json)) : null;
    let body;
    let headers = {};

    if (json) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = payload.length;
      body = payload;
    }

    if (formFiles) {
      const boundary = "----resumeBoundary" + Date.now();
      const chunks = [];
      for (const [key, value] of Object.entries(formFields || {})) {
        chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`));
      }
      for (const filePath of formFiles) {
        const filename = path.basename(filePath);
        const file = fs.readFileSync(filePath);
        chunks.push(
          Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="resumes"; filename="${filename}"\r\nContent-Type: application/pdf\r\n\r\n`
          )
        );
        chunks.push(file);
        chunks.push(Buffer.from("\r\n"));
      }
      chunks.push(Buffer.from(`--${boundary}--\r\n`));
      body = Buffer.concat(chunks);
      headers["Content-Type"] = `multipart/form-data; boundary=${boundary}`;
      headers["Content-Length"] = body.length;
    }

    const req = http.request(
      {
        hostname: "localhost",
        port: 5000,
        path: urlPath,
        method,
        headers,
      },
      (res) => {
        const parts = [];
        res.on("data", (d) => parts.push(d));
        res.on("end", () => {
          const text = Buffer.concat(parts).toString("utf8");
          try {
            resolve({ status: res.statusCode, data: JSON.parse(text) });
          } catch {
            resolve({ status: res.statusCode, data: text });
          }
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const jobs = await request("GET", "/api/jobs");
  const job = jobs.data[0];
  if (!job) throw new Error("No job");
  const dir = path.join(__dirname, "..", "samples");
  const files = fs.readdirSync(dir).filter((name) => name.endsWith(".pdf")).map((name) => path.join(dir, name));
  const upload = await request("POST", "/api/resumes/upload", {
    formFields: { jobId: job.id },
    formFiles: files,
  });
  console.log("upload status", upload.status);
  console.log(JSON.stringify(upload.data, null, 2));
  const analyzed = await request("POST", "/api/resumes/analyze", { json: { jobId: job.id } });
  console.log("analyze status", analyzed.status);
  console.log(
    (analyzed.data.candidates || []).map((c) => `${c.name} ${c.matchScore}% missing=${(c.missingSkills || []).join("|")}`).join("\n")
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
