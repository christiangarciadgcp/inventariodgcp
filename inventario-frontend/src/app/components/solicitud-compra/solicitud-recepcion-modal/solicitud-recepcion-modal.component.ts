import { ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../../services/auth.service';
import { SolicitudCompraService } from '../../../services/solicitud-compra.service';
import { SolicitudCompra } from '../../../models/solicitud-compra';
import { Mensaje } from '../../../core/mensaje';
import { Utils } from '../../../core/utils';

// Interfaz adaptada para la vista de la tabla
interface ItemRecepcionVista {
  idDetalle: number;
  nombreProducto: string;
  sku: string;
  proveedor: string;
  solicitado: number;
  yaRecibido: number;
  faltante: number;
  aRecibirHoy: number; // Lo que el usuario escribe en el input
}

@Component({
  selector: 'app-solicitud-recepcion-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, 
    MatTableModule, MatFormFieldModule, MatInputModule, MatTooltipModule
  ],
  templateUrl: './solicitud-recepcion-modal.component.html',
  styleUrl: './solicitud-recepcion-modal.component.css',
})
export class SolicitudRecepcionModalComponent implements OnInit {

  private authService = inject(AuthService);
  private solicitudService = inject(SolicitudCompraService);
  private mensaje = inject(Mensaje);
  public sn = inject(Utils);
  private cdr = inject(ChangeDetectorRef);

  dataSource = new MatTableDataSource<ItemRecepcionVista>([]);
  displayedColumns: string[] = ['producto','proveedor', 'solicitado', 'recibido', 'faltante', 'ingreso'];
  
  cargando: boolean = false;
  totalARecibirHoyCalculado: number = 0;

  constructor(
    public dialogRef: MatDialogRef<SolicitudRecepcionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { solicitud: SolicitudCompra }
  ) {}

  ngOnInit(): void {
    this.cargarDetalles();
  }

  cargarDetalles() {
    this.cargando = true;
    this.solicitudService.listarDetalles(this.data.solicitud.idSolicitudCompra!).subscribe({
      next: (detalles) => {
        const items = detalles.map(d => {
          const yaRecibido = d.cantidad_recibida || 0;
          const faltante = d.cantidad_solicitada - yaRecibido;
          
          return {
            idDetalle: d.idSolicitudDetalle!,
            nombreProducto: d.producto.nombreproducto,
            proveedor: d.producto.proveedor?.nombreproveedor || 'Sin proveedor',
            sku: d.producto.skuproducto || 'N/A',
            solicitado: d.cantidad_solicitada,
            yaRecibido: yaRecibido,
            faltante: faltante,
            aRecibirHoy: 0 // Inicia en 0 por seguridad
          };
        });
        this.dataSource.data = items;
        this.recalcularTotal();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensaje.open('Error al cargar los detalles', 'error');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  recalcularTotal() {
    this.totalARecibirHoyCalculado = this.dataSource.data.reduce((acc, curr) => acc + (curr.aRecibirHoy || 0), 0);
  }

  // Validaciones
  validarCantidad(element: ItemRecepcionVista) {
    if (element.aRecibirHoy > element.faltante) {
      element.aRecibirHoy = element.faltante; 
      this.mensaje.open(`Solo faltan ${element.faltante} unidades de este producto`, 'warning');
    } else if (element.aRecibirHoy < 0 || !element.aRecibirHoy) {
      element.aRecibirHoy = 0;
    }
    
    // LLAMAMOS AL CÁLCULO CADA VEZ QUE EL USUARIO ESCRIBE
    this.recalcularTotal();
    this.cdr.detectChanges();
  }

  confirmarRecepcion() {
    if (this.totalARecibirHoyCalculado === 0) {
      this.mensaje.open('Debe ingresar al menos 1 producto para recepcionar', 'warning');
      return;
    }

    const payload = {
      idUsuarioComprador: this.authService.getIdUsuarioActual(),
      items: this.dataSource.data
        .filter(item => item.aRecibirHoy > 0) // Solo enviamos los que traen cantidad > 0
        .map(item => ({
          idDetalle: item.idDetalle,
          cantidadARecibir: item.aRecibirHoy
        }))
    };

    this.solicitudService.recepcionarSolicitud(this.data.solicitud.idSolicitudCompra!, payload as any).subscribe({
      next: () => {
        this.mensaje.open('Recepción registrada y stock actualizado', 'exito');
        this.dialogRef.close('recargar'); // Cerramos y avisamos a la tabla que recargue
      },
      error: (err) => this.mensaje.open(err.error?.message || 'Error en la recepción', 'error')
    });
  }

  cerrar() {
    this.dialogRef.close();
  }
}
