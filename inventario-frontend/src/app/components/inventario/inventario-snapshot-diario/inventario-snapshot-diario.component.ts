import { Component, inject, signal, ViewChild, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {InventarioService} from '../../../services/inventario.service';
import {Mensaje} from '../../../core/mensaje';
import {InventarioSnapshotService} from '../../../services/reportes/inventario-snapshot.service';
import {Bodega} from '../../../models/bodega';
import {PdfViewerDialogComponent} from '../../pdf-viewer-dialog/pdf-viewer-dialog.component';

@Component({
  selector: 'app-inventario-snapshot-diario',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatTableModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule,
    MatSelectModule, MatPaginatorModule, MatInputModule, RouterLink
  ],
  templateUrl: './inventario-snapshot-diario.component.html',
  styleUrl: './inventario-snapshot-diario.component.css',
})
export class InventarioSnapshotDiarioComponent implements OnInit{

  private inventarioService = inject(InventarioService);
  private mensaje = inject(Mensaje);
  private reporteService = inject(InventarioSnapshotService);
  private dialog = inject(MatDialog);

  textoBusqueda = '';
  buscando = false;
  generandoExcel = false;
  bodegas: Bodega[]  = [];

  displayedColumns : string[] = ['sku', 'producto', 'categoria', 'cantidad'];
  dataSource = new MatTableDataSource<any>([]);
  snapshots = signal<any[]>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  filtroForm = new FormGroup({
    idBodega: new FormControl<number | null>(null, Validators.required),
    fecha: new FormControl<Date | null>(null, Validators.required)
  });

  constructor() {

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      // Concatenamos todos los datos anidados que queremos que el usuario pueda buscar
      const datosAString = (
        (data.producto?.skuproducto || '') +
        (data.producto?.nombreproducto || '') +
        (data.producto?.categoria?.nombrecategoria || '')
      ).toLowerCase();

      return datosAString.includes(filter);
    };

    effect(() => {
      this.dataSource.data = this.snapshots();
      if(this.paginator) this.dataSource.paginator = this.paginator;
    });
  }

  ngOnInit() {
    this.inventarioService.listarBodegas().subscribe(data => this.bodegas = data);
  }

  buscarSnapshot() {
    if(this.filtroForm.invalid){
      this.mensaje.open('Seleccione la fecha y bodega', 'warning');
      this.filtroForm.markAsTouched();
      return;
    }

    this.buscando = true;

    const fechaInicio = new Date(this.filtroForm.value.fecha!);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(this.filtroForm.value.fecha!);
    fechaFin.setHours(23, 59, 59, 999);

    const idBodega = this.filtroForm.value.idBodega!;

    this.inventarioService.buscarSnapshot(idBodega, fechaInicio.toISOString(), fechaFin.toISOString()).subscribe({
      next: (data) => {
        this.snapshots.set(data);
        this.buscando = false;
        if(data.length === 0) {
          this.mensaje.open('No se encontró snapshot para esta bodega en la fecha seleccionada.', 'info');
        }
      },
      error: () => {
        this.buscando = false;
        this.mensaje.open('Error al consultar el servidor', 'error');
      }
    });
  }

  obtenerNombreBodega() : string {
    const id = this.filtroForm.value.idBodega;
    const bodega = this.bodegas.find(b => b.idBodega === id);
    return bodega ? bodega.nombrebodega : 'Bodega no encontrada';
  }

  obtenerFechaFormateada() : string {
    return this.filtroForm.value.fecha!.toLocaleString('es-ES', { day : '2-digit', month : '2-digit', year: 'numeric'});
  }

  descargarPDF(){
    if(this.snapshots().length === 0) return;
    const urlBlob = this.reporteService.generarSnapshotDiario(this.snapshots(),this.obtenerNombreBodega(), this.obtenerFechaFormateada());
    this.dialog.open(PdfViewerDialogComponent, {
      width : '100%',
      maxWidth : '60vw',
      height : '75%',
      panelClass : 'full-screen-modal',
      data : {
        url : urlBlob,
        titulo : `Snapshot de Inventario`
      }
    });
  }

  descargarExcel() {
    if(this.snapshots().length === 0) return;
    this.generandoExcel = true;
    this.reporteService.generarExcelSnapshot(this.snapshots(),this.obtenerNombreBodega(), this.obtenerFechaFormateada());
    this.generandoExcel = false;
    this.mensaje.open('Archivo Excel generado correctamente', 'exito');
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.textoBusqueda = filterValue;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

}
