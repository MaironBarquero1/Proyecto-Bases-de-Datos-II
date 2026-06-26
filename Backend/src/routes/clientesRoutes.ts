import { Router } from "express";
import {
  listarClientes,
  obtenerCliente,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
} from "../controllers/clientesController";

const router = Router();

router.get("/", listarClientes);       // GET  /api/clientes
router.get("/:id", obtenerCliente);    // GET  /api/clientes/:id
router.post("/", crearCliente);        // POST /api/clientes
router.put("/:id", actualizarCliente); // PUT  /api/clientes/:id
router.delete("/:id", eliminarCliente); // DELETE /api/clientes/:id

export default router;
