import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import dns from "dns/promises";

dotenv.config();

const ca = fs.readFileSync(path.resolve("ca.pem"));

const DB_HOST = process.env.DB_HOST;
const DB_PORT = Number(process.env.DB_PORT);
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;


async function resolveHostToIPv4(hostname) {
  try {
    const ips = await dns.resolve4(hostname);
    if (ips?.length) return ips[0];
  } catch (e) {
    console.error("DNS resolve4 falló, usando hostname:", e.message);
  }
  return hostname; 
}

const resolvedHost = await resolveHostToIPv4(DB_HOST);


export const pool = mysql.createPool({
  host: resolvedHost,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,

  // Aiven: SSL REQUIRED
  ssl: {
    ca,
    servername: DB_HOST,          
    rejectUnauthorized: true,
  },

  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 20000,
});

