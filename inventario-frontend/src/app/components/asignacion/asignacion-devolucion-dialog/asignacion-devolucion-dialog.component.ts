import { Component, OnInit, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { AsignacionService } from '../../../services/asignacion.service';
import { BodegaService } from '../../../services/bodega.service';
import { AuthService } from '../../../services/auth.service';
import { Mensaje } from '../../../core/mensaje';
import { AsignacionDetalle } from '../../../models/asignacion';
import { Bodega } from '../../../models/bodega';
import {ConfirmDialogComponent} from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-asignacion-devolucion-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatSelectModule, MatInputModule,
    MatSlideToggleModule
  ],
  templateUrl: './asignacion-devolucion-dialog.component.html',
  styleUrls: ['./asignacion-devolucion-dialog.component.css']
})
export class AsignacionDevolucionDialogComponent implements OnInit {

  private fb = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<AsignacionDevolucionDialogComponent>);
  private asignacionService = inject(AsignacionService);
  private bodegaService = inject(BodegaService);
  private authService = inject(AuthService);
  private mensaje = inject(Mensaje);
  private dialog = inject(MatDialog);

  detallesPendientes = signal<AsignacionDetalle[]>([]);
  bodegasFisicas = signal<Bodega[]>([]);

  // Flag reactivo para controlar si se devuelven todos
  devolverTodo = signal<boolean>(false);

  form: FormGroup = this.fb.group({
    idAsignacionDetalle: [null, Validators.required],
    idBodegaDestino: [null, Validators.required],
    observacion: ['', Validators.required]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit(): void {
    this.asignacionService.listarDetalles(this.data.asignacion.idAsignacion).subscribe(detalles => {
      const pendientes = detalles.filter(d => d.estado === 'ASIGNADO');
      this.detallesPendientes.set(pendientes);

      // Si solo hay un equipo pendiente, se preselecciona automáticamente
      if (pendientes.length === 1) {
        this.form.get('idAsignacionDetalle')?.setValue(pendientes[0].idAsignacionDetalle);
      }
    });

    this.bodegaService.getBodegasActivas().subscribe(bodegas => {
      this.bodegasFisicas.set(bodegas.filter(b => b.bodegaTipo?.idBodegaTipo === 2));
    });
  }

  toggleDevolverTodo(checked: boolean): void {
    this.devolverTodo.set(checked);
    const detalleCtrl = this.form.get('idAsignacionDetalle');

    if (checked) {
      detalleCtrl?.clearValidators();
      detalleCtrl?.setValue(null);
    } else {
      detalleCtrl?.setValidators([Validators.required]);
      if (this.detallesPendientes().length === 1) {
        detalleCtrl?.setValue(this.detallesPendientes()[0].idAsignacionDetalle);
      }
    }
    detalleCtrl?.updateValueAndValidity();
  }

  confirmarDevolucion(): void {
    if (this.form.invalid) return;

    const idUsuario = this.authService.getIdUsuarioActual();
    const idBodegaDestino = this.form.value.idBodegaDestino;
    const observacion = this.form.value.observacion;

    if (this.devolverTodo()) {
      // Proceso en bloque
      const dto = {
        idAsignacion: this.data.asignacion.idAsignacion,
        idBodegaDestino: idBodegaDestino,
        idUsuario: idUsuario,
        observacion: observacion
      };

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '500px',
        data: {
          titulo: '¿Desea devolver todos los equipos asignados?',
          mensaje: 'Los Equipos se agregarán a la bodega seleccionada',
          textoBoton: 'Aprobar',
          colorBoton: 'primary'
        }
      });

      dialogRef.afterClosed().subscribe(confirmado => {
        if (confirmado) {
          this.asignacionService.devolverTodosEquipos(dto).subscribe({
            next: () => {
              this.mensaje.open('Devolución total procesada con éxito', 'exito');
              this.dialogRef.close(true);
            },
            error: (err) => this.mensaje.open(err.error?.mensaje || 'Error en la devolución total', 'error')
          });
        }
      });
    } else {
      // Proceso individual
      const dto = {
        idAsignacionDetalle: this.form.value.idAsignacionDetalle,
        idBodegaDestino: idBodegaDestino,
        idUsuario: idUsuario,
        observacion: observacion
      };

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          titulo: '¿Desea devolver este equipo?',
          mensaje: 'El Equipo se agregará a la bodega seleccionada',
          textoBoton: 'Aprobar',
          colorBoton: 'primary'
        }
      });

      dialogRef.afterClosed().subscribe(confirmado => {
        if (confirmado) {
          this.asignacionService.devolverEquipo(dto).subscribe({
            next: () => {
              this.mensaje.open('Devolución individual procesada con éxito', 'exito');
              this.dialogRef.close(true);
            },
            error: (err) => this.mensaje.open(err.error?.mensaje || 'Error en la devolución', 'error')
          });
        }
      });
    }
  }
}
