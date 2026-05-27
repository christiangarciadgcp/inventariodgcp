import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UnidadMedida } from '../models/unidades-medidas';
import { environment } from '../../environments/environment.development';
import {Categoria} from '../models/categoria';

@Injectable({
  providedIn: 'root',
})
export class UnidadMedidaService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/unidades`;

  getUnidadesMedida(): Observable<UnidadMedida[]> {
    return this.http.get<UnidadMedida[]>(this.apiUrl);
  }

  getUnidadesMedidaActivas() : Observable<UnidadMedida[]>{
    return this.http.get<UnidadMedida[]>(`${this.apiUrl}/activas`);
  }

  createUnidadMedida(unidadmedida : UnidadMedida): Observable<UnidadMedida> {
    return this.http.post<UnidadMedida>(this.apiUrl, unidadmedida);
  }

  updateUnidadMedida(id:number, unidadMedida : UnidadMedida) : Observable<UnidadMedida>{
    return this.http.put<UnidadMedida>(`${this.apiUrl}/${id}`, unidadMedida);
  }

  deleteUnidadMedida(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  desactivarUnidadMedida(id:number) : Observable<void>{
    return this.http.put<void>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  activarUnidadMedida(id:number){
    return this.http.put<void>(`${this.apiUrl}/${id}/activar`, {});
  }

}
