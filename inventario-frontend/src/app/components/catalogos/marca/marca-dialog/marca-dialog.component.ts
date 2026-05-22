import {Component, Inject, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {Utils} from '../../../../core/utils';
import {Mensaje} from '../../../../core/mensaje';

@Component({
  selector: 'app-marca-dialog',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './marca-dialog.component.html',
  styles: [`mat-form-field { width: 100%; margin-bottom: 10px; }`]
})
export class MarcaDialogComponent implements OnInit{
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<MarcaDialogComponent>);
  private ft = Inject(Utils);
  private mensaje = inject(Mensaje);

  constructor(@Inject(MAT_DIALOG_DATA) public marcaData : any) {}

  esEdicion = false;

  form : FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
  });

  ngOnInit(): void {
    if(this.marcaData && this.marcaData.marca){
      this.esEdicion = true;
      this.form.patchValue({
        nombre: this.marcaData.marca.nombremarca
      })
    }
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
