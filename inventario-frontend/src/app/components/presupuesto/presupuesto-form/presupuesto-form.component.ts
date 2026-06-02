import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterLink,ActivatedRoute } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { PresupuestoService } from '../../../services/presupuesto.service';
import { ProductoService } from '../../../services/producto.service';
import { AuthService } from '../../../services/auth.service';
import { Producto } from '../../../models/producto';
import { DetalleItemDTO, PresupuestoCreacionDTO } from '../../../models/presupuesto';
import { Mensaje } from '../../../core/mensaje';
import { Utils } from '../../../core/utils';
import { UbicacionService } from '../../../services/ubicacion.service';
import { Ubicacion } from '../../../models/ubicacion';

interface DetalleVista {
  producto: Producto;
  cantidad: number;
}

@Component({
  selector: 'app-presupuesto-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatIconModule, MatTableModule, RouterLink,
    MatDividerModule, MatTooltipModule, MatAutocompleteModule
  ],
  templateUrl: './presupuesto-form.component.html',
  styleUrl: './presupuesto-form.component.css'
})
export class PresupuestoFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private presupuestoService = inject(PresupuestoService);
  private productoService = inject(ProductoService);
  private ubicacionService = inject(UbicacionService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private mensaje = inject(Mensaje);
  public sn = inject(Utils);
  private route = inject(ActivatedRoute);

  esModoEdicion = signal<boolean>(false);
  idPresupuestoEdicion = signal<number | null>(null);

  listaProductos = signal<Producto[]>([]);
  listaUbicaciones = signal<Ubicacion[]>([]);
  productosFiltrados = signal<Producto[]>([]);
  detallesAgregados = signal<DetalleVista[]>([]);

  formCabecera = this.fb.group({
    nombresolicitud: ['', Validators.required],
    idUbicacion: [null as number | null, Validators.required],
    observaciones: ['']
  });

  productoSeleccionado: Producto | null = null;
  busquedaTexto: any = '';
  cantidadSeleccionada: number = 1;

  displayedColumns: string[] = ['producto', 'cantidad', 'acciones'];

  ngOnInit(): void {
    this.productoService.getProductosActivos().subscribe(data => {
      this.listaProductos.set(data);
      this.productosFiltrados.set(data);
    });

    this.ubicacionService.getUbicacionesActivas().subscribe(data => {
      this.listaUbicaciones.set(data);
    })

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.esModoEdicion.set(true);
      this.idPresupuestoEdicion.set(Number(idParam));
      this.cargarDatosPresupuesto(this.idPresupuestoEdicion()!);
    }
  }

  // MÉTODO PARA CARGAR DATOS EXISTENTES
  cargarDatosPresupuesto(id: number) {
    this.presupuestoService.obtenerPorId(id).subscribe(presupuesto => {
      this.formCabecera.patchValue({
        nombresolicitud: presupuesto.nombre_presupuesto,
        idUbicacion : presupuesto.ubicacion?.idUbicacion,
        observaciones : presupuesto.observaciones || null
      });
    });

    this.presupuestoService.listarDetalles(id).subscribe(detalles => {
      const itemsMapeados = detalles.map(d => ({
        producto: d.producto,
        cantidad: d.cantidad_solicitada
      }));
      this.detallesAgregados.set(itemsMapeados);
    });
  }

  filtrar(event: Event) {
    const input = event.target as HTMLInputElement;
    const valor = input.value.toLowerCase();

    if (this.productoSeleccionado) {
      this.productoSeleccionado = null;
    }

    const filtrados = this.listaProductos().filter(p =>
      p.nombreproducto.toLowerCase().includes(valor) ||
      (p.skuproducto && p.skuproducto.toLowerCase().includes(valor))
    );

    this.productosFiltrados.set(filtrados);
  }

  seleccionarProducto(evento: any) {
    const producto = evento.option.value;
    this.productoSeleccionado = producto;
  }

  displayFn(producto: Producto): string {
    return (producto && producto.nombreproducto) ? producto.nombreproducto : '';
  }

  limpiarInputsProducto(){
    this.productoSeleccionado = null;
    this.busquedaTexto = '';
    this.cantidadSeleccionada = 1;

    this.productosFiltrados.set([...this.listaProductos()]);
  }

  agregarProducto() {
    if (!this.productoSeleccionado || this.cantidadSeleccionada <= 0) return;

    const itemsActuales = this.detallesAgregados();
    const existe = itemsActuales.find(d => d.producto.idProducto === this.productoSeleccionado?.idProducto);

    if (existe) {
      const itemsActualizados = itemsActuales.map(item => {
        if (item.producto.idProducto === this.productoSeleccionado?.idProducto) {
          return { ...item, cantidad: item.cantidad + this.cantidadSeleccionada };
        }
        return item;
      });
      this.detallesAgregados.set(itemsActualizados);
    } else {
      const nuevoDetalle: DetalleVista = {
        producto: this.productoSeleccionado,
        cantidad: this.cantidadSeleccionada
      };
      this.detallesAgregados.update(prev => [...prev, nuevoDetalle]);
    }

    this.limpiarInputsProducto();

  }

  eliminarDetalle(index: number) {
    this.detallesAgregados.update(prev => prev.filter((_, i) => i !== index));
  }

  guardarSolicitud() {
    if (this.formCabecera.invalid) {
      this.formCabecera.markAllAsTouched();
      this.mensaje.open('Por favor, complete los campos obligatorios', 'warning');
      return;
    }

    if (this.detallesAgregados().length === 0) {
      this.mensaje.open('Debe agregar al menos un producto a la lista.', 'warning');
      return;
    }

    const idUsuario = this.authService.getIdUsuarioActual();

    const itemsDTO: DetalleItemDTO[] = this.detallesAgregados().map(d => ({
        idProducto: d.producto.idProducto!,
        cantidad: d.cantidad
    }));

    const dto: PresupuestoCreacionDTO = {
      nombrePresupuesto: this.formCabecera.value.nombresolicitud!,
      idUsuario: idUsuario,
      idUbicacion : this.formCabecera.value.idUbicacion!,
      observaciones : this.formCabecera.value.observaciones!,
      items: itemsDTO
    };

    if (this.esModoEdicion()) {
      this.presupuestoService.actualizarPresupuesto(this.idPresupuestoEdicion()!, dto).subscribe({
        next: () => {
          this.mensaje.open('Presupuesto actualizado exitosamente', 'exito');
          this.router.navigate(['/presupuesto']);
        },
        error: (err) => this.mensaje.open(err.error?.message || 'Error al actualizar', 'error')
      });
    } else {
      this.presupuestoService.crearPresupuesto(dto).subscribe({
        next: () => {
          this.mensaje.open('Solicitud creada exitosamente', 'exito');
          this.router.navigate(['/presupuesto']);
        },
        error: () => this.mensaje.open('Error al guardar', 'error')
      });
    }
  }

}
