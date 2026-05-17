import {Component, Inject, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';

@Component({
  selector: 'app-modelo-dialog',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './modelo-dialog.component.html',
  styles: [`mat-form-field { width: 100%; margin-bottom: 10px; }`]
})
export class ModeloDialogComponent implements OnInit {

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ModeloDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public modeloData: any) {}

  esEdicion = false;

  form: FormGroup = this.fb.group({
    nombre : ['', Validators.required],
  });

  ngOnInit(): void {
      if(this.modeloData && this.modeloData.modelo){
        this.esEdicion = true;
        this.form.patchValue({
          nombre : this.modeloData.modelo.nombremodelo
        })
      }
  }

  guardar(){
    if(this.form.valid){
      this.dialogRef.close(this.form.value);
    }
  }

  cancelar(){
    this.dialogRef.close();
  }

}
