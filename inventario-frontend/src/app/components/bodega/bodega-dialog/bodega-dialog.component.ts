import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Utils } from '../../../core/utils';
import {Mensaje} from '../../../core/mensaje';

@Component({
  selector: 'app-bodega-dialog',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './bodega-dialog.component.html',
  styles: [`mat-form-field { width: 100%; margin-bottom: 10px; }`]
})
export class BodegaDialogComponent implements OnInit{

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<BodegaDialogComponent>);
  private ft = inject(Utils);
  private mensaje = inject(Mensaje);

  constructor(@Inject(MAT_DIALOG_DATA) public bodegaData : any) {}

  esEdicion = false;

  form : FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    direccion: [''],
    telefono: ['', [Validators.pattern('^[0-9]{4}-[0-9]{4}$')]]
  });

  ngOnInit(): void {
    if(this.bodegaData && this.bodegaData.bodega){
      this.esEdicion = true;
      this.form.patchValue({
        nombre: this.bodegaData.bodega.nombrebodega,
        direccion: this.bodegaData.bodega.direccionbodega,
        telefono: this.bodegaData.bodega.telefonobodega
      })
    }
  }

  mascaraTelefono(event: any) {
    const input = event.target as HTMLInputElement;
    const valorFormateado = this.ft.formatearTelefono(input.value);

    this.form.get('telefono')?.setValue(valorFormateado, { emitEvent: false });
    input.value = valorFormateado;
  }


  guardar(){
    if(this.form.get('nombre')?.invalid){
      this.form.markAllAsTouched();
      this.mensaje.open('Complete los campos requeridos', 'warning');
      return;
    }
      this.dialogRef.close(this.form.value);
  }

  cancelar(){
    this.dialogRef.close();
  }

}
