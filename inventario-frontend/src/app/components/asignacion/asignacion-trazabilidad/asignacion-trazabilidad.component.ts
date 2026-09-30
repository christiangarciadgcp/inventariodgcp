import { Component, OnInit, inject, signal, effect, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';

import { AsignacionService } from '../../../services/asignacion.service';
import { EquipoTrazabilidadDTO } from '../../../models/asignacion';
import { Utils } from '../../../core/utils';
import { Mensaje } from '../../../core/mensaje';
import {
  AsignacionTrazabilidadDialogComponent
} from '../asignacion-trazabilidad-dialog/asignacion-trazabilidad-dialog.component';

@Component({
  selector: 'app-asignacion-trazabilidad',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDialogModule, RouterLink
  ],
  templateUrl: './asignacion-trazabilidad.component.html',
  styleUrls: ['./asignacion-trazabilidad.component.css']
})
export class AsignacionTrazabilidadComponent implements OnInit {

  private asignacionService = inject(AsignacionService);
  private dialog = inject(MatDialog);
  private mensaje = inject(Mensaje);
  public utils = inject(Utils);

  cargando = signal<boolean>(true);
  equipos = signal<EquipoTrazabilidadDTO[]>([]);
  dataSource = new MatTableDataSource<EquipoTrazabilidadDTO>([]);

  // Columnas unificadas
  displayedColumns: string[] = ['fecha', 'producto', 'marca-modelo', 'serie-inventario', 'estado', 'acciones'];

  paginator = viewChild(MatPaginator);
  sort = viewChild(MatSort);

  constructor() {
    effect(() => {
      this.dataSource.data = this.equipos();
      const p = this.paginator();
      const s = this.sort();
      if (p) this.dataSource.paginator = p;
      if (s) this.dataSource.sort = s;
    });

    this.dataSource.filterPredicate = (data: EquipoTrazabilidadDTO, filter: string) => {
      const search = (
        (data.nombreProducto || '') +
        (data.marca || '') +
        (data.modelo || '') +
        (data.serieProducto || '') +
        (data.inventarioProducto || '') +
        (data.skuProducto || '') +
        (data.asignadoA || '') +
        (data.ultimaActa || '') +
        (data.estadoActual || '')
      ).toLowerCase();
      return search.includes(filter);
    };

    this.dataSource.sortingDataAccessor = (item: EquipoTrazabilidadDTO, property: string) => {
      switch (property) {
        case 'producto': return item.nombreProducto;
        case 'marca-modelo': return (item.marca || '') + ' ' + (item.modelo || '');
        case 'serie-inventario': return (item.serieProducto || '') + ' ' + (item.inventarioProducto || '');
        case 'estado': return item.estadoActual;
        case 'fecha': return item.fechaUltimaAsignacion ? new Date(item.fechaUltimaAsignacion).getTime() : 0;
        default: return (item as any)[property];
      }
    };
  }

  ngOnInit(): void {
    this.cargarEquipos();
  }

  cargarEquipos() {
    this.cargando.set(true);
    this.asignacionService.listarEquiposActivos().subscribe({
      next: (data) => {
        this.equipos.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  applyFilter(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.dataSource.filter = val.trim().toLowerCase();
  }

  verTimeline(element: EquipoTrazabilidadDTO) {
    this.asignacionService.obtenerTrazabilidad(element.idProducto).subscribe({
      next: (historial) => {
        this.dialog.open(AsignacionTrazabilidadDialogComponent, {
          width: '980px',
          maxWidth: '95vw',
          data: {
            equipo: element,
            historial: historial
          }
        });
      },
      error: () => this.mensaje.open('No se pudo cargar el historial del equipo', 'error')
    });
  }
}
