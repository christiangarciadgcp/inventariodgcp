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
import { MatTableModule } from '@angular/material/table';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';

import { InventarioService } from '../../../services/inventario.service';
import { AuthService } from '../../../services/auth.service';
import { Mensaje } from '../../../core/mensaje';
import { Bodega } from '../../../models/bodega';
import { Utils } from '../../../core/utils';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-inventario-movimiento-stock',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatIconModule, RouterLink, MatDividerModule, MatTableModule,
    MatAutocompleteModule
  ],
  templateUrl: './inventario-movimiento-stock.component.html',
  styleUrl: './inventario-movimiento-stock.component.css'
})
export class InventarioMovimientoStockComponent implements OnInit {

  private fb = inject(FormBuilder);
  private inventarioService = inject(InventarioService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private mensaje = inject(Mensaje);
  public sn = inject(Utils);
  private dialog = inject(MatDialog);

  listaBodegas = signal<Bodega[]>([]);
  productosOrigen = signal<any[]>([]);
  productosFiltrados = signal<any[]>([]);
  detallesAgregados = signal<any[]>([]);

  displayedColumns: string[] = ['producto', 'marca-modelo', 'serie-inventario', 'cantidad', 'acciones'];
  stockDisponible: number = 0;
  busquedaTexto: string = '';

  form = this.fb.group({
    bodegaOrigen: [null, Validators.required],
    bodegaDestino: [null, Validators.required],
    motivo: ['', Validators.required],
    producto: [{ value: null, disabled: true }],
    cantidad: [0, [Validators.required, Validators.min(1)]] // Cantidad inicia en 0
  });

  get productoSeleccionado(): any {
    return this.form.get('producto')?.value;
  }

  ngOnInit(): void {
    this.cargarBodegas();

    // Reaccionar a cambios en bodega de origen
    this.form.get('bodegaOrigen')?.valueChanges.subscribe((idBodega: any) => {
      if (idBodega) {
        this.cargarProductos(idBodega);
        this.detallesAgregados.set([]);
        this.limpiarInputsProducto();
        this.form.get('producto')?.enable();

        if (this.form.value.bodegaDestino === idBodega) {
          this.form.get('bodegaDestino')?.setValue(null);
        }
      } else {
        this.form.get('producto')?.disable();
        this.productosOrigen.set([]);
        this.productosFiltrados.set([]);
      }
    });

    // Calcular disponible al seleccionar un producto
    this.form.get('producto')?.valueChanges.subscribe((productoInventario: any) => {
      if (productoInventario) {
        const yaEnLista = this.detallesAgregados()
          .filter(d => d.producto.idProducto === productoInventario.producto.idProducto)
          .reduce((acc, curr) => acc + curr.cantidad, 0);

        this.stockDisponible = productoInventario.cantidad_actual - yaEnLista;

        const cantControl = this.form.get('cantidad');
        cantControl?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(this.stockDisponible)
        ]);
        cantControl?.updateValueAndValidity();

        if (this.stockDisponible <= 0) {
          this.mensaje.open('No hay stock disponible para este producto en la bodega seleccionada', 'warning');
        }
      }
    });
  }

  cargarBodegas(): void {
    this.inventarioService.listarBodegas().subscribe({
      next: (data) => this.listaBodegas.set(data),
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.message || 'Error al cargar bodegas';
        this.mensaje.open(msg, 'error');
      }
    });
  }

  cargarProductos(idBodega: number): void {
    this.inventarioService.listarInventarioPorBodega(idBodega).subscribe({
      next: (data) => {
        const disponibles = data.filter(item => item.cantidad_actual > 0);
        this.productosOrigen.set(disponibles);
        this.productosFiltrados.set(disponibles);
      },
      error: () => this.mensaje.open('Error al obtener inventario de la bodega', 'error')
    });
  }

  filtrar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value.toLowerCase().trim();

    if (this.productoSeleccionado && this.productoSeleccionado.producto.nombreproducto.toLowerCase() !== valor) {
      this.form.get('producto')?.setValue(null);
      this.stockDisponible = 0;
    }

    const filtrados = this.productosOrigen().filter(item => {
      const p = item.producto;
      const texto = (
        (p.nombreproducto || '') + ' ' +
        (p.skuproducto || '') + ' ' +
        (p.serieproducto || '') + ' ' +
        (p.inventarioproducto || '') + ' ' +
        (p.modelo?.nombremodelo || '') + ' ' +
        (p.modelo?.marca?.nombremarca || '')
      ).toLowerCase();
      return texto.includes(valor);
    });

    this.productosFiltrados.set(filtrados);
  }

  seleccionarProducto(evento: any): void {
    const itemInventario = evento.option.value;
    this.form.get('producto')?.setValue(itemInventario);
    this.busquedaTexto = itemInventario.producto.nombreproducto;
  }

  displayFn(item: any): string {
    if (typeof item === 'string') return item;
    return (item && item.producto) ? item.producto.nombreproducto : '';
  }

  agregarProductoALista(): void {
    // 1. Validar que exista una bodega de origen seleccionada
    if (!this.form.value.bodegaOrigen) {
      this.mensaje.open('Seleccione primero una bodega de origen', 'warning');
      return;
    }

    // 2. Validar que se haya seleccionado un producto
    const prodVal = this.productoSeleccionado;
    if (!prodVal) {
      this.mensaje.open('Debe seleccionar un producto de la lista', 'warning');
      return;
    }

    // 3. Validar cantidad mayor a cero
    const cantVal = Number(this.form.get('cantidad')?.value);
    if (cantVal === null || cantVal === undefined || isNaN(cantVal) || cantVal <= 0) {
      this.form.get('cantidad')?.markAsTouched();
      this.mensaje.open('La cantidad debe ser mayor a cero', 'warning');
      return;
    }

    // 4. Validar existencia y disponibilidad de stock
    if (this.stockDisponible <= 0) {
      this.mensaje.open('No hay stock disponible para este producto en la bodega seleccionada', 'warning');
      return;
    }

    if (cantVal > this.stockDisponible) {
      this.form.get('cantidad')?.markAsTouched();
      this.mensaje.open(`La cantidad supera el stock actual [${this.stockDisponible} Disponible]`, 'warning');
      return;
    }

    // 5. Agrupar si ya está en la lista o agregar como nuevo ítem
    const indexExistente = this.detallesAgregados().findIndex(
      d => d.producto.idProducto === prodVal.producto.idProducto
    );

    if (indexExistente !== -1) {
      this.detallesAgregados.update(lista => {
        const copia = [...lista];
        copia[indexExistente] = {
          ...copia[indexExistente],
          cantidad: copia[indexExistente].cantidad + cantVal
        };
        return copia;
      });
    } else {
      this.detallesAgregados.update(lista => [...lista, {
        producto: prodVal.producto,
        cantidad: cantVal
      }]);
    }

    this.limpiarInputsProducto();
  }

  eliminarDetalle(index: number): void {
    this.detallesAgregados.update(lista => lista.filter((_, i) => i !== index));

    // Si el producto actual seleccionado coincide con el eliminado, se recalcula el disponible
    if (this.productoSeleccionado) {
      const prodId = this.productoSeleccionado.producto.idProducto;
      const yaEnLista = this.detallesAgregados()
        .filter(d => d.producto.idProducto === prodId)
        .reduce((acc, curr) => acc + curr.cantidad, 0);
      this.stockDisponible = this.productoSeleccionado.cantidad_actual - yaEnLista;
    }
  }

  limpiarInputsProducto(): void {
    this.form.get('producto')?.setValue(null);
    this.form.get('cantidad')?.setValue(0); // Reiniciar siempre a 0
    this.form.get('cantidad')?.markAsUntouched();
    this.form.get('cantidad')?.setErrors(null);
    this.stockDisponible = 0;
    this.busquedaTexto = '';
    this.productosFiltrados.set(this.productosOrigen());
  }

  guardarTransferencia(): void {
    if (this.form.get('bodegaOrigen')?.invalid ||
      this.form.get('bodegaDestino')?.invalid ||
      this.form.get('motivo')?.invalid) {
      this.form.markAllAsTouched();
      this.mensaje.open('Complete la información de bodegas y motivo', 'warning');
      return;
    }

    if (this.form.value.bodegaOrigen === this.form.value.bodegaDestino) {
      this.mensaje.open('La bodega de origen y destino no pueden ser iguales', 'warning');
      return;
    }

    if (this.detallesAgregados().length === 0) {
      this.mensaje.open('Debe agregar al menos un material a la lista de movimiento', 'warning');
      return;
    }

    const movimientoStockDTO = {
      idBodegaOrigen: this.form.value.bodegaOrigen,
      idBodegaDestino: this.form.value.bodegaDestino,
      motivo: this.form.value.motivo,
      idUsuario: this.authService.getIdUsuarioActual(),
      items: this.detallesAgregados().map(d => ({
        idProducto: d.producto.idProducto,
        cantidad: d.cantidad
      }))
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        titulo: '¿Confirmar Movimiento de Materiales?',
        mensaje: 'Se transferirán las existencias de la bodega de origen a la de destino.',
        textoBoton: 'Confirmar',
        colorBoton: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.inventarioService.realizarMovimientoStockBodega(movimientoStockDTO).subscribe({
          next: () => {
            this.mensaje.open('Movimiento realizado con éxito', 'exito');
            this.router.navigate(['/inventario']);
          },
          error: (err) => {
            const msg = err.error?.mensaje || err.error?.message || 'Error al procesar el movimiento';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }
}
