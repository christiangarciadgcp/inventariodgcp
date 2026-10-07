import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface ToastItem {
  id: number;
  tipo: 'success' | 'info' | 'warning' | 'error';
  titulo?: string;
  mensaje: string;
  icono: string;
  duracion?: number;
  saliendo?: boolean;
}

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './toast-notification.component.html',
  styleUrls: ['./toast-notification.component.css']
})
export class ToastContainerComponent {
  toasts = signal<ToastItem[]>([]);

  agregarToast(toast: ToastItem): void {
    this.toasts.update(lista => [...lista, toast]);

    setTimeout(() => {
      this.iniciarSalida(toast.id);
    }, toast.duracion || 4000);
  }

  iniciarSalida(id: number): void {
    const item = this.toasts().find(t => t.id === id);
    if (!item || item.saliendo) return;

    // 1. Activa la animación CSS de salida
    this.toasts.update(lista =>
      lista.map(t => (t.id === id ? { ...t, saliendo: true } : t))
    );

    // 2. Remueve el elemento del DOM una vez terminada la animación (320ms)
    setTimeout(() => {
      this.toasts.update(lista => lista.filter(t => t.id !== id));
    }, 320);
  }

  removerToast(id: number): void {
    this.iniciarSalida(id);
  }
}
