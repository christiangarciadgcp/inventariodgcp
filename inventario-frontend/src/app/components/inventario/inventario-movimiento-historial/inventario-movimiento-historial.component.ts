import { Component, inject, signal, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select'; // <-- IMPORTACIÓN CLAVE
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { InventarioService } from '../../../services/inventario.service';
import { Utils } from '../../../core/utils';
import { Mensaje } from '../../../core/mensaje';
import { InventarioMovimientosService } from '../../../services/reportes/inventario-movimientos.service';
import { PdfViewerDialogComponent } from '../../pdf-viewer-dialog/pdf-viewer-dialog.component';

@Component({
  selector: 'app-inventario-movimiento-historial',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatTableModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule,
    MatSelectModule, MatPaginatorModule, MatInputModule, RouterLink
  ],
  templateUrl: './inventario-movimiento-historial.component.html',
  styleUrl: './inventario-movimiento-historial.component.css',
})
export class InventarioMovimientoHistorialComponent {
  private inventarioService = inject(InventarioService);
  public utils = inject(Utils);
  private mensaje = inject(Mensaje);
  private reporteService = inject(InventarioMovimientosService);
  private dialog = inject(MatDialog);

  buscando = false;
  displayedColumns: string[] = ['icono', 'detalle', 'bodega', 'cantidad', 'fecha'];
  dataSource = new MatTableDataSource<any>([]);
  movimientos = signal<any[]>([]);

  // Lista de tipos de movimientos disponibles para el select
  tiposMovimiento: string[] = ['TODOS', 'ENTRADA', 'SALIDA', 'DESPACHO', 'DESCARGO']; // S EPUEDE AGREGAR 'AJUSTE' SI SE REQUIERE

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Formulario unificado de filtros
  filtroForm = new FormGroup({
    inicio: new FormControl<Date | null>(null, Validators.required),
    fin: new FormControl<Date | null>(null, Validators.required),
    tipo: new FormControl<string>('TODOS')
  });

  constructor() {
    effect(() => {
      this.dataSource.data = this.movimientos();
      if (this.paginator) this.dataSource.paginator = this.paginator;
    });
  }

  buscarMovimientos() {
    if (this.filtroForm.invalid) {
      this.mensaje.open('El rango de fechas es requerido.', 'warning');
      this.filtroForm.markAllAsTouched();
      return;
    }

    this.buscando = true;

    // Normalizar horas para abarcar los días completos
    const fechaInicio = new Date(this.filtroForm.value.inicio!);
    fechaInicio.setHours(0, 0, 0, 0);

    const fechaFin = new Date(this.filtroForm.value.fin!);
    fechaFin.setHours(23, 59, 59, 999);

    const tipoSeleccionado = this.filtroForm.value.tipo || 'TODOS';

    this.inventarioService.buscarMovimientosPorFechas(
      fechaInicio.toISOString(),
      fechaFin.toISOString(),
      tipoSeleccionado
    ).subscribe({
      next: (data) => {
        this.movimientos.set(data);
        this.buscando = false;

        if(data.length === 0) {
          this.mensaje.open('No se encontraron movimientos con los criterios aplicados.', 'info');
        }
      },
      error: () => {
        this.buscando = false;
        this.mensaje.open('Error al consultar el servidor', 'error');
      }
    });
  }

  descargarReportePdf() {
    if (this.movimientos().length === 0) return;

    const strInicio = this.filtroForm.value.inicio!.toLocaleDateString('es-ES');
    const strFin = this.filtroForm.value.fin!.toLocaleDateString('es-ES');
    const tipoFiltro = this.filtroForm.value.tipo || 'TODOS';

    const urlBlob = this.reporteService.generarPdfHistorialMovimientos(this.movimientos(), strInicio, strFin, tipoFiltro);

    this.dialog.open(PdfViewerDialogComponent, {
      width: '100%',
      maxWidth: '60vw',
      height: '75%',
      panelClass: 'full-screen-modal',
      data: { url: urlBlob, titulo: `Historial de Movimientos` }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getIconoMovimiento(tipo: string): string {
    switch (tipo.toUpperCase()) {
      case 'ENTRADA': return 'trending_up';
      case 'SALIDA': return 'trending_down';
      case 'DESPACHO': return 'local_shipping';
      case 'DESCARGO': return 'remove_circle_outline';
      case 'AJUSTE': return 'tune';
      default: return 'swap_horiz';
    }
  }

  getColorMovimiento(tipo: string): string {
    switch (tipo.toUpperCase()) {
      case 'ENTRADA': return 'text-success bg-success-subtle';
      case 'SALIDA': return 'text-danger bg-danger-subtle';
      case 'DESPACHO': return 'text-primary bg-primary-subtle';
      case 'DESCARGO': return 'text-danger bg-danger-subtle';
      case 'AJUSTE': return 'text-warning bg-warning-subtle';
      default: return 'text-secondary bg-light';
    }
  }
}
