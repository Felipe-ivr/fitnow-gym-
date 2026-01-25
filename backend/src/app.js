import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { authRouter } from "./routes/auth.routes.js";
import { classesRouter } from "./routes/classes.routes.js";
import { reservationsRouter } from "./routes/reservations.routes.js";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", message: "FitNow Gym API running" }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/classes", classesRouter);
app.use("/api/reservations", reservationsRouter);

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ API running on http://localhost:${PORT}`));
