import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Utils } from '../../../core/utils';

@Component({
  selector: 'app-proveedor-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, 
    MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './proveedor-dialog.component.html',
  styles: [`mat-form-field { width: 100%; margin-bottom: 10px; }`]
})
export class ProveedorDialogComponent implements OnInit{
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProveedorDialogComponent>);
  private ft = inject(Utils);

  constructor(@Inject(MAT_DIALOG_DATA) public proveedorData : any) {}

  esEdicion = false;

  form : FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    telefono: ['', [Validators.required, Validators.pattern('^[0-9]{4}-[0-9]{4}$')]]
  });

  ngOnInit(): void {
    if(this.proveedorData && this.proveedorData.proveedor){
      this.esEdicion = true;
      this.form.patchValue({
        nombre: this.proveedorData.proveedor.nombreproveedor,
        telefono: this.proveedorData.proveedor.telefonoproveedor
      })
    }
  }

  mascaraTelefono(event: any) {
    // Enviamos el valor al servicio Utils y recibimos la máscara
    const valorFormateado = this.ft.formatearTelefono(event.target.value);
    
    // Actualizamos el formulario de este componente
    this.form.get('telefono')?.setValue(valorFormateado, { emitEvent: false });
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
