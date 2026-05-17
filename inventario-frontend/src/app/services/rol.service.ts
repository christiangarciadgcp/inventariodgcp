import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Rol } from '../models/rol';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class RolService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/roles`;

  getRoles() : Observable<Rol[]>{
    return this.http.get<Rol[]>(this.apiUrl);
  }
  
}
