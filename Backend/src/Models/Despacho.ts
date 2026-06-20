export interface Despacho {
  idDespacho: number;
  idCliente: number;
  fecha: Date;
  estado: Estado;
  operario: string;
}

export enum Estado {
  "pendiente",
  "procesado",
  "cancelado",
}
