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

  createProducto(dto: any, archivos: File[]): Observable<any> {
    const formData = new FormData();

    // Spring Boot espera el DTO como un Blob tipo JSON
    formData.append('producto', new Blob([JSON.stringify(dto)], { type: 'application/json' }));

    if (archivos && archivos.length > 0) {
      archivos.forEach(archivo => {
        formData.append('imagenes', archivo);
      });
    }

    return this.http.post(`${this.apiUrl}`, formData);
  }

  updateProducto(id: number, dto: any, archivos: File[]): Observable<any> {
    const formData = new FormData();
    formData.append('producto', new Blob([JSON.stringify(dto)], { type: 'application/json' }));

    if (archivos && archivos.length > 0) {
      archivos.forEach(archivo => {
        formData.append('imagenes', archivo);
      });
    }

    return this.http.put(`${this.apiUrl}/${id}`, formData);
  }

  desactivarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  activarProducto(id: number) {
    return this.http.put<void>(`${this.apiUrl}/${id}/activar`, {});
  }

  eliminarImagenProducto(idImagen: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/imagen/${idImagen}`);
  }

  subirExcelMasivo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/carga-masiva`, formData);
  }
}
