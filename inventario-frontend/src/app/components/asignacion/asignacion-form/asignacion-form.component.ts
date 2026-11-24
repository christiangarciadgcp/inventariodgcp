import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable, forkJoin } from 'rxjs';
import { startWith, map } from 'rxjs/operators';

import { AsignacionService } from '../../../services/asignacion.service';
import { TipoAsignacionService } from '../../../services/tipo-asignacion.service';
import { UbicacionService } from '../../../services/ubicacion.service';
import { InventarioService } from '../../../services/inventario.service';
import { AuthService } from '../../../services/auth.service';
import { Mensaje } from '../../../core/mensaje';
import { TipoAsignacion } from '../../../models/tipo-asignacion';
import { Ubicacion } from '../../../models/ubicacion';
import { AsignacionCreacionDTO } from '../../../models/asignacion';
import { MayusculasDirective } from '../../../core/directives/mayusculas.directive';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-asignacion-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatTableModule, MatAutocompleteModule, MatProgressSpinner, RouterLink,
    MatTooltipModule, MatDialogModule, MayusculasDirective
  ],
  templateUrl: './asignacion-form.component.html',
  styleUrls: ['./asignacion-form.component.css']
})
export class AsignacionFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private asignacionService = inject(AsignacionService);
  private tipoAsignacionService = inject(TipoAsignacionService);
  private ubicacionService = inject(UbicacionService);
  private inventarioService = inject(InventarioService);
  private authService = inject(AuthService);
  private mensaje = inject(Mensaje);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  tiposAsignacion = signal<TipoAsignacion[]>([]);
  ubicaciones = signal<Ubicacion[]>([]);

  ubicacionFiltroCtrl = new FormControl<any>('');
  textoFiltroUbicacion = signal<string>('');

  ubicacionesFiltradas = computed(() => {
    const query = this.textoFiltroUbicacion().toLowerCase().trim();
    const list = this.ubicaciones();

    if (!query) {
      return list;
    }

    return list.filter(u =>
      (u.nombreubicacion && u.nombreubicacion.toLowerCase().includes(query)) ||
      (u.siglasubicacion && u.siglasubicacion.toLowerCase().includes(query))
    );
  });

  itemsDisponibles: any[] = [];
  itemsOriginalesEdicion: any[] = [];
  filtroCtrl = new FormControl('');
  itemsFiltrados!: Observable<any[]>;

  itemsSeleccionados = signal<any[]>([]);

  guardando = signal<boolean>(false);
  cargandoEquipos: boolean = false;

  esEdicion = signal<boolean>(false);
  idAsignacion = signal<number | null>(null);
  numeroActa = signal<string>('');
  estadoAsignacion = signal<string>('');

  displayedColumns = computed<string[]>(() =>
    this.esEdicion()
      ? ['producto', 'marca', 'modelo', 'serie', 'inventario', 'bodega', 'estado', 'acciones']
      : ['producto', 'marca', 'modelo', 'serie', 'inventario', 'bodega', 'acciones']
  );

  form: FormGroup = this.fb.group({
    idAsignacionTipo: [null, Validators.required],
    idUbicacion: [null, Validators.required],
    responsableDestino: [''],
    observaciones: ['']
  });

  ngOnInit(): void {
    this.tipoAsignacionService.listarActivos().subscribe(data => this.tiposAsignacion.set(data));

    this.cargarCatalogoUbicaciones();

    this.ubicacionFiltroCtrl.valueChanges.subscribe(val => {
      if (typeof val === 'string') {
        this.textoFiltroUbicacion.set(val);
        if (val.trim() === '') {
          this.form.get('idUbicacion')?.setValue(null);
        }
      } else if (val) {
        this.textoFiltroUbicacion.set('');
      }
    });

    this.cargarInventarioConsolidado(true);

    this.itemsFiltrados = this.filtroCtrl.valueChanges.pipe(
      startWith(''),
      map(val => this.filtrarItems(val || ''))
    );

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = +idParam;
      this.idAsignacion.set(id);
      this.esEdicion.set(true);
      this.cargarDatosEdicion(id);
    }
  }

  cargarCatalogoUbicaciones() {
    const req$ = typeof (this.ubicacionService as any).getUbicacionesActivas === 'function'
      ? this.ubicacionService.getUbicacionesActivas()
      : this.ubicacionService.getUbicaciones();

    req$.subscribe({
      next: (data: Ubicacion[]) => {
        const activas = data.filter(u => u.activo !== false);
        this.ubicaciones.set(activas);

        if (this.esEdicion() && this.form.get('idUbicacion')?.value) {
          const uEncontrada = activas.find(u => u.idUbicacion === this.form.get('idUbicacion')?.value);
          if (uEncontrada) {
            this.ubicacionFiltroCtrl.setValue(uEncontrada, { emitEvent: false });
          }
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar ubicaciones:', err);
      }
    });
  }

  abrirUbicaciones(trigger: any) {
    if (typeof this.ubicacionFiltroCtrl.value !== 'string') {
      this.textoFiltroUbicacion.set('');
    }
    trigger.openPanel();
  }

  displayFnUbicacion = (item: any): string => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.siglasubicacion
      ? `${item.nombreubicacion} (${item.siglasubicacion})`
      : item.nombreubicacion || '';
  };

  seleccionarUbicacion(event: any) {
    const u: Ubicacion = event.option.value;
    if (u && u.idUbicacion) {
      this.form.get('idUbicacion')?.setValue(u.idUbicacion);
      this.textoFiltroUbicacion.set('');
    } else {
      this.limpiarUbicacion();
    }
  }

  limpiarUbicacion() {
    this.ubicacionFiltroCtrl.setValue('');
    this.form.get('idUbicacion')?.setValue(null);
    this.textoFiltroUbicacion.set('');
    this.form.get('idUbicacion')?.markAsTouched();
  }

  cargarDatosEdicion(id: number) {
    forkJoin({
      asignacion: this.asignacionService.obtenerPorId(id),
      detalles: this.asignacionService.listarDetalles(id)
    }).subscribe({
      next: ({ asignacion, detalles }) => {
        if (asignacion.estado === 'DEVOLUCION TOTAL' || asignacion.estado === 'CANCELADA') {
          this.mensaje.open('No se pueden editar asignaciones finalizadas o canceladas', 'warning');
          this.router.navigate(['/asignaciones']);
          return;
        }

        this.numeroActa.set(asignacion.numeroActa);
        this.estadoAsignacion.set(asignacion.estado);
        this.form.patchValue({
          idAsignacionTipo: asignacion.tipoAsignacion.idAsignacionTipo,
          idUbicacion: asignacion.ubicacion?.idUbicacion,
          responsableDestino: asignacion.responsableDestino || '',
          observaciones: asignacion.observaciones
        });

        if (asignacion.ubicacion) {
          this.ubicacionFiltroCtrl.setValue(asignacion.ubicacion, { emitEvent: false });
        }

        const itemsMapeados = detalles.map(d => ({
          producto: d.producto,
          bodega: d.bodegaOrigen,
          cantidad_actual: 1,
          estadoDetalle: asignacion.estado === 'REGISTRADA' ? 'PENDIENTE' : (d.estado || 'ASIGNADO'),
          bodegaDevolucion: d.bodegaDevolucion,
          esOriginal: true
        }));

        this.itemsOriginalesEdicion = [...itemsMapeados];
        this.itemsSeleccionados.set(itemsMapeados);
        this.fusionarItemsPropiosEnDisponibles();
      },
      error: () => {
        this.mensaje.open('Error al cargar la información de la asignación', 'error');
        this.router.navigate(['/asignaciones']);
      }
    });
  }

  private fusionarItemsPropiosEnDisponibles() {
    if (!this.esEdicion() || this.itemsOriginalesEdicion.length === 0) return;

    this.itemsOriginalesEdicion.forEach(itemActa => {
      const idx = this.itemsDisponibles.findIndex(
        disp => disp.producto.idProducto === itemActa.producto.idProducto
      );
      if (idx === -1) {
        this.itemsDisponibles.push(itemActa);
      } else {
        this.itemsDisponibles[idx] = itemActa;
      }
    });
    this.filtroCtrl.setValue(this.filtroCtrl.value, { emitEvent: true });
    this.cdr.detectChanges();
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
        this.fusionarItemsPropiosEnDisponibles();
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

    const itemParaLista = invItem.esOriginal
      ? invItem
      : { ...invItem, estadoDetalle: 'NUEVO', esOriginal: false };

    this.itemsSeleccionados.update(list => [...list, itemParaLista]);
    this.filtroCtrl.setValue('');
  }

  eliminarItem(index: number) {
    const item = this.itemsSeleccionados()[index];
    if (!item) return;

    // Enfoque híbrido: si el equipo ya fue despachado (ASIGNADO), avisar que al guardar volverá a su bodega origen
    if (this.esEdicion() && item.esOriginal && item.estadoDetalle === 'ASIGNADO') {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '460px',
        data: {
          titulo: '¿Quitar equipo asignado?',
          mensaje: `El equipo <b>${item.producto.nombreproducto}</b> ya fue despachado (<b>ASIGNADO</b>).<br><br>Al guardar los cambios, se <b>reingresará automáticamente</b> a su bodega de origen (<b>${item.bodega?.nombrebodega || 'Bodega Origen'}</b>) y se eliminará de esta acta.`,
          textoBoton: 'Quitar y devolver',
          colorBoton: 'warn'
        }
      });

      dialogRef.afterClosed().subscribe(confirmado => {
        if (confirmado) {
          this.itemsSeleccionados.update(list => list.filter((_, i) => i !== index));
        }
      });
      return;
    }

    // Si ya fue devuelto previamente por el modal de devoluciones, solo se retira del acta
    if (this.esEdicion() && item.esOriginal && item.estadoDetalle === 'DEVUELTO') {
      this.itemsSeleccionados.update(list => list.filter((_, i) => i !== index));
      this.mensaje.open('Equipo ya devuelto se retira de la lista (al guardar no afectará el stock).', 'info');
      return;
    }

    // Si está PENDIENTE o es un ítem recién agregado en memoria
    this.itemsSeleccionados.update(list => list.filter((_, i) => i !== index));
  }

  obtenerClaseEstadoItem(estado: string): string {
    switch ((estado || '').toUpperCase()) {
      case 'PENDIENTE': return 'item-pendiente';
      case 'ASIGNADO': return 'item-asignado';
      case 'DEVUELTO': return 'item-devuelto';
      case 'NUEVO': return 'item-nuevo';
      default: return 'item-pendiente';
    }
  }

  obtenerTooltipEliminar(item: any): string {
    if (!this.esEdicion() || !item.esOriginal) return 'Quitar equipo de la lista';
    if (item.estadoDetalle === 'ASIGNADO') return 'Quitar del acta y devolver automáticamente a bodega origen al guardar';
    if (item.estadoDetalle === 'DEVUELTO') return 'Retirar equipo ya devuelto del acta';
    return 'Quitar equipo de la reserva';
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.ubicacionFiltroCtrl.markAsTouched();
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
      idUbicacion: this.form.value.idUbicacion,
      responsableDestino: this.form.value.responsableDestino?.trim() || '',
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
          const msg = err.error?.mensaje || err.error?.message || 'Error al actualizar la asignación';
          this.mensaje.open(msg, 'error');
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
          const msg = err.error?.mensaje || err.error?.message || 'Error al guardar la asignación';
          this.mensaje.open(msg, 'error');
          this.guardando.set(false);
        }
      });
    }
  }
}
