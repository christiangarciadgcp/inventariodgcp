import {Component, OnInit, inject, signal, ViewChild, effect} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import {ProductoSugerencia} from '../../../../models/sugerencia';
import {AuthService} from '../../../../services/auth.service';
import {SugerenciaService} from '../../../../services/sugerencia.service';
import {Mensaje} from '../../../../core/mensaje';
import {SugerenciaDialogComponent} from '../sugerencia-dialog/sugerencia-dialog.component';
import {ConfirmDialogComponent} from '../../../confirm-dialog/confirm-dialog.component';
import {ProductoDialogComponent} from '../../producto-dialog/producto-dialog.component';
import {SugerenciaRechazoDialogComponent} from '../sugerencia-rechazo-dialog/sugerencia-rechazo-dialog.component';
import {Utils} from '../../../../core/utils';

@Component({
  selector: 'app-sugerencia-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule, MatDialogModule, RouterLink],
  templateUrl: './sugerencia-list.component.html',
  styleUrl: './sugerencia-list.component.css',
})
export class SugerenciasListComponent implements OnInit {

  sugerencias = signal<ProductoSugerencia[]>([]);
  dataSource = new MatTableDataSource<ProductoSugerencia>([]);
  displayedColumns: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public authService = inject(AuthService);
  private sugerenciaService = inject(SugerenciaService);
  private dialog = inject(MatDialog);
  private mensaje = inject(Mensaje);
  public utils = inject(Utils);

  esEncargadoInventario = signal<boolean>(false);

  constructor() {
    effect(() => {
      this.dataSource.data = this.sugerencias();
      if (this.paginator) this.dataSource.paginator = this.paginator;
    });

    this.dataSource.filterPredicate = (data: ProductoSugerencia, filter : string)  => {
      const searchStr = (data.nombreSugerido + data.usuarioSolicitante?.nombreusuario + data.justificacion + data.estado).toLowerCase();
      return searchStr.includes(filter);
    }
  }

  ngOnInit(): void {

    const rolActual = this.authService.getRolUsuario();
    this.esEncargadoInventario.set(rolActual === 'inventario utdi' || rolActual === 'administrador' || rolActual === 'jefe utdi');
    if (this.esEncargadoInventario()) {
      this.displayedColumns = ['id', 'fecha', 'nombre', 'solicitante', 'justificacion', 'estado', 'acciones'];
    } else {
      this.displayedColumns = ['id', 'fecha', 'nombre', 'justificacion', 'estado', 'comentario', 'acciones'];
    }

    this.cargarSugerencias();
  }

  cargarSugerencias() {
    if (this.esEncargadoInventario()) {
      this.sugerenciaService.getProductosSugeridos().subscribe(data => this.sugerencias.set(data));
    } else {
      const idUsuario = this.authService.getIdUsuarioActual();
      this.sugerenciaService.getProductosSugeridosPorUsuario(idUsuario).subscribe(data => this.sugerencias.set(data));
    }
  }

  applyFilter(event : Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if(this.dataSource.paginator){
      this.dataSource.paginator.firstPage()
    }
  }

  abrirModalSugerir() {
    const dialogRef = this.dialog.open(SugerenciaDialogComponent, { width: '500px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.cargarSugerencias(); });
  }

  eliminarSugerencia(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { width: '350px' });
    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.sugerenciaService.eliminarSugerencia(id).subscribe({
          next: () => {
            this.cargarSugerencias();
            this.mensaje.open('Sugerencia eliminada', 'exito');
          }
        });
      }
    });
  }

  aprobar(sugerencia: ProductoSugerencia) {

    const dialogRef = this.dialog.open(ProductoDialogComponent, {
      width: '900px',
      maxHeight: '95vh',
      data: { sugerenciaParaConvertir: sugerencia } //
    });

    dialogRef.afterClosed().subscribe(productoCreado => {
      if (productoCreado === true) {
        this.sugerenciaService.cambiarEstado(sugerencia.idSugerencia, 'APROBADO', 'Producto registrado en catálogo.').subscribe(() => {
          this.cargarSugerencias();
        });
      }
    });
  }

  rechazarSugerencia(id: number) {
    const dialogRef = this.dialog.open(SugerenciaRechazoDialogComponent, {
      width: '400px',
      disableClose: false
    });
    dialogRef.afterClosed().subscribe(comentarioEscrito => {
      if (comentarioEscrito) {
        this.sugerenciaService.cambiarEstado(id, 'RECHAZADO', comentarioEscrito).subscribe({
          next: () => {
            this.cargarSugerencias();
            this.mensaje.open('Sugerencia rechazada', 'exito');
          },
          error: (err) => {
            const msg = err.error?.mensaje || 'No se pudo procesar el rechazo';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }

}
