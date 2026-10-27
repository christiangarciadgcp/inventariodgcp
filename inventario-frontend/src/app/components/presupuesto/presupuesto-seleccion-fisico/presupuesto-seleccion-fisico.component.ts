import { Component, inject, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InventarioMovimientoDialogComponent } from '../../inventario/inventario-movimiento-dialog/inventario-movimiento-dialog.component';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { Mensaje } from '../../../core/mensaje';
import {AuthService} from '../../../services/auth.service';

@Component({
  selector: 'app-presupuesto-seleccion-fisico',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule
  ],
  templateUrl: './presupuesto-seleccion-fisico.component.html',
  styleUrl: './presupuesto-seleccion-fisico.component.css'
})
export class PresupuestoSeleccionFisicoComponent implements OnInit {

  private authService = inject(AuthService);
  public dialogRef = inject(MatDialogRef<PresupuestoSeleccionFisicoComponent>);
  private dialog = inject(MatDialog);
  public data = inject(MAT_DIALOG_DATA);

  private presupuestoService = inject(PresupuestoService);
  private cdr = inject(ChangeDetectorRef);
  private mensaje = inject(Mensaje);

  itemGenerico = this.data.item;
  idPresupuesto = this.data.idPresupuesto;
  seHizoMovimiento = false;
  datosFrescos: any[] | null = null;
  procesando = false;

  sustitutosFiltrados: any[] = [];
  searchTerm: string = '';

  ngOnInit(): void {
    this.sustitutosFiltrados = [...this.itemGenerico.sustitutosDisponibles];
  }

  applyFilter(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.filtrarLista();
  }

  filtrarLista() {
    if (!this.searchTerm) {
      this.sustitutosFiltrados = [...this.itemGenerico.sustitutosDisponibles];
    } else {
      this.sustitutosFiltrados = this.itemGenerico.sustitutosDisponibles.filter((sust: any) => {
        const condicionStr = sust.esNuevo ? 'nuevo' : 'usado';
        return (
          (sust.nombreProducto && sust.nombreProducto.toLowerCase().includes(this.searchTerm)) ||
          (sust.skuProducto && sust.skuProducto.toLowerCase().includes(this.searchTerm)) ||
          (sust.marcaProducto && sust.marcaProducto.toLowerCase().includes(this.searchTerm)) ||
          (sust.modeloProducto && sust.modeloProducto.toLowerCase().includes(this.searchTerm)) ||
          (sust.serieProducto && sust.serieProducto.toLowerCase().includes(this.searchTerm)) ||
          (sust.inventarioProducto && sust.inventarioProducto.toLowerCase().includes(this.searchTerm)) ||
          (sust.descripcionProducto && sust.descripcionProducto.toLowerCase().includes(this.searchTerm)) ||
          condicionStr.includes(this.searchTerm)
        );
      });
    }
    this.cdr.detectChanges();
  }

  getCantidadRestantePorAsignar(): number {
    const totalYaListo = (this.itemGenerico.sustitutosDisponibles || []).reduce(
      (acc: number, s: any) => acc + (s.stockEnDespacho || 0), 0
    );
    return Math.max(0, this.itemGenerico.cantidadPendiente - totalYaListo);
  }

  // Selección directa en memoria para Equipos Informáticos (!esMaterial) sin mover a Bodega Despacho
  toggleSeleccionEquipo(sust: any) {
    if (sust.stockEnDespacho > 0) {
      sust.stockEnDespacho = 0;
      this.seHizoMovimiento = true;
      this.cdr.detectChanges();
      return;
    }

    const faltante = this.getCantidadRestantePorAsignar();
    if (faltante <= 0) {
      this.mensaje.open('Ya ha seleccionado la cantidad total requerida para este equipo.', 'warning');
      return;
    }

    sust.stockEnDespacho = Math.min(sust.stockGlobal, faltante);
    this.seHizoMovimiento = true;
    this.cdr.detectChanges();
  }

  cerrarModal() {
    this.dialogRef.close(this.datosFrescos || this.seHizoMovimiento);
  }

  transferirStock(sustitutoFisico: any) {
    const faltante = this.getCantidadRestantePorAsignar();

    const dialogMovimiento = this.dialog.open(InventarioMovimientoDialogComponent, {
      width: '600px',
      data: {
        idPresupuesto: this.idPresupuesto,
        idProducto: sustitutoFisico.idProducto,
        nombreProducto: sustitutoFisico.nombreProducto,
        cantidadFaltante: faltante > 0 ? faltante : 0
      }
    });

    dialogMovimiento.afterClosed().subscribe(resultado => {
      if (resultado === true) {
        this.seHizoMovimiento = true;
        this.procesando = true;
        this.cdr.detectChanges();
        this.recargarDatos();
      }
    });
  }

  recargarDatos() {
    this.presupuestoService.obtenerDetalleRevision(this.idPresupuesto).subscribe({
      next: (detalles: any[]) => {
        this.datosFrescos = detalles;
        const itemActualizado = detalles.find(d => d.idProducto === this.itemGenerico.idProducto);

        if (itemActualizado) {
          this.itemGenerico = { ...itemActualizado };
          this.itemGenerico.sustitutosDisponibles = [...itemActualizado.sustitutosDisponibles];
          this.filtrarLista();
        }

        this.procesando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error recargando inventario físico:', err);
        this.procesando = false;
        this.cdr.detectChanges();
      }
    });
  }

  verDetalles(sust: any) {
    const condicionTexto = sust.esNuevo
      ? '<span style="color: #198754; font-weight: bold;">NUEVO</span>'
      : '<span style="color: #ffc107; font-weight: bold;">USADO</span>';

    let mensajeHTML = `
      <div style="text-align: left; font-size: 0.95rem; line-height: 1.3;">
        <p class="mb-3 fs-6 text-dark text-center"><strong>Detalles Técnicos</strong></p>

        <p class="mb-1"><strong>Condición:</strong> ${condicionTexto}</p>
        <p class="mb-1"><strong>Marca:</strong> ${sust.marcaProducto || 'SIN ESPECIFICAR'}</p>
        <p class="mb-1"><strong>Modelo:</strong> ${sust.modeloProducto || 'SIN ESPECIFICAR'}</p>
        <p class="mb-1"><strong>Descripción:</strong> <span class="text-muted">${sust.descripcionProducto || '---'}</span></p>

        <div style="border-top: 1px solid #dee2e6; padding-top: 10px; margin-top: 10px;">
          <p class="mb-1"><strong>Número de Serie:</strong> ${sust.serieProducto || '---'}</p>
          <p class="mb-0"><strong>N° Inventario:</strong> ${sust.inventarioProducto || '---'}</p>
        </div>
      </div>
    `;

    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Detalles Técnicos',
        mensaje: mensajeHTML,
        ocultarBotones: true,
        ocultarTitulo: true
      }
    });
  }

  regresarMaterialABodega(sust: any) {
    const dialogConfirm = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: '¿Regresar material a bodega?',
        mensaje: `Se devolverán las <b>${sust.stockEnDespacho}</b> unidades de <b>${sust.nombreProducto}</b> a su bodega de origen y quedarán disponibles nuevamente.`,
        textoBoton: 'Regresar Material',
        colorBoton: 'warn'
      }
    });

    dialogConfirm.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.procesando = true;
        this.cdr.detectChanges();
        const idUsuario = this.authService.getIdUsuarioActual();

        this.presupuestoService.revertirPreparacionMaterial(this.idPresupuesto, sust.idProducto, idUsuario).subscribe({
          next: () => {
            this.mensaje.open('Material devuelto a su bodega de origen', 'exito');
            this.seHizoMovimiento = true;
            this.recargarDatos();
          },
          error: (err) => {
            this.procesando = false;
            this.cdr.detectChanges();
            this.mensaje.open(err.error?.mensaje || 'Error al regresar el material', 'error');
          }
        });
      }
    });
  }
}
