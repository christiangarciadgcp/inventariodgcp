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
import {Marca} from '../../../../models/marca';
import {MarcaService} from '../../../../services/marca.service';
import {Mensaje} from '../../../../core/mensaje';
import {ConfirmDialogComponent} from '../../../confirm-dialog/confirm-dialog.component';
import {MatSort, MatSortHeader} from '@angular/material/sort';
import {MarcaDialogComponent} from '../marca-dialog/marca-dialog.component';
import {Bodega} from '../../../../models/bodega';
import {UnidadMedida} from '../../../../models/unidades-medidas';

@Component({
  selector: 'app-marca-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatCardModule, MatTooltipModule, MatDialogModule, MatSnackBarModule, RouterLink, MatSort, MatSortHeader
  ],
  templateUrl: './marca-list.component.html',
  styleUrl: './marca-list.component.css',
})
export class MarcaListComponent {

  displayedColumns : string[] = ['id', 'nombre', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Marca>([]);
  marcas = signal<Marca[]>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private marcaService = inject(MarcaService);
  private dialog = inject(MatDialog);
  private mensaje = inject(Mensaje);

  constructor(){
    effect(() => {
      this.dataSource.data = this.marcas();
      if (this.paginator) this.dataSource.paginator = this.paginator;
      if(this.sort) this.dataSource.sort = this.sort;
    });

    this.dataSource.filterPredicate = (data: Marca, filter: string) => {
      const searchStr = (data.nombremarca).toLowerCase();
      return searchStr.includes(filter);
    };

    this.dataSource.sortingDataAccessor = (item : Marca, property : string) => {
      switch(property){
        case 'id':
          return item.idMarca;
        case 'nombre':
          return item.nombremarca;
        case 'estado':
          return item.activo;
        default:
          return (item as any)[property];
      }
    };
  }

  ngOnInit(): void {
    this.cargarMarcas();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  cargarMarcas() {
    this.marcaService.getMarcas().subscribe({
      next: (data) => this.marcas.set(data),
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.message || 'Error al cargar las marcas';
        this.mensaje.open(msg, 'warning');
      }
    });
  }

  abrirFormulario(marca?: Marca){
    const dialogRef = this.dialog.open(MarcaDialogComponent,{
      width: '400px',
      disableClose: false,
      data : marca ? { marca : marca} : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        if(marca && marca.idMarca){
          this.actualizarMarca(marca.idMarca, result);
        }else{
          this.registrarMarca(result);
        }
      }
    });
  }

  actualizarMarca(id : number, data:any){
    const marcaActualizada : Marca = {
      nombremarca : data.nombre,
      activo : false
    };

    this.marcaService.updateMarca(id, marcaActualizada).subscribe({
      next : () => {
        this.cargarMarcas();
        this.mensaje.open('Marca actualizada exitosamente', 'exito');
      },
      error : (err) => {
        const msg = err.error?.mensaje || 'Error al actualizar la marca';
        this.mensaje.open(msg, 'error');
      }
    });
  }

  registrarMarca(datos:any){
    const nuevaMarca : Marca = {
      nombremarca : datos.nombre,
      activo : datos.activo
    };

    this.marcaService.createMarca(nuevaMarca).subscribe({
      next : () => {
        this.cargarMarcas();
        this.mensaje.open('Marca registrada exitosamente', 'exito');
      },
      error: (e) => {
        console.error(e);
        this.mensaje.open('Error al guardar la marca', 'error')
      }
    });
  }

    desactivarMarca(id : number) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          titulo: '¿Desactivar Marca?',
          mensaje: 'La Marca dejará de estar visible.',
          textoBoton: 'Desactivar',
          colorBoton: 'primary'
        }
      });
      dialogRef.afterClosed().subscribe(confirmado => {
        if (confirmado) {
          this.marcaService.desactivarMarca(id).subscribe({
            next: () => {
              this.cargarMarcas();
              this.mensaje.open('Marca desactivada correctamente','exito');
            },
            error: (err) => {
              const msg = err.error?.mensaje || 'No se pudo desactivar la Marca';
              this.mensaje.open(msg, 'error');
            }
          });
        }
      });
    }

    reactivarMarca(id: number) {
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
          this.marcaService.activarMarca(id).subscribe({
            next: () => {
              this.cargarMarcas();
              this.mensaje.open('Marca reactivada correctamente','exito');
            },
            error: (err) => {
              const msg = err.error?.mensaje || 'No se pudo activar la marca';
              this.mensaje.open(msg, 'error');
            }
          });
        }
      });
    }


}
