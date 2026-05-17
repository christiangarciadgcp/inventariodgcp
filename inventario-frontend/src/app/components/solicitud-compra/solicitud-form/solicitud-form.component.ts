import { Component, OnInit, inject,ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDivider } from '@angular/material/divider';
import { Router, RouterLink,ActivatedRoute } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

// Servicios y Modelos
import { ProductoService } from '../../../services/producto.service';
import { BodegaService } from '../../../services/bodega.service';
import { SolicitudCompraService } from '../../../services/solicitud-compra.service';
import { Producto } from '../../../models/producto';
import { Bodega } from '../../../models/bodega';
import { SolicitudCreacionDTO, DetalleItemDTO } from '../../../models/solicitud-compra';
import { AuthService } from '../../../services/auth.service';
import { Mensaje } from '../../../core/mensaje';
import { Utils } from '../../../core/utils';

interface DetalleVista {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}

@Component({
  selector: 'app-solicitud-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatIconModule, MatCardModule, MatTableModule, RouterLink,
    MatDivider,MatAutocompleteModule
  ],
  templateUrl: './solicitud-form.component.html',
  styleUrl: './solicitud-form.component.css'
})
export class SolicitudFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private bodegaService = inject(BodegaService);
  private solicitudService = inject(SolicitudCompraService);
  private authService = inject(AuthService);
  private mensaje = inject(Mensaje);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  public sn = inject(Utils);
  private route = inject(ActivatedRoute);

  // Datos para Selects
  listaProductos: Producto[] = [];
  productosFiltrados: Producto[] = []
  listaBodegas: Bodega[] = [];
  idUsuarioActual : number = 0;

  esModoEdicion = signal<boolean>(false);
  idSolicitudEdicion = signal<number | null>(null);

  // Formulario Cabecera
  form: FormGroup = this.fb.group({
    nombresolicitud: ['', Validators.required],
    idBodega: [null, Validators.required]
  });

  // Inputs temporales
  productoSeleccionado: Producto | null = null;
  busquedaTexto: any = '';
  cantidadSeleccionada: number = 1;

  detalles: DetalleVista[] = [];
  dataSource = new MatTableDataSource<DetalleVista>([]);
  displayedColumns: string[] = ['producto', 'cantidad', 'precio', 'subtotal', 'acciones'];

  ngOnInit(): void {
    this.idUsuarioActual = this.authService.getIdUsuarioActual();

    this.productoService.getProductosActivos().subscribe(data => {
      this.listaProductos = data;
      this.productosFiltrados = data;
      this.cdr.detectChanges();
    });

    this.bodegaService.getBodegasActivas().subscribe(data => {
      this.listaBodegas = data;
      this.cdr.detectChanges();
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.esModoEdicion.set(true);
      this.idSolicitudEdicion.set(Number(idParam));
      this.cargarDatosSolicitud(this.idSolicitudEdicion()!);
    }

  }

  cargarDatosSolicitud(id: number) {
    // Cargar Cabecera
    this.solicitudService.obtenerPorId(id).subscribe(solicitud => {
      this.form.patchValue({
        nombresolicitud: solicitud.nombresolicitud,
        idBodega: solicitud.idbodegadestino?.idBodega
      });
    });

    this.solicitudService.listarDetalles(id).subscribe(detallesBD => {
      this.detalles = detallesBD.map(d => ({
        producto: d.producto,
        cantidad: d.cantidad_solicitada,
        subtotal: d.cantidad_solicitada * d.producto.preciocostoproducto
      }));
      this.actualizarTabla();
    });
  }

  filtrar(event: Event) {
    const input = event.target as HTMLInputElement;
    const valor = input.value.toLowerCase();


    if (this.productoSeleccionado && this.productoSeleccionado.nombreproducto.toLowerCase() !== valor) {
       this.productoSeleccionado = null;
    }

    this.productosFiltrados = this.listaProductos.filter(p =>
      p.nombreproducto.toLowerCase().includes(valor) ||
      (p.skuproducto && p.skuproducto.toLowerCase().includes(valor))
    );

  }

  seleccionarProducto(evento: any) {
    const producto = evento.option.value as Producto;
    this.productoSeleccionado = producto;
  }

  displayFn(producto: Producto): string {
    return (producto && producto.nombreproducto) ? producto.nombreproducto : '';
  }

  limpiarInputsProducto(){
    // Reset inputs
    this.productoSeleccionado = null;
    this.busquedaTexto = '';
    this.cantidadSeleccionada = 1;
    this.productosFiltrados = [...this.listaProductos];

  }

  agregarProducto() {
    if (!this.productoSeleccionado || this.cantidadSeleccionada <= 0) return;

    const existente = this.detalles.find(d => d.producto.idProducto === this.productoSeleccionado?.idProducto);

    if (existente) {
      existente.cantidad += this.cantidadSeleccionada;
      existente.subtotal = existente.producto.preciocostoproducto * existente.cantidad;
    } else {
      this.detalles.push({
        producto: this.productoSeleccionado,
        cantidad: this.cantidadSeleccionada,
        subtotal: this.productoSeleccionado.preciocostoproducto * this.cantidadSeleccionada
      });
    }

    this.actualizarTabla();
    this.limpiarInputsProducto();
  }

  eliminarDetalle(index: number) {
    this.detalles.splice(index, 1);
    this.actualizarTabla();
  }

  // Método auxiliar para que la tabla detecte cambios
  actualizarTabla() {
    this.dataSource.data = [...this.detalles];
  }

  get totalEstimado(): number {
    return this.detalles.reduce((acc, curr) => acc + (curr.producto.preciocostoproducto * curr.cantidad), 0);
  }

  guardarSolicitud() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensaje.open('Por favor, complete los campos obligatorios.', 'warning');
      return;
    }

    if (this.detalles.length === 0) {
      this.mensaje.open('Debe agregar al menos un material.', 'warning');
      return;
    }

    const datosForm = this.form.value;

    // 1. Armar Lista de Detalles para el DTO
    const itemsDTO: DetalleItemDTO[] = this.detalles.map(d => ({
        idProducto: d.producto.idProducto!,
        cantidad: d.cantidad
    }));

    // 2. Armar el DTO Final (Cabecera + Detalles)
    const dto: SolicitudCreacionDTO = {
        nombreSolicitud: datosForm.nombresolicitud,
        idUsuario: this.idUsuarioActual,
        idBodegaDestino: datosForm.idBodega,
        items: itemsDTO
    };

    // 3. Petición única
    if (this.esModoEdicion()) {

        this.solicitudService.actualizarSolicitud(this.idSolicitudEdicion()!, dto).subscribe({
            next: () => {
                this.mensaje.open('Solicitud de Compra actualizada correctamente', 'exito');
                this.router.navigate(['/solicitud_compra']);
            },
            error: (err) => this.mensaje.open(err.error?.message || 'Error al actualizar', 'error')
        });

    } else {

        this.solicitudService.crearSolicitud(dto).subscribe({
            next: () => {
                this.mensaje.open('Solicitud de Compra creada exitosamente', 'exito');
                this.router.navigate(['/solicitud_compra']);
            },
            error: (err) => this.mensaje.open('Error al crear solicitud', 'error')
        });

    }
  }
}
