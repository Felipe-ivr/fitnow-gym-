export function saveSession(session) {
  localStorage.setItem("fitnow_session", JSON.stringify(session));
}

export function getSession() {
  const raw = localStorage.getItem("fitnow_session");
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem("fitnow_session");
}

export function requireSessionOrRedirect() {
  const session = getSession();
  if (!session?.token) {
    window.location.href = "index.html";
    return null;
  }
  return session;
}
