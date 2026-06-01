import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {ProductoSugerencia, ProductoSugerenciaRegistroDTO} from '../models/sugerencia';


@Injectable({
  providedIn: 'root',
})
export class SugerenciaService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sugerencias`;

  getProductosSugeridos() : Observable<ProductoSugerencia[]> {
    return this.http.get<ProductoSugerencia[]>(this.apiUrl);
  }

  getProductosSugeridosPorUsuario(idUsuario: number) : Observable<ProductoSugerencia[]>{
    return this.http.get<ProductoSugerencia[]>(`${this.apiUrl}/usuario/${idUsuario}`);
  }

  crearSugerencia(dto: ProductoSugerenciaRegistroDTO): Observable<ProductoSugerencia> {
    return this.http.post<ProductoSugerencia>(this.apiUrl, dto);
  }

  cambiarEstado(idSugerencia: number, estado: string, comentario: string = ''): Observable<ProductoSugerencia> {
    return this.http.put<ProductoSugerencia>(`${this.apiUrl}/${idSugerencia}/estado`, { estado, comentario });
  }

  eliminarSugerencia(idSugerencia: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idSugerencia}`);
  }

}
