export interface AuditoriaProducto {
    idAuditoria: number;
    idProducto: number;
    fecha: Date;
    cantidadAnterior: number;
    nuevaCantidad: number;
    usuario: string;
}