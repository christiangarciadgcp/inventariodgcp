import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario, UsuarioRegistroDTO } from '../models/usuario';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  listarUsuarios() : Observable<Usuario[]>{
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  registrarUsuario(dto: UsuarioRegistroDTO): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, dto);
  }
  
  // Actualizar Usuario (Solo Rol y Estado)
  actualizarUsuario(id: number, datos: { idrol: number, activo: boolean }): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, datos);
  }

  // Cambiar estado Activo/Inactivo
  cambiarEstado(id: number, activo: boolean): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/estado?activo=${activo}`, {});
  }

  // Resetear Contraseña
  resetearPassword(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/reset-password`, {});
  }

  cambiarPassword(id:number, datos : {passwordActual:string, nuevaPassword:string}) : Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/password`, datos);
  }
}
