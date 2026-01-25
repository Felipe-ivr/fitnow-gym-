import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const classesRouter = Router();

/**
 * GET /api/classes
 * Lista clases activas (para todos autenticados)
 */
classesRouter.get("/", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_clase, nombre_clase, descripcion, fecha, hora_inicio, hora_fin, capacidad_maxima, estado
       FROM clases
       WHERE estado = 'activa'
       ORDER BY fecha ASC, hora_inicio ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al listar clases" });
  }
});

/**
 * POST /api/classes  (solo Admin)
 * body: { nombre_clase, descripcion, fecha, hora_inicio, hora_fin, capacidad_maxima }
 */
classesRouter.post("/", requireAuth, requireRole("Administrador"), async (req, res) => {
  try {
    const { nombre_clase, descripcion, fecha, hora_inicio, hora_fin, capacidad_maxima } = req.body;

    if (!nombre_clase || !fecha || !hora_inicio || !hora_fin || !capacidad_maxima) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    await pool.query(
      `INSERT INTO clases (nombre_clase, descripcion, fecha, hora_inicio, hora_fin, capacidad_maxima, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'activa')`,
      [nombre_clase, descripcion || null, fecha, hora_inicio, hora_fin, Number(capacidad_maxima)]
    );

    res.status(201).json({ message: "Clase creada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al crear clase" });
  }
});
