import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SolicitudCompra, SolicitudDTO, DetalleSolicitudDTO, SolicitudCompraDetalle, SolicitudCreacionDTO, RecepcionPayloadDTO } from '../models/solicitud-compra';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class SolicitudCompraService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/solicitudes-compra`;

// Obtener todas
  listar(): Observable<SolicitudCompra[]> {
    return this.http.get<SolicitudCompra[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<SolicitudCompra> {
    return this.http.get<SolicitudCompra>(`${this.apiUrl}/${id}`);
  }

  // Obtener detalles de una solicitud
  listarDetalles(id: number): Observable<SolicitudCompraDetalle[]> {
    return this.http.get<SolicitudCompraDetalle[]>(`${this.apiUrl}/${id}/detalles`);
  }

  //Crear Cabecera
  crearSolicitud(dto: SolicitudCreacionDTO): Observable<SolicitudCompra> {
    return this.http.post<SolicitudCompra>(`${this.apiUrl}/crear`, dto);
  }

  //Agregar Producto (Se llama por cada fila del detalle)
  agregarProducto(idSolicitud: number, detalle: DetalleSolicitudDTO): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${idSolicitud}/productos`, detalle);
  }

  // Aprobar
  aprobarSolicitud(id: number, idUsuario: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/aprobar?idUsuario=${idUsuario}`, {});
  }

  // Recepcionar
  recepcionarSolicitud2(id: number, idUsuario: number): Observable<void> {
    const body = { idUsuarioComprador: idUsuario };
    return this.http.put<void>(`${this.apiUrl}/${id}/recepcionar`, body);
  }

  recepcionarSolicitud(id: number, payload: RecepcionPayloadDTO): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/recepcionar`, payload);
  }

  actualizarSolicitud(id: number, dto: SolicitudCreacionDTO): Observable<SolicitudCompra> {
    return this.http.put<SolicitudCompra>(`${this.apiUrl}/${id}/editar`, dto);
  }

}
