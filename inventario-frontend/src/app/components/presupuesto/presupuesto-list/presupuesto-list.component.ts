import { Component, OnInit, ViewChild, inject, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter} from '@angular/material/core';

import { PresupuestoService } from '../../../services/presupuesto.service';
import { Presupuesto } from '../../../models/presupuesto';
import { AuthService } from '../../../services/auth.service';
import { PdfViewerDialogComponent } from '../../pdf-viewer-dialog/pdf-viewer-dialog.component';
import { DespachoService } from '../../../services/reportes/despacho.service';
import { Mensaje } from '../../../core/mensaje';
import { PresupuestoDetalleComponent } from '../presupuesto-detalle/presupuesto-detalle.component';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { PresupuestoAprobacionComponent } from '../presupuesto-aprobacion/presupuesto-aprobacion.component';
import { Utils } from '../../../core/utils';
import { MovimientoMaterialesActaService } from '../../../services/reportes/movimiento-materiales-acta.service';

@Component({
  selector: 'app-presupuesto-list',
  standalone: true,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ],
  imports: [
    CommonModule, RouterLink, MatTableModule, MatPaginatorModule,
    MatSortModule, MatButtonModule, MatIconModule, MatCardModule,
    MatInputModule, MatFormFieldModule, MatTooltipModule,
    ReactiveFormsModule, MatDatepickerModule, MatNativeDateModule
  ],
  templateUrl: './presupuesto-list.component.html',
  styleUrl: './presupuesto-list.component.css',
})
export class PresupuestoListComponent implements OnInit {

  private dateAdapter = inject(DateAdapter<Date>);
  private presupuestoService = inject(PresupuestoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private despachoService = inject(DespachoService);
  private movimientoMaterialesService = inject(MovimientoMaterialesActaService);
  private mensaje = inject(Mensaje);
  public utils = inject(Utils);

  displayedColumns: string[] = ['id', 'fecha', 'destino', 'solicitante', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Presupuesto>([]);
  presupuestos = signal<Presupuesto[]>([]);
  esEncargadoInventario = signal<boolean>(false);
  esJefeUTDI = signal<boolean>(false);
  esAdmin = signal<boolean>(false);

  todasLasSolicitudes = signal<Presupuesto[]>([]);
  currentTab: number = 0;

  // Formulario reactivo para el selector de fechas igual que en Historial
  filtroFechas = new FormGroup({
    inicio: new FormControl<Date | null>(null),
    fin: new FormControl<Date | null>(null)
  });

  conteoPendientes = computed(() => this.todasLasSolicitudes().filter(p => p.estado === 'PENDIENTE').length);
  conteoAprobados = computed(() => this.todasLasSolicitudes().filter(p => p.estado === 'APROBADO').length);
  conteoDespachos = computed(() => this.todasLasSolicitudes().filter(p => p.estado === 'DESPACHO PARCIAL').length);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    effect(() => {
      this.dataSource.data = this.presupuestos();
      if (this.paginator) this.dataSource.paginator = this.paginator;
      if (this.sort) this.dataSource.sort = this.sort;
    });

    this.dataSource.filterPredicate = (data: Presupuesto, filter: string) => {
      const searchStr = (
        data.idPresupuesto +
        (data.numeroActa || '') +
        data.nombre_presupuesto +
        data.idusuariopresupuesto.nombreusuario +
        (data.ubicacion?.nombreubicacion || '')
      ).toLowerCase();
      return searchStr.includes(filter);
    };

    this.dataSource.sortingDataAccessor = (item: Presupuesto, property: string) => {
      switch (property) {
        case 'id':
          return item.idPresupuesto;
        case 'fecha':
          return item.fecha_creacion;
        case 'destino':
          return item.nombre_presupuesto;
        case 'solicitante':
          return item.idusuariopresupuesto.nombreusuario;
        case 'estado':
          return item.estado;
        default:
          return (item as any)[property];
      }
    };
  }

  ngOnInit(): void {
    this.dateAdapter.setLocale('es-ES');
    const rolActual = this.authService.getRolUsuario();
    this.esEncargadoInventario.set(rolActual === 'inventario utdi' || rolActual === 'administrador' || rolActual === 'jefe utdi' || rolActual === 'coordinador utdi');
    this.esJefeUTDI.set(rolActual === 'jefe utdi' || rolActual === 'administrador' || rolActual === 'coordinador utdi');
    this.esAdmin.set(rolActual === 'administrador');

    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam) {
      this.currentTab = +tabParam;
    }

    // Al seleccionar fechas en la pestaña TODOS se filtra automáticamente
    this.filtroFechas.valueChanges.subscribe(() => {
      if (this.currentTab === 3) {
        this.filtrarDatos();
      }
    });

    this.cargarPresupuestos();
  }

  cargarPresupuestos() {
    this.presupuestoService.listarTodos().subscribe({
      next: (data) => {
        const ordenadas = data.sort((a, b) => b.idPresupuesto! - a.idPresupuesto!);
        this.todasLasSolicitudes.set(ordenadas);
        this.filtrarDatos();
      },
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.message || 'Error con el servidor';
        this.mensaje.open('Error al cargar la información', 'warning');
        this.mensaje.open(msg, 'error');
      }
    });
  }

  onTabChange(index: number) {
    this.currentTab = index;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: index },
      queryParamsHandling: 'merge'
    });

    this.filtrarDatos();
  }

  limpiarFechas(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.filtroFechas.reset({ inicio: null, fin: null });
    this.filtrarDatos();
  }

  filtrarDatos() {
    const lista = this.todasLasSolicitudes();

    if (this.currentTab === 0) {
      this.presupuestos.set(lista.filter(p => p.estado === 'PENDIENTE'));
    } else if (this.currentTab === 1) {
      this.presupuestos.set(lista.filter(p => p.estado === 'APROBADO'));
    } else if (this.currentTab === 2) {
      this.presupuestos.set(lista.filter(p => p.estado === 'DESPACHO PARCIAL'));
    } else {
      // Pestaña 3: TODOS (Aplica filtro de rango de fechas si se definió)
      let resultado = [...lista];
      const { inicio, fin } = this.filtroFechas.value;

      if (inicio) {
        const dInicio = new Date(inicio);
        dInicio.setHours(0, 0, 0, 0);

        resultado = resultado.filter(p => {
          if (!p.fecha_creacion) return false;
          return new Date(p.fecha_creacion) >= dInicio;
        });
      }

      if (fin) {
        const dFin = new Date(fin);
        dFin.setHours(23, 59, 59, 999);

        resultado = resultado.filter(p => {
          if (!p.fecha_creacion) return false;
          return new Date(p.fecha_creacion) <= dFin;
        });
      }

      this.presupuestos.set(resultado);
    }

    if (this.paginator) this.paginator.firstPage();
  }

  aprobarSolicitud(id: number) {
    const idUsuario = this.authService.getIdUsuarioActual();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: '¿Desea aprobar este presupuesto?',
        mensaje: 'La solicitud pasará a estado APROBADO',
        textoBoton: 'Aprobar',
        colorBoton: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.presupuestoService.aprobarPresupuesto(id, idUsuario).subscribe({
          next: () => {
            this.mensaje.open('Presupuesto aprobado. Pase a la pestaña de Aprobados.', 'exito');
            this.cargarPresupuestos();
          },
          error: (err) => {
            const msg = err.error?.mensaje || 'No se pudo aprobar este presupuesto';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }

  cancelarSolicitud(id: number) {
    const idUsuario = this.authService.getIdUsuarioActual();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: '¿Desea cancelar este presupuesto?',
        mensaje: 'La solicitud pasará a estado CANCELADO',
        textoBoton: 'Aceptar',
        colorBoton: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.presupuestoService.cancelarPresupuesto(id, idUsuario).subscribe({
          next: () => {
            this.mensaje.open('Presupuesto ha sido Cancelado', 'exito');
            this.cargarPresupuestos();
          },
          error: (err) => {
            const msg = err.error?.mensaje || 'No se pudo Cancelar este presupuesto';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  verDetallePresupuesto(presupuesto: Presupuesto) {
    this.dialog.open(PresupuestoDetalleComponent, {
      width: '900px',
      maxWidth: '100vw',
      maxHeight: '90vh',
      disableClose: false,
      data: { presupuesto: presupuesto }
    });
  }

  evaluarPresupuesto(idPresupuesto: number, nombreusuario: string) {
    const dialogRef = this.dialog.open(PresupuestoAprobacionComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { idPresupuesto: idPresupuesto, nombreusuario: nombreusuario }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.accion === 'recargar') {
        this.currentTab = result.tabDestino;
        this.cargarPresupuestos();

        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { tab: this.currentTab },
          queryParamsHandling: 'merge'
        });
      }
    });
  }

  imprimirDespacho(presupuesto: Presupuesto) {
    if (presupuesto.estado !== 'DESPACHADO' && presupuesto.estado !== 'DESPACHO PARCIAL') {
      this.mensaje.open('Solo se puede imprimir hoja de despacho de presupuestos despachados', 'warning');
      return;
    }

    this.presupuestoService.obtenerDatosReporte(presupuesto.idPresupuesto!).subscribe({
      next: (data) => {
        const urlBlob = this.despachoService.generarPdfDespacho(data);
        this.dialog.open(PdfViewerDialogComponent, {
          width: '100%',
          maxWidth: '60vw',
          height: '75%',
          panelClass: 'full-screen-modal',
          data: {
            url: urlBlob,
            titulo: `${presupuesto.ubicacion?.siglasubicacion || ''} - ${presupuesto.nombre_presupuesto}`
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.mensaje.open('Error al generar el reporte', 'error');
      }
    });
  }

  imprimirActaMateriales(presupuesto: Presupuesto) {
    if (presupuesto.estado !== 'DESPACHADO' && presupuesto.estado !== 'DESPACHO PARCIAL') {
      this.mensaje.open('Solo se puede generar el acta de presupuestos despachados', 'warning');
      return;
    }

    this.presupuestoService.obtenerDatosReporte(presupuesto.idPresupuesto!).subscribe({
      next: (data) => {
        const urlBlob = this.movimientoMaterialesService.generarActaMovimientoMaterialesPdf(data);
        this.dialog.open(PdfViewerDialogComponent, {
          width: '100%',
          maxWidth: '65vw',
          height: '80%',
          panelClass: 'full-screen-modal',
          data: {
            url: urlBlob,
            titulo: `Acta de Movimiento de Materiales N° ${data.numeroActa || presupuesto.idPresupuesto}`
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.mensaje.open('Error al generar el Acta de Movimiento de Materiales', 'error');
      }
    });
  }
}
