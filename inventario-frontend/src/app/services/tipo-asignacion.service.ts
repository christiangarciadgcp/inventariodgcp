import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoAsignacion } from '../models/tipo-asignacion';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class TipoAsignacionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tipoasignacion`;

  listarTodos(): Observable<TipoAsignacion[]> {
    return this.http.get<TipoAsignacion[]>(this.apiUrl);
  }

  listarActivos(): Observable<TipoAsignacion[]> {
    return this.http.get<TipoAsignacion[]>(`${this.apiUrl}/activos`);
  }

  guardar(tipo: TipoAsignacion): Observable<TipoAsignacion> {
    return this.http.post<TipoAsignacion>(this.apiUrl, tipo);
  }

  actualizar(idAsignacionTipo: number, tipo: TipoAsignacion): Observable<TipoAsignacion> {
    return this.http.put<TipoAsignacion>(`${this.apiUrl}/${idAsignacionTipo}`, tipo);
  }

  cambiarEstado(idAsignacionTipo: number, activo: boolean): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${idAsignacionTipo}/estado?activo=${activo}`, {});
  }
}
