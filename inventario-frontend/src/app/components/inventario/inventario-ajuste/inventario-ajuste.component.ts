import { Component, Inject, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';

import { InventarioService } from '../../../services/inventario.service';
import { AuthService } from '../../../services/auth.service';
import { map } from 'rxjs';
import { Mensaje } from '../../../core/mensaje'
import { Utils } from '../../../core/utils';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-inventario-ajuste',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, MatDialogModule,
    MatButtonModule, MatInputModule, MatFormFieldModule, MatIconModule
  ],
  templateUrl: './inventario-ajuste.component.html',
  styleUrls: ['./inventario-ajuste.component.css']
})
export class InventarioAjusteComponent {

  private fb = inject(FormBuilder);
  private inventarioService = inject(InventarioService);
  private authService = inject(AuthService);
  public dialogRef = inject(MatDialogRef<InventarioAjusteComponent>);
  private mensaje = inject(Mensaje);
  private dialog = inject(MatDialog);
  public sn = inject(Utils);


  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  // Control del Tipo de Acción
  tipoAccion = signal<'ENTRADA' | 'SALIDA'>('ENTRADA');

  // Formulario
  form = this.fb.group({
    cantidad: [null, [Validators.required, Validators.min(1), Validators.pattern('[0-9]+$')]],
    motivo: ['', [Validators.required]]
  });

  // --- SOLUCIÓN DE REACTIVIDAD ---
  // Convertimos el flujo de valores del formulario en una Signal
  cantidadSignal = toSignal(
    this.form.get('cantidad')!.valueChanges.pipe(
      map(valor => Number(valor) || 0) // Si es null/undefined, devuelve 0
    ),
    { initialValue: 0 }
  );

  // Calculamos el stock final proyectado en tiempo real
  nuevoStockProyectado = computed(() => {
    // Ahora dependemos de cantidadSignal() en lugar de this.form.value
    const cant = Number(this.cantidadSignal()) || 0;
    const actual = this.data.cantidadActual;

    if (this.tipoAccion() === 'ENTRADA') {
      return actual + cant;
    } else {
      return actual - cant;
    }
  });

  guardarAjuste() {
    if (this.form.get('cantidad')?.invalid || this.form.get('motivo')?.invalid) {
      this.form.markAllAsTouched();
      this.mensaje.open('Complete los campos requeridos', 'warning');
      return;
    }

    const cantidad = this.form.value.cantidad;
    const nuevoStock = this.nuevoStockProyectado();

    if (nuevoStock < 0) {
      this.mensaje.open('Error: El ajuste excede el stock disponible.', 'warning');
      return;
    }

    const ajusteDTO = {
      idProducto: this.data.producto.idProducto,
      idBodega: this.data.idBodega,
      cantidad: cantidad,
      tipoMovimiento: this.tipoAccion(),
      idUsuario: this.authService.getIdUsuarioActual(),
      motivo: this.form.value.motivo
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: '¿Está seguro de realizar este ajuste?',
        mensaje: 'Esta acción no se puede deshacer',
        textoBoton: 'Aceptar',
        colorBoton: 'primary'
      }
    });
    dialogRef.afterClosed().subscribe(confirmado => {
      if(confirmado){
        this.inventarioService.realizarAjuste(ajusteDTO).subscribe({
          next: () => {
            this.mensaje.open('Ajuste realizado exitosamente', 'exito');
            this.dialogRef.close(true);
          },
          error: (err) => {
            const msg = err.error?.mensaje || err.error?.message || 'Error en el ajuste';
            this.mensaje.open('Error: ' + msg, 'error');
          }
        });
      }
    });
  }

  setTipo(tipo: 'ENTRADA' | 'SALIDA') {
    this.tipoAccion.set(tipo);
  }

}
