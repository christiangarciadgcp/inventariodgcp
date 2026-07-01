import { Component, OnInit, inject, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../../services/auth.service';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { PresupuestoRevisionItem } from '../../../models/presupuesto';
import { Mensaje } from '../../../core/mensaje';
import { Utils } from '../../../core/utils';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-presupuesto-aprobacion',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatTooltipModule
    ],
  templateUrl: './presupuesto-aprobacion.component.html',
  styleUrl: './presupuesto-aprobacion.component.css',
})
export class PresupuestoAprobacionComponent implements OnInit {

  private presupuestoService = inject(PresupuestoService);
  public utils = inject(Utils);
  private mensaje = inject(Mensaje);
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<PresupuestoAprobacionComponent>);
  private dialog = inject(MatDialog);
  private data = inject(MAT_DIALOG_DATA);

  itemsSolicitados = signal<PresupuestoRevisionItem[]>([]);
  cargando = signal<boolean>(true);

  idPresupuesto : number = 0;
  usuarioPresupuesto : string = '';
  displayedColumns: string[] = ['producto', 'solicitado', 'stockGlobal', 'viabilidad'];

  ngOnInit() {
    if(this.data && this.data.idPresupuesto){
      this.idPresupuesto = this.data.idPresupuesto;
      this.usuarioPresupuesto = this.utils.formatearNombre(this.data.nombreusuario);
      this.cargarDatos(this.idPresupuesto);
    }
  }

  cargarDatos(id: number) {
    this.cargando.set(true);
    this.presupuestoService.obtenerDetalleRevision(id).subscribe({
      next: (data) => {
        this.itemsSolicitados.set(data);
        this.cargando.set(false);
      },
      error: (error) => {
        console.log(error);
        this.cargando.set(false);
      }
    });
  }

  cerrarModal() {
    this.dialogRef.close();
  }

  aprobarSolicitud(){
    const idUsuario = this.authService.getIdUsuarioActual();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: '¿Desea aprobar este presupuesto?',
        mensaje: 'La solicitud pasará a estado APROBADO',
        textoBoton: 'Aprobar',
        colorBoton: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.presupuestoService.aprobarPresupuesto(this.idPresupuesto, idUsuario).subscribe({
          next : () => {
            this.mensaje.open('Presupuesto ha sido aprobado', 'exito');
            this.dialogRef.close({ accion: 'recargar', tabDestino: 1 });
          },
          error: (err) => {
            const msg = err.error?.mensaje || 'No se pudo aprobar este presupuesto';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }

  cancelarSolicitud(){
    const idUsuario = this.authService.getIdUsuarioActual();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: '¿Desea cancelar este presupuesto?',
        mensaje: 'La solicitud pasará a estado CANCELADO.',
        textoBoton: 'Rechazar',
        colorBoton: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.presupuestoService.cancelarPresupuesto(this.idPresupuesto, idUsuario).subscribe({
          next : () => {
            this.mensaje.open('Presupuesto ha sido cancelado', 'exito');
            this.dialogRef.close({ accion: 'recargar', tabDestino: 0 });
          },
          error: (err) => {
            const msg = err.error?.mensaje || 'No se pudo Cancelar este presupuesto';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }
}
