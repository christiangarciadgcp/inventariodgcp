import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DespachoReporteDTO, Presupuesto, PresupuestoCreacionDTO, PresupuestoRevisionItem,PresupuestoDetalle } from '../models/presupuesto';
import { environment } from '../../environments/environment.development';


@Injectable({
  providedIn: 'root'
})
export class PresupuestoService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/presupuestos`;


  /**
   * CREAR PRESUPUESTO (Requerimiento)
   */
  crearPresupuesto(presupuesto: PresupuestoCreacionDTO): Observable<Presupuesto> {
    return this.http.post<Presupuesto>(`${this.apiUrl}/crear`, presupuesto);
  }

  /**
   * OBTENER DETALLE PARA REVISIÓN (Con Stock Real)
   * Devuelve los items cruzados con el inventario de bodega.
   */
  obtenerDetalleRevision(idPresupuesto: number): Observable<PresupuestoRevisionItem[]> {
    return this.http.get<PresupuestoRevisionItem[]>(`${this.apiUrl}/${idPresupuesto}/revision`);
  }

  /**
   * LISTAR TODOS LOS PRESUPUESTOS
   */
  listarTodos(): Observable<Presupuesto[]> {
    return this.http.get<Presupuesto[]>(`${this.apiUrl}`);
  }

  /**
   * OBTENER UN PRESUPUESTO POR ID
   */
  obtenerPorId(id: number): Observable<Presupuesto> {
    return this.http.get<Presupuesto>(`${this.apiUrl}/${id}`);
  }

    /**
   * OBTENER LOS DETALLES DE UN PRESUPUESTO
   */
  listarDetalles(id: number): Observable<PresupuestoDetalle[]> {
    return this.http.get<PresupuestoDetalle[]>(`${this.apiUrl}/${id}/detalles`);
  }

  /**
   * FILTRAR POR ESTADO
   * Listar solo los "PENDIENTE"
   */
  listarPorEstado(estado: string): Observable<Presupuesto[]> {
    return this.http.get<Presupuesto[]>(`${this.apiUrl}/estado/${estado}`);
  }

  despacharPresupuesto(idPresupuesto: number, idUsuario: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${idPresupuesto}/despachar?idUsuario=${idUsuario}`, {});
  }

  obtenerDatosReporte(id: number): Observable<DespachoReporteDTO> {
    return this.http.get<DespachoReporteDTO>(`${this.apiUrl}/${id}/reporte-despacho`);
  }

  actualizarPresupuesto(id: number, presupuesto: PresupuestoCreacionDTO): Observable<Presupuesto> {
    return this.http.put<Presupuesto>(`${this.apiUrl}/${id}/editar`, presupuesto);
  }

  aprobarPresupuesto(idPresupuesto: number, idUsuario: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${idPresupuesto}/aprobar?idUsuario=${idUsuario}`, {});
  }

  cancelarPresupuesto(idPresupuesto: number, idUsuario: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${idPresupuesto}/cancelar?idUsuario=${idUsuario}`, {});
  }

}
