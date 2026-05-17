import { Component, OnInit, inject, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
// Material Imports
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';

import { AuthService } from '../../../services/auth.service';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { PresupuestoRevisionItem } from '../../../models/presupuesto';
import { Mensaje } from '../../../core/mensaje'
import { Utils } from '../../../core/utils';
import { InventarioMovimientoDialogComponent } from '../../inventario/inventario-movimiento-dialog/inventario-movimiento-dialog.component';
import { MatTooltip } from '@angular/material/tooltip';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-presupuesto-revision',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatChipsModule, MatDividerModule,
    MatDialogModule, MatTooltip
  ],
  templateUrl: './presupuesto-revision.component.html',
  styleUrl: './presupuesto-revision.component.css',
})
export class PresupuestoRevisionComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private presupuestoService = inject(PresupuestoService);
  private fn = inject(Utils);
  private mensaje = inject(Mensaje);
  private authService = inject(AuthService);

  // INYECCIONES PARA MODAL
  private dialogRef = inject(MatDialogRef<PresupuestoRevisionComponent>);
  private dialog = inject(MatDialog);
  private data = inject(MAT_DIALOG_DATA);



  // Señal para almacenar los datos
  itemsRevision = signal<PresupuestoRevisionItem[]>([]);
  todoListoParaDespacho = signal<boolean>(false);
  hayAlgoParaDespachar = signal<boolean>(false);

  // Señal de Permisos
  esEncargadoInventario = signal<boolean>(false);

  idPresupuesto: number = 0;
  usuarioPresupuesto: string = '';

  displayedColumns: string[] = ['producto', 'solicitado', 'stock', 'acciones'];

  ngOnInit() {

    // 1. VALIDAR ROL DEL USUARIO ACTUAL
    const rolActual = this.authService.getRolUsuario();
    //console.log('Rol:', rolActual);

    this.esEncargadoInventario.set(rolActual === 'inventario utdi' || rolActual === 'administrador' || rolActual === 'jefe utdi');


    if (this.data && this.data.idPresupuesto) {
      this.idPresupuesto = this.data.idPresupuesto;
      this.usuarioPresupuesto = this.fn.formatearNombre(this.data.nombreusuario);
      this.cargarDatos(this.idPresupuesto);
    }
  }

  cargarDatos(id: number) {
    this.presupuestoService.obtenerDetalleRevision(id).subscribe({
      next: (data) => {
        this.itemsRevision.set(data);
        this.verificarEstadoGeneral(data);
      },
      error: (err) => console.error(err)
    });
  }

  verificarEstadoGeneral(items: PresupuestoRevisionItem[]) {
    let puedeDespacharAlgo = false;
    let estaTodoListo = true;

    items.forEach(item => {
      //evaluamos los materiales que aún no se han entregado por completo
      if (item.cantidadPendiente > 0) {
        
        // ¿Hay al menos 1 unidad de este material en la Bodega de Despacho?
        if (item.cantidadEnBodegaDespacho > 0) {
          puedeDespacharAlgo = true; // Encontramos al menos un producto que sí se puede entregar
        }
        
        // ¿Lo que hay en despacho no alcanza para cubrir todo lo que falta?
        if (item.cantidadEnBodegaDespacho < item.cantidadPendiente) {
          estaTodoListo = false; // Entonces no podemos hacer un despacho total
        }
      }
    });

    this.todoListoParaDespacho.set(estaTodoListo);
    this.hayAlgoParaDespachar.set(puedeDespacharAlgo);
  }

  cerrarModal() {
    this.dialogRef.close();
  }

  transferirStock(item: PresupuestoRevisionItem) {
    //this.mensaje.open(`Mover ${item.cantidadSolicitada - item.cantidadEnBodegaDespacho} a Bodega Despacho`, 'exito');

    // const faltante = item.cantidadSolicitada - item.cantidadEnBodegaDespacho;
    const faltante = item.cantidadPendiente - item.cantidadEnBodegaDespacho;

    const dialogMovimiento = this.dialog.open(InventarioMovimientoDialogComponent, {
      width: '600px',
      data: {
        idPresupuesto: this.idPresupuesto,
        idProducto: item.idProducto,
        nombreProducto: item.nombreProducto,
        cantidadFaltante: faltante > 0 ? faltante : 0
      }
    });

    dialogMovimiento.afterClosed().subscribe(resultado => {
      if (resultado === true) {
        this.cargarDatos(this.idPresupuesto);
      }
    });

  }

  //Generar Compra
  generarCompra(item: PresupuestoRevisionItem) {
    const faltante = item.cantidadSolicitada - item.totalStockGlobal;
    const cantidadAComprar = faltante > 0 ? faltante : item.cantidadSolicitada;

    this.mensaje.open(`Redirigiendo a compra de: ${item.nombreProducto} (Cant: ${cantidadAComprar})`, 'exito');
  }

  ejecutarDespacho() {
    if (!this.esEncargadoInventario()) {
      this.mensaje.open('No tienes permisos para realizar el despacho.', 'error');
      return;
    }
    const idUsuario = this.authService.getIdUsuarioActual();

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        titulo: '¿Desea realizar el despacho de estos materiales?',
        mensaje: 'Los materiales se descontaran de su inventario',
        textoBoton: 'Aceptar',
        colorBoton: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.presupuestoService.despacharPresupuesto(this.idPresupuesto, idUsuario).subscribe({
          next: () => {
            this.mensaje.open('Materiales despachados', 'exito');
            this.dialogRef.close('recargar');
          },
          error: (err) => {
            const msg = err.error?.message || 'Error al procesar el despacho';
            this.mensaje.open(msg, 'error');
          }
        });
      }
    });
  }

}