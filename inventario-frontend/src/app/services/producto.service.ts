import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, ProductoRegistroDTO } from '../models/producto';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/productos`;

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  getProductosActivos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/activos`);
  }

  buscarPorNombre(nombre: string): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/buscar?nombre=${nombre}`);
  }

  createProducto(dto: ProductoRegistroDTO): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, dto);
  }

  updateProducto(id:number, dto:ProductoRegistroDTO) : Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`,dto);
  }

  desactivarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  activarProducto(id: number) {
    return this.http.put<void>(`${this.apiUrl}/${id}/activar`, {});
  }
}
