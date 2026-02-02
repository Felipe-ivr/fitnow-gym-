import { clearSession, getSession } from "./storage.js";

export function setNavUser() {
  const session = getSession();
  const el = document.querySelector("#navUser");
  if (el) {
    el.textContent = session?.user?.email ? `${session.user.email} (${session.user.rol})` : "";
  }
}

export function wireLogout() {
  const btn = document.querySelector("#btnLogout");
  if (btn) {
    btn.addEventListener("click", () => {
      clearSession();
      window.location.href = "index.html";
    });
  }
}

export function showAlert(containerSelector, type, message) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
