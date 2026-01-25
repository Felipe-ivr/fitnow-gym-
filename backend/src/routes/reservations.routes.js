import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const reservationsRouter = Router();

/**
 * GET /api/reservations/mine
 * Lista reservas del usuario logueado
 */
reservationsRouter.get("/mine", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id_usuario;

    const [rows] = await pool.query(
      `SELECT r.id_reserva, r.estado, r.fecha_reserva,
              c.id_clase, c.nombre_clase, c.fecha, c.hora_inicio, c.hora_fin
       FROM reservas r
       JOIN clases c ON c.id_clase = r.id_clase
       WHERE r.id_usuario = ?
       ORDER BY c.fecha ASC, c.hora_inicio ASC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al listar reservas" });
  }
});

/**
 * POST /api/reservations
 * body: { id_clase }
 * Reserva clase con validación de cupos
 */
reservationsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id_usuario;
    const { id_clase } = req.body;

    if (!id_clase) return res.status(400).json({ message: "id_clase requerido" });

    // Obtener clase
    const [classes] = await pool.query(
      `SELECT id_clase, capacidad_maxima, estado
       FROM clases
       WHERE id_clase = ? LIMIT 1`,
      [id_clase]
    );
    if (classes.length === 0) return res.status(404).json({ message: "Clase no existe" });
    if (classes[0].estado !== "activa") return res.status(400).json({ message: "Clase no disponible" });

    const capacidad = Number(classes[0].capacidad_maxima);

    // Contar reservas activas (reservada)
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM reservas
       WHERE id_clase = ? AND estado = 'reservada'`,
      [id_clase]
    );
    const totalReservas = Number(countRows[0].total);

    if (totalReservas >= capacidad) {
      return res.status(409).json({ message: "Cupo completo" });
    }

    // Insert reserva (evita duplicado por UNIQUE id_clase + id_usuario)
    await pool.query(
      `INSERT INTO reservas (id_clase, id_usuario, fecha_reserva, estado)
       VALUES (?, ?, NOW(), 'reservada')`,
      [id_clase, userId]
    );

    res.status(201).json({ message: "Reserva confirmada" });
  } catch (err) {
    if (String(err?.message || "").includes("Duplicate")) {
      return res.status(409).json({ message: "Ya tienes una reserva para esta clase" });
    }
    console.error(err);
    res.status(500).json({ message: "Error al reservar" });
  }
});

/**
 * PATCH /api/reservations/:id/cancel
 * Cancela reserva del usuario
 */
reservationsRouter.patch("/:id/cancel", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id_usuario;
    const id_reserva = req.params.id;

    const [result] = await pool.query(
      `UPDATE reservas
       SET estado = 'cancelada'
       WHERE id_reserva = ? AND id_usuario = ? AND estado = 'reservada'`,
      [id_reserva, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Reserva no encontrada o ya no se puede cancelar" });
    }

    res.json({ message: "Reserva cancelada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al cancelar reserva" });
  }
});
