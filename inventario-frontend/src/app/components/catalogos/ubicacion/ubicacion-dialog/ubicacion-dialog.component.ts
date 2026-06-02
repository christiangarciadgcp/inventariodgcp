import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Utils } from '../../../../core/utils';
import {Mensaje} from '../../../../core/mensaje';

@Component({
  selector: 'app-ubicacion-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './ubicacion-dialog.component.html',
  styles: [`mat-form-field { width: 100%; margin-bottom: 10px; }`]
})
export class UbicacionDialogComponent implements OnInit {

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<UbicacionDialogComponent>);
  private ft = inject(Utils);
  private mensaje = inject(Mensaje);

  constructor(@Inject(MAT_DIALOG_DATA) public ubicacionData : any) {}

  esEdicion = false;

  form : FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    siglas: ['', [Validators.required]]
  });

  ngOnInit() : void {
    if(this.ubicacionData && this.ubicacionData.ubicacion){
      this.esEdicion = true;
      this.form.patchValue({
        nombre : this.ubicacionData.ubicacion.nombreubicacion,
        siglas : this.ubicacionData.ubicacion.siglasubicacion
      })
    }
  }

  onInputMayusculas(event: Event, controlName: string) {
    const control = this.form.get(controlName);
    this.ft.convertirAMayusculas(event, control);
  }

  guardar(){
    if(this.form.get('nombre')?.invalid || this.form.get('siglas')?.invalid){
      this.form.markAllAsTouched();
      this.mensaje.open('Complete la informacion', 'warning');
      return;
    }
    this.dialogRef.close(this.form.value);
  }

  cancelar(){
    this.dialogRef.close();
  }

}
