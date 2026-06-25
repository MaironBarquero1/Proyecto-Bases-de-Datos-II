import { Cliente } from "../Models/Cliente";
import { ClienteRepositorio } from "../repository/ClienteRepositorio";

export class ClienteServicio {
  static async obtenerTodos(): Promise<Cliente[]> {
    try {
      const clientes = await ClienteRepositorio.obtenerTodos();
      return clientes;
    } catch (error) {
        throw error;
    }
  }

  static async obtenerPorId(id: number): Promise<Cliente | null> {
    try {
      const cliente = await ClienteRepositorio.obtenerPorId(id);
      if (!cliente) {
        throw new Error("Cliente no encontrado");
      }
      return cliente;
    } catch (error) {
        throw error;
    }
  }

  static async crearCliente(
    cliente: Omit<Cliente, "idCliente">,
  ): Promise<number> {
    try {
      const result = await ClienteRepositorio.crearCliente(cliente);
      if (!result) {
        throw new Error("Cliente no creado");
      }
      return result;
    } catch (error) {
        throw error;
    }
  }

  static async actualizarCliente(
    id: number,
    cliente: Partial<Cliente>,
  ): Promise<boolean> {
    try {
      const result = await ClienteRepositorio.actualizar(id, cliente);
      if (!result) {
        throw new Error("Cliente no actualizado");
      }
      return result;
    } catch (error) {
        throw error;
    }
  }

  static async eliminarCliente(id: number): Promise<boolean> {
    try {
      const result = await ClienteRepositorio.eliminar(id);
      if (!result) {
        throw new Error("Cliente no eliminado");
      }
      return result;
    } catch (error) {
        throw error;
    }
  }
}
