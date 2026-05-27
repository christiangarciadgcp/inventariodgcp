import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categoria } from '../models/categoria';
import { environment } from '../../environments/environment.development';
import {Marca} from '../models/marca';

@Injectable({
  providedIn: 'root',
})
export class CategoriaService {

  private apiUrl = `${environment.apiUrl}/categorias`;

  constructor(private http: HttpClient) { }

  // Listar todas
  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.apiUrl);
  }

  getCategoriasActivas() : Observable<Categoria[]>{
    return this.http.get<Categoria[]>(`${this.apiUrl}/activas`);
  }

  // Obtener por ID
  getCategoria(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}/${id}`);
  }

  // Crear
  createCategoria(categoria: Categoria): Observable<Categoria> {
    return this.http.post<Categoria>(this.apiUrl, categoria);
  }

  //actualizar
  actualizarCategoria(id:number, categoria: Categoria): Observable<Categoria>{
    return this.http.put<Categoria>(`${this.apiUrl}/${id}`, categoria)
  }

  // delete
  deleteCategoria(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  desactivarCategoria(id:number) : Observable<void>{
    return this.http.put<void>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  activarCategoria(id:number){
    return this.http.put<void>(`${this.apiUrl}/${id}/activar`, {});
  }
}
