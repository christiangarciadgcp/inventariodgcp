import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { Mensaje } from '../../../core/mensaje';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private mensaje = inject(Mensaje)

  loginForm = this.fb.group({
    nombreusuario: ['', [Validators.required]],
    passwordusuario: ['', [Validators.required]]
  });

  hidePassword = true;
  isLoading = false;

  onSubmit() {
    if (this.loginForm.valid) {

      //Se limpia si hay un token en localstorage
      localStorage.removeItem('token');

      // Se bloquea el botón
      this.isLoading = true;
      this.cdr.detectChanges()

      const { nombreusuario, passwordusuario } = this.loginForm.value;

      this.authService.login(nombreusuario!, passwordusuario!).subscribe({
        next: () => {
          // Si es exitoso, el servicio redirige.
        },
        error: (err) => {
          // SI OCURRE UN ERROR (403, 401, 500)
          //console.warn('Error en login:', err.status);

          // Usamos setTimeout para salir del ciclo de detección de cambios actual
          setTimeout(() => {

            this.isLoading = false;
            this.cdr.detectChanges()

            let mensajeError = 'Error de conexión con el servidor';

            if (err.error && err.error.mensaje) {
              mensajeError = err.error.mensaje;
            }
            // 2. Si no hay mensaje del backend pero es un error de autenticación
            else if (err.status === 403 || err.status === 401) {
              mensajeError = 'Credenciales Incorrectas';
            }

            this.mensaje.open(mensajeError, 'error');


          }, 300); // Validar que las credenciales estan incorrectas
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
