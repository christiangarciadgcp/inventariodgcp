import { Producto } from './producto';
import { Ubicacion } from './ubicacion';
import { Usuario } from './usuario';

// DTO PARA CREAR EL PRESUPUESTO TAL CUAL LO RECIBE SPRING
export interface PresupuestoCreacionDTO {
    nombrePresupuesto: string;
    idUsuario: number;
    idUbicacion : number;
    observaciones : string;
    items: DetalleItemDTO[];
}

//AGREGAR PRODUCTOS AL PRESUPUESTO
export interface DetalleItemDTO {
    idProducto: number;
    cantidad: number;
}

// DTO PARA LA VALIDACION DEL INVENTARIO EN CUANTO A LAS EXISTENCIAS
export interface PresupuestoRevisionItem {
    idDetalle: number;
    idProducto: number;
    nombreProducto: string;
    cantidadSolicitada: number;

    cantidadDespachada : number;
    cantidadPendiente : number;

    cantidadEnBodegaDespacho: number;
    totalStockGlobal: number;
    desglosePorBodega: StockBodega[];
}

//VALIDACION DE EXISTENCIAS EN LA BODEGA
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

// CREACION DEL PRESUPUESTO SIN DTO
export interface Presupuesto {
    idPresupuesto: number;
    nombre_presupuesto: string;
    estado: string;
    fecha_creacion: string;
    fecha_modificacion: string;
    idusuariopresupuesto: Usuario;
    ubicacion? : Ubicacion;
    observaciones: string;
    historial?: PresupuestoHistorial[];
}

export interface PresupuestoDetalle {
    idPresupuesto?: number;
    producto: Producto;
    cantidad_solicitada: number;
    cantidad_despachada : number;
}

export interface DespachoReporteDTO {
    idPresupuesto: number;
    nombreProyecto: string;
    solicitante: string;
    usuarioDespachado: string;
    fechaAprobacion: string;
    estado: string;
    ubicacionDestino: string;
    observaciones: string;
    items: DetalleDespachoItem[];
}

export interface DetalleDespachoItem {
    sku: string;
    nombreProducto: string;
    unidadMedida: string;
    bodegaOrigen: string;
    cantidadSolicitada: number;
    cantidadDespachada : number;
    estadoItem : string;
}
