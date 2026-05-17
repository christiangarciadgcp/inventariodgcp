import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

// Imports de Material (Iguales a Movimiento)
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { InventarioService } from '../../../services/inventario.service';
import { AuthService } from '../../../services/auth.service';
import { Mensaje } from '../../../core/mensaje';
import { Bodega } from '../../../models/bodega';
import { Utils } from '../../../core/utils';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-inventario-descargo',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatIconModule, RouterLink, MatDividerModule, MatTableModule,
    MatAutocompleteModule
  ],
  templateUrl: './inventario-descargo.component.html',
  styleUrl: './inventario-descargo.component.css',
})
export class InventarioDescargoComponent implements OnInit{

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

  displayedColumns: string[] = ['producto', 'cantidad', 'acciones'];
  stockDisponible = 0;
  busquedaTexto: string = '';

  form = this.fb.group({
    bodega: [null, Validators.required], // Solo una bodega
    motivo: ['', Validators.required],
    producto: [{ value: null, disabled: true }],
    cantidad: [null]
  });

  get productoSeleccionado(): any {
    return this.form.get('producto')?.value;
  }

  ngOnInit(): void {
    this.cargarBodegas();

    // Listener Bodega
    this.form.get('bodega')?.valueChanges.subscribe((idBodega: any) => {
      if (idBodega) {
        this.cargarProductos(idBodega);
        this.detallesAgregados.set([]);
        this.limpiarInputsProducto();
        this.form.get('producto')?.enable();
      } else {
        this.form.get('producto')?.disable();
        this.productosOrigen.set([]);
        this.productosFiltrados.set([]);
      }
    });

    this.form.get('producto')?.valueChanges.subscribe((productoInventario: any) => {
      if (productoInventario) {
        const yaEnCarrito = this.detallesAgregados()
            .filter(d => d.producto.idProducto === productoInventario.producto.idProducto)
            .reduce((acc, curr) => acc + curr.cantidad, 0);

        this.stockDisponible = productoInventario.cantidad_actual - yaEnCarrito;

        const cantControl = this.form.get('cantidad');
        cantControl?.setValidators([Validators.required, Validators.min(1), Validators.max(this.stockDisponible)]);
        cantControl?.updateValueAndValidity();

        if (this.stockDisponible <= 0) {
          cantControl?.disable();
          this.mensaje.open('No hay stock suficiente para descargar', 'warning');
        } else {
            cantControl?.enable();
        }
      }
    });
  }

  cargarBodegas() {
    this.inventarioService.listarBodegas().subscribe({
      next: (data) => this.listaBodegas.set(data),
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.message || 'Error con el servidor';
        this.mensaje.open('Error al cargar la información', 'warning');
        this.mensaje.open(msg, 'error');
      }
    });
  }

  cargarProductos(idBodega: number) {
    this.inventarioService.listarInventarioPorBodega(idBodega).subscribe(data => {
      const disponibles = data.filter(item => item.cantidad_actual > 0);
      this.productosOrigen.set(disponibles);
      this.productosFiltrados.set(disponibles); // Inicializar filtro
    });
  }

  filtrar(event: Event) {
    const input = event.target as HTMLInputElement;
    const valor = input.value.toLowerCase();

    // Si escribe algo nuevo, limpiamos la selección actual
    if (this.productoSeleccionado && this.productoSeleccionado.producto.nombreproducto.toLowerCase() !== valor) {
       this.form.get('producto')?.setValue(null);
       this.stockDisponible = 0;
       this.form.get('cantidad')?.disable();
    }

    const filtrados = this.productosOrigen().filter(item =>
      item.producto.nombreproducto.toLowerCase().includes(valor) ||
      (item.producto.skuproducto && item.producto.skuproducto.toLowerCase().includes(valor))
    );

    this.productosFiltrados.set(filtrados);
  }

  seleccionarProducto(evento: any) {
    const itemInventario = evento.option.value;

    // 1. Lógica interna
    this.form.get('producto')?.setValue(itemInventario);

    // 2. Actualizar visualmente el input (CLAVE)
    this.busquedaTexto = itemInventario.producto.nombreproducto;
  }

  displayFn(item: any): string {
    if (typeof item === 'string') return item;
    return (item && item.producto) ? item.producto.nombreproducto : '';
  }


  agregarProductoALista() {
    const prodVal = this.productoSeleccionado;
    const cantVal = this.form.get('cantidad')?.value;

    if (!prodVal || !cantVal || cantVal <= 0) return;

    const nuevoDetalle = {
      producto: prodVal.producto,
      cantidad: cantVal
    };

    this.detallesAgregados.update(lista => [...lista, nuevoDetalle]);
    this.limpiarInputsProducto();
  }

  eliminarDetalle(index: number) {
    this.detallesAgregados.update(lista => lista.filter((_, i) => i !== index));
  }

  limpiarInputsProducto() {
      this.form.get('producto')?.setValue(null);
      this.form.get('cantidad')?.reset();
      this.form.get('cantidad')?.setErrors(null);
      this.stockDisponible = 0;

      // Limpieza visual del autocomplete
      this.busquedaTexto = '';
      this.productosFiltrados.set(this.productosOrigen());
    }

  guardarDescargo() {
    if (this.form.get('bodega')?.invalid || this.form.get('motivo')?.invalid) {
        this.form.markAllAsTouched();
        this.mensaje.open('Complete la información de bodega y motivo', 'warning');
        return;
    }
    if (this.detallesAgregados().length === 0) {
        this.mensaje.open('Agregue productos a la lista de descargo', 'warning');
        return;
    }

    const descargoDTO = {
      idBodega: this.form.value.bodega,
      motivo: this.form.value.motivo,
      idUsuario: this.authService.getIdUsuarioActual(),
      items: this.detallesAgregados().map(d => ({
          idProducto: d.producto.idProducto,
          cantidad: d.cantidad
      }))
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: '¿Está seguro de enviar a descargo estos materiales?',
        mensaje: 'Esta acción no se puede deshacer',
        textoBoton: 'Aceptar',
        colorBoton: 'primary'
      }
    });
    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.inventarioService.realizarDescargo(descargoDTO).subscribe({
          next: () => {
            this.mensaje.open('Descargo realizado con éxito', 'exito');
            this.router.navigate(['/inventario']);
          },
          error: (err) => {
            const msg = err.error?.mensaje || err.error?.message || 'Error en el descargo';
            this.mensaje.open('Error: ' + msg, 'error');
          }
        });
      }
    });
  }
}

