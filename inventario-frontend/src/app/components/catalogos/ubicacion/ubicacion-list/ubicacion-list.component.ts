import { Component, OnInit, inject, signal, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ConfirmDialogComponent } from '../../../confirm-dialog/confirm-dialog.component';
import { RouterLink } from '@angular/router';
import { Mensaje } from '../../../../core/mensaje';
import { Ubicacion } from '../../../../models/ubicacion';
import { UbicacionDialogComponent } from '../ubicacion-dialog/ubicacion-dialog.component';
import {UbicacionService} from '../../../../services/ubicacion.service';




@Component({
  selector: 'app-ubicacion-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatCardModule, MatTooltipModule, MatDialogModule, MatSnackBarModule, RouterLink,MatSortModule
  ],
  templateUrl: './ubicacion-list.component.html',
  styleUrl: './ubicacion-list.component.css',
})
export class UbicacionListComponent {

  displayedColumns : string[] = ['id', 'nombre', 'siglas', 'estado', 'acciones'];

  dataSource = new MatTableDataSource<Ubicacion>([]);
  ubicaciones = signal<Ubicacion[]>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private ubicacionService = inject(UbicacionService);
  private dialog = inject(MatDialog);
  private mensaje = inject(Mensaje);

  constructor() {
    effect(() => {
      this.dataSource.data = this.ubicaciones();
      if (this.paginator) this.dataSource.paginator = this.paginator;
      if (this.sort) this.dataSource.sort = this.sort;
    });

    this.dataSource.filterPredicate = (data: Ubicacion, filter: string) => {
      const searchStr = (data.nombreubicacion + data.siglasubicacion).toLowerCase();
      return searchStr.includes(filter);
    }

    this.dataSource.sortingDataAccessor = (item: Ubicacion, property: string) => {
      switch (property) {
        case 'id':
          return item.idUbicacion;
        case 'nombre':
          return item.nombreubicacion;
        case 'siglas':
          return item.siglasubicacion;
        case 'estado':
          return item.activo;
        default:
          return (item as any)[property];
      }
    };
  }

  ngOnInit(): void {
    this.cargarUbicaciones();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event : Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if(this.dataSource.paginator){
      this.dataSource.paginator.firstPage()
    }
  }

  cargarUbicaciones() {
    this.ubicacionService.getUbicaciones().subscribe({
      next: (data) => this.ubicaciones.set(data),
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.message || 'Error al cargar ubicaciones';
        this.mensaje.open(msg, 'warning');
      }
    });
  }

  abrirFormulario(ubicacion?: Ubicacion){
    const dialogRef = this.dialog.open(UbicacionDialogComponent,{
      width: '400px',
      disableClose: false,
      data : ubicacion ? { ubicacion : ubicacion} : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        if(ubicacion && ubicacion.idUbicacion){
          this.actualizarUbicacion(ubicacion.idUbicacion, result);
        }else{
          this.registrarUbicacion(result);
        }
      }
    });
  }


  actualizarUbicacion(id: number, data: any) {
    const ubicacionActualizada : Ubicacion = {
      nombreubicacion : data.nombre,
      siglasubicacion : data.siglas,
      activo : false
    };

    this.ubicacionService.updateUbicacion(id, ubicacionActualizada).subscribe({
      next: () => {
        this.cargarUbicaciones();
        this.mensaje.open('Ubicación actualizada correctamente', 'exito')
      },
      error: (err) => {
        const msg = err.error?.mensaje || 'Error al actualizar la Ubicación';
        this.mensaje.open(msg, 'error');
      }
    });
  }

  registrarUbicacion(datos: any) {
    const nuevo : Ubicacion = {
      nombreubicacion : datos.nombre,
      siglasubicacion : datos.siglas,
      activo : datos.activo
    };

    this.ubicacionService.createUbicacion(nuevo).subscribe({
      next: () => {
        this.cargarUbicaciones();
        this.mensaje.open('Ubicación registrada exitosamente', 'exito');
      },
      error: (err) => {
        const msg = err.error?.mensaje || 'Error al registrar la Ubicación';
        this.mensaje.open(msg, 'error');
      }
    });
  }

  desactivarUbicacion(id: number){
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: '¿Desactivar Ubicación?',
        mensaje: 'El Ubicación dejará de estar visible.',
        textoBoton: 'Desactivar',
        colorBoton: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if(confirmado){
        this.ubicacionService.desactivarUbicacion(id).subscribe({
          next: () => {
            this.cargarUbicaciones();
            this.mensaje.open('Ubicación desactivada exitosamente', 'exito');
          },
          error: (err) => {
            const msg = err.error?.mensaje || 'No se pudo desactivar la Ubicación';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }

  reactivarUbicacion(id: number){
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: '¿Reactivar Ubicación?',
        mensaje: 'El Ubicación volverá a estar visible.',
        textoBoton: 'Reactivar',
        colorBoton: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if(confirmado){
       this.ubicacionService.activarUbicacion(id).subscribe({
         next: () => {
           this.cargarUbicaciones();
           this.mensaje.open('Ubicación reactivada correctamente','exito');
         },
         error: (err) => {
           const msg = err.error?.mensaje || 'No se pudo activar la Ubicación';
           this.mensaje.open(msg, 'error');
         }
       });
      }
    });
  }
}
