import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Mensaje } from '../core/mensaje';

export const permisosGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const mensaje = inject(Mensaje);

  const rol = authService.getRolUsuario();

  const expectedRoles = route.data?.['roles'] as Array<string>; 

  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  // Verificamos si el rol del usuario está dentro de los permitidos para esta ruta
  if (expectedRoles.includes(rol)) {
    return true;
  } else {
    // Si no tiene permiso, lo mandamos al dashboard con un mensaje
    mensaje.open('No tienes permisos para acceder a esta sección', 'warning',);
    router.navigate(['/dashboard']);
    return false;
  }
};