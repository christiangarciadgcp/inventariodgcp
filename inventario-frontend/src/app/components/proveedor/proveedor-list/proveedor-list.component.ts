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

import { ProveedorService } from '../../../services/proveedor.service';
import { Proveedor } from '../../../models/proveedor';
import { ProveedorDialogComponent } from '../proveedor-dialog/proveedor-dialog.component';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { RouterLink } from '@angular/router';
import { Mensaje } from '../../../core/mensaje';

@Component({
  selector: 'app-proveedor-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatCardModule, MatTooltipModule, MatDialogModule, MatSnackBarModule, RouterLink
  ],
  templateUrl: './proveedor-list.component.html',
  styleUrl: './proveedor-list.component.css',
})

export class ProveedorListComponent {

  //Columnas a mostrar en la tabla
  displayedColumns : string[] = ['id', 'nombre', 'telefono', 'acciones'];

  dataSource = new MatTableDataSource<Proveedor>([]);
  proveedores = signal<Proveedor[]>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Inyecciones
  private proveedorService = inject(ProveedorService);
  private dialog = inject(MatDialog);
  private mensaje = inject(Mensaje);

  constructor(){
    effect(() => {
      this.dataSource.data = this.proveedores();
      if (this.paginator) this.dataSource.paginator = this.paginator;
    });
  }

  ngOnInit(): void {
    this.cargarProveedores();
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
      telefonoproveedor : data.telefono
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
      telefonoproveedor: datos.telefono
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

}
