import { Router } from "express";
import {
  registrarRecepcion,
  listarRecepciones,
} from "../controllers/recepcionesController";

const router = Router();

router.get("/", listarRecepciones);       // GET  /api/recepciones  ?fechaInicio=&fechaFin=
router.post("/", registrarRecepcion);     // POST /api/recepciones

export default router;
