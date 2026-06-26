import { Component, inject, Inject, OnInit, ChangeDetectorRef } from '@angular/core'; // <-- 1. Agregado ChangeDetectorRef
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
      this.sustitutosFiltrados = this.itemGenerico.sustitutosDisponibles.filter((sust: any) =>
        sust.nombreProducto.toLowerCase().includes(this.searchTerm) ||
        sust.skuProducto.toLowerCase().includes(this.searchTerm)
      );
    }

    this.cdr.detectChanges();
  }

  cerrarModal() {
    this.dialogRef.close(this.seHizoMovimiento);
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
        this.recargarDatos();
      }
    });
  }

  recargarDatos() {
    this.presupuestoService.obtenerDetalleRevision(this.idPresupuesto).subscribe({
      next: (detalles: any[]) => {
        const itemActualizado = detalles.find(d => d.idProducto === this.itemGenerico.idProducto);

        if (itemActualizado) {
          this.itemGenerico = itemActualizado;
          this.filtrarLista();
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error recargando inventario físico:', err)
    });
  }

  verDetalles(sust: any) {
    let mensajeHTML = `
      <div style="text-align: left; font-size: 0.95rem; line-height: 1;">
        <p class="mb-2 fs-6 text-dark text-center"><strong>Detalles Técnicos</strong></p>
        <p class="mb-1"><strong>Marca:</strong> ${sust.marcaProducto || 'SIN ESPECIFICAR'}</p>
        <p class="mb-2"><strong>Modelo:</strong> ${sust.modeloProducto || 'SIN ESPECIFICAR'}</p>
        <div style="border-top: 1px solid #dee2e6; padding-top: 1px;">
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
