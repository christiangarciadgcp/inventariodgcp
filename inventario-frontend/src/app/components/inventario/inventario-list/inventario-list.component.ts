import { Component, OnInit, inject, signal,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterModule } from '@angular/router';

import { InventarioService } from '../../../services/inventario.service';
import { Bodega } from '../../../models/bodega';
import { MatDivider } from '@angular/material/divider';
import { Mensaje } from '../../../core/mensaje';
import {MatDialog} from '@angular/material/dialog';
import {InventarioBodegasConsolidadoService} from '../../../services/reportes/inventario-bodegas-consolidado.service';
import {PdfViewerDialogComponent} from '../../pdf-viewer-dialog/pdf-viewer-dialog.component';

@Component({
  selector: 'app-inventario-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, RouterModule, RouterLink, MatDivider],
  templateUrl: './inventario-list.component.html',
  styleUrl: './inventario-list.component.css',
})
export class InventarioListComponent implements OnInit {


  private inventarioService = inject(InventarioService);
  private cdr = inject(ChangeDetectorRef);
  private mensaje = inject(Mensaje)
  private dialog = inject(MatDialog);
  private reporteConsolidado = inject(InventarioBodegasConsolidadoService)

  bodegas = signal<Bodega[]>([]);
  generandoReporte = false;
  generandoExcel = false;

  ngOnInit(): void {
    this.cargarInventario();
  }


  cargarInventario() {
    this.inventarioService.listarBodegas().subscribe({
      next: (data) => {
        this.bodegas.set(data);
        this.cdr.detectChanges();

      },
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.message || 'Error con el servidor';
        this.mensaje.open('Error al cargar la información', 'warning');
        this.mensaje.open(msg, 'error');
      }
    });
  }

  imprimirReporteConsolidado() {
    this.generandoReporte = true;

    this.inventarioService.listarInventarioConsolidado().subscribe({
      next: (data) => {
        if(!data || data.length === 0) {
          this.mensaje.open('No hay inventario en ninguna Bodega', 'warning');
          this.generandoReporte = false;
          return;
        }

        const urlBlob = this.reporteConsolidado.generarPdfInventarioConsolidado(data);

        this.dialog.open(PdfViewerDialogComponent, {
          width : '100%',
          maxWidth : '60vw',
          height : '75%',
          panelClass : 'full-screen-modal',
          data : {
            url: urlBlob,
            titulo: 'Consolidado Global de Existencias'
          }
        });

        this.generandoReporte = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log(err);
        this.mensaje.open('Error al cargar el inventario', 'error');
        this.generandoReporte = false;
        this.cdr.detectChanges();
      }
    });
  }

  descargarExcelConsolidado() {
    this.generandoExcel = true;

    this.inventarioService.listarInventarioConsolidado().subscribe({
      next: (data) => {
        if(!data || data.length === 0) {
          this.mensaje.open('No hay inventario en ninguna Bodega', 'warning');
          this.generandoExcel = false;
          return;
        }

        this.reporteConsolidado.generarExcelInventarioConsolidado(data);

        this.mensaje.open('Excel generado exitosamente', 'exito');
        this.generandoExcel = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log(err);
        this.mensaje.open('No se pudo generar el archivo Excel', 'error');
        this.generandoExcel = false;
        this.cdr.detectChanges();
      }
    });
  }
}
