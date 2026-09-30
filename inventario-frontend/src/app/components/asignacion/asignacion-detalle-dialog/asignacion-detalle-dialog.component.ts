import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AsignacionService } from '../../../services/asignacion.service';
import { AuthService } from '../../../services/auth.service';
import { Mensaje } from '../../../core/mensaje';
import { Utils } from '../../../core/utils';
import { Asignacion, AsignacionDetalle } from '../../../models/asignacion';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-asignacion-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatTableModule, MatTooltipModule
  ],
  templateUrl: './asignacion-detalle-dialog.component.html',
  styleUrls: ['./asignacion-detalle-dialog.component.css']
})
export class AsignacionDetalleDialogComponent implements OnInit {

  public dialogRef = inject(MatDialogRef<AsignacionDetalleDialogComponent>);
  private asignacionService = inject(AsignacionService);
  private authService = inject(AuthService);
  private mensaje = inject(Mensaje);
  private dialog = inject(MatDialog);
  public utils = inject(Utils);

  detalles = signal<AsignacionDetalle[]>([]);
  apruebaAsignaciones = signal<boolean>(false);

  displayedColumns: string[] = ['producto', 'serie', 'bodegaOrigen', 'estado'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: { asignacion: Asignacion }) {}

  ngOnInit(): void {
    const rol = this.authService.getRolUsuario();
    this.apruebaAsignaciones.set(rol === 'jefe utdi' || rol === 'administrador' || rol === 'coordinador utdi');

    if (this.data.asignacion?.idAsignacion) {
      this.asignacionService.listarDetalles(this.data.asignacion.idAsignacion).subscribe(d => this.detalles.set(d));
    }
  }

  aprobar(): void {
    const asignacion = this.data.asignacion;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: '¿Aprobar Asignación?',
        mensaje: `Se descontarán los equipos para el Acta <b>${asignacion.numeroActa}</b>.`,
        textoBoton: 'Aprobar Asignación',
        colorBoton: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const idUsuario = this.authService.getIdUsuarioActual();
        this.asignacionService.aprobarAsignacion(asignacion.idAsignacion!, idUsuario).subscribe({
          next: () => {
            this.mensaje.open('Asignación aprobada con éxito', 'exito');
            this.dialogRef.close(true); // Retorna true para refrescar la lista
          },
          error: (err) => this.mensaje.open(err.error?.mensaje || 'Error al aprobar', 'error')
        });
      }
    });
  }

  cancelar(): void {
    const asignacion = this.data.asignacion;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: '¿Cancelar Solicitud?',
        mensaje: `Al cancelar la asignación <b>${asignacion.numeroActa}</b>, ese número de acta quedará liberado para la siguiente solicitud procesada.`,
        textoBoton: 'Cancelar Asignación',
        colorBoton: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const idUsuario = this.authService.getIdUsuarioActual();
        this.asignacionService.cancelarAsignacion(asignacion.idAsignacion!, idUsuario).subscribe({
          next: () => {
            this.mensaje.open('Asignación cancelada y número liberado exitosamente', 'exito');
            this.dialogRef.close(true); // Retorna true para refrescar la lista
          },
          error: (err) => this.mensaje.open(err.error?.mensaje || 'Error al cancelar', 'error')
        });
      }
    });
  }

  obtenerTextoBadgeItem(estadoItem: string, estadoAsignacion?: string): string {
    if (estadoAsignacion === 'REGISTRADA') {
      return 'PENDIENTE';
    }
    return estadoItem || 'PENDIENTE';
  }

  obtenerClaseBadgeItem(estadoItem: string, estadoAsignacion?: string): string {
    const estado = this.obtenerTextoBadgeItem(estadoItem, estadoAsignacion);
    if (estado === 'PENDIENTE') return 'badge-pendiente';
    if (estado === 'ASIGNADO') return 'bg-success text-white';
    if (estado === 'DEVUELTO') return 'badge-devuelto';
    return 'bg-secondary text-white';
  }

  obtenerTextoBadgeAccion(accion: string): string {
    if (!accion) return '';
    const acc = accion.toUpperCase().trim();
    if (acc === 'DEVOLUCION TOTAL') {
      return 'DEVOLUCIÓN';
    }
    if (acc === 'DEVOLUCION PARCIAL') {
      return 'DEVOLUCIÓN';
    }
    if (acc.includes('DEVOLUCION')) {
      return 'DEVOLUCIÓN';
    }
    return acc;
  }

  esDevolucion(accion: string): boolean {
    if (!accion) return false;
    return accion.toUpperCase().includes('DEVOLUCION');
  }

  obtenerProductoDevuelto(detalle: string): string {
    if (!detalle) return '';
    if (detalle.includes('Devuelto equipo:')) {
      const parte = detalle.split('Devuelto equipo:')[1];
      return parte.includes(' a ') ? parte.split(' a ')[0].trim() : parte.trim();
    }
    if (detalle.includes('Devuelto:')) {
      const parte = detalle.split('Devuelto:')[1];
      return parte.includes(' a ') ? parte.split(' a ')[0].trim() : parte.trim();
    }
    if (this.detalles().length === 1) {
      return this.detalles()[0].producto?.nombreproducto || '';
    }
    return detalle;
  }

  obtenerTooltipProducto(detalleTexto: string): string {
    const nombre = this.obtenerProductoDevuelto(detalleTexto);
    if (!nombre) return '';

    const item = this.detalles().find(d =>
      d.producto?.nombreproducto?.trim().toLowerCase() === nombre.toLowerCase()
    );

    if (item?.producto) {
      const p = item.producto;
      const serie = p.serieproducto || 'S/N';
      const inv = p.inventarioproducto || 'S/I';
      return `${p.nombreproducto} | Serie: ${serie} | Inv: ${inv}`;
    }

    if (this.detalles().length === 1 && this.detalles()[0]?.producto) {
      const p = this.detalles()[0].producto;
      const serie = p.serieproducto || 'S/N';
      const inv = p.inventarioproducto || 'S/I';
      return `${p.nombreproducto} | Serie: ${serie} | Inv: ${inv}`;
    }

    return nombre;
  }

  obtenerIconoAccion(accion: string): string {
    switch (accion) {
      case 'CREACION': return 'note_add';
      case 'EDICION': return 'edit';
      case 'APROBACION': return 'verified';
      case 'DEVOLUCION PARCIAL':
      case 'DEVOLUCION TOTAL': return 'assignment_return';
      case 'CANCELACION': return 'close';
      default: return 'history';
    }
  }

  obtenerClaseTimeline(accion: string): string {
    switch (accion) {
      case 'CREACION': return 'tl-creacion';
      case 'EDICION': return 'tl-edicion';
      case 'APROBACION': return 'tl-aprobacion';
      case 'DEVOLUCION PARCIAL': return 'tl-parcial';
      case 'DEVOLUCION TOTAL': return 'tl-total';
      case 'CANCELACION': return 'tl-cancelacion';
      default: return 'tl-creacion';
    }
  }

  obtenerClaseBadgeAccion(accion: string): string {
    switch (accion) {
      case 'CREACION': return 'bg-creacion-subtle text-creacion';
      case 'EDICION': return 'bg-warning-subtle text-warning';
      case 'APROBACION': return 'bg-success-subtle text-success';
      case 'DEVOLUCION PARCIAL': return 'bg-parcial-subtle text-parcial';
      case 'DEVOLUCION TOTAL': return 'bg-info-subtle text-info';
      case 'CANCELACION': return 'bg-danger-subtle text-danger';
      default: return 'bg-creacion-subtle text-creacion';
    }
  }
}
