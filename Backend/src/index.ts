import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes       from "./routes/authRoutes";
import clientesRoutes   from "./routes/clientesRoutes";
import productosRoutes  from "./routes/productosRoutes";
import recepcionesRoutes from "./routes/recepcionesRoutes";
import despachosRoutes  from "./routes/despachosRoutes";
import inventarioRoutes from "./routes/inventarioRoutes";
import auditoriaRoutes  from "./routes/auditoriaRoutes";

import {
  notFoundHandler,
  globalErrorHandler,
} from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000");

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (simple, no dependency)
app.use((req: Request, _res: Response, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.originalUrl}`);
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/clientes",    clientesRoutes);
app.use("/api/productos",   productosRoutes);
app.use("/api/recepciones", recepcionesRoutes);
app.use("/api/despachos",   despachosRoutes);
app.use("/api/inventario",  inventarioRoutes);
app.use("/api/auditoria",   auditoriaRoutes);

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: "SGID LogiChain Backend",
    timestamp: new Date().toISOString(),
  });
});

// ── Error handlers (must be last) ───────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ┌──────────────────────────────────────────────────┐
  │  SGID LogiChain Backend                          │
  │  Servidor corriendo en http://localhost:${PORT}   │
  │                                                  │
  │  Endpoints base: /api/                           │
  │    auth        → /api/auth/login                 │
  │    clientes    → /api/clientes                   │
  │    productos   → /api/productos                  │
  │    recepciones → /api/recepciones                │
  │    despachos   → /api/despachos                  │
  │    inventario  → /api/inventario/monitoreo       │
  │    auditoria   → /api/auditoria/movimientos/:cod │
  └──────────────────────────────────────────────────┘
  `);
});

export default app;
