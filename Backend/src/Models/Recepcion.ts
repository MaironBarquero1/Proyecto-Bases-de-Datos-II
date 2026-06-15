export interface Recepcion {
    idRecepcion: number;
    idProducto: number;
    idCliente: number;
    numeroLote: string;
    cantidad: number;
    fecha: Date;
    usuario: string;
}