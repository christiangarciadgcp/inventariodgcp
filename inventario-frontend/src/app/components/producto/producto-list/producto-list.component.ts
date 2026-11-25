import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { RouterLink } from '@angular/router';

import { ProductoService } from '../../../services/producto.service';
import { Producto } from '../../../models/producto';
import { ProductoDialogComponent } from '../producto-dialog/producto-dialog.component';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { Mensaje } from '../../../core/mensaje';
import { ProductoGaleriaDialogComponent } from '../producto-galeria-dialog/producto-galeria-dialog.component';
import { AuthService } from '../../../services/auth.service';
import { LayoutService } from '../../../services/layout.service';
import { ProductoQrDialogComponent } from '../producto-qr-dialog/producto-qr-dialog.component';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatCardModule, MatTooltipModule, MatDialogModule,
    MatSnackBarModule, MatFormFieldModule, MatInputModule, RouterLink,
    MatSortModule, MatProgressSpinnerModule, MatProgressBarModule
  ],
  templateUrl: './producto-list.component.html',
  styleUrl: './producto-list.component.css',
})
export class ProductoListComponent implements OnInit {

  displayedColumns: string[] = ['id', 'sku', 'nombre', 'categoria', 'marca', 'ser-inv', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Producto>([]);

  cargaInicial = signal<boolean>(true);
  cargando = signal<boolean>(true);
  cargandoExcel = signal<boolean>(false);

  // Estado de vista y paginación en servidor
  tipoVista = signal<'NORMAL' | 'BASE'>('NORMAL');
  totalRegistros = signal<number>(0);
  pageIndex = signal<number>(0);
  pageSize = signal<number>(50);
  sortBy = signal<string>('id');
  sortDir = signal<'asc' | 'desc'>('asc');
  filtroActual = signal<string>('');

  private busqueda$ = new Subject<string>();
  private recargar$ = new Subject<void>();

  private productoService = inject(ProductoService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private mensaje = inject(Mensaje);
  private destroyRef = inject(DestroyRef);
  public layoutService = inject(LayoutService);

  ngOnInit(): void {
    // Buscador con debounce para evitar peticiones innecesarias al escribir
    this.busqueda$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(texto => {
      this.filtroActual.set(texto);
      this.pageIndex.set(0);
      this.cargarProductos();
    });

    this.recargar$.pipe(
      switchMap(() => {
        this.cargando.set(true);
        return this.productoService.getProductosPaginado(
          this.tipoVista() === 'BASE',
          this.filtroActual(),
          this.pageIndex(),
          this.pageSize(),
          this.sortBy(),
          this.sortDir()
        ).pipe(
          catchError(err => {
            const msg = err.error?.mensaje || err.error?.message || 'Error al cargar productos';
            this.mensaje.open(msg, 'warning');
            this.cargando.set(false);
            this.cargaInicial.set(false);
            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      if (res) {
        this.dataSource.data = res.content;
        this.totalRegistros.set(res.totalElements);
        this.cargando.set(false);
        this.cargaInicial.set(false);
      }
    });


    this.cargarProductos();
  }

  cargarProductos() {
    this.recargar$.next();
  }

  cambiarVista(tipo: 'NORMAL' | 'BASE') {
    if (this.tipoVista() === tipo) return;
    this.tipoVista.set(tipo);
    this.pageIndex.set(0);
    this.cargarProductos();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim();
    this.busqueda$.next(filterValue);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarProductos();
  }

  onSortChange(sortState: Sort) {
    if (!sortState.direction) {
      this.sortBy.set('id');
      this.sortDir.set('asc');
    } else {
      this.sortBy.set(sortState.active);
      this.sortDir.set(sortState.direction);
    }
    this.pageIndex.set(0);
    this.cargarProductos();
  }

  verGaleria(producto: any) {
    if (!producto.imagenes || producto.imagenes.length === 0) {
      this.mensaje.open('Este producto no tiene fotografías asignadas.', 'info');
      return;
    }

    this.dialog.open(ProductoGaleriaDialogComponent, {
      width: '800px',
      data: {
        nombre: producto.nombreproducto,
        imagenes: producto.imagenes
      }
    });
  }

  abrirFormulario(producto?: Producto) {
    const dialogRef = this.dialog.open(ProductoDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      disableClose: true,
      autoFocus: false,
      data: producto
        ? { producto: producto }
        : { esGenericoPorDefecto: this.tipoVista() === 'BASE' }
    });

    dialogRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape') {
        dialogRef.close(false);
      }
    });

    dialogRef.afterClosed().subscribe(exito => {
      if (exito === true) {
        this.cargarProductos();
      }
    });
  }

  desactivarProducto(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: '¿Desactivar Producto?',
        mensaje: 'El producto dejará de estar visible.',
        textoBoton: 'Desactivar',
        colorBoton: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.productoService.desactivarProducto(id).subscribe({
          next: () => {
            this.cargarProductos();
            this.mensaje.open('Producto desactivado correctamente', 'exito');
          },
          error: (err) => {
            const msg = err.error?.mensaje || 'No se pudo desactivar el producto';
            this.mensaje.open(msg, 'warning');
          }
        });
      }
    });
  }

  reactivarProducto(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: '¿Reactivar Producto?',
        mensaje: 'El producto volverá a estar disponible para movimientos.',
        textoBoton: 'Reactivar',
        colorBoton: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.productoService.activarProducto(id).subscribe({
          next: () => {
            this.cargarProductos();
            this.mensaje.open('Producto reactivado con éxito', 'exito');
          },
          error: (err) => {
            const msg = err.error?.mensaje || 'No se pudo activar el producto';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.cargandoExcel.set(true);
      this.mensaje.open('Procesando archivo, por favor espere...', 'info');
      const idActual = this.authService.getIdUsuarioActual();
      this.productoService.subirExcelMasivo(file, idActual).subscribe({
        next: (res) => {
          this.cargandoExcel.set(false);
          const totalProductos = res.cantidad || 0;
          this.mensaje.open(`Se agregaron ${totalProductos} productos exitosamente`, 'exito');
          this.pageIndex.set(0);
          this.cargarProductos();
          event.target.value = '';
        },
        error: (err) => {
          this.cargandoExcel.set(false);
          const errorMsg = err.error?.mensaje || 'Error al procesar el archivo Excel';
          this.mensaje.open(errorMsg, 'error');
          event.target.value = '';
        }
      });
    }
  }

  verCodigoQr(producto: Producto): void {
    this.dialog.open(ProductoQrDialogComponent, {
      width: '380px',
      data: { producto: producto }
    });
  }
}
