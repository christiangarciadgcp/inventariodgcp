import { Component, OnInit, inject, signal, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatFormFieldModule } from '@angular/material/form-field';

import { UsuarioService } from '../../../services/usuario.service';
import { Usuario, UsuarioRegistroDTO } from '../../../models/usuario';
import { UsuarioDialogComponent } from '../usuario-dialog/usuario-dialog.component';
import { RouterLink } from '@angular/router';
import { Mensaje } from '../../../core/mensaje';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-usuario-list',
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule, 
    MatIconModule, MatDialogModule, MatSnackBarModule, MatCardModule,MatTooltipModule, RouterLink,
    MatSlideToggleModule, MatFormFieldModule, MatSortModule
  ],
  templateUrl: './usuario-list.component.html',
  styleUrl: './usuario-list.component.css',
})
export class UsuarioListComponent implements OnInit {

  displayedColumns: string[] = ['id', 'nombre', 'rol','actividad', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Usuario>([]);
  usuarios = signal<Usuario[]>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private usuarioService = inject(UsuarioService);
  private dialog = inject(MatDialog);
  private mensaje = inject(Mensaje);

  constructor() {
    effect(() => {
      this.dataSource.data = this.usuarios();
      if (this.paginator) this.dataSource.paginator = this.paginator;
      if(this.sort) this.dataSource.sort = this.sort;
    });

    this.dataSource.sortingDataAccessor = (item : Usuario, property : string) => {
      switch(property){
        case 'id':
          return item.idUsuario;
        case 'nombre':
          return item.nombreusuario;
        case 'rol':
          return item.rol.nombrerol;
        default:
          return (item as any)[property];
      }
    };
  }

  ngOnInit(): void {
    this.cargarUsuarios();

    this.dataSource.filterPredicate = (data: Usuario, filter: string) => {
      // Filtrar por nombre, id o IP
      const searchStr = (data.nombreusuario + data.idUsuario + (data.ultimaIp || '')).toLowerCase();
      return searchStr.includes(filter);
    };
  }

  cargarUsuarios() {
    this.usuarioService.listarUsuarios().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.dataSource.paginator = this.paginator;
      },
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.message || 'Error al cargar usuarios';
        this.mensaje.open(msg, 'warning');
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }


  cambiarEstado(usuario: Usuario, event: any) {
    const nuevoEstado = event.checked;

    event.source.checked = !nuevoEstado;

    const accionTexto = nuevoEstado ? 'activar' : 'desactivar';
    const estadoTexto = nuevoEstado ? 'ACTIVO' : 'INACTIVO';
    const colorAccion = nuevoEstado ? 'primary' : 'warn';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {

      width: '450px',
      data: { 
        titulo: `¿Deseas ${accionTexto} este usuario?`, 
        mensaje: `El usuario pasará a estado ${estadoTexto}.`, 
        textoBoton: 'Aceptar',
        colorBoton: colorAccion
      } 
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if(confirmado){

        this.usuarioService.cambiarEstado(usuario.idUsuario!, nuevoEstado).subscribe({
          next: () => {
            usuario.estado = nuevoEstado; 
            event.source.checked = nuevoEstado;
            const texto = nuevoEstado ? 'Activado' : 'Desactivado';
            this.mensaje.open(`Usuario ${texto} correctamente`, 'exito');
          },
          error: () => {
            event.source.checked = !nuevoEstado; // Revertir toggle si falla
            this.mensaje.open('Error al cambiar el estado', 'error');
          }
        });
      }
    });
  }

  resetearClave2(usuario: Usuario) {
    if(confirm(`¿Deseas resetear la contraseña del usuario ${usuario.nombreusuario}?`)) {
      this.usuarioService.resetearPassword(usuario.idUsuario!).subscribe({
        next: () => this.mensaje.open('Contraseña reseteada exitosamente', 'exito'),
        error: () => this.mensaje.open('Error al resetear contraseña', 'error')
      });
    }
  }

  restablecerPassword(usuario: Usuario ){
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: { 
        titulo: `¿Deseas restablecer la contraseña del usuario ${usuario.nombreusuario}?`, 
        mensaje: ' ', 
        textoBoton: 'Restablecer',
        colorBoton: 'primary'
      } 
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if(confirmado){
        this.usuarioService.resetearPassword(usuario.idUsuario!).subscribe({
          next: () => {
            this.mensaje.open('Contraseña restablecida exitosamente', 'exito');
          },
          error: (err) => {
            const msg = err.error?.mensaje || 'Error al restablecer contraseña';
            this.mensaje.open(msg, 'error');
          }
        });
    }
  });
}

  obtenerIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const partes = nombre.split('.');
    return partes.length > 1 
      ? (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase() 
      : nombre.substring(0, 2).toUpperCase();
  }

  usuarioForm(usuario? : Usuario) {
    const dialogRef = this.dialog.open(UsuarioDialogComponent, { 
      width: '400px',
      // Pasamos el usuario completo si existe
      data: usuario ? { usuario: usuario } : null 
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (usuario) {
          this.actualizarUsuario(usuario.idUsuario!, result);
        } else {
          this.registrarUsuario(result);
        }
      }
    });
  }

  actualizarUsuario(id: number, datos: any) {
    const dto = {
      idrol: datos.idrol,
      activo: datos.activo
    };

    this.usuarioService.actualizarUsuario(id, dto).subscribe({
      next: () => {
        this.mensaje.open('Usuario actualizado con éxito', 'exito');
        this.cargarUsuarios(); // Recarga la tabla
      },
      error: () => this.mensaje.open('Error al actualizar usuario', 'error')
    });
  }

  registrarUsuario(datos: any) {
    const dto: UsuarioRegistroDTO = {
        nombreusuario: datos.nombreusuario,
        passwordusuario: datos.passwordusuario,
        idrol: datos.idrol
    };

    this.usuarioService.registrarUsuario(dto).subscribe({
        next: () => {
          this.mensaje.open('Usuario creado con éxito', 'exito');
          this.cargarUsuarios();
        },
        error: (e) => {
            console.error(e);
            this.mensaje.open('Error al crear usuario', 'error');
        }
    });
  }

  obtenerClaseRol(rol: string): string {
    switch (rol) {
      case 'administrador':
        return 'role-admin';
      case 'jefe utdi':
        return 'role-jefe';
      case 'inventario utdi':
        return 'role-inventario';
      case 'tecnico utdi':
        return 'role-tecnico';
      default:
        return 'role-default';
    }
  }

}
