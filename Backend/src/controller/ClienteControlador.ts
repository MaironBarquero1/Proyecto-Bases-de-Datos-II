import { Request,Response,NextFunction, RequestHandler } from "express";
import { ClienteServicio } from "../service/ClienteServicio";

export class ClienteControlador{
    static async obtenerTodos(req:Request,res:Response,next:NextFunction):Promise<void>{
        try {
            const clientes = await ClienteServicio.obtenerTodos();
            res.status(200).json({
                status:'success',
                data:{clientes}
            });
        } catch (error) {
            res.status(500).json({
                status:'error',
                details:{error}
            });
        }
    }
}