import { Component, OnInit, inject, signal,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterModule } from '@angular/router';

import { InventarioService } from '../../../services/inventario.service';
import { Bodega } from '../../../models/bodega';
import { MatDivider } from '@angular/material/divider';
import { Mensaje } from '../../../core/mensaje';

@Component({
  selector: 'app-inventario-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, RouterModule, RouterLink, MatDivider],
  templateUrl: './inventario-list.component.html',
  styleUrl: './inventario-list.component.css',
})
export class InventarioListComponent implements OnInit {


  private inventarioService = inject(InventarioService);
  private cdr = inject(ChangeDetectorRef);
  private mensaje = inject(Mensaje)

  bodegas = signal<Bodega[]>([]);

  ngOnInit(): void {
    this.cargarInventario();
  }


  cargarInventario() {
    this.inventarioService.listarBodegas().subscribe({
      next: (data) => {
        this.bodegas.set(data);
        this.cdr.detectChanges();

      },
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.message || 'Error con el servidor';
        this.mensaje.open('Error al cargar la información', 'warning');
        this.mensaje.open(msg, 'error');
      }
    });
  }
}
