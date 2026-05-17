import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ubicacion } from '../models/ubicacion';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class UbicacionService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ubicaciones`;

  listarTodos(): Observable<Ubicacion[]> {
    return this.http.get<Ubicacion[]>(`${this.apiUrl}`);
  }
  
}
