import {Component, Inject, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MarcaService} from '../../../../services/marca.service';
import { MatSelectModule} from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';
import {Mensaje} from '../../../../core/mensaje';

@Component({
  selector: 'app-modelo-dialog',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatIconModule
  ],
  templateUrl: './modelo-dialog.component.html',
  styles: [`mat-form-field { width: 100%; margin-bottom: 10 px; }`]
})
export class ModeloDialogComponent implements OnInit {

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ModeloDialogComponent>);
  private marcaService = inject(MarcaService);
  private mensaje = inject(Mensaje);

  listaMarcas : any[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public modeloData: any) {}

  esEdicion = false;

  form: FormGroup = this.fb.group({
    nombre : ['', Validators.required],
    idMarca : [null, Validators.required]
  });

  ngOnInit(): void {

    this.marcaService.getMarcasActivas().subscribe( data =>
      this.listaMarcas = data);

      if(this.modeloData && this.modeloData.modelo){
        this.esEdicion = true;
        this.form.patchValue({
          nombre : this.modeloData.modelo.nombremodelo,
          idMarca : this.modeloData.modelo.marca?.idMarca
        });
      }
  }

  guardar(){
    if (this.form.get('idMarca')?.invalid || this.form.get('nombre')?.invalid) {
      this.form.markAllAsTouched();
      this.mensaje.open('Complete la información', 'warning');
      return;
    }

      const data = {
        nombremodelo : this.form.value.nombre,
        idMarca : this.form.value.idMarca
      };

      this.dialogRef.close(data);

  }

  cancelar(){
    this.dialogRef.close();
  }

}
