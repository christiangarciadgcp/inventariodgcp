import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Observable, forkJoin } from 'rxjs';
import { startWith, map } from 'rxjs/operators';

import { AsignacionService } from '../../../services/asignacion.service';
import { TipoAsignacionService } from '../../../services/tipo-asignacion.service';
import { InventarioService } from '../../../services/inventario.service';
import { AuthService } from '../../../services/auth.service';
import { Mensaje } from '../../../core/mensaje';
import { TipoAsignacion } from '../../../models/tipo-asignacion';
import { AsignacionCreacionDTO } from '../../../models/asignacion';

@Component({
  selector: 'app-asignacion-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatTableModule, MatAutocompleteModule, MatProgressSpinner, RouterLink
  ],
  templateUrl: './asignacion-form.component.html',
  styleUrls: ['./asignacion-form.component.css']
})
export class AsignacionFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private asignacionService = inject(AsignacionService);
  private tipoAsignacionService = inject(TipoAsignacionService);
  private inventarioService = inject(InventarioService);
  private authService = inject(AuthService);
  private mensaje = inject(Mensaje);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  tiposAsignacion = signal<TipoAsignacion[]>([]);
  itemsDisponibles: any[] = [];
  filtroCtrl = new FormControl('');
  itemsFiltrados!: Observable<any[]>;

  itemsSeleccionados = signal<any[]>([]);
  displayedColumns: string[] = ['producto', 'marca', 'modelo', 'serie', 'inventario', 'bodega', 'acciones'];

  guardando = signal<boolean>(false);
  cargandoEquipos: boolean = false;

  // Variables para controlar la Edición
  esEdicion = signal<boolean>(false);
  idAsignacion = signal<number | null>(null);
  numeroActa = signal<string>('');

  form: FormGroup = this.fb.group({
    idAsignacionTipo: [null, Validators.required],
    responsableDestino: ['', [Validators.required, Validators.minLength(3)]],
    observaciones: ['']
  });

  ngOnInit(): void {
    this.tipoAsignacionService.listarActivos().subscribe(data => this.tiposAsignacion.set(data));
    this.cargarInventarioConsolidado(true);

    this.itemsFiltrados = this.filtroCtrl.valueChanges.pipe(
      startWith(''),
      map(val => this.filtrarItems(val || ''))
    );

    // Detección de edición por parámetro de ruta
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = +idParam;
      this.idAsignacion.set(id);
      this.esEdicion.set(true);
      this.cargarDatosEdicion(id);
    }
  }

  cargarDatosEdicion(id: number) {
    forkJoin({
      asignacion: this.asignacionService.obtenerPorId(id),
      detalles: this.asignacionService.listarDetalles(id)
    }).subscribe({
      next: ({ asignacion, detalles }) => {
        if (asignacion.estado !== 'REGISTRADA') {
          this.mensaje.open('Solo se pueden editar asignaciones en estado REGISTRADA', 'warning');
          this.router.navigate(['/asignaciones']);
          return;
        }

        this.numeroActa.set(asignacion.numeroActa);
        this.form.patchValue({
          idAsignacionTipo: asignacion.tipoAsignacion.idAsignacionTipo,
          responsableDestino: asignacion.responsableDestino,
          observaciones: asignacion.observaciones
        });

        const itemsMapeados = detalles.map(d => ({
          producto: d.producto,
          bodega: d.bodegaOrigen
        }));
        this.itemsSeleccionados.set(itemsMapeados);
      },
      error: () => {
        this.mensaje.open('Error al cargar la información de la asignación', 'error');
        this.router.navigate(['/asignaciones']);
      }
    });
  }

  cargarInventarioConsolidado(mostrarSpinner: boolean = true) {
    if (mostrarSpinner) {
      this.cargandoEquipos = true;
      this.cdr.detectChanges();
    }

    this.inventarioService.listarInventarioConsolidado().subscribe({
      next: (inv) => {
        this.itemsDisponibles = inv.filter((i: any) => {
          const categoria = (i.producto?.categoria?.nombrecategoria || '').toUpperCase().trim();
          return !i.producto.esGenerico && i.cantidad_actual > 0 && !categoria.includes('MATERIALES');
        });
        this.cargandoEquipos = false;
        this.filtroCtrl.setValue(this.filtroCtrl.value, { emitEvent: true });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando inventario consolidado:', err);
        this.cargandoEquipos = false;
        this.cdr.detectChanges();
      }
    });
  }

  actualizarEquiposSilencioso() {
    if (this.cargandoEquipos) return;
    this.cargarInventarioConsolidado(this.itemsDisponibles.length === 0);
  }

  private filtrarItems(query: string): any[] {
    const q = (typeof query === 'string' ? query : '').toLowerCase().trim();
    if (!q) return this.itemsDisponibles.slice(0, 100);

    return this.itemsDisponibles.filter(item => {
      const p = item.producto;
      const texto = (
        p.nombreproducto + ' ' +
        (p.skuproducto || '') + ' ' +
        (p.serieproducto || '') + ' ' +
        (p.inventarioproducto || '') + ' ' +
        (p.modelo?.nombremodelo || '') + ' ' +
        (p.modelo?.marca?.nombremarca || '')
      ).toLowerCase();
      return texto.includes(q);
    }).slice(0, 100);
  }

  seleccionarProducto(event: any) {
    const invItem = event.option.value;

    const yaAgregado = this.itemsSeleccionados().some(i => i.producto.idProducto === invItem.producto.idProducto);
    if (yaAgregado) {
      this.mensaje.open('Este equipo ya está en la lista', 'warning');
      this.filtroCtrl.setValue('');
      return;
    }

    this.itemsSeleccionados.update(list => [...list, invItem]);
    this.filtroCtrl.setValue('');
  }

  eliminarItem(index: number) {
    this.itemsSeleccionados.update(list => list.filter((_, i) => i !== index));
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensaje.open('Complete los datos obligatorios', 'warning');
      return;
    }
    if (this.itemsSeleccionados().length === 0) {
      this.mensaje.open('Debe seleccionar al menos un equipo', 'warning');
      return;
    }

    this.guardando.set(true);

    const dto: AsignacionCreacionDTO = {
      idAsignacionTipo: this.form.value.idAsignacionTipo,
      responsableDestino: this.form.value.responsableDestino,
      observaciones: this.form.value.observaciones,
      idUsuario: this.authService.getIdUsuarioActual(),
      items: this.itemsSeleccionados().map(i => ({
        idProducto: i.producto.idProducto,
        idBodegaOrigen: i.bodega.idBodega
      }))
    };

    if (this.esEdicion() && this.idAsignacion()) {
      this.asignacionService.actualizarAsignacion(this.idAsignacion()!, dto).subscribe({
        next: (asignacion) => {
          this.mensaje.open(`Asignación Acta N° ${asignacion.numeroActa} actualizada correctamente`, 'exito');
          this.guardando.set(false);
          this.router.navigate(['/asignaciones']);
        },
        error: (err) => {
          this.mensaje.open(err.error?.mensaje || 'Error al actualizar la asignación', 'error');
          this.guardando.set(false);
        }
      });
    } else {
      this.asignacionService.crearAsignacion(dto).subscribe({
        next: (creada) => {
          this.mensaje.open(`Asignación registrada con éxito (Acta N° ${creada.numeroActa})`, 'exito');
          this.guardando.set(false);
          this.router.navigate(['/asignaciones']);
        },
        error: (err) => {
          this.mensaje.open(err.error?.mensaje || 'Error al guardar la asignación', 'error');
          this.guardando.set(false);
        }
      });
    }
  }
}
