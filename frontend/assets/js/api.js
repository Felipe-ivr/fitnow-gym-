import { getSession } from "./storage.js";

const LOCAL_API = "http://localhost:3000/api";
const PROD_API = "https://fitnow-gym.onrender.com/api";

export const API_BASE =
  window.location.hostname === "localhost"
    ? LOCAL_API
    : PROD_API;

async function request(path, { method = "GET", body = null, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const session = getSession();
    if (session?.token) {
      headers["Authorization"] = `Bearer ${session.token}`;
    }
  }

  let res;

  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
  } catch (error) {
    throw new Error("No se pudo conectar con el servidor");
  }

  let data = null;
  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    data = await res.json();
  } else {
    data = { message: await res.text() };
  }

  if (!res.ok) {
    const msg = data?.message || `Error HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  health: () => request("/health", { auth: false }),

  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),

  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: payload,
      auth: false,
    }),

  listClasses: () => request("/classes"),

  createClass: (payload) =>
    request("/classes", {
      method: "POST",
      body: payload,
    }),

  myReservations: () => request("/reservations/mine"),

  reserveClass: (id_clase) =>
    request("/reservations", {
      method: "POST",
      body: { id_clase },
    }),

  cancelReservation: (id_reserva) =>
    request(`/reservations/${id_reserva}/cancel`, {
      method: "PATCH",
    }),
};
