import { Producto } from './producto';
import { Ubicacion } from './ubicacion';
import { Usuario } from './usuario';

export interface PresupuestoCreacionDTO {
  nombrePresupuesto: string;
  idUsuario: number;
  idUbicacion: number;
  observaciones: string;
  items: DetalleItemDTO[];
}

export interface DetalleItemDTO {
  idProducto: number;
  cantidad: number;
}

export interface PresupuestoRevisionItem {
  idDetalle: number;
  idProducto: number;
  nombreProducto: string;
  unidadMedida: string;
  esGenerico: boolean;
  esMaterial?: boolean;
  descripcionProducto: string;
  cantidadSolicitada: number;
  cantidadDespachada: number;
  cantidadPendiente: number;
  cantidadEnBodegaDespacho: number;
  totalStockGlobal: number;
  desglosePorBodega: StockBodega[];
  sustitutosDisponibles: ProductoFisicoDisponibleDTO[];
}

export interface ProductoFisicoDisponibleDTO {
  idProducto: number;
  nombreProducto: string;
  skuProducto: string;
  marcaProducto?: string;
  modeloProducto?: string;
  serieProducto?: string;
  inventarioProducto?: string;
  descripcionProducto?: string;
  stockEnDespacho: number;
  stockGlobal: number;
  esNuevo?: boolean;
  desgloseBodegas: StockBodega[];
}

export interface DespachoPayloadDTO {
  idUsuario: number;
  items: ItemDespachoDTO[];
}

export interface ItemDespachoDTO {
  idDetalle: number;
  idProductoFisico: number;
  cantidadADespachar: number;
}

export interface StockBodega {
  nombreBodega: string;
  cantidadActual: number;
}

export interface PresupuestoHistorial {
  idHistorial: number;
  usuario: Usuario;
  accion: string;
  fecha: string;
}

export interface Presupuesto {
  idPresupuesto: number;
  numeroActa?: string;
  correlativo?: number;
  anio?: number;
  fechaSalida?: string;
  nombre_presupuesto: string;
  estado: string;
  fecha_creacion: string;
  fecha_modificacion: string;
  idusuariopresupuesto: Usuario;
  ubicacion?: Ubicacion;
  observaciones: string;
  historial?: PresupuestoHistorial[];
}

export interface PresupuestoDetalle {
  idPresupuesto?: number;
  producto: Producto;
  productoFisico?: Producto;
  cantidad_solicitada: number;
  cantidad_despachada: number;
}

export interface DespachoReporteDTO {
  idPresupuesto: number;
  numeroActa?: string;
  fechaSalida?: string;
  nombreProyecto: string;
  solicitante: string;
  usuarioDespachado: string;
  inicialesUsuarioActa?: string;
  inicialesSolicitante?: string;
  fechaAprobacion: string;
  estado: string;
  ubicacionDestino: string;
  nombreUbicacionDestino?: string;
  observaciones: string;
  items: DetalleDespachoItem[];
}

export interface DetalleDespachoItem {
  skuGenerico: string;
  nombreGenerico: string;
  unidadMedida: string;
  cantidadSolicitada: number;
  cantidadDespachada: number;
  cantidadPendiente: number;
  estadoItem: string;
  entregasFisicas: SubItemDespacho[];
}

export interface SubItemDespacho {
  skuFisico: string;
  nombreFisico: string;
  marca?: string;
  modelo?: string;
  serie?: string;
  inventario?: string;
  esMaterial?: boolean;
  bodegaOrigen: string;
  cantidad: number;
}
