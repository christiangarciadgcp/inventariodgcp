import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ubicacion } from '../models/ubicacion';
import { environment } from '../../environments/environment.development';
import {Proveedor} from '../models/proveedor';

@Injectable({
  providedIn: 'root',
})
export class UbicacionService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ubicaciones`;

  getUbicaciones(): Observable<Ubicacion[]> {
    return this.http.get<Ubicacion[]>(`${this.apiUrl}`);
  }

  getUbicacionesActivas(): Observable<Ubicacion[]> {
    return this.http.get<Ubicacion[]>(`${this.apiUrl}/activas`);
  }

  createUbicacion(ubicacion : Ubicacion): Observable<Ubicacion> {
    return this.http.post<Ubicacion>(this.apiUrl, ubicacion);
  }

  updateUbicacion(id: number, ubicacion: Ubicacion): Observable<Ubicacion> {
    return this.http.put<Ubicacion>(`${this.apiUrl}/${id}`, ubicacion);
  }

  desactivarUbicacion(id:number) : Observable<void>{
    return this.http.put<void>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  activarUbicacion(id:number){
    return this.http.put<void>(`${this.apiUrl}/${id}/activar`, {});
  }

}
