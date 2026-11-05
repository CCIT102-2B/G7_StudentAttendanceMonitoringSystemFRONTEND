// Change this URL if your API uses a different port.
const API_BASE = "http://localhost:5035/api";

function getToken() { return localStorage.getItem("attendTrackToken"); }
function saveAuth(data) {
    localStorage.setItem("attendTrackToken", data.accessToken);
    localStorage.setItem("attendTrackUser", JSON.stringify(data.user));
}
async function apiRequest(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!response.ok) throw new Error(data?.message || data?.title || `Request failed (${response.status})`);
    return data;
}
function requireLogin() {
    if (!getToken()) window.location.href = "login.html";
}
function logout() {
    localStorage.removeItem("attendTrackToken");
    localStorage.removeItem("attendTrackUser");
    window.location.href = "login.html";
}
