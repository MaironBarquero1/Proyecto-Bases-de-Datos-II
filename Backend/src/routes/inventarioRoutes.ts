import { Router } from "express";
import {
  monitoreoInventario,
  productosStockCritico,
} from "../controllers/inventarioController";

const router = Router();

router.get("/monitoreo", monitoreoInventario);         // GET /api/inventario/monitoreo
router.get("/stock-critico", productosStockCritico);  // GET /api/inventario/stock-critico

export default router;
