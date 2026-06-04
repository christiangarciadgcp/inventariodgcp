import { Component, Inject, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Utils } from '../../../core/utils';
import { AuthService } from '../../../services/auth.service';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { Presupuesto, PresupuestoDetalle } from '../../../models/presupuesto';

@Component({
  selector: 'app-presupuesto-detalle',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatTableModule, MatDividerModule, MatTooltipModule
  ],
  templateUrl: './presupuesto-detalle.component.html',
  styleUrl: './presupuesto-detalle.component.css',
})
export class PresupuestoDetalleComponent implements OnInit{

  private presupuestoService = inject(PresupuestoService);
  private cdr = inject(ChangeDetectorRef);
  public utils = inject(Utils);
  private authService = inject(AuthService);

  dataSource = new MatTableDataSource<PresupuestoDetalle>([]);
  displayedColumns: string[] = ['producto', 'cantidad'];

  cargando: boolean = true;
  esJefeUTDI = signal<boolean>(false);

  constructor(
    public dialogRef: MatDialogRef<PresupuestoDetalleComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { presupuesto: Presupuesto }
  ) {}

  ngOnInit(): void {
    const rolActual = this.authService.getRolUsuario();
    this.esJefeUTDI.set(rolActual === 'jefe utdi');

    this.cargarDetalles();
  }

  cargarDetalles() {
    this.cargando = true;
    const id = this.data.presupuesto.idPresupuesto;

    if(id) {
      this.presupuestoService.listarDetalles(id).subscribe({
        next: (detalles) => {
          this.dataSource.data = detalles;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  cerrar() {
    this.dialogRef.close();
  }


}
