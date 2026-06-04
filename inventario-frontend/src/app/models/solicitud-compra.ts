import { Usuario } from './usuario';
import { Bodega } from './bodega';
import { Producto } from './producto';

export interface SolicitudCompra {
    idSolicitudCompra?: number;
    nombresolicitud: string;
    fechacreacionsolicitud?: string;
    estado: string;
    idusuariosolicitante: Usuario;
    idbodegadestino: Bodega;
    detalles?: SolicitudCompraDetalle[];
    historial?: SolicitudCompraHistorial[];
}

export interface SolicitudCompraDetalle {
    idSolicitudDetalle?: number;
    producto: Producto;
    cantidad_solicitada: number;
    cantidad_recibida: number;
}

// DTOs
export interface SolicitudDTO {
    nombresolicitud: string;
    idUsuarioSolicitante: number;
    idBodegaDestino: number;
}

export interface DetalleSolicitudDTO {
    idProducto: number;
    cantidad: number;
}

export interface SolicitudCompraHistorial {
  idSolicitudCompraHistorial: number;
  usuario: Usuario;
  accion: string;
  fecha: string;
}

export interface SolicitudCreacionDTO {
    nombreSolicitud: string;
    idUsuario: number;
    idBodegaDestino?: number;
    items: DetalleItemDTO[];
}

export interface DetalleItemDTO {
    idProducto: number;
    cantidad: number;
}

export interface RecepcionPayloadDTO {
    idUsuarioComprador: number;
    items: {
      idDetalle: number;
      cantidadARecibir: number;
    }[];
  }
