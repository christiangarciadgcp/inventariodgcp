import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-cambiar-password-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule
  ],
  templateUrl: './cambiar-password-dialog.component.html',
  /* styleUrl: './cambiar-password-dialog.component.css', */
  styles: [`mat-form-field {width: 100%; margin-bottom: 5px; }`]
})
export class CambiarPasswordDialogComponent {

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CambiarPasswordDialogComponent>);

  hideActual = true;
  hideNueva = true;
  hideConfirmar = true;

  // 1. Convertimos el método en una propiedad tipada como ValidatorFn
  passwordsCoinciden : ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const nueva = control.get('nuevaPassword')?.value;
    const confirmar = control.get('confirmarPassword')?.value;
    
    // Si coinciden retorna null (no hay error), si fallan retorna el objeto de error
    return nueva === confirmar ? null : { noCoinciden: true };
  };

  form  = this.fb.group({
    passwordActual : ['', [Validators.required]],
    nuevaPassword : ['', [Validators.required]],
    confirmarPassword : ['', [Validators.required]]
  }, {validators : this.passwordsCoinciden});

  guardar(){
    if(this.form.valid){
      this.dialogRef.close(this.form.value);
    }
  }

  cancelar(){
    this.dialogRef.close();
  }

}
