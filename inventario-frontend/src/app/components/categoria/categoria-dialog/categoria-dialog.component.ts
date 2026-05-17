import { Component,Inject,inject,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';

// Material Imports
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-categoria-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './categoria-dialog.component.html',
  styles: [`
    mat-form-field { width: 100%; }
  `]
})
export class CategoriaDialogComponent implements OnInit{

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CategoriaDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public categoriaData:any){}

  esEdicion = false;

  form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]]
  });

  ngOnInit(): void {
    if(this.categoriaData && this.categoriaData.categoria){
      this.esEdicion = true;

      this.form.patchValue({
        nombre: this.categoriaData.categoria.nombrecategoria
      })
    }
  }

  guardar() {
    if (this.form.valid) {
      // Cerramos el diálogo y enviamos el valor del formulario a la lista
      this.dialogRef.close(this.form.value);
    }
  }

  cancelar() {
    this.dialogRef.close();
  }

}
