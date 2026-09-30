import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Asignacion, AsignacionCreacionDTO, AsignacionDetalle, DevolucionItemDTO,
  EquipoTrazabilidadDTO, TrazabilidadItemDTO
} from '../models/asignacion';
import {environment} from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class AsignacionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/asignaciones`;

  listarTodas(): Observable<Asignacion[]> {
    return this.http.get<Asignacion[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<Asignacion> {
    return this.http.get<Asignacion>(`${this.apiUrl}/${id}`);
  }

  listarDetalles(id: number): Observable<AsignacionDetalle[]> {
    return this.http.get<AsignacionDetalle[]>(`${this.apiUrl}/${id}/detalles`);
  }

  crearAsignacion(dto: AsignacionCreacionDTO): Observable<Asignacion> {
    return this.http.post<Asignacion>(`${this.apiUrl}/crear`, dto);
  }

  actualizarAsignacion(id: number, dto: AsignacionCreacionDTO): Observable<Asignacion> {
    return this.http.put<Asignacion>(`${this.apiUrl}/${id}/editar`, dto);
  }

  aprobarAsignacion(id: number, idUsuario: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/aprobar?idUsuario=${idUsuario}`, {});
  }

  cancelarAsignacion(id: number, idUsuario: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/cancelar?idUsuario=${idUsuario}`, {});
  }

  devolverEquipo(dto: DevolucionItemDTO): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/devolucion`, dto);
  }

  devolverTodosEquipos(dto: any): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/devolucion-total`, dto);
  }

  listarEquiposActivos(): Observable<EquipoTrazabilidadDTO[]> {
    return this.http.get<EquipoTrazabilidadDTO[]>(`${this.apiUrl}/equipos-activos`);
  }

  obtenerTrazabilidad(idProducto: number): Observable<TrazabilidadItemDTO[]> {
    return this.http.get<TrazabilidadItemDTO[]>(`${this.apiUrl}/trazabilidad/producto/${idProducto}`);
  }
}
