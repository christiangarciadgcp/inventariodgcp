import { Injectable, inject } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ToastContainerComponent, ToastItem } from './toast-notification/toast-notification.component';

@Injectable({
  providedIn: 'root'
})
export class Mensaje {
  private overlay = inject(Overlay);
  private overlayRef?: OverlayRef;
  private containerRef?: ToastContainerComponent;
  private idCounter = 0;

  open(
    mensaje: string,
    tipo: 'exito' | 'error' | 'warning' | 'info' = 'exito',
    titulo?: string
  ): void {
    let tipoConfig: ToastItem['tipo'] = 'info';
    let icono = 'info';

    switch (tipo) {
      case 'exito':
        tipoConfig = 'success';
        icono = 'check';
        break;
      case 'error':
        tipoConfig = 'error';
        icono = 'close';
        break;
      case 'warning':
        tipoConfig = 'warning';
        icono = 'priority_high';
        break;
      case 'info':
      default:
        tipoConfig = 'info';
        icono = 'info';
        break;
    }

    this.ensureContainer();

    this.traerAlFrente();

    this.containerRef?.agregarToast({
      id: ++this.idCounter,
      tipo: tipoConfig,
      titulo: titulo,
      mensaje: mensaje,
      icono: icono,
      duracion: 4000
    });
  }

  private ensureContainer(): void {
    if (!this.overlayRef || !this.overlayRef.hasAttached()) {
      this.overlayRef = this.overlay.create({
        positionStrategy: this.overlay.position().global().top('24px').centerHorizontally(),
        hasBackdrop: false,
        panelClass: 'toast-stack-overlay-panel'
      });
      const portal = new ComponentPortal(ToastContainerComponent);
      const componentRef = this.overlayRef.attach(portal);
      this.containerRef = componentRef.instance;
    }
  }

  private traerAlFrente(): void {
    if (!this.overlayRef) return;

    // Obtiene el contenedor CDK del toast
    const pane = this.overlayRef.overlayElement;
    const wrapper = (this.overlayRef.hostElement || pane?.closest('.cdk-global-overlay-wrapper')) as HTMLElement | null;

    if (pane) {
      pane.style.zIndex = '99999';
    }

    if (wrapper) {
      wrapper.style.zIndex = '99999';
      wrapper.style.pointerEvents = 'none';

      // Lo reubica al final del contenedor global de overlays
      if (wrapper.parentElement && wrapper.parentElement.lastElementChild !== wrapper) {
        wrapper.parentElement.appendChild(wrapper);
      }
    }
  }
}
