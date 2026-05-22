import {Component, effect, inject, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {RouterLink} from '@angular/router';
import {MatSort, MatSortHeader} from '@angular/material/sort';
import {Modelo} from '../../../../models/modelo';
import {Mensaje} from '../../../../core/mensaje';
import {ModeloService} from '../../../../services/modelo.service';
import {ModeloDialogComponent} from '../modelo-dialog/modelo-dialog.component';
import {ConfirmDialogComponent} from '../../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-modelo-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatCardModule, MatTooltipModule, MatDialogModule, MatSnackBarModule, RouterLink, MatSort, MatSortHeader
  ],
  templateUrl: './modelo-list.component.html',
  styleUrl: './modelo-list.component.css',
})
export class ModeloListComponent {

  displayedColumns: string[] = ['id', 'marca', 'nombre', 'acciones'];
  dataSource = new MatTableDataSource<Modelo>([]);
  modelos = signal<Modelo[]>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private modeloService = inject(ModeloService);
  private dialog = inject(MatDialog);
  private mensaje = inject(Mensaje);

  constructor() {
    effect(() => {
      this.dataSource.data = this.modelos();
      if (this.paginator) this.dataSource.paginator = this.paginator;
    });
  }

  ngOnInit(): void {
    this.cargarModelos();
  }


  private cargarModelos() {
    this.modeloService.getModelos().subscribe({
      next: (data) => {
        const modelosL = data.filter(m => m.nombremodelo !== 'SIN ESPECIFICAR');
        this.modelos.set(modelosL)
      },
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.message || 'Error al cargar los modelos';
        this.mensaje.open(msg, 'warning');
      }
    });
  }

  abrirFormulario(modelo?: Modelo) {
    const dialogRef = this.dialog.open(ModeloDialogComponent, {
      width: '400px',
      disableClose: false,
      data : modelo ? { modelo : modelo} : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        if(modelo && modelo.idModelo){
          this.actualizarModelo(modelo.idModelo, result);
        }else{
          this.registrarModelo(result)
        }
      }
    });
  }

  actualizarModelo(id : number, datos : any){

    this.modeloService.updateModelo(id, datos).subscribe({
      next : () => {
        this.cargarModelos();
        this.mensaje.open('Modelo actualizado correctamente', 'exito');
      },
      error : (err) => {
        const msg = err.error?.mensaje || 'Error al actualizar el modelo';
        this.mensaje.open(msg, 'error');
      }
    });
  }

  registrarModelo(datos : any){

    this.modeloService.createModelo(datos).subscribe({
      next : () => {
        this.cargarModelos();
        this.mensaje.open('Modelo registrado exitosamente', 'exito');
      },
      error: (e) => {
        this.mensaje.open('Error al guardar el modelo', 'error')
      }
    });
  }

  desactivarModelo(id : number){
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: '¿Desactivar Modelo?',
        mensaje: 'El modelo dejará de estar visible.',
        textoBoton: 'Desactivar',
        colorBoton: 'primary'
      }
    });
    dialogRef.afterClosed().subscribe(confirmado => {
      if(confirmado){
        this.modeloService.desactivarModelo(id).subscribe({
          next: () => {
            this.cargarModelos();
            this.mensaje.open('Modelo desactivado correctamente', 'exito');
          },
          error: (err) => {
            const msg = err.error?.mensaje || 'No se pudo desactivar el modelo';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }

  reactivarModelo(id : number){
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: '¿Reactivar Marca?',
        mensaje: 'La Marca volverá a estar visible.',
        textoBoton: 'Reactivar',
        colorBoton: 'primary'
      }
    });
    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.modeloService.activarModelo(id).subscribe({
          next: () => {
            this.cargarModelos();
            this.mensaje.open('Modelo reactivado correctamente','exito');
          },
          error: (err) => {
            const msg = err.error?.mensaje || 'No se pudo activar la marca';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }

}// FIN ModeloListComponent
