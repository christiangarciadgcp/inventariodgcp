import { Component, OnDestroy, inject, effect, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from './services/auth.service';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet],
    templateUrl: './app.html',
    styleUrl: './app.css'
})
export class App implements OnDestroy {

    private authService = inject(AuthService);
    private dialog = inject(MatDialog);
    private router = inject(Router);

    private warningTimer: any;
    private logoutTimer: any;
    private autoRefreshInterval: any;
    private isDialogResultPending = false;
    private isLoggingOut = false;
    private actividadSub!: Subscription;

    private syncChannel = new BroadcastChannel('session-sync');

    //  TIEMPOS
    private readonly MAX_INACTIVIDAD = 60 * 60 * 1000; // 1 Hora
    private readonly TIEMPO_AVISO = 45 * 60 * 1000;    // Aviso a los 45 minutos
    private readonly REFRESH_TOKEN = 5 * 60 * 1000;    // Revisa el JWT cada 5 mins despues del mensaje de inactividad

    private countdownInterval: any;
    private tiempoRestanteSegundos = 0;
    tiempoFormateado = signal<string>('00:00');
    // -----------------------------------------------

    constructor() {

        this.listenActions();

        effect(() => {
            const estaLogueado = this.authService.isAuthenticated();
            const isLoginRoute = window.location.pathname.includes('login');

            if (estaLogueado) {
                console.log('Sesión iniciada: ...');
                this.isLoggingOut = false;
                this.iniciarMonitoreoBackend();
                this.iniciarAutoRenovacionToken();
            } else {

                if (!this.isLoggingOut) {
                    this.isLoggingOut = true;
                    this.syncChannel.postMessage('LOGOUT_SESSION');
                }

                if (isLoginRoute) {
                    return;
                }

                console.log('Sesión cerrada:...');
                this.limpiarTodo();
                this.dialog.closeAll();
                this.router.navigate(['/login']);

            }
        });
    }

    // =========================================================
    // SINCRONIZACIÓN ENTRE PESTAÑAS (BROADCAST CHANNEL)
    // =========================================================
    listenActions() {
        this.syncChannel.onmessage = (event) => {
            switch (event.data) {
                case 'ACTIVITY':
                    if (!this.isDialogResultPending) {
                        this.resetearTimers();
                    }
                    break;
                case 'EXTEND_SESSION':
                    console.log('Otra pestaña extendió la sesión');
                    this.dialog.closeAll();
                    this.isDialogResultPending = false;
                    this.resetearTimers();
                    break;
                case 'LOGOUT_SESSION':
                    console.log('Otra pestaña cerró la sesión');
                    this.dialog.closeAll();
                    this.cerrarSesionForzada(true);
                    break;
            }
        };
    }

    // =========================================================
    // MONITOREO POR PETICIONES AL BACKEND
    // =========================================================

/*     iniciarMonitoreoBackend() {
        this.resetearTimers();

        const expDate = this.authService.getTokenExpirationDate();
        if (!expDate) {
            console.warn('No se pudo obtener fecha de expiración del token');
            return;
        }

        const ahora = new Date().getTime();
        const expiracion = expDate.getTime();
        const tiempoRestante = expiracion - ahora;

        if (tiempoRestante <= 0) {
            console.error('El token ya expiró. Cerrando sesión');
            return;
        }

        this.actividadSub = this.authService.actividad$.subscribe(() => {
            if (!this.isDialogResultPending) {
                this.resetearTimers();
                this.syncChannel.postMessage('ACTIVITY');
            }
        });
    } */

    iniciarMonitoreoBackend() {
        this.resetearTimers();

        const expDate = this.authService.getTokenExpirationDate();
        if (!expDate) {
            console.warn('No se pudo obtener fecha de expiración del token');
            return;
        }

        const ahora = new Date();
        const horaAviso = new Date(ahora.getTime() + this.TIEMPO_AVISO);
        const horaCierre = new Date(ahora.getTime() + this.MAX_INACTIVIDAD);

/*        console.log(`=================================================`);
        console.log(`✅ Sesión iniciada a las: ${ahora.toLocaleTimeString()}`);
        console.log(`⚠️ Primer aviso programado para: ${horaAviso.toLocaleTimeString()}`);
        console.log(`🛑 Cierre por inactividad a las: ${horaCierre.toLocaleTimeString()}`);
        console.log(`📌 Nota: Estos tiempos se renuevan con cada acción que realizas.`);
        console.log(`=================================================`);*/

        const expiracion = expDate.getTime();
        const tiempoRestante = expiracion - ahora.getTime();

        if (tiempoRestante <= 0) {
            console.error('El token ya expiró. Cerrando sesión');
            this.syncChannel.postMessage('LOGOUT_SESSION');
            this.cerrarSesionForzada(true);
            return;
        }

        this.actividadSub = this.authService.actividad$.subscribe(() => {
            if (!this.isDialogResultPending) {
                this.resetearTimers();
                this.syncChannel.postMessage('ACTIVITY');
            }
        });
    }

    resetearTimers() {
        this.limpiarTimersInactividad();

        if (this.countdownInterval) clearInterval(this.countdownInterval);

        this.tiempoRestanteSegundos = Math.floor(this.MAX_INACTIVIDAD / 1000);
        this.actualizarTextoContador();

        this.countdownInterval = setInterval(() => {
            this.tiempoRestanteSegundos--;
            this.actualizarTextoContador();

            if (this.tiempoRestanteSegundos <= 0) {
                clearInterval(this.countdownInterval);
            }
        }, 1000);
        // ---------------------------------------------

        this.warningTimer = setTimeout(() => {
            console.log('45 mins sin hacer peticiones. Mostrando advertencia.');
            this.mostrarAlertaInactividad();
        }, this.TIEMPO_AVISO);

        this.logoutTimer = setTimeout(() => {
            console.log('60 minutos totales sin peticiones. Cerrando sesión.');
            this.syncChannel.postMessage('LOGOUT_SESSION');
            this.dialog.closeAll();
            this.cerrarSesionForzada(true);
        }, this.MAX_INACTIVIDAD);
    }

    actualizarTextoContador() {
        const minutos = Math.floor(this.tiempoRestanteSegundos / 60);
        const segundos = this.tiempoRestanteSegundos % 60;
        this.tiempoFormateado.set(
            `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`
        );
    }



    // =========================================================
    // RENOVACIÓN DEL TOKEN
    // =========================================================

    iniciarAutoRenovacionToken() {
        if (this.autoRefreshInterval) clearInterval(this.autoRefreshInterval);

        this.autoRefreshInterval = setInterval(() => {
            const expDate = this.authService.getTokenExpirationDate();
            if (!expDate) return;

            const tiempoRestante = expDate.getTime() - Date.now();

            if (tiempoRestante <= 0) {
              console.error('El token expiró.');
              this.syncChannel.postMessage('LOGOUT_SESSION');
              this.cerrarSesionForzada(true);
              return;
            }

            if (tiempoRestante < (15 * 60 * 1000) && !this.isDialogResultPending) {
                console.log('Renovando token...');
                this.authService.refreshToken().subscribe({
                    error: () => {
                        this.syncChannel.postMessage('LOGOUT_SESSION');
                        this.cerrarSesionForzada(true);
                    }
                });
            }
        }, this.REFRESH_TOKEN);
    }

    // =========================================================
    // MODALES Y CIERRE
    // =========================================================

  // Método auxiliar para formatear los segundos en reloj (MM:SS)
  private formatearTiempo(totalSegundos: number): string {
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  }


  mostrarAlertaInactividad() {
    this.isDialogResultPending = true;

    let segundosRestantes = Math.floor((this.MAX_INACTIVIDAD - this.TIEMPO_AVISO) / 1000);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      data: {
        titulo: 'Inactividad detectada',
        mensaje: `Llevas mucho tiempo sin actividad en el sistema. Tu sesión se cerrará en <strong class="text-primary">${this.formatearTiempo(segundosRestantes)} min</strong>. ¿Deseas mantenerla abierta?`,
        textoBoton: 'Mantener sesión',
        colorBoton: 'primary'
      }
    });

    const modalTimer = setInterval(() => {
      segundosRestantes--;

      if (segundosRestantes > 0 && dialogRef.componentInstance) {

        dialogRef.componentInstance.mensaje = `Llevas mucho tiempo sin actividad en el sistema. Tu sesión se cerrará en <strong class="text-primary">${this.formatearTiempo(segundosRestantes)} min</strong>. ¿Deseas mantenerla abierta?`;

        if (dialogRef.componentInstance.cdr) {
          dialogRef.componentInstance.cdr.detectChanges();
        }

      } else {
        clearInterval(modalTimer);
      }
    }, 1000);

    dialogRef.afterClosed().subscribe((confirmado: boolean | undefined) => {
      this.isDialogResultPending = false;

      clearInterval(modalTimer);

      if (confirmado === true) {
        console.log('Usuario Activo. Renovando sesión');
        this.authService.refreshToken().subscribe({
          next: () => {
            this.syncChannel.postMessage('EXTEND_SESSION');
            this.resetearTimers();
          },
          error: () => {
            this.syncChannel.postMessage('LOGOUT_SESSION');
            this.cerrarSesionForzada(true);
          }
        });
      } else if (confirmado === false) {
        console.log('Sesión Cerrada por inactividad confirmada.');
        this.syncChannel.postMessage('LOGOUT_SESSION');
        this.cerrarSesionForzada(true);
      }
    });
  }

    cerrarSesionForzada(reloadPage: boolean = false) {
        if (this.isLoggingOut) return;

        this.isLoggingOut = true;

        this.limpiarTodo();
        this.authService.logout();

        const isLoginRoute = window.location.pathname.includes('login');

        if (isLoginRoute) {
            return;
        }

        if (reloadPage) {
            setTimeout(() => {
                window.location.reload();
            }, 300);
        }else{
            this.router.navigate(['/login']);
        }
    }

    ngOnDestroy() {
        this.limpiarTodo();
        this.syncChannel.close();
    }

    limpiarTimersInactividad() {
        if (this.warningTimer) clearTimeout(this.warningTimer);
        if (this.logoutTimer) clearTimeout(this.logoutTimer);
    }

    limpiarTodo() {
        this.limpiarTimersInactividad();
        if (this.autoRefreshInterval) clearInterval(this.autoRefreshInterval);
        if (this.actividadSub) this.actividadSub.unsubscribe();
    }
}
