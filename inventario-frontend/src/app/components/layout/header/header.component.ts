import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../services/auth.service';
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Utils } from '../../../core/utils';
import { MatDialog } from '@angular/material/dialog';
import { UsuarioService } from '../../../services/usuario.service';
import { Mensaje } from '../../../core/mensaje';
import { CambiarPasswordDialogComponent } from '../../usuario/cambiar-password-dialog/cambiar-password-dialog.component';
import {NotificationService} from '../../../services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    BreadcrumbComponent,
    MatCardModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  private fn = inject(Utils);
  private dialog = inject(MatDialog);
  private usuarioService = inject(UsuarioService);
  private mensaje = inject(Mensaje);
  private notificacionService = inject(NotificationService);
  private router = inject(Router);

  nombreUsuario: string = '';
  rolUsuario: string = '';
  avatarUrl: string = '';

  notificaciones = signal<any[]>([]);
  noLeidas = signal<number>(0);

  private idUsuarioActual: number = 0;
  private subRouter!: Subscription;

  ngOnInit(): void {
    const usuarioActual = this.authService.getUsuarioActual();
    this.idUsuarioActual = this.authService.getIdUsuarioActual();
    this.nombreUsuario = this.fn.formatearNombre(usuarioActual);

    //Obtener Rol
    const rolActual = this.authService.getRolUsuario();
    this.rolUsuario = this.fn.formatearNombre(rolActual);

    this.avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.nombreUsuario)}&background=random&color=fff`;

    this.cargarNotificaciones();

    this.subRouter = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.cargarNotificaciones();
    });
  }

  cargarNotificaciones() {
    this.notificacionService.obtenerNotificaciones(this.idUsuarioActual).subscribe({
      next: (res) => {
        this.notificaciones.set(res.notificaciones);
        this.noLeidas.set(res.noLeidas);
      }
    });
  }

  marcarLeidas() {
    if (this.noLeidas() === 0) return;

    this.notificacionService.marcarComoLeidas(this.idUsuarioActual).subscribe({
      next: () => {
        this.noLeidas.set(0);

        const actualizadas = this.notificaciones().map(n => ({ ...n, leida: true }));
        this.notificaciones.set(actualizadas);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subRouter) this.subRouter.unsubscribe();
  }

  abrirCambiarPassword(event : Event){
    event.preventDefault();

    const dialogRef = this.dialog.open(CambiarPasswordDialogComponent,{
      width : '400px',
      disableClose : true
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        const idUsuarioActual = this.authService.getIdUsuarioActual();

        const passwordDTO = {
          passwordActual : result.passwordActual,
          nuevaPassword : result.nuevaPassword
        };

        this.usuarioService.cambiarPassword(idUsuarioActual,passwordDTO).subscribe({
          next : () => {
            this.mensaje.open('Contraseña actualizada exitosamente', 'exito');
          },
          error : (err) => {
            const msg = err.error?.mensaje || 'La contraseña actual no es correcta';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }

  cerrarSesion(event: Event) {
    event.preventDefault();
    this.authService.logout();
  }
}
