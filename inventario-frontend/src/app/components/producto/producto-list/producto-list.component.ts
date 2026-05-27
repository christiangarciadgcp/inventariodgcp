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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// Modelos y Servicios
import { ProductoService } from '../../../services/producto.service';
import { Producto, ProductoRegistroDTO } from '../../../models/producto';
import { ProductoDialogComponent } from '../producto-dialog/producto-dialog.component';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { RouterLink } from '@angular/router';
import { Mensaje } from '../../../core/mensaje';
import {ProductoGaleriaDialogComponent} from '../producto-galeria-dialog/producto-galeria-dialog.component';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatCardModule, MatTooltipModule, MatDialogModule,
    MatSnackBarModule, MatFormFieldModule, MatInputModule, RouterLink,MatSortModule
  ],
  templateUrl: './producto-list.component.html',
  styleUrl: './producto-list.component.css',
})
export class ProductoListComponent implements OnInit {

  displayedColumns: string[] = ['id', 'sku', 'ser-inv', 'nombre', 'categoria', 'marca', 'proveedor', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Producto>([]);
  productos = signal<Producto[]>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private productoService = inject(ProductoService);
  private dialog = inject(MatDialog);
  private mensaje = inject(Mensaje);

  constructor() {
    // Sincronización reactiva: cada vez que el signal 'productos' cambie, actualizamos la tabla
    effect(() => {
      this.dataSource.data = this.productos();
      if (this.paginator) this.dataSource.paginator = this.paginator;
      if(this.sort) this.dataSource.sort = this.sort;
    });

    // CONFIGURACIÓN DE BÚSQUEDA LOCAL
    this.dataSource.filterPredicate = (data: Producto, filter: string) => {
      const searchStr = (data.skuproducto + data.serieproducto + data.inventarioproducto + data.nombreproducto + data.categoria?.nombrecategoria + data.modelo?.marca?.nombremarca + data.modelo?.nombremodelo + data.proveedor?.nombreproveedor ).toLowerCase();
      //const nombre = data.nombreproducto ? data.nombreproducto.toLowerCase() : '';
      //const term = filter.trim().toLowerCase();
      return searchStr.includes(filter); // Retorna true si el nombre contiene el texto buscado
    };

    this.dataSource.sortingDataAccessor = (item : Producto, property : string) => {
      switch(property){
        case 'id':
          return item.idProducto;
        case 'sku':
          return item.skuproducto;
        case 'nombre':
          return item.nombreproducto;
        case 'categoria':
          return item.categoria?.nombrecategoria;
        case 'marca':
          return item.modelo?.marca?.nombremarca;
        case 'proveedor':
          return item.proveedor?.nombreproveedor;
        case 'estado':
          return item.activo;
        default:
          return (item as any)[property];
      }
    };
  }

  ngOnInit(): void {
    this.cargarProductos();
  }

  // Se activa al escribir en la barra de búsqueda
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  cargarProductos() {
    this.productoService.getProductos().subscribe({
      next: (data) => this.productos.set(data),
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.message || 'Error al cargar productos';
        this.mensaje.open(msg, 'warning');
      }
    });
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
      maxHeight: '95vh',
      disableClose: false,
      data: producto ? { producto: producto } : null
    });

    dialogRef.afterClosed().subscribe(exito => {

      if (exito === true) {
        this.cargarProductos();
      }
    });
  }

/*   actualizarProducto(id: number, producto: any) {
    const productoDTO: ProductoRegistroDTO = {
      nombreproducto: producto.nombreproducto,
      skuproducto: producto.skuproducto,
      descripcionproducto: producto.descripcionproducto,
      serieproducto: producto.serieproducto,
      inventarioproducto : producto.inventarioproducto,
      preciocostoproducto: producto.preciocostoproducto,
      precioventaproducto: producto.precioventaproducto,
      idCategoria: producto.idCategoria,
      idProveedor: producto.idProveedor,
      idUnidadMedida: producto.idUnidadMedida,
      idMarca : producto.idMarca,
      idModelo : producto.idModelo
    };

    this.productoService.updateProducto(id, productoDTO).subscribe({
      next: () => {
        this.cargarProductos();
        this.mensaje.open("Producto actualizado exitosamente", 'exito');
      },
      error: (err) => {
        const msg = err.error?.message || 'Error al actualizar el producto';
        this.mensaje.open(msg, 'error');
      }
    });
  }

  registrarProducto(datosForm: any) {
    const productoDTO: ProductoRegistroDTO = {
      nombreproducto: datosForm.nombreproducto,
      skuproducto: datosForm.skuproducto,
      descripcionproducto: datosForm.descripcionproducto,
      serieproducto : datosForm.serieproducto,
      inventarioproducto : datosForm.inventarioproducto,
      preciocostoproducto: datosForm.preciocostoproducto,
      precioventaproducto: datosForm.precioventaproducto,
      idCategoria: datosForm.idCategoria,
      idProveedor: datosForm.idProveedor,
      idUnidadMedida: datosForm.idUnidadMedida,
      idMarca : datosForm.idMarca,
      idModelo : datosForm.idModelo
    };

    this.productoService.createProducto(productoDTO).subscribe({
      next: () => {
        this.mensaje.open('Producto registrado exitosamente', 'exito');
        this.cargarProductos();
      },
      error: (err) => {
        const msg = err.error?.mensaje || 'Error al registrar el producto';
        this.mensaje.open(msg, 'warning');
      }
    });
  } */

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

}
