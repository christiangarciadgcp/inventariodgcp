import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Modelo } from '../models/modelo';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ModeloService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/modelos`;

  getModelos() : Observable<Modelo[]>{
    return this.http.get<Modelo[]>(this.apiUrl);
  }

  getModelosActivos() : Observable<Modelo[]>{
    return this.http.get<Modelo[]>(`${this.apiUrl}/activas`);
  }

  createModelo(modelo : Modelo) : Observable<Modelo>{
    return this.http.post<Modelo>(this.apiUrl, modelo);
  }

  updateModelo(id:number, modelo:Modelo) : Observable<Modelo>{
    return this.http.put<Modelo>(`${this.apiUrl}/${id}`, modelo);
  }

  desactivarModelo(id:number) : Observable<void>{
    return this.http.put<void>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  activarModelo(id:number) : Observable<void>{
    return this.http.put<void>(`${this.apiUrl}/${id}/activar`, {});
  }
  
}
