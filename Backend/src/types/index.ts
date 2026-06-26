// ============================================================
// Domain types – mirror the SGID_LogiChain MySQL schema exactly
// ============================================================

export type ClienteRol = "origen" | "destino" | "ambos";
export type DespachoEstado = "pendiente" | "procesado" | "cancelado";
export type StockEstado = "OK" | "REORDEN";
export type TipoMovimiento = "Recepcion" | "Despacho";

// ── Entities ────────────────────────────────────────────────

export interface Cliente {
  Id_Cliente: number;
  Nombre: string;
  Rol: ClienteRol;
}

export interface Producto {
  Id_Producto: number;
  Codigo: string;
  Nombre: string;
  Detalle: string | null;
  Cantidad_Actual: number;
  Stock_Critico: number;
  Bodega: string;
  Pasillo: string;
  Estante: string;
}

export interface Recepcion {
  Id_Recepcion: number;
  Id_Producto: number;
  Id_Cliente: number;
  Numero_Lote: string;
  Cantidad: number;
  Fecha: Date;
  Usuario: string;
}

export interface Despacho {
  Id_Despacho: number;
  Id_Cliente: number;
  Fecha: Date;
  Estado: DespachoEstado;
  Operario: string;
}

export interface DetalleDespacho {
  Id_Detalle: number;
  Id_Despacho: number;
  Id_Producto: number;
  Cantidad: number;
}

export interface CarroItem {
  Usuario: string;
  Id_Producto: number;
  Cantidad: number;
}

export interface AuditoriaProducto {
  Id_Auditoria: number;
  Id_Producto: number;
  Fecha: Date;
  Cantidad_Anterior: number;
  Nueva_Cantidad: number;
  Usuario: string;
}

// ── Extended / view types ───────────────────────────────────

export interface ProductoMonitoreo extends Producto {
  UltimoIngreso: Date | null;
  UltimoDespacho: Date | null;
  EstadoStock: StockEstado;
}

export interface MovimientoProducto {
  CodigoProducto: string;
  NombreProducto: string;
  FechaMovimiento: Date;
  TipoMovimiento: TipoMovimiento;
  Cliente: string;
  Cantidad: number;
  Usuario: string;
}

export interface DespachoConDetalle extends Despacho {
  NombreCliente: string;
  Detalle?: DetalleDespachoExtendido[];
}

export interface DetalleDespachoExtendido {
  Id_Producto: number;
  CodigoProducto: string;
  NombreProducto: string;
  Cantidad: number;
}

export interface RecepcionExtendida extends Recepcion {
  NombreProducto: string;
  CodigoProducto: string;
  NombreCliente: string;
}

// ── Request body types ──────────────────────────────────────

export interface LoginBody {
  usuario: string;
  password: string;
}

export interface CrearClienteBody {
  Nombre: string;
  Rol: ClienteRol;
}

export interface ActualizarClienteBody {
  Nombre?: string;
  Rol?: ClienteRol;
}

export interface CrearProductoBody {
  Codigo: string;
  Nombre: string;
  Detalle?: string;
  Stock_Critico: number;
  Bodega: string;
  Pasillo: string;
  Estante: string;
}

export interface ActualizarProductoBody {
  Nombre?: string;
  Stock_Critico?: number;
  Bodega?: string;
  Pasillo?: string;
  Estante?: string;
}

export interface RegistrarRecepcionBody {
  Id_Producto: number;
  Cantidad_Entrante: number;
  Id_Cliente: number;
  Numero_Lote: string;
}

export interface CrearDespachoBody {
  Id_Cliente: number;
}

export interface AgregarItemCarroBody {
  Id_Producto: number;
  Cantidad: number;
}

export interface ProcesarDespachoBody {
  Id_Cliente: number;
}

export interface ReporteMovimientosQuery {
  fechaInicio?: string;
  fechaFin?: string;
}

export interface FiltroFechasQuery {
  fechaInicio?: string;
  fechaFin?: string;
}

// ── API response wrapper ────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
