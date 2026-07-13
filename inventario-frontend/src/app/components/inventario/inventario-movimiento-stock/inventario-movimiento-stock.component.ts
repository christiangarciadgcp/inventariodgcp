import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { InventarioService } from '../../../services/inventario.service';
import { AuthService } from '../../../services/auth.service';
import { Mensaje } from '../../../core/mensaje';
import { Bodega } from '../../../models/bodega';
import { Utils } from '../../../core/utils';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';


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
  styleUrl: './inventario-movimiento-stock.component.css',
})
export class InventarioMovimientoStockComponent implements OnInit{


  private fb = inject(FormBuilder);
  private inventarioService = inject(InventarioService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private mensaje = inject(Mensaje);
  public sn = inject(Utils);
  private dialog = inject(MatDialog);

  // Datos
  listaBodegas = signal<Bodega[]>([]);
  productosOrigen = signal<any[]>([]);
  productosFiltrados = signal<any[]>([]);
  productosDetalle = signal<any[]>([]);
  displayedColumns : string[] = ['producto','cantidad','acciones'];

  stockDisponible = 0;
  busquedaTexto: string = '';

  form = this.fb.group({
    bodegaOrigen : [null, Validators.required],
    bodegaDestino : [null, Validators.required],
    motivo : ['', Validators.required],
    producto: [{ value: null, disabled: true }],
    cantidad: [null, [Validators.required, Validators.min(1)]]
  });

  get productoSeleccionado() : any {
    return this.form.get('producto')?.value;
  }

  ngOnInit(): void {
    this.cargarBodegas();

    this.form.get('bodegaOrigen')?.valueChanges.subscribe((idBodega : any ) => {
      if(idBodega){
        this.cargarProductosOrigen(idBodega);

        this.productosDetalle.set([]);
        this.limpiarInputsProducto();
        this.busquedaTexto = '';

        this.form.get('producto')?.enable();
      }else{
        this.form.get('producto')?.disable();
        this.productosOrigen.set([]);
        this.productosFiltrados.set([]);
      }
    });

    this.form.get('producto')?.valueChanges.subscribe((productoInv : any) => {
      if(productoInv){

        const productoAgregado = this.productosDetalle()
            .filter(d => d.producto.idProducto === productoInv.producto.idProducto)
            .reduce((acc, curr) => acc + curr.cantidad,0);

        this.stockDisponible = productoInv.cantidad_actual - productoAgregado;

        //Validaciones
        const cantControl = this.form.get('cantidad');
        cantControl?.setValidators([
          //Validators.required,
          Validators.min(1),
          Validators.max(this.stockDisponible)
        ]);

        cantControl?.updateValueAndValidity();

        //Validar si ya no hay Stock porque ya está en la lista
        if(this.stockDisponible <= 0){
          cantControl?.disable();
          this.mensaje.open('No hay suficiente Stock para este producto', 'warning');
        }else{
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

  cargarProductosOrigen(idBodega : number) {
    this.inventarioService.listarInventarioPorBodega(idBodega).subscribe( data => {
      const stockDisponible = data.filter(item => item.cantidad_actual > 0);
      this.productosOrigen.set(stockDisponible);
      this.productosFiltrados.set(stockDisponible);
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

    // Actualizamos el control del formulario
    this.form.get('producto')?.setValue(itemInventario);

    // Actualizamos la variable vinculada al ngModel para que el input muestre el texto
    this.busquedaTexto = itemInventario.producto.nombreproducto;
  }

  displayFn(item: any): string {

    if (typeof item === 'string') {
      return item;
    }

    return (item && item.producto) ? item.producto.nombreproducto : '';
  }

  limpiarInputsProducto(){
    this.form.get('producto')?.setValue(null);
    this.form.get('cantidad')?.reset();
    this.form.get('cantidad')?.setErrors(null);
    this.stockDisponible = 0;
    this.busquedaTexto = '';
    this.productosFiltrados.set(this.productosOrigen());
  }

  agregarProductoALista(){
    const prodVal = this.productoSeleccionado;
    const cantVal = this.form.get('cantidad')?.value;

    if(!prodVal || !cantVal || cantVal <= 0) return;

    const nuevoDetalle = {
      producto: prodVal.producto,
      cantidad: cantVal
    };

    this.productosDetalle.update(lista => [...lista, nuevoDetalle]);
    this.limpiarInputsProducto();
  }

  eliminarDetalle(index: number) {
    this.productosDetalle.update(lista => lista.filter((_, i) => i !== index));
  }

  guardarMovimientoStock() {

    if (this.form.get('bodegaOrigen')?.invalid ||
        this.form.get('bodegaDestino')?.invalid ||
        this.form.get('motivo')?.invalid) {
        this.form.markAllAsTouched();
        this.mensaje.open('Complete la información de origen, destino y motivo', 'warning');
        return;
    }

    if (this.productosDetalle().length === 0) {
        this.mensaje.open('Agregue al menos un producto a la lista', 'warning');
        return;
    }

    const values = this.form.value;

    if (values.bodegaOrigen === values.bodegaDestino) {
        this.mensaje.open('La bodega de origen y destino deben ser diferentes', 'warning');
        return;
    }

    const idUser = this.authService.getIdUsuarioActual();
    if (!idUser) {
        this.mensaje.open('Error: No se pudo identificar al usuario. Inicie sesión nuevamente.', 'error');
        return;
    }

    const dto = {
      idBodegaOrigen: values.bodegaOrigen,
      idBodegaDestino: values.bodegaDestino,
      motivo: values.motivo,
      idUsuario: idUser,
      items: this.productosDetalle().map(d => ({
          idProducto: d.producto.idProducto,
          cantidad: d.cantidad
      }))
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        titulo: '¿Está seguro de realizar este movimiento?',
        mensaje: 'Esta acción no se puede deshacer',
        textoBoton: 'Aceptar',
        colorBoton: 'primary'
      }
    });
    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.inventarioService.realizarMovimientoStockBodega(dto).subscribe({
          next: () => {
            this.mensaje.open('Movimiento realizado con éxito', 'exito');
            this.router.navigate(['/inventario']);
          },
          error: (err) => {
            console.error(err);
            const mensajeError = err.error?.mensaje || err.error?.message || 'Ocurrió un error inesperado';
            this.mensaje.open('Error en Movimiento: ' + mensajeError , 'error');
          }
        });
      }
    });
  }
}
