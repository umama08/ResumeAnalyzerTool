const API = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/csv")) {
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Request failed.");
    }
    return response.blob();
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

export const api = {
  stats: () => request("/stats"),
  jobs: () => request("/jobs"),
  job: (id) => request(`/jobs/${id}`),
  createJob: (payload) =>
    request("/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteJob: (id) => request(`/jobs/${id}`, { method: "DELETE" }),
  uploadResumes: (jobId, files) => {
    const form = new FormData();
    form.append("jobId", jobId);
    files.forEach((file) => form.append("resumes", file));
    return request("/resumes/upload", { method: "POST", body: form });
  },
  analyze: (jobId) =>
    request("/resumes/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    }),
  candidates: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, value]) => value != null && value !== ""))
    );
    return request(`/candidates?${query.toString()}`);
  },
  candidate: (id) => request(`/candidates/${id}`),
  updateStatus: (id, status) =>
    request(`/candidates/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),
  exportCsv: async (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, value]) => value != null && value !== ""))
    );
    const blob = await request(`/candidates/export?${query.toString()}`);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "shortlist.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
