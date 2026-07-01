import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AuthService } from '../../../services/auth.service';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { PresupuestoRevisionItem } from '../../../models/presupuesto';
import { Mensaje } from '../../../core/mensaje';
import { Utils } from '../../../core/utils';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { PresupuestoSeleccionFisicoComponent } from '../presupuesto-seleccion-fisico/presupuesto-seleccion-fisico.component';

@Component({
  selector: 'app-presupuesto-despacho',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatTooltipModule, MatDialogModule
  ],
  templateUrl: './presupuesto-despacho.component.html',
  styleUrl: './presupuesto-despacho.component.css',
})
export class PresupuestoDespachoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private presupuestoService = inject(PresupuestoService);
  public fn = inject(Utils);
  private mensaje = inject(Mensaje);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  itemsRevision = signal<PresupuestoRevisionItem[]>([]);
  todoListoParaDespacho = signal<boolean>(false);
  hayAlgoParaDespachar = signal<boolean>(false);
  esEncargadoInventario = signal<boolean>(false);

  idPresupuesto: number = 0;
  displayedColumns: string[] = ['producto', 'solicitado', 'estado', 'acciones'];

  ngOnInit() {
    const rolActual = this.authService.getRolUsuario();
    this.esEncargadoInventario.set(rolActual === 'inventario utdi' || rolActual === 'administrador' || rolActual === 'jefe utdi');

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.idPresupuesto = +id;
        this.cargarDatos(this.idPresupuesto);
      }
    });
  }

  cargarDatos(id: number) {
    this.presupuestoService.obtenerDetalleRevision(id).subscribe({
      next: (data) => {
        this.itemsRevision.set(data);
        this.evaluarBotonDespacho();
      },
      error: (err) => console.error(err)
    });
  }

  abrirSeleccionMaterial(item: PresupuestoRevisionItem) {
    const dialogRef = this.dialog.open(PresupuestoSeleccionFisicoComponent, {
      width: '850px',
      maxWidth: '95vw',
      disableClose: false,
      data: {
        item: item,
        idPresupuesto: this.idPresupuesto
      }
    });

    dialogRef.afterClosed().subscribe(realizoMovimiento => {
      if (realizoMovimiento) {
        this.cargarDatos(this.idPresupuesto);
      }
    });
  }

  evaluarBotonDespacho() {
    let algoAsignado = false;
    let todoAsignado = true;

    this.itemsRevision().forEach(item => {
      if (item.cantidadPendiente > 0) {
        let disponibleEnDespacho = 0;
        item.sustitutosDisponibles.forEach(sust => {
          disponibleEnDespacho += sust.stockEnDespacho;
        });

        if (disponibleEnDespacho > 0) algoAsignado = true;
        if (disponibleEnDespacho < item.cantidadPendiente) todoAsignado = false;
      }
    });

    this.hayAlgoParaDespachar.set(algoAsignado);
    this.todoListoParaDespacho.set(todoAsignado);
  }

  regresar() {
    this.location.back();
  }

  ejecutarDespacho() {
    if (!this.hayAlgoParaDespachar()) return;

    const itemsPayload: any[] = [];

    this.itemsRevision().forEach(item => {
      if (item.cantidadPendiente > 0) {
        let restante = item.cantidadPendiente;

        item.sustitutosDisponibles.forEach(sust => {
          if (sust.stockEnDespacho > 0 && restante > 0) {
            const cant = Math.min(sust.stockEnDespacho, restante);
            itemsPayload.push({
              idDetalle: item.idDetalle,
              idProductoFisico: sust.idProducto,
              cantidadADespachar: cant
            });
            restante -= cant;
          }
        });
      }
    });

    const payload = {
      idUsuario: this.authService.getIdUsuarioActual(),
      items: itemsPayload
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: '¿Desea confirmar este despacho?',
        mensaje: 'Los materiales seleccionados saldrán físicamente de Bodega de Despacho.',
        textoBoton: 'Confirmar',
        colorBoton: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.presupuestoService.despacharPresupuesto(this.idPresupuesto, payload as any).subscribe({
          next: () => {
            this.mensaje.open('Despacho completado con éxito', 'exito');
            this.router.navigate(['/presupuesto'], { queryParams: { tab: 2 } });
          },
          error: (err) => this.mensaje.open(err.error?.mensaje || 'Error al despachar', 'error')
        });
      }
    });
  }
}
