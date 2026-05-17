import { Component, OnInit, inject, signal, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { BodegaService } from '../../../services/bodega.service';
import { Bodega } from '../../../models/bodega';
import { BodegaDialogComponent } from '../bodega-dialog/bodega-dialog.component';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { RouterLink } from '@angular/router';
import { Mensaje } from '../../../core/mensaje';

@Component({
  selector: 'app-bodega-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatCardModule, MatTooltipModule, MatDialogModule, MatSnackBarModule, RouterLink,MatSortModule
  ],
  templateUrl: './bodega-list.component.html',
  styleUrl: './bodega-list.component.css',
})
export class BodegaListComponent {

  displayedColumns: string[] = ['id', 'nombre', 'direccion', 'telefono', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Bodega>([]);
  bodegas = signal<Bodega[]>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;


  //Inyecciones
  private bodegaService = inject(BodegaService);
  private dialog = inject(MatDialog);
  private mensaje = inject(Mensaje);

  constructor(){
    effect(() => {
      this.dataSource.data = this.bodegas();
      if(this.paginator) this.dataSource.paginator = this.paginator;
      if(this.sort) this.dataSource.sort = this.sort;
    });

    this.dataSource.sortingDataAccessor = (item : Bodega, property : string) => {
      switch(property){
        case 'id':
          return item.idBodega;
        case 'nombre':
          return item.nombrebodega;
        case 'estado':
          return item.activo;
        default:
          return (item as any)[property];
      }
    };
  }

  ngOnInit(): void {
    this.cargarBodegas();
  }

  cargarBodegas() {
    this.bodegaService.getBodegas().subscribe({
      next: (data) => this.bodegas.set(data),
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.message || 'Error al cargar bodegas';
        this.mensaje.open(msg, 'warning');
      }
    });
  }

  abrirFormulario(bodega? : Bodega){
    const dialogRef = this.dialog.open(BodegaDialogComponent,{
      width: '400px',
       disableClose: false,
       data : bodega ? {bodega : bodega} : null
      });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        if(bodega && bodega.idBodega){
          this.actualizarBodega(bodega.idBodega, result)
        }else{
          this.registrarBodega(result);
        }
      }
    });
  }

  actualizarBodega(id:number, data:any){
    const bodegaActualizada : Bodega = {
      nombrebodega: data.nombre,
      direccionbodega: data.direccion,
      telefonobodega: data.telefono,
      activo: false
    };

    this.bodegaService.updateBodega(id, bodegaActualizada).subscribe({
      next : () => {
        this.cargarBodegas();
        this.mensaje.open('Bodega actualizada correctamente', 'exito');
      },
      error : (err) => {
        const msg = err.error?.mensaje || 'Error al actualizar Bodega';
        this.mensaje.open(msg, 'error');
      }
    });
  }

  registrarBodega(datos:any){
    const nuevaBodega : Bodega = {
      nombrebodega: datos.nombre,
      direccionbodega: datos.direccion,
      telefonobodega : datos.telefono,
      activo : datos.activo
    };

    console.log('Enviando:', nuevaBodega);

    this.bodegaService.createBodega(nuevaBodega).subscribe({
      next: () => {
        this.cargarBodegas();
        this.mensaje.open('Bodega registrada exitosamente', 'exito');
      },
      error: (e) => {
        console.error(e);
        this.mensaje.open('Error al guardar la bodega', 'error')
      }
    });

  }

  desactivarBodega(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: '¿Desactivar Bodega?',
        mensaje: 'La Bodega dejará de estar visible.',
        textoBoton: 'Desactivar',
        colorBoton: 'primary'
      }
    });
    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.bodegaService.desactivarBodega(id).subscribe({
          next: () => {
            this.cargarBodegas();
            this.mensaje.open('Bodega desactivada correctamente','exito');
          },
          error: (err) => {
            const msg = err.error?.mensaje || 'No se pudo desactivar la Bodega';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }

  reactivarBodega(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: '¿Reactivar Bodega?',
        mensaje: 'La Bodega volverá a estar visible.',
        textoBoton: 'Reactivar',
        colorBoton: 'primary'
      }
    });
    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.bodegaService.activarBodega(id).subscribe({
          next: () => {
            this.cargarBodegas();
            this.mensaje.open('Bodega reactivada correctamente','exito');
          },
          error: (err) => {
            const msg = err.error?.mensaje || 'No se pudo activar la Bodega';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }

}
