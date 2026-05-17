import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Utils } from '../../../core/utils';
import { MatDialog } from '@angular/material/dialog';
import { UsuarioService } from '../../../services/usuario.service';
import { Mensaje } from '../../../core/mensaje';
import { CambiarPasswordDialogComponent } from '../../usuario/cambiar-password-dialog/cambiar-password-dialog.component';

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
export class HeaderComponent implements OnInit{

  private authService = inject(AuthService);
  private fn = inject(Utils);
  private dialog = inject(MatDialog);
  private usuarioService = inject(UsuarioService);
  private mensaje = inject(Mensaje);

  nombreUsuario: string = '';
  rolUsuario: string = '';
  avatarUrl: string = '';

  ngOnInit(): void {
    const usuarioActual = this.authService.getUsuarioActual();
    this.nombreUsuario = this.fn.formatearNombre(usuarioActual);

    //Obtener Rol (NUEVO)
    const rolActual = this.authService.getRolUsuario();
    this.rolUsuario = this.fn.formatearNombre(rolActual);


    this.avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.nombreUsuario)}&background=random&color=fff`;
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