import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bodega } from '../models/bodega';

@Injectable({
  providedIn: 'root',
})
export class InventarioService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/inventario`;

  constructor() {}

  listarBodegas() : Observable<Bodega[]>{
    return this.http.get<Bodega[]>(`${this.apiUrl}/bodegas`);
  }

  listarInventarioPorBodega(idBodega: number) : Observable<any[]>{
    return this.http.get<any[]>(`${this.apiUrl}/bodega/${idBodega}`);
  }

  /* Ver el Stock de un producto para realizar un movimiento rapido */
  listarStockPorProducto(idProducto : number) : Observable<any[]>{
    return this.http.get<any[]>(`${this.apiUrl}/producto/${idProducto}`);
  }

  getDashboard() : Observable<any>{
    return this.http.get<any>(`${environment.apiUrl}/dashboard/resumen`);
  }

  realizarAjuste(ajuste: any): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/ajuste`, ajuste);
  }

  realizarMovimientoBodega(movimiento : any) : Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/movimiento`, movimiento);
  }

  realizarMovimientoStockBodega(movimientoStock : any) : Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/movimientostock`, movimientoStock)
  }

  realizarDescargo(Descargo : any) : Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/descargo`, Descargo)
  }

}
  