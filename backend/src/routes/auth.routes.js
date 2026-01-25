import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

export const authRouter = Router();

/**
 * POST /api/auth/register
 * body: { nombres, apellidos, email, telefono, password }
 * Crea usuario con rol "Cliente"
 */
authRouter.post("/register", async (req, res) => {
  try {
    const { nombres, apellidos, email, telefono, password } = req.body;

    if (!nombres || !apellidos || !email || !password) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // Buscar rol Clientw
    const [roles] = await pool.query(
      "SELECT id_rol, nombre FROM roles WHERE nombre = ? LIMIT 1",
      ["Cliente"]
    );
    if (roles.length === 0) {
      return res.status(500).json({ message: "Rol Cliente no existe en BD" });
    }
    const id_rol = roles[0].id_rol;

    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO usuarios (id_rol, nombres, apellidos, email, telefono, password_hash, estado, fecha_registro)
       VALUES (?, ?, ?, ?, ?, ?, 'activo', CURDATE())`,
      [id_rol, nombres, apellidos, email, telefono || null, password_hash]
    );

    return res.status(201).json({ message: "Usuario registrado" });
  } catch (err) {
    // Email duplicadoi
    if (String(err?.message || "").includes("Duplicate")) {
      return res.status(409).json({ message: "El email ya está registrado" });
    }
    console.error(err);
    return res.status(500).json({ message: "Error en registro" });
  }
});


authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email y password son requeridos" });

    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.email, u.password_hash, u.estado, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
       WHERE u.email = ? LIMIT 1`,
      [email]
    );

    if (rows.length === 0) return res.status(401).json({ message: "Credenciales inválidas" });

    const user = rows[0];
    if (user.estado !== "activo") return res.status(403).json({ message: "Usuario inactivo" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

    const token = jwt.sign(
      { id_usuario: user.id_usuario, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      message: "Login OK",
      token,
      user: { id_usuario: user.id_usuario, email: user.email, rol: user.rol },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error en login" });
  }
});
