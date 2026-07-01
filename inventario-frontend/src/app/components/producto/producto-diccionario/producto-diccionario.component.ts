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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ProductoService } from '../../../services/producto.service';
import { Producto } from '../../../models/producto';
import { Mensaje } from '../../../core/mensaje';
import { ProductoGaleriaDialogComponent } from '../producto-galeria-dialog/producto-galeria-dialog.component';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-diccionario-producto',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatCardModule, MatTooltipModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSortModule, RouterLink
  ],
  templateUrl: './producto-diccionario.component.html',
  styleUrl: './producto-diccionario.component.css',
})
export class ProductoDiccionarioComponent implements OnInit {

  // Tabla simplificada: Quitamos columnas administrativas como Proveedor o Estado
  displayedColumns: string[] = ['sku', 'nombre', 'categoria', 'marca', 'acciones'];
  dataSource = new MatTableDataSource<Producto>([]);
  productos = signal<Producto[]>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private productoService = inject(ProductoService);
  private dialog = inject(MatDialog);
  private mensaje = inject(Mensaje);

  constructor() {
    effect(() => {
      this.dataSource.data = this.productos();
      if (this.paginator) this.dataSource.paginator = this.paginator;
      if (this.sort) this.dataSource.sort = this.sort;
    });

    this.dataSource.filterPredicate = (data: Producto, filter: string) => {

      const searchStr = (
        data.nombreproducto +
        data.skuproducto +
        (data.categoria?.nombrecategoria ?? '') +
        (data.modelo?.marca?.nombremarca ?? '')
      ).toLowerCase();

      return searchStr.includes(filter);
    };


    this.dataSource.sortingDataAccessor = (item: Producto, property: string) => {
      switch (property) {
        case 'sku': return item.skuproducto;
        case 'nombre': return item.nombreproducto;
        case 'categoria': return item.categoria?.nombrecategoria;
        case 'marca': return item.modelo?.marca?.nombremarca;
        default: return (item as any)[property];
      }
    };
  }

  ngOnInit(): void {
    this.cargarProductos();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  cargarProductos() {
    this.productoService.getProductosActivos().subscribe({
      next: (data) => {

        const productosGenericos = data.filter(producto => producto.esGenerico);

        const dataOrdenada = productosGenericos.sort((a, b) =>
          a.nombreproducto.localeCompare(b.nombreproducto, 'es', { sensitivity: 'base' })
        );

        this.productos.set(dataOrdenada);
      },
      error: (err) => {
        const msg = err.error?.mensaje || 'Error al cargar los materiales/equipos';
        this.mensaje.open(msg, 'warning');
      }
    });
  }

  verGaleria(producto: any) {
    if (!producto.imagenes || producto.imagenes.length === 0) {
      this.mensaje.open('Este producto no tiene fotografías de referencia.', 'info');
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
}
