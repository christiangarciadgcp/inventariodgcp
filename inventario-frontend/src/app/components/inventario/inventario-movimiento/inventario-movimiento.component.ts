
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { InventarioService } from '../../../services/inventario.service';
import { AuthService } from '../../../services/auth.service';
import { Mensaje } from '../../../core/mensaje';
import { Bodega } from '../../../models/bodega';

@Component({
  selector: 'app-inventario-movimiento',
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, 
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, 
    MatSelectModule, MatIconModule, RouterLink, MatDividerModule
  ],
  templateUrl: './inventario-movimiento.component.html',
  styleUrl: './inventario-movimiento.component.css',
})
export class InventarioMovimientoComponent implements OnInit{

  private fb = inject(FormBuilder);
  private inventarioService = inject(InventarioService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private mensaje = inject(Mensaje)

  listaBodegas = signal(<Bodega[]>([]));
  productosOrigen = signal(<any[]>([]));

  stockDisponible = 0; 

  form = this.fb.group({
    bodegaOrigen: [null, Validators.required],
    bodegaDestino: [null, Validators.required],
    producto: [null, Validators.required],
    cantidad: [null, [Validators.required, Validators.min(1)]],
    motivo: ['', Validators.required]
  });

  get productoSeleccionado(): any {
    return this.form.get('producto')?.value;
  }

  ngOnInit(): void {
    this.cargarBodegas();

    this.form.get('bodegaOrigen')?.valueChanges.subscribe((idBodega : any) => {
      if(idBodega){
        this.cargarProductosOrigen(idBodega);
        this.form.get('producto')?.setValue(null);
        this.stockDisponible=0;
      }
    });

    this.form.get('producto')?.valueChanges.subscribe((producto: any) => {
      if (producto) {
        this.stockDisponible = producto.cantidad_actual;
        // Validar que la cantidad no exceda
        this.form.get('cantidad')?.setValidators([
            Validators.required, 
            Validators.min(1), 
            Validators.max(this.stockDisponible)
        ]);
        this.form.get('cantidad')?.updateValueAndValidity();
      }
    });

  }

  cargarBodegas() {
    this.inventarioService.listarBodegas().subscribe(
    data => this.listaBodegas.set(data)
    );
  }

  cargarProductosOrigen(idBodega : number){
    this.inventarioService.listarInventarioPorBodega(idBodega).subscribe( data => {
      const stockDisponible = data.filter(item => item.cantidad_actual > 0);
      this.productosOrigen.set(stockDisponible);
    });
  }

  guardarTransferencia() {
    if (this.form.invalid) return;

    const values = this.form.value;

    const idUser = this.authService.getIdUsuarioActual();
    
    if (!idUser) {
        this.mensaje.open('Error: No se pudo identificar al usuario. Inicie sesión nuevamente.', 'error');
        return;
    }

    if (values.bodegaOrigen === values.bodegaDestino) {
        this.mensaje.open('La bodega de origen y destino deben ser diferentes', 'warning');
        return;
    }

    const dto = {
      idBodegaOrigen: values.bodegaOrigen,
      idBodegaDestino: values.bodegaDestino,
      idProducto: (values.producto as any).producto.idProducto, // El select guarda el objeto inventario completo
      cantidad: values.cantidad,
      idUsuario: idUser,
      motivo: values.motivo
    };

    this.inventarioService.realizarMovimientoBodega(dto).subscribe({
      next: () => {
        this.mensaje.open('Movimiento realizado con éxito', 'exito');
        this.router.navigate(['/inventario']);
      },
      error: (err) => {
        console.error(err);
        this.mensaje.open('Error en Movimiento: ' + err.message, 'error');
      }
    });
  }

}
