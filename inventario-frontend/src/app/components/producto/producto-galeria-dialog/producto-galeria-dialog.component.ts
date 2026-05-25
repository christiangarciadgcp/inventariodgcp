import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-producto-galeria-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template : `
    <div class="d-flex justify-content-center align-items-center p-3 border-bottom position-relative">
      <h3 class="m-0 fw-bold text-dark">{{data.nombre}}</h3>
      <button mat-icon-button mat-dialog-close class="position-absolute end-0 me-3 mb-2">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="p-4 bg-light text-center">
        @if (data.imagenes && data.imagenes.length > 0) {
            <div class="d-flex flex-column align-items-center">
                <img [src]="data.imagenes[indiceActual].rutaimagen"
                     class="img-fluid rounded shadow-sm mb-4 bg-white p-1 border"
                     style="max-height: 450px; object-fit: contain;">

                @if (data.imagenes.length > 1) {
                    <div class="d-flex gap-4 align-items-center">
                        <button mat-mini-fab color="primary" (click)="prev()" [disabled]="indiceActual === 0">
                            <mat-icon>chevron_left</mat-icon>
                        </button>

                        <span class="text-muted fw-bold" style="font-size: 1.1rem;">
                            {{ indiceActual + 1 }} / {{ data.imagenes.length }}
                        </span>

                        <button mat-mini-fab color="primary" (click)="next()" [disabled]="indiceActual === data.imagenes.length - 1">
                            <mat-icon>chevron_right</mat-icon>
                        </button>
                    </div>
                }
            </div>
        } @else {
            <div class="py-5 text-muted d-flex flex-column align-items-center">
                <mat-icon style="font-size: 60px; width: 60px; height: 60px; opacity: 0.3;" class="mb-3">image_not_supported</mat-icon>
                <h4 class="fw-medium">Sin fotografías</h4>
                <p>Este producto no tiene imágenes registradas en el sistema.</p>
            </div>
        }
    </mat-dialog-content>
  `
})
export class ProductoGaleriaDialogComponent {

  indiceActual = 0;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { nombre: string, imagenes: any[] }) {}

  next() { if (this.indiceActual < this.data.imagenes.length - 1) this.indiceActual++; }
  prev() { if (this.indiceActual > 0) this.indiceActual--; }
}
