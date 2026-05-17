import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export type TipoSnack = 'exito' | 'error' | 'warning';

@Injectable({
  providedIn: 'root'
})
export class MensajeSnack {
  
  private _snackBar = inject(MatSnackBar);

  open(mensaje: string, tipo: TipoSnack) {
    let panelClass = '';

    switch (tipo) {
      case 'exito': panelClass = 'snack-exito'; break;
      case 'error': panelClass = 'snack-error'; break;
      case 'warning': panelClass = 'snack-warning'; break;
    }

    this._snackBar.open(mensaje, '✖', {
      duration: 3000,
      panelClass: [panelClass],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}