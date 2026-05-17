import { Component, OnInit, ViewChild, inject, effect, signal, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, NativeDateAdapter, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';

import { PresupuestoService } from '../../../services/presupuesto.service';
import { Presupuesto } from '../../../models/presupuesto';
import { MatDialog } from '@angular/material/dialog';
import { PresupuestoRevisionComponent } from '../presupuesto-revision/presupuesto-revision.component';
import { AuthService } from '../../../services/auth.service';
import { PdfViewerDialogComponent } from '../../pdf-viewer-dialog/pdf-viewer-dialog.component';
import { DespachoService } from '../../../services/reportes/despacho.service';
import { Mensaje } from '../../../core/mensaje';
import { PresupuestoDetalleComponent } from '../presupuesto-detalle/presupuesto-detalle.component';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return super.format(date, displayFormat);
  }
}

export const MY_DATE_FORMATS = {
  parse: { dateInput: 'input' },
  display: {
    dateInput: 'input',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};

@Component({
  selector: 'app-presupuesto-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatTableModule, MatPaginatorModule,
    MatSortModule, MatButtonModule, MatIconModule, MatCardModule,
    MatInputModule, MatFormFieldModule, MatTooltipModule,MatSortModule,
    MatTabsModule, MatDatepickerModule, MatNativeDateModule, ReactiveFormsModule
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ],
  templateUrl: './presupuesto-list.component.html',
  styleUrl: './presupuesto-list.component.css',
})
export class PresupuestoListComponent implements OnInit {

  private presupuestoService = inject(PresupuestoService);

  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private despachoService = inject(DespachoService);
  private mensaje = inject(Mensaje);

  displayedColumns: string[] = ['id', 'fecha', 'destino', 'solicitante', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Presupuesto>([]);
  presupuestos = signal<Presupuesto[]>([]);
  esEncargadoInventario = signal<boolean>(false);

  todasLasSolicitudes : Presupuesto[] = [];
  currentTab : number = 0;

  rangoFechas = new FormGroup({
    start : new FormControl<Date | null>(null),
    end : new FormControl<Date | null>(null),
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    effect(() => {
      this.dataSource.data = this.presupuestos();
      if (this.paginator) this.dataSource.paginator = this.paginator;
      if (this.sort) this.dataSource.sort = this.sort;
    });

    // Filtro personalizado: Busca por ID, Nombre de Presupuesto o Estado
    this.dataSource.filterPredicate = (data: Presupuesto, filter: string) => {
      const searchStr = (data.idPresupuesto + data.nombre_presupuesto + data.estado).toLowerCase();
      return searchStr.includes(filter);
    };

    this.dataSource.sortingDataAccessor = (item : Presupuesto, property : string) => {
      switch(property) {
        case 'id':
          return item.idPresupuesto;
        case 'fecha':
          return item.fecha_creacion;
        case 'destino':
          return item.nombre_presupuesto;
        case 'solicitante':
            return item.idusuariopresupuesto.nombreusuario;
        case 'estado':
          return item.estado;
        default:
          return (item as any)[property];
      }
    };
  }

  ngOnInit(): void {

    const rolActual = this.authService.getRolUsuario();
    this.esEncargadoInventario.set(rolActual === 'inventario utdi' || rolActual === 'administrador' || rolActual === 'jefe utdi');

    const hoy = new Date();
    const intervaloSolicitudes = new Date();
    intervaloSolicitudes.setDate(hoy.getDate() - 30); // SOLO SE PODRAN VER SOLICITUDES CON 30 DIAS DE ANTIGUEDAD

    this.rangoFechas.setValue({start : intervaloSolicitudes, end : hoy});

    this.rangoFechas.valueChanges.subscribe(() => {
      if(this.currentTab === 2) this.filtrarDatos();
    });

    this.cargarPresupuestos();
  }

  cargarPresupuestos() {
    this.presupuestoService.listarTodos().subscribe({
      next: (data) => {
        this.todasLasSolicitudes = data.sort((a,b) => b.idPresupuesto! - a.idPresupuesto!);
        this.filtrarDatos();
      },
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.message || 'Error con el servidor';
        this.mensaje.open('Error al cargar la información', 'warning');
        this.mensaje.open(msg, 'error');
      }
    });
  }

  onTabChange(index : number){
    this.currentTab = index;
    this.filtrarDatos();
  }

/*   filtrarDatos(){
    if(this.currentTab===0){
      const pendientes = this.todasLasSolicitudes.filter(p => p.estado === 'PENDIENTE');
      this.presupuestos.set(pendientes);
    } else {
      const start = this.rangoFechas.value.start;
      let end = this.rangoFechas.value.end;

      if(end){
        end = new Date(end);
        end.setHours(23,59,59,999);
      }

      const historial = this.todasLasSolicitudes.filter ( p => {
        if(p.estado === 'PENDIENTE') return false;

        if(!start || !end) return true;

        const fechaPresupuesto = new Date(p.fecha_creacion);
        return fechaPresupuesto >= start && fechaPresupuesto <= end;
      });

      this.presupuestos.set(historial);
    }

    if(this.paginator){
      this.paginator.firstPage();
    }
  } */

  filtrarDatos() {
    if(this.currentTab === 0) {     // PENDIENTES (Esperando aprobación)
      this.presupuestos.set(this.todasLasSolicitudes.filter(p => p.estado === 'PENDIENTE'));
    } else if (this.currentTab === 1) {        // APROBADAS (Listas para empezar a despachar)
      this.presupuestos.set(this.todasLasSolicitudes.filter(p => p.estado === 'APROBADO'));
    } else {        // CONTROL DE DESPACHOS (Parciales y Despachadas)
      const start = this.rangoFechas.value.start;
      let end = this.rangoFechas.value.end;

      if(start) start.setHours(0, 0, 0, 0);

      if(end) {
        end = new Date(end);
        end.setHours(23,59,59,999);
      }

      const historial = this.todasLasSolicitudes.filter(p => {
        if(p.estado !== 'DESPACHO PARCIAL' && p.estado !== 'DESPACHADO') return false; // AGREGAR p.estado !== 'CANCELADO' SI SE REQUIERE QUE APAREZCAN LAS CANCELADAS
        if(!start || !end) return true;

        const fecha = new Date(p.fecha_creacion);
        return fecha >= start && fecha <= end;
      });

      this.presupuestos.set(historial);
    }

    if(this.paginator) this.paginator.firstPage();
  }

  aprobarSolicitud(id: number) {

    const idUsuario = this.authService.getIdUsuarioActual();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: '¿Desea aprobar este presupuesto?',
        mensaje: 'La solicitud pasará a estado APROBADO',
        textoBoton: 'Aprobar',
        colorBoton: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if(confirmado){
        this.presupuestoService.aprobarPresupuesto(id, idUsuario).subscribe({
          next: () => {
            this.mensaje.open('Presupuesto aprobado. Pase a la pestaña de Aprobados.', 'exito');
            this.cargarPresupuestos();
          },
          error: (err) => {
            const msg = err.error?.mensaje || 'No se pudo aprobar este presupuesto';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }

  cancelarSolicitud(id : number){

    const idUsuario = this.authService.getIdUsuarioActual();

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: '¿Desea cancelar este presupuesto?',
        mensaje: 'La solicitud pasará a estado CANCELADO',
        textoBoton: 'Aceptar',
        colorBoton: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if(confirmado){
        this.presupuestoService.cancelarPresupuesto(id,idUsuario).subscribe({
          next : () => {
            this.mensaje.open('Presupuesto ha sido Cancelado', 'exito');
            this.cargarPresupuestos();
          },
          error : (err) => {
            const msg = err.error?.mensaje || 'No se pudo Cancelar este presupuesto';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  obtenerIniciales(nombre: string | undefined): string {
    if (!nombre) return '';

    const partes = nombre.split('.');

    if (partes.length > 1) {
      const inicialNombre = partes[0].charAt(0);
      const inicialApellido = partes[1].charAt(0);
      return (inicialNombre + inicialApellido).toUpperCase();
    }

    return nombre.substring(0, 2).toUpperCase();
  }

  verDetallePresupuesto(presupuesto : Presupuesto){
    const dialogRef = this.dialog.open(PresupuestoDetalleComponent, {
      width: '800px',
      maxWidth: '100vw',
      maxHeight: '90vh',
      disableClose: false,
      data: { presupuesto: presupuesto }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
    });
  }

  revisionPresupuesto(idPresupuesto : number, nombreusuario : string) {
    const dialogRef = this.dialog.open(PresupuestoRevisionComponent, {
      width: '1200px',
      maxWidth: '95vw',
      disableClose: false,
      autoFocus: false,
      data: { idPresupuesto: idPresupuesto, nombreusuario : nombreusuario}
    });

      // --------------------------------------------------------
  // MODAL PARA APROBAR O RECEPCIONAR
  // --------------------------------------------------------
  dialogRef.afterClosed().subscribe(result => {
    if (!result) return;

    if(result === 'recargar'){
      this.cargarPresupuestos();
    }
/*     if (result?.accion === 'aprobar') {
/*       this.aprobarSolicitud(result.id,false);
    } else if (result?.accion === 'recepcionar') {
      // Llamar a tu lógica de recepción
      this.recepcionarSolicitud(result.id, false);
      console.log('Recepcionar ID:', result.id);
    } */
    });
  }

  imprimirDespacho(presupuesto: Presupuesto) {
    // Validación Opcional
    if (presupuesto.estado !== 'DESPACHADO' && presupuesto.estado !== 'DESPACHO PARCIAL') {
        this.mensaje.open('Solo se puede imprimir hoja de despacho de presupuestos APROBADOS', 'warning');
        return;
    }

    this.presupuestoService.obtenerDatosReporte(presupuesto.idPresupuesto!).subscribe({
      next: (data) => {
        // Generar PDF
        const urlBlob = this.despachoService.generarPdfDespacho(data);

        // Abrir Visor
        this.dialog.open(PdfViewerDialogComponent, {
          width: '100%',
          maxWidth: '60vw',
          height: '75%',
          panelClass: 'full-screen-modal',
          data: {
            url: urlBlob,
            titulo: ` ${presupuesto.ubicacion?.siglasubicacion} - ${presupuesto.nombre_presupuesto}`
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.mensaje.open('Error al generar el reporte', 'error');
      }
    });
  }

}
