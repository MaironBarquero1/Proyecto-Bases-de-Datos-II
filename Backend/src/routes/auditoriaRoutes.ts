import { Router } from "express";
import {
  movimientosProducto,
  logAuditoriaProducto,
  logAuditoriaGeneral,
} from "../controllers/auditoriaController";

const router = Router();

// GET /api/auditoria/movimientos/:codigo   ?fechaInicio=&fechaFin=
router.get("/movimientos/:codigo", movimientosProducto);

// GET /api/auditoria/log/:idProducto        ?fechaInicio=&fechaFin=
router.get("/log/:idProducto", logAuditoriaProducto);

// GET /api/auditoria/log
router.get("/log", logAuditoriaGeneral);

export default router;
