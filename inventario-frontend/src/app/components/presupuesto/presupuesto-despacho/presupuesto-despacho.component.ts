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
import {forkJoin} from 'rxjs';

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
  nombrePresupuesto = signal<string>('');
  todoListoParaDespacho = signal<boolean>(false);
  hayAlgoParaDespachar = signal<boolean>(false);
  esEncargadoInventario = signal<boolean>(false);

  idPresupuesto: number = 0;
  displayedColumns: string[] = ['producto', 'solicitado', 'estado', 'acciones'];

  ngOnInit() {
    const rolActual = this.authService.getRolUsuario();
    this.esEncargadoInventario.set(
      rolActual === 'coordinador utdi' ||
      rolActual === 'inventario utdi' ||
      rolActual === 'administrador' ||
      rolActual === 'jefe utdi'
    );

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
        const dataOrdenada = data.sort((a, b) =>
          a.nombreProducto.localeCompare(b.nombreProducto, 'es', { sensitivity: 'base' })
        );
        this.itemsRevision.set([...dataOrdenada]);
        this.evaluarBotonDespacho();
      },
      error: (err) => console.error(err)
    });

    this.presupuestoService.obtenerPorId(id).subscribe({
      next: (presupuesto) => {
        this.nombrePresupuesto.set(presupuesto.nombre_presupuesto);
      },
      error: (err) => console.error('Error al obtener el nombre del presupuesto', err)
    });
  }

  abrirSeleccionMaterial(item: PresupuestoRevisionItem) {
    const dialogRef = this.dialog.open(PresupuestoSeleccionFisicoComponent, {
      width: '850px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        item: item,
        idPresupuesto: this.idPresupuesto
      }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado && Array.isArray(resultado)) {
        // Preservar selección en memoria de los Equipos Informáticos (!esMaterial)
        const actuales = this.itemsRevision();
        resultado.forEach((nuevoItem: PresupuestoRevisionItem) => {
          if (nuevoItem.esMaterial === false) {
            const previo = actuales.find(a => a.idProducto === nuevoItem.idProducto);
            if (previo) {
              nuevoItem.sustitutosDisponibles = previo.sustitutosDisponibles;
            }
          }
        });

        const resultadoOrdenado = resultado.sort((a, b) =>
          a.nombreProducto.localeCompare(b.nombreProducto, 'es', { sensitivity: 'base' })
        );
        this.itemsRevision.set([...resultadoOrdenado]);
        this.evaluarBotonDespacho();
      } else if (resultado === true) {
        this.itemsRevision.set([...this.itemsRevision()]);
        this.evaluarBotonDespacho();
      }
    });
  }

  getCantidadLista(item: PresupuestoRevisionItem): number {
    // 1. Si el requerimiento ya se despachó al 100%, no hay nada "LISTO" para despachar hoy.
    if (item.cantidadPendiente <= 0) return 0;

    let totalPreparado = 0;
    if (item.sustitutosDisponibles) {
      item.sustitutosDisponibles.forEach(sust => {
        totalPreparado += sust.stockEnDespacho;
      });
    }

    // 2. Límite de seguridad: el estado "LISTO" nunca debe ser mayor a lo que falta.
    return Math.min(totalPreparado, item.cantidadPendiente);
  }

  evaluarBotonDespacho() {
    let algoAsignado = false;
    let todoAsignado = true;

    this.itemsRevision().forEach(item => {
      if (item.cantidadPendiente > 0) {

        let disponibleEnDespacho = this.getCantidadLista(item);

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
      width: '420px',
      data: {
        titulo: '¿Desea confirmar este despacho?',
        mensaje: 'Se descontarán los materiales de Bodega Despacho y se generará el Acta de Movimiento de Materiales.',
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

  regresarMaterialListo(item: PresupuestoRevisionItem) {
    const cantidadLista = this.getCantidadLista(item);
    if (cantidadLista <= 0) return;

    // Si es equipo informático (selección en memoria), solo se limpia en memoria
    if (item.esMaterial === false) {
      item.sustitutosDisponibles.forEach(s => s.stockEnDespacho = 0);
      this.itemsRevision.set([...this.itemsRevision()]);
      this.evaluarBotonDespacho();
      this.mensaje.open('Selección de equipo liberada', 'info');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: '¿Regresar material listo?',
        mensaje: `Se devolverán <b>${cantidadLista} ${item.unidadMedida}</b> de <b>${item.nombreProducto}</b> desde Bodega Despacho hacia su bodega de origen.`,
        textoBoton: 'Confirmar',
        colorBoton: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        const idUsuario = this.authService.getIdUsuarioActual();
        const peticiones = item.sustitutosDisponibles
          .filter(s => s.stockEnDespacho > 0)
          .map(s => this.presupuestoService.revertirPreparacionMaterial(this.idPresupuesto, s.idProducto, idUsuario));

        if (peticiones.length > 0) {
          forkJoin(peticiones).subscribe({
            next: () => {
              this.mensaje.open('Material regresado a su bodega de origen exitosamente', 'exito');
              this.cargarDatos(this.idPresupuesto);
            },
            error: (err) => this.mensaje.open(err.error?.mensaje || 'Error al regresar el material', 'error')
          });
        }
      }
    });
  }
}
