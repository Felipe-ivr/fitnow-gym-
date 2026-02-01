import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import dns from "dns";
import { resolve4 } from "dns/promises";

dotenv.config();

const ca = fs.readFileSync(path.resolve("ca.pem"));

const DB_HOST = (process.env.DB_HOST || "").trim();
const DB_PORT = Number((process.env.DB_PORT || "").trim());
const DB_USER = (process.env.DB_USER || "").trim();
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = (process.env.DB_NAME || "").trim();

// DNS públicos para evitar problemas raros en Render
dns.setServers(["1.1.1.1", "8.8.8.8"]);

async function resolveHostToIPv4(hostname) {
  try {
    const ips = await resolve4(hostname);
    if (ips && ips.length > 0) return ips[0];
  } catch (e) {
    console.error("[DB] resolve4 falló:", e.message);
  }
  return hostname; // fallback
}

const resolvedHost = await resolveHostToIPv4(DB_HOST);

console.log("[DB] DB_HOST =", DB_HOST);
console.log("[DB] resolvedHost =", resolvedHost);
console.log("[DB] DB_PORT =", DB_PORT, "| DB_NAME =", DB_NAME);

export const pool = mysql.createPool({
  host: resolvedHost,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  ssl: {
    ca,
    servername: DB_HOST,
    rejectUnauthorized: true,
  },
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 20000,
});
