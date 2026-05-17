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

import { UnidadMedidaService } from '../../../services/unidades-medida.service';
import { UnidadMedida } from '../../../models/unidades-medidas';
import { UnidadesMedidasDialogComponent } from '../unidades-medidas-dialog/unidades-medidas-dialog.component';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { RouterLink } from '@angular/router';
import { Mensaje } from '../../../core/mensaje';

@Component({
  selector: 'app-unidades-medidas-list',
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatCardModule, MatTooltipModule, MatDialogModule, MatSnackBarModule, RouterLink
  ],
  templateUrl: './unidades-medidas-list.component.html',
  styleUrl: './unidades-medidas-list.component.css',
})
export class UnidadesMedidasListComponent {

  displayedColumns: string[] = ['id', 'nombre', 'abreviatura', 'acciones'];
  dataSource = new MatTableDataSource<UnidadMedida>([]);
  unidadMedida = signal<UnidadMedida[]>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Inyecciones
  private unidadMedidaService = inject(UnidadMedidaService);
  private dialog = inject(MatDialog);
  private mensaje = inject(Mensaje);


  constructor(){
    effect(() => {
      this.dataSource.data = this.unidadMedida();
      if (this.paginator) this.dataSource.paginator = this.paginator;
    });
  }

  ngOnInit(): void {
    this.cargarUnidadesMedida();
  }

  cargarUnidadesMedida() {
    this.unidadMedidaService.getUnidadesMedida().subscribe({
      next: (data) => this.unidadMedida.set(data),
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.message || 'Error al cargar unidades de medida';
        this.mensaje.open(msg, 'warning');
      }
    });
  }

  abrirFormulario(unidadMedida?:UnidadMedida){
    const dialogRef = this.dialog.open(UnidadesMedidasDialogComponent,{
      width: '400px',
      disableClose: false,
      data : unidadMedida ? {unidadMedida : unidadMedida} : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        if(unidadMedida && unidadMedida.idUnidadMedida){
          this.actualizarUnidadMedida(unidadMedida.idUnidadMedida,result)
        }else{
          this.registrarUnidadMedida(result);
        }
      }
    });
  }

  actualizarUnidadMedida(id : number, data: any){
    const unidadMedidaActualizada : UnidadMedida = {
      nombreunidadmedida : data.nombre,
      abreviaturaunidadmedida: data.abreviatura
    };

    this.unidadMedidaService.updateUnidadMedida(id,unidadMedidaActualizada).subscribe({
      next : () => {
        this.cargarUnidadesMedida();
        this.mensaje.open('Unidad de Medida actualizada correctamente', 'exito');
      },
      error : (err) => {
          const msg = err.error?.mensaje || 'Error al actualizar la Unidad de Medida';
          this.mensaje.open(msg, 'error');
      }
    })
  }

  registrarUnidadMedida(datos:any){
    const nuevaUnidadMedida : UnidadMedida = {
      nombreunidadmedida: datos.nombre,
      abreviaturaunidadmedida: datos.abreviatura
    };

    console.log('Enviando:', nuevaUnidadMedida);

    this.unidadMedidaService.createUnidadMedida(nuevaUnidadMedida).subscribe({
      next: () => {
        this.cargarUnidadesMedida();
        this.mensaje.open('Unidad de Medida registrada exitosamente', 'exito');
      },
      error: (e) => {
        console.error(e);
        this.mensaje.open('Error al guardar la Unidad de Medida', 'error')
      }
    });

  }

  eliminar(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { width: '350px' });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.unidadMedidaService.deleteUnidadMedida(id).subscribe({
          next: () => {
            this.cargarUnidadesMedida();
            this.mensaje.open('Unidad de Medida eliminada', 'exito');
          },
          error: () => this.mensaje.open('No se pudo eliminar', 'error')
        });
      }
    });
  }


}
