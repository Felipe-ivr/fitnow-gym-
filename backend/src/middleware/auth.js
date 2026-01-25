import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ message: "Token requerido" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id_usuario, id_rol, email }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

export function requireRole(roleName) {
  // roleName esperado: "Administrador" o "Cliente"
  return (req, res, next) => {
    if (!req.user?.rol) {
      return res.status(403).json({ message: "Rol no disponible" });
    }
    if (req.user.rol !== roleName) {
      return res.status(403).json({ message: "No autorizado" });
    }
    next();
  };
}
