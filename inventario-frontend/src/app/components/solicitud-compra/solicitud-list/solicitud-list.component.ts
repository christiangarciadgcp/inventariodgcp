import { Component, OnInit, inject, ViewChild, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';

import { SolicitudCompra } from '../../../models/solicitud-compra';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { SolicitudDetalleDialogComponent } from '../solicitud-detalle-dialog/solicitud-detalle-dialog.component';
import { SolicitudCompraService } from '../../../services/solicitud-compra.service';
import { SolicitudCompraReporteService } from '../../../services/reportes/solicitud-compra-reporte.service';
import { PdfViewerDialogComponent } from '../../pdf-viewer-dialog/pdf-viewer-dialog.component';
import { Mensaje } from '../../../core/mensaje';
import { AuthService } from '../../../services/auth.service';
import { SolicitudRecepcionModalComponent } from '../solicitud-recepcion-modal/solicitud-recepcion-modal.component';
import { Utils } from '../../../core/utils';

@Component({
  selector: 'app-solicitud-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatCardModule, MatTooltipModule, MatChipsModule,
    RouterLink, MatFormFieldModule, MatInputModule, MatSortModule
  ],
  templateUrl: './solicitud-list.component.html',
  styleUrl: './solicitud-list.component.css'
})
export class SolicitudListComponent implements OnInit {

  displayedColumns: string[] = ['id', 'fecha', 'nombre', 'solicitante', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<SolicitudCompra>([]);
  solicitudes = signal<SolicitudCompra[]>([]);
  idUsuarioActual = 1;
  esJefeUTDI = signal<boolean>(false);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private dialog = inject(MatDialog);
  private mensaje = inject(Mensaje);
  private solicitudService = inject(SolicitudCompraService);
  private pdfService = inject(SolicitudCompraReporteService);
  private authService = inject(AuthService);
  public utils = inject(Utils);

  constructor() {
    effect(() => {
      this.dataSource.data = this.solicitudes();
      if (this.paginator) this.dataSource.paginator = this.paginator;
      if (this.sort) this.dataSource.sort = this.sort;
    });

    // Filtro personalizado: Busca por ID, Nombre de Solicitud o Estado
    this.dataSource.filterPredicate = (data: SolicitudCompra, filter: string) => {
      const searchStr = (data.idSolicitudCompra + data.nombresolicitud + data.estado).toLowerCase();
      return searchStr.includes(filter);
    };

    this.dataSource.sortingDataAccessor = (item: SolicitudCompra, property: string) => {
      switch (property) {
        case 'id':
          return item.idSolicitudCompra;
        case 'fecha':
          return item.fechacreacionsolicitud;
        case 'nombre':
          return item.nombresolicitud;
        case 'solicitante':
          return item.idusuariosolicitante.nombreusuario;
        case 'estado':
          return item.estado;
        default:
          return (item as any)[property];
      }
    };
  }

  ngOnInit(): void {
    const rolActual = this.authService.getRolUsuario();
    this.esJefeUTDI.set(rolActual === 'jefe utdi' || rolActual === 'administrador');
    this.idUsuarioActual = this.authService.getIdUsuarioActual();
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.solicitudService.listar().subscribe({
      next: (data) => {
        // ORDENAMIENTO SEGUN EL ID ASC O DESC
        this.solicitudes.set(data.sort((a, b) => a.idSolicitudCompra! - b.idSolicitudCompra!));
      },
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.message || 'Error con el servidor';
        this.mensaje.open('Error al cargar la información', 'warning');
        this.mensaje.open(msg, 'error');
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // --------------------------------------------------------
  // MODAL CON EL DETALLE DE LA SOLICITUD
  // --------------------------------------------------------
  verDetalle(solicitud: SolicitudCompraReporteService) {
    const dialogRef = this.dialog.open(SolicitudDetalleDialogComponent, {
      width: '900px',
      maxWidth: '100vw',
      maxHeight: '90vh',
      disableClose: false,
      data: { solicitud: solicitud }
    });

    // --------------------------------------------------------
    // MODAL PARA APROBAR O RECEPCIONAR
    // --------------------------------------------------------
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      if (result?.accion === 'aprobar') {
        this.aprobarSolicitud(result.id, false);
      } else if (result?.accion === 'recepcionar') {
        // Llamar a tu lógica de recepción
        this.ejecutarRecepcion(solicitud);
        //console.log('Recepcionar ID:', result.id);
      }
    });
  }

  // --------------------------------------------------------
  // MODAL DE SELECCION PARA APROBAR
  // --------------------------------------------------------

  aprobarSolicitud(id: number, confirmar: boolean = true) {
    if (confirmar) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          titulo: 'Confirmar Aprobación',
          mensaje: '¿Estás seguro de que deseas aprobar esta solicitud? Pasará a estado APROBADA.',
          textoBoton: 'Aprobar',
          colorBoton: 'primary'
        }
      });
      dialogRef.afterClosed().subscribe(res => {
        if (res) this.ejecutarAprobacion(id);
      });
    } else {
      this.ejecutarAprobacion(id);
    }
  }

  // --------------------------------------------------------
  // MODAL DE SELECCION PARA RECEPCIONAR
  // --------------------------------------------------------
  ejecutarAprobacion(id: number) {
    const idUsuario = this.authService.getIdUsuarioActual();
    this.solicitudService.aprobarSolicitud(id, idUsuario).subscribe({
      next: () => {
        this.mensaje.open('Solicitud Aprobada', 'exito');
        this.cargarSolicitudes();
      },
      error: () => this.mensaje.open('Error al aprobar solicitud', 'error')
    });
  }

  // --------------------------------------------------------
  // FUNCION PARA RECEPCIONAR DE SOLICITUDES
  // --------------------------------------------------------
  /*   recepcionarSolicitud(id: number, confirmar: boolean = true){
      if(confirmar){
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          width: '350px',
          data: {
            titulo: 'Confirmar Recepción',
            mensaje: 'Al recepcionar, se sumarán los productos al inventario de la bodega destino. ¿Continuar?',
            textoBoton: 'Recepcionar',
            colorBoton: 'primary'
          }
        });
        dialogRef.afterClosed().subscribe(res => {
          if(res) this.ejecutarRecepcion(id);
        });
      }else{
        this.ejecutarRecepcion(id);
      }
    } */

  // --------------------------------------------------------
  // FUNCION PARA RECEPCIONAR SOLICITUDES
  // --------------------------------------------------------
  /*   private ejecutarRecepcion(id : number){
      this.solicitudService.recepcionarSolicitud(id, this.idUsuarioActual).subscribe({
        next: () => {
          this.mensaje.open('Productos Recepcionados e Inventario Actualizado', 'exito');
          this.cargarSolicitudes();
        },
        error : (e) => {
          console.log(e);
          this.mensaje.open('Error al recepcionar esta solicitud', 'warning');
        }
      });
    } */

  ejecutarRecepcion(solicitud: SolicitudCompraReporteService) {
    const dialogRef = this.dialog.open(SolicitudRecepcionModalComponent, {
      width: '900px',
      maxWidth: '95vw',
      disableClose: true,
      data: { solicitud: solicitud }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Si el modal devuelve 'recargar', actualizamos la tabla principal
      if (result === 'recargar') {
        this.cargarSolicitudes();
      }
    });
  }

  // --------------------------------------------------------
  // FUNCION PARA VER LA SOLICITUD COMO NUEVA VENTANA
  // --------------------------------------------------------
  imprimirSolicitud(solicitud: SolicitudCompra) {
    if (!solicitud.idSolicitudCompra) return;

    this.solicitudService.listarDetalles(solicitud.idSolicitudCompra).subscribe({
      next: (detalles) => {
        this.pdfService.generarPdfSolicitud(solicitud, detalles);
      },
      error: () => this.mensaje.open('Error al generar el PDF', 'error')
    });
  }

  // --------------------------------------------------------
  // FUNCION PARA VER LA SOLICITUD COMO MODAL
  // --------------------------------------------------------
  imprimirSolicitudModal(solicitud: SolicitudCompra) {
    if (!solicitud.idSolicitudCompra) return;

    this.solicitudService.listarDetalles(solicitud.idSolicitudCompra).subscribe({
      next: (detalles) => {

        const urlBlob = this.pdfService.generarPdfSolicitud(solicitud, detalles);

        this.dialog.open(PdfViewerDialogComponent, {
          width: '100%',
          maxWidth: '60vw',
          height: '75%',
          panelClass: 'full-screen-modal',
          data: {
            url: urlBlob,
            titulo: `${solicitud.nombresolicitud}`
          }
        });
      },
      error: () => this.mensaje.open('Error al generar PDF', 'error')
    });
  }

}
