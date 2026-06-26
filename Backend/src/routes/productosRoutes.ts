import { Router } from "express";
import {
  listarProductos,
  listarProductosDisponibles,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  listarRecepcionesProducto,
} from "../controllers/productosController";

const router = Router();

router.get("/", listarProductos);                           // GET    /api/productos
router.get("/disponibles", listarProductosDisponibles);    // GET    /api/productos/disponibles
router.get("/:id", obtenerProducto);                       // GET    /api/productos/:id
router.post("/", crearProducto);                           // POST   /api/productos
router.put("/:id", actualizarProducto);                    // PUT    /api/productos/:id
router.delete("/:id", eliminarProducto);                   // DELETE /api/productos/:id
router.get("/:id/recepciones", listarRecepcionesProducto); // GET    /api/productos/:id/recepciones

export default router;
