import {Component, OnInit, inject, signal, ViewChild, effect, viewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';

import { InventarioService } from '../../../services/inventario.service';
import { ProductoService } from '../../../services/producto.service';

export interface MaterialConsulta {
  idProducto: number;
  sku: string;
  nombreGenerico: string;
  marcas: string[];
  unidadMedida: string;
  totalStockGlobal: number;
  desglosePorBodega: { nombreBodega: string, cantidad: number }[];
}

@Component({
  selector: 'app-inventario-consulta',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule,
    RouterLink, MatProgressSpinnerModule
  ],
  templateUrl: './inventario-consulta.component.html',
  styleUrl: './inventario-consulta.component.css'
})
export class InventarioConsultaComponent implements OnInit {

  private inventarioService = inject(InventarioService);
  private productoService = inject(ProductoService);

  cargando = signal<boolean>(true);
  displayedColumns: string[] = ['producto', 'marca', 'stockGlobal', 'desglose'];
  dataSource = new MatTableDataSource<MaterialConsulta>([]);

  paginator = viewChild(MatPaginator);
  sort = viewChild(MatSort);

  constructor() {
    effect(() => {
      const paginadorActual = this.paginator();
      const sortActual = this.sort();

      if (paginadorActual) {
        this.dataSource.paginator = paginadorActual;
      }
      if (sortActual) {
        this.dataSource.sort = sortActual;
      }
    });

    this.dataSource.filterPredicate = (data: MaterialConsulta, filter: string) => {
      const marcasStr = data.marcas.join(' ');
      const searchStr = (data.sku + data.nombreGenerico + marcasStr).toLowerCase();
      return searchStr.includes(filter);
    };
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando.set(true);

    forkJoin({
      productosBase: this.productoService.getProductosActivos(),
      inventarios: this.inventarioService.listarInventarioConsolidado()
    }).subscribe({
      next: (res) => {
        const map = new Map<number, MaterialConsulta>();

        const productoMap = new Map<number, any>();
        res.productosBase.forEach(p => productoMap.set(p.idProducto!, p));

        res.productosBase.forEach(p => {
          if (p.esGenerico || (!p.esGenerico && !p.productoPadre)){
            map.set(p.idProducto!, {
              idProducto: p.idProducto!,
              sku: p.skuproducto,
              nombreGenerico: p.nombreproducto,
              marcas: [],
              unidadMedida: p.unidadMedida?.abreviaturaunidadmedida || 'U',
              totalStockGlobal: 0,
              desglosePorBodega: []
            });
          }
        });

        // Mapa temporal para agrupar por bodega: Map<idGenerico, Map<nombreBodega, cantidad>>
        const sumadorBodegas = new Map<number, Map<string, number>>();

        // Set para evitar marcas duplicadas por cada producto genérico
        const marcasSet = new Map<number, Set<string>>();

        // Sumamos el inventario físico y recolectamos sus marcas
        res.inventarios.forEach((inv: any) => {
          const productoFisico = inv.producto;

          // Si tiene padre, se suma al padre. Si no, se suma a sí mismo.
          const idTarget = productoFisico.productoPadre ? productoFisico.productoPadre.idProducto : productoFisico.idProducto;

          if (map.has(idTarget)) {
            const item = map.get(idTarget)!;
            item.totalStockGlobal += inv.cantidad_actual;

            // Extraer la marca del producto físico actual
            const nombreMarca = productoFisico.modelo?.marca?.nombremarca;
            if (nombreMarca) {
              if (!marcasSet.has(idTarget)) {
                marcasSet.set(idTarget, new Set<string>());
              }
              marcasSet.get(idTarget)!.add(nombreMarca);
            }

            // Lógica para agrupar las cantidades por nombre de bodega
            if (!sumadorBodegas.has(idTarget)) {
              sumadorBodegas.set(idTarget, new Map<string, number>());
            }

            const bodegasDelItem = sumadorBodegas.get(idTarget)!;
            const nombreBod = inv.bodega.nombrebodega;
            bodegasDelItem.set(nombreBod, (bodegasDelItem.get(nombreBod) || 0) + inv.cantidad_actual);
          }
        });

        // Trasladamos los datos del sumador y del set de marcas al objeto final
        map.forEach((item, idGenerico) => {

          // Asignar marcas únicas encontradas
          if (marcasSet.has(idGenerico)) {
            item.marcas = Array.from(marcasSet.get(idGenerico)!);
          }

          const bodegas = sumadorBodegas.get(idGenerico);
          if (bodegas) {
            bodegas.forEach((cantidad, nombreBodega) => {
              item.desglosePorBodega.push({ nombreBodega, cantidad });
            });
          }
        });

        // Ordenamos alfabéticamente
        const dataFinal = Array.from(map.values()).sort((a, b) =>
          a.nombreGenerico.localeCompare(b.nombreGenerico, 'es', { sensitivity: 'base' })
        );

        this.dataSource.data = dataFinal;
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando consulta general', err);
        this.cargando.set(false);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
