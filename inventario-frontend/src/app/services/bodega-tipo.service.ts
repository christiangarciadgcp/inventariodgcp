import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BodegaTipo } from '../models/bodega-tipo';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class BodegaTipoService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tipobodegas`;

  getTiposBodegas() : Observable<BodegaTipo[]> {
    return this.http.get<BodegaTipo[]>(this.apiUrl);
  }

}
