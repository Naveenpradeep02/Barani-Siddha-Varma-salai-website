const ADMIN_TOKEN_KEY = "adminToken";
const ADMIN_TOKEN_EXPIRY_KEY = "adminTokenExpiry";

function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(decoded)));
  } catch (error) {
    return null;
  }
}

function isAdminPayload(payload) {
  const audience = payload?.aud;
  const hasAdminAudience = Array.isArray(audience)
    ? audience.includes("admin")
    : audience === "admin";

  return hasAdminAudience && payload?.role === "admin";
}

export function setAdminToken(token) {
  const payload = parseJwt(token);
  if (!isAdminPayload(payload) || !payload?.exp) {
    clearAdminAuth();
    return false;
  }

  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_TOKEN_EXPIRY_KEY, String(payload.exp * 1000));
  return true;
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getAdminTokenExpiry() {
  return Number(localStorage.getItem(ADMIN_TOKEN_EXPIRY_KEY) || "0");
}

export function isAdminTokenExpired() {
  const expiry = getAdminTokenExpiry();
  return !expiry || Date.now() >= expiry;
}

export function isValidAdminToken() {
  const token = getAdminToken();
  return Boolean(token && !isAdminTokenExpired() && isAdminPayload(parseJwt(token)));
}

export function clearAdminAuth() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_TOKEN_EXPIRY_KEY);
}
