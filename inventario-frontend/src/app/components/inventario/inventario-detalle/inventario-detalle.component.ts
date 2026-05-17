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

import { InventarioService } from '../../../services/inventario.service';
import { InventarioAjusteComponent } from '../inventario-ajuste/inventario-ajuste.component';
import { MatDialog } from '@angular/material/dialog';
import { InventarioBodegaService } from '../../../services/reportes/inventario-bodega.service';
import { Mensaje } from '../../../core/mensaje';
import { PdfViewerDialogComponent } from '../../pdf-viewer-dialog/pdf-viewer-dialog.component';

@Component({
  selector: 'app-inventario-detalle',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, 
    MatInputModule, MatFormFieldModule, MatIconModule, MatButtonModule, 
    MatCardModule, MatTooltipModule, RouterLink
  ],
  templateUrl: './inventario-detalle.component.html',
  styleUrl: './inventario-detalle.component.css',
})
export class InventarioDetalleComponent implements OnInit {

  private inventarioService = inject(InventarioService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private reporteInventario = inject(InventarioBodegaService);
  private mensaje = inject(Mensaje);

  //displayedColumns: string[] = ['sku', 'producto', 'categoria', 'cantidad', 'costo', 'total'];
  displayedColumns: string[] = ['sku', 'producto', 'categoria', 'cantidad', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);

  paginator = viewChild(MatPaginator);
  sort = viewChild(MatSort);

  nombreBodega: string = '';
  idBodega: number = 0;
  totalValorizado: number = 0;
  cargando: boolean = true;

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
          case 'sku': 
            return item.producto?.skuproducto;
          case 'producto': 
            return item.producto?.nombreproducto;
          case 'categoria': 
            // Si no hay categoría, devolvemos un string vacío para que no falle al ordenar
            return item.producto?.categoria?.nombrecategoria || ''; 
          case 'cantidad': 
            return item.cantidad_actual;
          default: 
            return item[property];
      }
    };
  }

  ngOnInit(): void {
    
    //CONFIGURACIÓN DEL FILTRO PERSONALIZADO
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const datosAString = (
        data.producto.skuproducto + 
        data.producto.nombreproducto + 
        (data.producto.categoria?.nombrecategoria || '')
      ).toLowerCase();
      
      return datosAString.includes(filter);
    };

    //Obtener ID y cargar
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.idBodega = +id;
        this.cargarProductos(this.idBodega);
      }
    });
  }

  cargarProductos(id: number) {
    this.cargando = true;
    this.inventarioService.listarInventarioPorBodega(id).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        
        //CAPTURAR EL NOMBRE DE LA BODEGA
        //Si hay productos, tomamos el nombre de la bodega del primer ítem
        if (data.length > 0) {
            this.nombreBodega = data[0].bodega.nombrebodega;
        }

        this.totalValorizado = data.reduce((acc, item) => 
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
    // Validamos que haya datos
    if (!this.dataSource.data || this.dataSource.data.length === 0) {
      this.mensaje.open('No hay existencias para generar el reporte', 'warning');
      return;
    }

    const nombre = this.nombreBodega ? this.nombreBodega : 'Bodega #' + this.idBodega;
    
    // Le pasamos la data que YA está en la tabla (this.dataSource.data)
    const urlBlob = this.reporteInventario.generarPdfInventarioBodega(nombre, this.dataSource.data);

    // Abrimos el modal tal cual lo haces en Solicitudes
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

}

