import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sugerencia-rechazo-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <h2 mat-dialog-title class="text-danger">Rechazar Sugerencia</h2>

    <mat-dialog-content>
      <p class="text-secondary small mb-3">Por favor, ingresa el motivo del rechazo. Este comentario será visible para el técnico solicitante.</p>

      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Motivo del rechazo</mat-label>
        <textarea matInput [(ngModel)]="comentario" rows="3" placeholder="Ej. Ya existe un material similar o especificaciones incompletas." required></textarea>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="pb-3 pe-3 gap-2">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button color="warn" [disabled]="!comentario.trim()" (click)="confirmarRechazo()">
        Confirmar Rechazo
      </button>
    </mat-dialog-actions>
  `
})
export class SugerenciaRechazoDialogComponent {
  public dialogRef = inject(MatDialogRef<SugerenciaRechazoDialogComponent>);
  comentario: string = '';

  confirmarRechazo() {
    if (this.comentario.trim()) {
      // Devolvemos el texto escrito al componente que lo llamó
      this.dialogRef.close(this.comentario.trim());
    }
  }
}
