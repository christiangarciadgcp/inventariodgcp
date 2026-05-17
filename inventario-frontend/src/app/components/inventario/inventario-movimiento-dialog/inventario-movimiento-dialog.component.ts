import { Component, OnInit, inject, Inject,signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { delay } from 'rxjs/operators';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { InventarioService } from '../../../services/inventario.service';
import { AuthService } from '../../../services/auth.service';
import { Mensaje } from '../../../core/mensaje';
import { Utils } from '../../../core/utils';

@Component({
  selector: 'app-inventario-movimiento-dialog',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, 
    MatButtonModule, MatIconModule
  ],
  templateUrl: './inventario-movimiento-dialog.component.html',
  styleUrl: './inventario-movimiento-dialog.component.css',
})
export class InventarioMovimientoDialogComponent implements OnInit{

  private fb = inject(FormBuilder);
  private inventarioService = inject(InventarioService);
  private authService = inject(AuthService);
  private mensaje = inject(Mensaje);
  public dialogRef = inject(MatDialogRef<InventarioMovimientoDialogComponent>);
  public sn = inject(Utils);

  public data = inject(MAT_DIALOG_DATA);

  form : FormGroup;
  bodegasOrigen = signal<any[]>([]);
  stockDisponible: number = 0;

  readonly ID_BODEGA_DESTINO = 1;

  constructor(){
    this.form = this.fb.group({
      bodegaOrigen : [null, Validators.required],
      cantidad : [this.data.cantidadFaltante, [Validators.required, Validators.min(1)]],
      motivo : [`Preparación para Presupuesto: ${this.data.idPresupuesto}`, Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarBodegasStock();

    this.form.get('bodegaOrigen')?.valueChanges
      .pipe(delay(0))
      .subscribe((inv : any) => {
        if(inv){
          this.stockDisponible = inv.cantidad_actual;

          const cantControl = this.form.get('cantidad');
          cantControl?.setValidators([
            Validators.required,
            Validators.min(1),
            Validators.max(this.stockDisponible)
          ]);
          cantControl?.updateValueAndValidity();
        }
      });
  }

  cargarBodegasStock(){
    this.inventarioService.listarStockPorProducto(this.data.idProducto).subscribe({
      next : data => {
        const bodegas = data.filter((d:any) => d.bodega.idBodega !== this.ID_BODEGA_DESTINO && d.cantidad_actual > 0);
        this.bodegasOrigen.set(bodegas);
      },
      error : () => this.mensaje.open('Error al cargar el inventario', 'error')
    });
  }

  guardarMovimiento(){
    if(this.form.invalid) return;

    const formVal = this.form.value;

    const movimientoDTO = {
      idBodegaOrigen : formVal.bodegaOrigen.bodega.idBodega,
      idBodegaDestino : this.ID_BODEGA_DESTINO,
      motivo : formVal.motivo,
      idUsuario : this.authService.getIdUsuarioActual(),
      items : [
        {
          idProducto : this.data.idProducto,
          cantidad : formVal.cantidad
        }
      ]
    };

    this.inventarioService.realizarMovimientoStockBodega(movimientoDTO).subscribe({
      next : () => {
        this.mensaje.open('Movimiento Realizado' , 'exito');
        this.dialogRef.close(true);
      },
      error : (err) => {
        const mensajeError = err.error?.mensaje || err.error?.message || 'Error en el movimiento';
        this.mensaje.open(mensajeError,'error');
      } 
    });
  }

}
