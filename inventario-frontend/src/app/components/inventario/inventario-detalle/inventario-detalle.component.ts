import { Component, OnInit, inject, ChangeDetectorRef, viewChild, effect} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { startWith, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { InventarioService } from '../../../services/inventario.service';
import { ProductoService } from '../../../services/producto.service';
import { InventarioAjusteComponent } from '../inventario-ajuste/inventario-ajuste.component';
import { MatDialog } from '@angular/material/dialog';
import { InventarioBodegaService } from '../../../services/reportes/inventario-bodega.service';
import { Mensaje } from '../../../core/mensaje';
import { PdfViewerDialogComponent } from '../../pdf-viewer-dialog/pdf-viewer-dialog.component';
import { Producto } from '../../../models/producto';

@Component({
  selector: 'app-inventario-detalle',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatInputModule, MatFormFieldModule, MatIconModule, MatButtonModule,
    MatCardModule, MatTooltipModule, RouterLink, MatAutocompleteModule, ReactiveFormsModule
  ],
  templateUrl: './inventario-detalle.component.html',
  styleUrl: './inventario-detalle.component.css',
})
export class InventarioDetalleComponent implements OnInit {

  private inventarioService = inject(InventarioService);
  private productoService = inject(ProductoService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private reporteInventario = inject(InventarioBodegaService);
  private mensaje = inject(Mensaje);

  displayedColumns: string[] = ['sku', 'producto', 'ser-inv', 'categoria', 'cantidad', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);

  paginator = viewChild(MatPaginator);
  sort = viewChild(MatSort);

  nombreBodega: string = '';
  idBodega: number = 0;
  totalValorizado: number = 0;
  cargando: boolean = true;

  buscadorCtrl = new FormControl('');
  productosMaestros: Producto[] = [];
  productosFiltrados: Observable<Producto[]>;
  mostrarBuscador = false;

  constructor() {

    effect(() => {
      const paginadorActual = this.paginator();
      const sortActual = this.sort();

      if (paginadorActual) {
        this.dataSource.paginator = paginadorActual;
      }
      if(sortActual){
        this.dataSource.sort = sortActual;
      }
    });

    this.dataSource.sortingDataAccessor = (item: any,property : string) => {
      switch(property){
        case 'sku': return item.producto?.skuproducto;
        case 'producto': return item.producto?.nombreproducto;
        case 'ser-inv': return item.producto?.serieproducto;
        case 'categoria': return item.producto?.categoria?.nombrecategoria || '';
        case 'cantidad': return item.cantidad_actual;
        default: return item[property];
      }
    };

    // Filtro para el Autocomplete
    this.productosFiltrados = this.buscadorCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(value => {
        const nombre = typeof value === 'string' ? value : (value as any)?.nombreproducto;
        return nombre ? this._filtrarProductos(nombre) : this.productosMaestros.slice();
      })
    );
  }

  ngOnInit(): void {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const datosAString = (
        data.producto.skuproducto +
        data.producto.nombreproducto +
        (data.producto.categoria?.nombrecategoria || '') +
        data.producto.serieproducto +
        data.producto.inventarioproducto
      ).toLowerCase();
      return datosAString.includes(filter);
    };

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.idBodega = +id;
        this.cargarProductos(this.idBodega);
      }
    });

  }

  private _filtrarProductos(nombre: string): Producto[] {
    const filterValue = nombre.toLowerCase();
    return this.productosMaestros.filter(p =>
      p.nombreproducto.toLowerCase().includes(filterValue) ||
      p.skuproducto.toLowerCase().includes(filterValue) ||
      (p.serieproducto && p.serieproducto.toLowerCase().includes(filterValue))
    );
  }

  displayFn(producto: Producto): string {
    return producto && producto.nombreproducto ? `${producto.skuproducto} - ${producto.nombreproducto}` : '';
  }

  toggleBuscadorMaestro() {
    this.mostrarBuscador = !this.mostrarBuscador;
    if (!this.mostrarBuscador) {
      this.buscadorCtrl.setValue('');
    }
  }

  productoMaestroSeleccionado(event: any) {
    const productoSeleccionado: Producto = event.option.value;
    const existeEnBodega = this.dataSource.data.find((item: any) => item.producto.idProducto === productoSeleccionado.idProducto);

    if (existeEnBodega) {
      this.mensaje.open('El producto ya tiene registros en esta bodega. Utilice la tabla de abajo para ajustarlo.', 'info');
      this.buscadorCtrl.setValue('');
      return;
    }

    const elementoSimulado = {
      producto: productoSeleccionado,
      cantidad_actual: 0
    };

    this.abrirAjuste(elementoSimulado);

    this.buscadorCtrl.setValue('');
    this.mostrarBuscador = false;
  }

  cargarProductos(id: number) {
    this.cargando = true;
    this.inventarioService.listarInventarioPorBodega(id).subscribe({
      next: (data) => {
        if (data.length > 0) {
          this.nombreBodega = data[0].bodega.nombrebodega;
        }
        const inventarioFisico = data.filter((item : any) => !item.producto.esGenerico);
        this.dataSource.data = inventarioFisico;
        this.totalValorizado = inventarioFisico.reduce((acc : number, item : any) =>
          acc + (item.cantidad_actual * item.producto.preciocostoproducto), 0);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  abrirAjuste(element: any) {
    const dialogRef = this.dialog.open(InventarioAjusteComponent, {
      width: '600px',
      disableClose: true,
      data: {
        producto: element.producto,
        cantidadActual: element.cantidad_actual,
        idBodega: this.idBodega,
        nombreBodega: this.nombreBodega
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.cargarProductos(this.idBodega);
        this.cdr.detectChanges();
      }
    });
  }

  imprimirReporte() {
    if (!this.dataSource.data || this.dataSource.data.length === 0) {
      this.mensaje.open('No hay existencias para generar el reporte', 'warning');
      return;
    }
    const datosConStock = this.dataSource.data.filter((item: any) => item.cantidad_actual > 0);
    if (datosConStock.length === 0) {
      this.mensaje.open('No hay productos con existencias reales para imprimir.', 'warning');
      return;
    }
    const nombre = this.nombreBodega ? this.nombreBodega : 'Bodega #' + this.idBodega;
    const urlBlob = this.reporteInventario.generarPdfInventarioBodega(nombre, datosConStock);

    this.dialog.open(PdfViewerDialogComponent, {
      width: '100%',
      maxWidth: '60vw',
      height: '75%',
      panelClass: 'full-screen-modal',
      data: {
        url: urlBlob,
        titulo: `Reporte de Existencias - ${nombre}`
      }
    });
  }


  actualizarInventarioSilencioso() {
    if (this.idBodega === 0) return;

    this.inventarioService.listarInventarioPorBodega(this.idBodega).subscribe({
      next: (data) => {
        const inventarioFisico = data.filter((item : any) => !item.producto.esGenerico);

        this.dataSource.data = inventarioFisico;

        this.totalValorizado = inventarioFisico.reduce((acc : number, item : any) =>
          acc + (item.cantidad_actual * item.producto.preciocostoproducto), 0);

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error actualizando tabla silenciosamente', err)
    });
  }

  actualizarMaestroSilencioso() {
    this.productoService.getProductosActivos().subscribe({
      next: (data) => {
        this.productosMaestros = data.filter(p => !p.esGenerico);
        this.buscadorCtrl.setValue(this.buscadorCtrl.value);
      },
      error: (err) => console.error('Error actualizando catálogo maestro silenciosamente', err)
    });
  }
}
