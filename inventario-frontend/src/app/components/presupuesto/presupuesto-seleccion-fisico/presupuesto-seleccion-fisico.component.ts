import { Component, inject, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InventarioMovimientoDialogComponent } from '../../inventario/inventario-movimiento-dialog/inventario-movimiento-dialog.component';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

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

  public dialogRef = inject(MatDialogRef<PresupuestoSeleccionFisicoComponent>);
  private dialog = inject(MatDialog);
  public data = inject(MAT_DIALOG_DATA);

  private presupuestoService = inject(PresupuestoService);
  private cdr = inject(ChangeDetectorRef);

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
          (sust.descripcionProducto && sust.descripcionProducto.toLowerCase().includes(this.searchTerm)) ||
          condicionStr.includes(this.searchTerm)
        );

      });
    }

    this.cdr.detectChanges();
  }

  cerrarModal() {
    // Al cerrar, le enviamos toda la data fresca al padre (así el padre no carga de nuevo)
    this.dialogRef.close(this.datosFrescos || this.seHizoMovimiento);
  }

  transferirStock(sustitutoFisico: any) {
    const faltante = this.itemGenerico.cantidadPendiente - sustitutoFisico.stockEnDespacho;

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
        this.procesando = true; // Activa el estado de carga visual
        this.cdr.detectChanges();
        this.recargarDatos();
      }
    });
  }

  recargarDatos() {
    this.presupuestoService.obtenerDetalleRevision(this.idPresupuesto).subscribe({
      next: (detalles: any[]) => {
        // Guardamos TODA la lista fresca para el componente padre
        this.datosFrescos = detalles;

        const itemActualizado = detalles.find(d => d.idProducto === this.itemGenerico.idProducto);

        if (itemActualizado) {
          // Clonar el objeto desvincula la memoria y obliga al HTML a actualizarse
          this.itemGenerico = { ...itemActualizado };
          this.itemGenerico.sustitutosDisponibles = [...itemActualizado.sustitutosDisponibles];
          this.filtrarLista();
        }

        this.procesando = false; // Apaga el estado de carga
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

    console.log('Datos del producto físico:', sust);

    const condicionTexto = sust.esNuevo ? '<span style="color: #198754; font-weight: bold;">NUEVO</span>' : '<span style="color: #ffc107; font-weight: bold;">USADO</span>';

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
}
