import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Marca } from '../models/marca';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class MarcaService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/marcas`;

  getMarcas() : Observable<Marca[]>{
    return this.http.get<Marca[]>(this.apiUrl);
  }

  getMarcasActivas() : Observable<Marca[]>{
    return this.http.get<Marca[]>(`${this.apiUrl}/activas`);
  }

  createMarca(marca : Marca) : Observable<Marca>{
    return this.http.post<Marca>(this.apiUrl, marca);
  }

  updateMarca(id:number, marca:Marca) : Observable<Marca>{
    return this.http.put<Marca>(`${this.apiUrl}/${id}`, marca);
  }

  desactivarMarca(id:number) : Observable<void>{
    return this.http.put<void>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  activarMarca(id:number){
    return this.http.put<void>(`${this.apiUrl}/${id}/activar`, {});
  }

}
