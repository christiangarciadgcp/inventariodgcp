import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  isAuthenticated = signal<boolean>(!!this.getToken());

  private actividadSubject = new Subject<void>();
  public actividad$ = this.actividadSubject.asObservable();

  notificarActividad() {
    this.actividadSubject.next();
  }

  login(nombreusuario: string, passwordusuario: string) {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { 
      nombreusuario, 
      passwordusuario 
    }).pipe(
      tap(response => {
        //Guardamos el token en el navegador
        localStorage.setItem('token', response.token);
        
        //Actualizamos el estado de la app
        this.isAuthenticated.set(true);
        
        //Redirigimos al inventario o dashboard
        this.router.navigate(['/dashboard']); 
      })
    );
  }

  // Método para obtener el nombre de usuario desde el Token JWT
  getUsuarioActual(): string {
    const token = this.getToken();
    if (!token) return 'Usuario';

    try {
      // El token tiene 3 partes separadas por puntos. La segunda es el Payload.
      const payload = token.split('.')[1];
      // Decodificamos Base64 a texto y luego a JSON
      const decoded = JSON.parse(atob(payload));
      
      // En Spring Security, el usuario suele venir en el campo 'sub'
      return decoded.sub || 'Usuario';
    } catch (e) {
      console.error('Error decodificando token', e);
      return 'Usuario';
    }
  }

  // Método para obtener el ID de usuario desde el Token JWT
  getIdUsuarioActual() : number {
    const token = this.getToken();
    if (!token) return 0;

    try{
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));

      return decoded.idUsuario || 0;
    }catch(e){
      console.error('Error decodificando token', e);
      return 0;
    }
  }

  // Obtener el ROL del usuario desde el Token
  getRolUsuario(): string {
    const token = this.getToken();
    if (!token) return 'Usuario';

    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      
      return decoded.rol || 'Usuario';
    } catch (e) {
      console.error('Error obteniendo rol', e);
      return 'Usuario';
    }
  }

  logout() {
    localStorage.removeItem('token');
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Método simple para verificar si hay sesión
  isLoggedIn(): boolean {
    return !!this.getToken(); 
  }

  refreshToken() {
    const token = this.getToken();

    const headers = { 'Authorization': `Bearer ${token}` };
    
    return this.http.post<{ token: string }>(`${this.apiUrl}/refresh`, {}, { headers }).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
      })
    );
  }

  getTokenExpirationDate(): Date | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));

      if (decoded.exp === undefined) return null;

      const date = new Date(0);
      date.setUTCSeconds(decoded.exp);
      return date;
    } catch (e) {
      return null;
    }
  }

}
