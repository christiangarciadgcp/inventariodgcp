import { Component, OnInit, inject, signal, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ProveedorService } from '../../../services/proveedor.service';
import { Proveedor } from '../../../models/proveedor';
import { ProveedorDialogComponent } from '../proveedor-dialog/proveedor-dialog.component';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { RouterLink } from '@angular/router';
import { Mensaje } from '../../../core/mensaje';
import {Bodega} from '../../../models/bodega';

@Component({
  selector: 'app-proveedor-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatCardModule, MatTooltipModule, MatDialogModule, MatSnackBarModule, RouterLink,MatSortModule
  ],
  templateUrl: './proveedor-list.component.html',
  styleUrl: './proveedor-list.component.css',
})

export class ProveedorListComponent {

  //Columnas a mostrar en la tabla
  displayedColumns : string[] = ['id', 'nombre', 'telefono', 'estado', 'acciones'];

  dataSource = new MatTableDataSource<Proveedor>([]);
  proveedores = signal<Proveedor[]>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  //Inyecciones
  private proveedorService = inject(ProveedorService);
  private dialog = inject(MatDialog);
  private mensaje = inject(Mensaje);

  constructor(){
    effect(() => {
      this.dataSource.data = this.proveedores();
      if (this.paginator) this.dataSource.paginator = this.paginator;
      if(this.sort) this.dataSource.sort = this.sort;
    });

    this.dataSource.sortingDataAccessor = (item : Proveedor, property : string) => {
      switch(property){
        case 'id':
          return item.idProveedor;
        case 'nombre':
          return item.nombreproveedor;
        case 'estado':
          return item.activo;
        default:
          return (item as any)[property];
      }
    };
  }

  ngOnInit(): void {
    this.cargarProveedores();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  cargarProveedores() {
    this.proveedorService.getProveedores().subscribe({
      next: (data) => this.proveedores.set(data),
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.message || 'Error al cargar proveedores';
        this.mensaje.open(msg, 'warning');
      }
    });
  }

  abrirFormulario(proveedor? : Proveedor){
    const dialogRef = this.dialog.open(ProveedorDialogComponent,{
      width: '400px',
      disableClose: false,
      data : proveedor ? { proveedor : proveedor} : null
     });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        if(proveedor && proveedor.idProveedor){
          this.actualizarProveedor(proveedor.idProveedor, result);
        }else{
          this.registrarProveedor(result);
        }
      }
    });
  }

  actualizarProveedor(id : number, data : any){
    const proveedorActualizado : Proveedor = {
      nombreproveedor : data.nombre,
      telefonoproveedor : data.telefono,
      activo : false
    };

    this.proveedorService.updateProveedor(id, proveedorActualizado).subscribe({
      next : () => {
        this.cargarProveedores();
        this.mensaje.open('Proveedor actualizado exitosamente', 'exito');
      },
      error : (err) => {
        const msg = err.error?.mensaje || 'Error al actualizar el proveedor';
        this.mensaje.open(msg, 'error');
      }
    });
  }

  registrarProveedor(datos:any){
    const nuevo : Proveedor = {
      nombreproveedor: datos.nombre,
      telefonoproveedor: datos.telefono,
      activo: datos.activo
    };

    console.log('Enviando:', nuevo);

    this.proveedorService.createProveedor(nuevo).subscribe({
      next: () => {
        this.cargarProveedores();
        this.mensaje.open('Proveedor registrado exitosamente', 'exito');
      },
      error: (e) => {
        console.error(e);
        this.mensaje.open('Error al guardar el proveedor', 'error')
      }
    });

  }

  eliminar(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { width: '350px' });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.proveedorService.deleteProveedor(id).subscribe({
          next: () => {
            this.cargarProveedores();
            this.mensaje.open('Proveedor eliminado', 'exito');
          },
          error: () => this.mensaje.open('No se pudo eliminar', 'error')
        });
      }
    });
  }

  desactivarProveedor(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: '¿Desactivar Proveedor?',
        mensaje: 'El Proveedor dejará de estar visible.',
        textoBoton: 'Desactivar',
        colorBoton: 'primary'
      }
    });
    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.proveedorService.desactivarProveedor(id).subscribe({
          next: () => {
            this.cargarProveedores();
            this.mensaje.open('Proveedor desactivado correctamente','exito');
          },
          error: (err) => {
            const msg = err.error?.mensaje || 'No se pudo desactivar el Proveedor';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }

  reactivarProveedor(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: '¿Reactivar Proveedor?',
        mensaje: 'El Proveedor volverá a estar visible.',
        textoBoton: 'Reactivar',
        colorBoton: 'primary'
      }
    });
    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.proveedorService.activarProveedor(id).subscribe({
          next: () => {
            this.cargarProveedores();
            this.mensaje.open('Proveedor reactivado correctamente','exito');
          },
          error: (err) => {
            const msg = err.error?.mensaje || 'No se pudo activar el Proveedor';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }

}
