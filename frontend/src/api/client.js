import { getCookie } from "./cookies";

const API_BASE = process.env.REACT_APP_API_BASE || "";

function buildUrl(path) {
  if (path.startsWith("/")) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}

export async function apiRequest(path, { method = "GET", body, isFormData = false } = {}) {
  const url = buildUrl(path);
  const headers = {};

  const upperMethod = method.toUpperCase();
  const needsCsrf = !["GET", "HEAD", "OPTIONS"].includes(upperMethod);
  if (needsCsrf) {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) headers["X-CSRFToken"] = csrfToken;
  }

  if (body !== undefined && body !== null && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method: upperMethod,
    credentials: "include",
    headers,
    body: isFormData ? body : body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = data?.error || data?.detail || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: (path) => apiRequest(path, { method: "GET" }),
  post: (path, body, isFormData = false) => apiRequest(path, { method: "POST", body, isFormData }),
  patch: (path, body) => apiRequest(path, { method: "PATCH", body }),
  delete: (path) => apiRequest(path, { method: "DELETE" }),
};

