import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  
  const token = localStorage.getItem('token');
  const router = inject(Router);

  //const esLogin = req.url.includes('/api/auth');
  const url = req.url.toLowerCase();

  if (token && !url.includes('/auth')) { 
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 403 || error.status === 401) {
        // Si el error no viene del login, cerramos sesión
        if (!url) { 
            localStorage.removeItem('token');
            router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};