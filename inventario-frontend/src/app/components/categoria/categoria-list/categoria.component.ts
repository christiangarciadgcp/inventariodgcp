import { Component, OnInit,inject, signal, ViewChild, effect} from '@angular/core';
//import { RouterLink } from '@angular/router';
//import { CommonModule } from '@angular/common';
import { CategoriaService } from '../../../services/categoria.service';
import { Categoria } from '../../../models/categoria';
import { CategoriaDialogComponent } from '../categoria-dialog/categoria-dialog.component';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { Mensaje } from '../../../core/mensaje';

// --- Imports de Material ---
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-categoria',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './categoria.component.html',
  styleUrl: './categoria.component.css',
})
export class CategoriaComponent implements OnInit{

  displayedColumns: string[] = ['id', 'nombre', 'acciones'];

  dataSource = new MatTableDataSource<Categoria>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  categorias = signal<Categoria[]>([]);

  //INYECCIONES
  private categoriaService = inject(CategoriaService);
  private dialog = inject(MatDialog);
  private mensaje = inject(Mensaje);

  constructor() {
    effect(() => {
      this.dataSource.data = this.categorias();

      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    });
  }

  ngOnInit(): void {
    this.cargarCategorias();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data) => {
        this.categorias.set(data);

      },
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.message || 'Error al cargar categorias';
        this.mensaje.open(msg, 'warning');
      }
    });
  }


  abrirFormulario(categoria? : Categoria) {
    const dialogRef = this.dialog.open(CategoriaDialogComponent, {
      width: '400px',
      disableClose: false, // Evita que se cierre haciendo clic fuera
      data: categoria ? {categoria : categoria} : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if(categoria && categoria.idCategoria){
          this.actualizarCategoria(categoria.idCategoria,result);
        }else{
          // Si hay resultado (el usuario dio Guardar), llamamos al servicio
          this.registrarCategoria(result);
        }
      }
    });
  }

  actualizarCategoria(id : number, data: any){
    const categoriaActualizada : Categoria = {
      nombrecategoria : data.nombre
    };

    this.categoriaService.actualizarCategoria(id, categoriaActualizada).subscribe({
      next : () => {
        this.mensaje.open('Categoría actualizada con exito', 'exito');
        this.cargarCategorias();
      },
      error : (err) => {
        const msg = err.error?.mensaje || 'Error al actualizar la categoria';
        this.mensaje.open(msg, 'error');
      }
    });
  }

  registrarCategoria(datosFormulario: any) {
    // Armamos el objeto (el ID es autogenerado, no lo mandamos)
    const nuevaCategoria: Categoria = {
      nombrecategoria: datosFormulario.nombre
    };

    //console.log('Enviando JSON:', nuevaCategoria);

    this.categoriaService.createCategoria(nuevaCategoria).subscribe({
      next: () => {
        // ¡Éxito! Recargamos la lista
        this.cargarCategorias();
        this.mensaje.open('¡Categoría creada con éxito!', 'exito');
      },
      error: (e) => {
        console.error('Error al guardar:', e);
        this.mensaje.open('Error al crear la categoría', 'error');
      }
    });

  }

  eliminar(id: number): void {
    //Abrimos el dialog de confirmación
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px'
    });

    //Esperamos la respuesta (true o false)
    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.categoriaService.deleteCategoria(id).subscribe({
          next: () => {
            this.cargarCategorias();
            this.mensaje.open('Categoría eliminada correctamente', 'exito');
          },
          error: (e) => {
            console.error(e);
            this.mensaje.open('No se pudo eliminar la categoría', 'error');
          }
        });
      }
    });
  }

}
