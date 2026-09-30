import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EquipoTrazabilidadDTO, TrazabilidadItemDTO } from '../../../models/asignacion';
import { Utils } from '../../../core/utils';

export interface TrazabilidadDialogData {
  equipo: EquipoTrazabilidadDTO;
  historial: TrazabilidadItemDTO[];
}

@Component({
  selector: 'app-asignacion-trazabilidad-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatTooltipModule
  ],
  templateUrl: './asignacion-trazabilidad-dialog.component.html',
  styleUrls: ['./asignacion-trazabilidad-dialog.component.css']
})
export class AsignacionTrazabilidadDialogComponent {
  public dialogRef = inject(MatDialogRef<AsignacionTrazabilidadDialogComponent>);
  public utils = inject(Utils);

  constructor(@Inject(MAT_DIALOG_DATA) public data: TrazabilidadDialogData) {}
}
