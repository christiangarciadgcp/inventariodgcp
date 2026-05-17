import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  titulo?: string;
  mensaje?: string;
  textoBoton?: string;
  colorBoton?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone:true,
  imports: [
    CommonModule,
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule
  ],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
})
export class ConfirmDialogComponent {

  titulo: string = 'Confirmar Eliminación';
  mensaje: string = '¿Estás seguro de que deseas eliminar este registro?';
  textoBoton: string = 'Eliminar';
  colorBoton: string = 'primary';


  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    // Si viene data, sobrescribimos los valores por defecto
    if (data) {
      this.titulo = data.titulo || this.titulo;
      this.mensaje = data.mensaje || this.mensaje;
      this.textoBoton = data.textoBoton || this.textoBoton;
      this.colorBoton = data.colorBoton || this.colorBoton;
    }
  }

  cerrar(confirmado:boolean){
    this.dialogRef.close(confirmado);
  }

}
