import express  from "express";
import { ClienteControlador } from "../controller/ClienteControlador";

const clienteRutas = express.Router();

clienteRutas.get('/',ClienteControlador.obtenerTodos);
// router.get('/:id',);

export default clienteRutas;