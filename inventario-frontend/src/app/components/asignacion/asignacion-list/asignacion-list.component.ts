import { Component, OnInit, inject, signal, effect, viewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';

import { AsignacionService } from '../../../services/asignacion.service';
import { Asignacion } from '../../../models/asignacion';
import { AuthService } from '../../../services/auth.service';
import { Mensaje } from '../../../core/mensaje';
import { Utils } from '../../../core/utils';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { AsignacionActaService } from '../../../services/reportes/asignacion-acta.service';
import { PdfViewerDialogComponent } from '../../pdf-viewer-dialog/pdf-viewer-dialog.component';
import { AsignacionDetalleDialogComponent } from '../asignacion-detalle-dialog/asignacion-detalle-dialog.component';
import { AsignacionDevolucionDialogComponent } from '../asignacion-devolucion-dialog/asignacion-devolucion-dialog.component';

export type TabAsignacion = 'REGISTRADAS' | 'ASIGNADAS' | 'DEVOLUCIONES' | 'TODAS';

@Component({
  selector: 'app-asignacion-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule,
    MatDialogModule, MatProgressSpinnerModule, RouterLink
  ],
  templateUrl: './asignacion-list.component.html',
  styleUrls: ['./asignacion-list.component.css']
})
export class AsignacionListComponent implements OnInit {

  private asignacionService = inject(AsignacionService);
  private authService = inject(AuthService);
  private mensaje = inject(Mensaje);
  public utils = inject(Utils);
  private dialog = inject(MatDialog);
  private actaService = inject(AsignacionActaService);

  cargando = signal<boolean>(true);
  asignaciones = signal<Asignacion[]>([]);
  dataSource = new MatTableDataSource<Asignacion>([]);

  // Control de pestaña activa (por defecto REGISTRADAS)
  tabActiva = signal<TabAsignacion>('REGISTRADAS');


// Contadores reactivos limpios con los estados vigentes
  conteoRegistradas = computed(() => this.asignaciones().filter(a => a.estado === 'REGISTRADA').length);
  conteoAsignadas = computed(() => this.asignaciones().filter(a => a.estado === 'ASIGNADA').length);
  conteoDevoluciones = computed(() => this.asignaciones().filter(a =>
    a.estado === 'DEVOLUCION PARCIAL' || a.estado === 'DEVOLUCION TOTAL'
  ).length);
  // conteoCanceladas = computed(() => this.asignaciones().filter(a => a.estado === 'CANCELADA').length);

  // Filtro y ordenamiento específico por pestaña
  asignacionesPorPestana = computed(() => {
    const tab = this.tabActiva();
    const lista = this.asignaciones();

    switch (tab) {
      case 'REGISTRADAS':
        return lista.filter(a => a.estado === 'REGISTRADA');

      case 'ASIGNADAS':
        return lista.filter(a => a.estado === 'ASIGNADA');

      case 'DEVOLUCIONES':
        // Parciales primero, luego Totales
        const parciales = lista.filter(a => a.estado === 'DEVOLUCION PARCIAL');
        const totales = lista.filter(a => a.estado === 'DEVOLUCION TOTAL');
        return [...parciales, ...totales];

/*      case 'CANCELADAS':
        return lista.filter(a => a.estado === 'CANCELADA');*/

      case 'TODAS':
      default:
        return lista;
    }
  });

  displayedColumns: string[] = ['acta', 'fecha', 'tipo', 'responsable', 'estado', 'acciones'];

  paginator = viewChild(MatPaginator);
  sort = viewChild(MatSort);

  apruebaAsignaciones = signal<boolean>(false);

  constructor() {
    effect(() => {
      this.dataSource.data = this.asignacionesPorPestana();
      const p = this.paginator();
      const s = this.sort();
      if (p) this.dataSource.paginator = p;
      if (s) this.dataSource.sort = s;
    });

    this.dataSource.filterPredicate = (data: Asignacion, filter: string) => {
      const searchStr = (
        data.numeroActa +
        data.responsableDestino +
        data.tipoAsignacion.nombre +
        data.estado +
        (data.observaciones || '')
      ).toLowerCase();
      return searchStr.includes(filter);
    };
  }

  ngOnInit(): void {
    const rol = this.authService.getRolUsuario();
    this.apruebaAsignaciones.set(rol === 'jefe utdi' || rol === 'administrador' || rol === 'coordinador utdi');
    this.cargarAsignaciones();
  }

  cambiarPestana(tab: TabAsignacion) {
    this.tabActiva.set(tab);
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  cargarAsignaciones() {
    this.cargando.set(true);
    this.asignacionService.listarTodas().subscribe({
      next: (data) => {
        this.asignaciones.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.mensaje.open('Error al cargar la lista de asignaciones', 'error');
        this.cargando.set(false);
      }
    });
  }

  applyFilter(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.dataSource.filter = val.trim().toLowerCase();
  }

  verActa(asignacion: Asignacion) {
    this.asignacionService.listarDetalles(asignacion.idAsignacion!).subscribe({
      next: (detalles) => {
        const urlBlob = this.actaService.generarActaPdf(asignacion, detalles);
        this.dialog.open(PdfViewerDialogComponent, {
          width: '100%',
          maxWidth: '65vw',
          height: '80%',
          panelClass: 'full-screen-modal',
          data: {
            url: urlBlob,
            titulo: `Acta de Asignación N° ${asignacion.numeroActa}`
          }
        });
      },
      error: () => this.mensaje.open('No se pudieron obtener los detalles del acta', 'error')
    });
  }

  verDetalleHistorial(asignacion: Asignacion) {
    const dialogRef = this.dialog.open(AsignacionDetalleDialogComponent, {
      width: '850px',
      maxWidth: '95vw',
      data: { asignacion }
    });

    dialogRef.afterClosed().subscribe((recargar) => {
      if (recargar) {
        this.cargarAsignaciones();
      }
    });
  }

  aprobar(asignacion: Asignacion) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: '¿Aprobar Asignación?',
        mensaje: `Se descontarán los equipos físicamente de las bodegas para el Acta <b>${asignacion.numeroActa}</b>.`,
        textoBoton: 'Aprobar Asignación',
        colorBoton: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const idUsuario = this.authService.getIdUsuarioActual();
        this.asignacionService.aprobarAsignacion(asignacion.idAsignacion!, idUsuario).subscribe({
          next: () => {
            this.mensaje.open('Asignación aprobada con éxito', 'exito');
            this.cargarAsignaciones();
          },
          error: (err) => this.mensaje.open(err.error?.mensaje || 'Error al aprobar', 'error')
        });
      }
    });
  }

  cancelar(asignacion: Asignacion) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: '¿Cancelar Solicitud?',
        mensaje: `Al cancelar la asignación <b>${asignacion.numeroActa}</b>, ese número de acta quedará liberado para la siguiente solicitud procesada.`,
        textoBoton: 'Cancelar Asignación',
        colorBoton: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const idUsuario = this.authService.getIdUsuarioActual();
        this.asignacionService.cancelarAsignacion(asignacion.idAsignacion!, idUsuario).subscribe({
          next: () => {
            this.mensaje.open('Asignación cancelada y número liberado exitosamente', 'exito');
            this.cargarAsignaciones();
          },
          error: (err) => this.mensaje.open(err.error?.mensaje || 'Error al cancelar', 'error')
        });
      }
    });
  }

  abrirDevolucion(asignacion: Asignacion) {
    const dialogRef = this.dialog.open(AsignacionDevolucionDialogComponent, {
      width: '850px',
      maxWidth: '95vw',
      disableClose: true,
      data: { asignacion }
    });

    dialogRef.afterClosed().subscribe(recargar => {
      if (recargar) this.cargarAsignaciones();
    });
  }

  obtenerClaseEstado(estado: string): string {
    switch (estado) {
      case 'REGISTRADA': return 'estado-registrada';
      case 'ASIGNADA': return 'estado-asignada';
      case 'DEVOLUCION PARCIAL': return 'estado-devolucion-parcial';
      case 'DEVOLUCION TOTAL': return 'estado-devolucion-total';
      case 'CANCELADA': return 'estado-cancelada';
      default: return 'tipo-default';
    }
  }

  obtenerTextoEstado(estado: string): string {
    return estado || '';
  }

  obtenerClaseTipo(tipo: string): string {
    const t = (tipo || '').toUpperCase().trim();
    if (t.includes('ASIGNAC')) return 'tipo-asignacion';
    if (t.includes('TRASLAD')) return 'tipo-traslado';
    if (t.includes('PRESTAM') || t.includes('PRÉSTAM')) return 'tipo-prestamo';
    if (t.includes('REVISI') || t.includes('REPARAC')) return 'tipo-revision';
    return 'tipo-default';
  }

}
