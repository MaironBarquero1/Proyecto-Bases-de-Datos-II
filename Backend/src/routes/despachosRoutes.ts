import { Router } from "express";
import {
  listarDespachos,
  obtenerDespacho,
  crearDespacho,
  procesarDespacho,
  verCarro,
  agregarAlCarro,
  eliminarDelCarro,
  vaciarCarro,
} from "../controllers/despachosController";

const router = Router();

// ── Despachos ──────────────────────────────────────────────────
router.get("/", listarDespachos);               // GET    /api/despachos  ?fechaInicio=&fechaFin=
router.post("/", crearDespacho);                // POST   /api/despachos
router.get("/:id", obtenerDespacho);            // GET    /api/despachos/:id  (con detalle si procesado)
router.post("/:id/procesar", procesarDespacho); // POST   /api/despachos/:id/procesar

// ── Carro de compras (tabla TEMPORAL_CARRO_COMPRAS) ────────────
// El usuario se lee del header X-Usuario o del body.usuario
router.get("/carro/items", verCarro);                        // GET    /api/despachos/carro/items
router.post("/carro/items", agregarAlCarro);                 // POST   /api/despachos/carro/items
router.delete("/carro/items/:idProducto", eliminarDelCarro); // DELETE /api/despachos/carro/items/:idProducto
router.delete("/carro/items", vaciarCarro);                  // DELETE /api/despachos/carro/items

export default router;
