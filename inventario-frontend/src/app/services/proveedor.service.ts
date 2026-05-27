import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proveedor } from '../models/proveedor';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ProveedorService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/proveedores`;

  getProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl);
  }

  getProveedoresActivos() : Observable<Proveedor[]>{
    return this.http.get<Proveedor[]>(`${this.apiUrl}/activos`);
  }

  createProveedor(proveedor: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, proveedor);
  }

  updateProveedor(id: number, proveedor: Proveedor): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, proveedor);
  }

  deleteProveedor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  desactivarProveedor(id:number) : Observable<void>{
    return this.http.put<void>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  activarProveedor(id:number){
    return this.http.put<void>(`${this.apiUrl}/${id}/activar`, {});
  }

}
