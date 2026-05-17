import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bodega } from '../models/bodega';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class BodegaService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bodegas`;

  getBodegas(): Observable<Bodega[]> {
    return this.http.get<Bodega[]>(this.apiUrl);
  }

  getBodegasActivas(): Observable<Bodega[]> {
    return this.http.get<Bodega[]>(`${this.apiUrl}/activas`);
  }

  createBodega(bodega: Bodega): Observable<Bodega> {
    return this.http.post<Bodega>(this.apiUrl, bodega);
  }

  updateBodega(id:number, bodega:Bodega) : Observable<Bodega>{
    return this.http.put<Bodega>(`${this.apiUrl}/${id}`,bodega);
  }

  desactivarBodega(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  activarBodega(id: number) {
    return this.http.put<void>(`${this.apiUrl}/${id}/activar`, {});
  }
  
}
