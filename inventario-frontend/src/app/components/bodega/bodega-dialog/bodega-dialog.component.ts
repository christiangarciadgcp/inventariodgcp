import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Utils } from '../../../core/utils';
import {Mensaje} from '../../../core/mensaje';
import {BodegaTipoService} from '../../../services/bodega-tipo.service';
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';

@Component({
  selector: 'app-bodega-dialog',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatOption, MatSelect
  ],
  templateUrl: './bodega-dialog.component.html',
  styles: [`mat-form-field { width: 100%; margin-bottom: 10px; }`]
})
export class BodegaDialogComponent implements OnInit{

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<BodegaDialogComponent>);
  private bodegaTipoService = inject(BodegaTipoService);
  private ft = inject(Utils);
  private mensaje = inject(Mensaje);

  constructor(@Inject(MAT_DIALOG_DATA) public bodegaData : any) {}

  listaBodegasTipo: any[] = [];
  esEdicion = false;

  form : FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    direccion: [''],
    telefono: ['', [Validators.pattern('^[0-9]{4}-[0-9]{4}$')]],
    idBodegaTipo: [null, Validators.required]
  });

  ngOnInit(): void {

    this.bodegaTipoService.getTiposBodegas().subscribe(data => {
      this.listaBodegasTipo = data.sort((a, b) =>
        a.tipobodega.localeCompare(b.tipobodega, 'es', {sensitivity: 'base'})
      );
    });

    if(this.bodegaData && this.bodegaData.bodega){
      this.esEdicion = true;
      this.form.patchValue({
        nombre: this.bodegaData.bodega.nombrebodega,
        direccion: this.bodegaData.bodega.direccionbodega,
        telefono: this.bodegaData.bodega.telefonobodega,
        idBodegaTipo: this.bodegaData.bodega.bodegaTipo?.idBodegaTipo
      });
    }
  }

  mascaraTelefono(event: any) {
    const input = event.target as HTMLInputElement;
    const valorFormateado = this.ft.formatearTelefono(input.value);

    this.form.get('telefono')?.setValue(valorFormateado, { emitEvent: false });
    input.value = valorFormateado;
  }


  guardar(){
    if(this.form.get('nombre')?.invalid || this.form.get('idBodegaTipo')?.invalid) {
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
