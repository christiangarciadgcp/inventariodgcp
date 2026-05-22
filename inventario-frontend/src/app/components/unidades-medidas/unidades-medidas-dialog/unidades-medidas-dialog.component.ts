import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {Mensaje} from '../../../core/mensaje';

@Component({
  selector: 'app-unidades-medidas-dialog',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './unidades-medidas-dialog.component.html',
  styles: [`mat-form-field { width: 100%; margin-bottom: 10px; }`]
})
export class UnidadesMedidasDialogComponent implements OnInit{

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<UnidadesMedidasDialogComponent>);
  private mensaje = inject(Mensaje);

  constructor(@Inject(MAT_DIALOG_DATA) public unidadMedidaData : any) {}

  esEdicion = false;

  form : FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    abreviatura: ['', [Validators.required]]
  });

  ngOnInit(): void {
    if(this.unidadMedidaData && this.unidadMedidaData.unidadMedida){
      this.esEdicion=true;
      this.form.patchValue({
        nombre : this.unidadMedidaData.unidadMedida.nombreunidadmedida,
        abreviatura : this.unidadMedidaData.unidadMedida.abreviaturaunidadmedida
      })
    }
  }

  guardar(){
    if (this.form.get('nombre')?.invalid || this.form.get('abreviatura')?.invalid) {
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
