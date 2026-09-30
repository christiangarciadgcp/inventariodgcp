import { Producto } from './producto';
import { Bodega } from './bodega';
import { TipoAsignacion } from './tipo-asignacion';
import { Usuario } from './usuario';

export interface AsignacionDetalle {
  idAsignacionDetalle?: number;
  asignacion: Asignacion;
  producto: Producto;
  bodegaOrigen: Bodega;
  bodegaDevolucion?: Bodega;
  estado: 'ASIGNADO' | 'DEVUELTO';
  fechaDevolucion?: string;
  observacionDevolucion?: string;
  usuarioDevolucion?: Usuario;
}

export interface AsignacionHistorial {
  idHistorial?: number;
  usuario: Usuario;
  accion: string;
  detalle: string;
  fecha: string;
}

export interface Asignacion {
  idAsignacion?: number;
  numeroActa: string;
  correlativo: number;
  anio: number;
  tipoAsignacion: TipoAsignacion;
  responsableDestino: string;
  observaciones?: string;
  fechaAsignacion: string;
  estado: 'REGISTRADA' | 'ASIGNADA' | 'DEVOLUCION PARCIAL' | 'DEVOLUCION TOTAL' | 'CANCELADA';
  usuarioCreacion: Usuario;
  usuarioAprobacion?: Usuario;
  fechaAprobacion?: string;
  detalles?: AsignacionDetalle[];
  historial?: AsignacionHistorial[];
}

export interface AsignacionCreacionDTO {
  idAsignacionTipo: number;
  responsableDestino: string;
  observaciones?: string;
  idUsuario: number;
  items: { idProducto: number; idBodegaOrigen: number }[];
}

export interface DevolucionItemDTO {
  idAsignacionDetalle: number;
  idBodegaDestino: number;
  idUsuario: number;
  observacion: string;
}

export interface TrazabilidadItemDTO {
  idAsignacion: number;
  numeroActa: string;
  tipoAsignacion: string;
  responsableDestino: string;
  fechaAsignacion: string;
  estadoDetalle: string;
  fechaDevolucion?: string;
  bodegaDevolucion?: string;
  observacionDevolucion?: string;
  usuarioAsignador: string;
  usuarioDevolucion?: string;
}

export interface EquipoTrazabilidadDTO {
  idProducto: number;
  nombreProducto: string;
  skuProducto: string;
  serieProducto?: string;
  inventarioProducto?: string;
  marca?: string;
  modelo?: string;
  estadoActual: 'ASIGNADO' | 'EN BODEGA (DEVUELTO)';
  asignadoA: string;
  ultimaActa: string;
  fechaUltimaAsignacion: string;
  totalAsignaciones: number;
}
