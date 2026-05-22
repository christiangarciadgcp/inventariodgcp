import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RolService } from '../../../services/rol.service';
import { MatIconModule } from '@angular/material/icon';
import {Mensaje} from '../../../core/mensaje';

@Component({
  selector: 'app-usuario-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatIconModule
  ],
  templateUrl: './usuario-dialog.component.html',
  styles: [`mat-form-field { width: 100%; margin-bottom: 10px; }`]
  //styleUrl: './usuario-dialog.component.css',
})
export class UsuarioDialogComponent implements OnInit {

  private fb = inject(FormBuilder);
  private rolService = inject(RolService);
  private dialogRef = inject(MatDialogRef<UsuarioDialogComponent>);
  private mensaje = inject(Mensaje);

  constructor (@Inject(MAT_DIALOG_DATA) public usuarioData:any){}

  listaRoles: any[] = [];
  esEdicion = false;

  form: FormGroup = this.fb.group({
    nombreusuario: ['', [Validators.required, Validators.minLength(4)]],
    passwordusuario: ['', [Validators.required, Validators.minLength(6)]],
    idrol: [null, Validators.required],
    activo : [true]
  });

  ngOnInit(): void {
    this.rolService.getRoles().subscribe(data => {
      //ORDENAMIENTO SEGUN ID
      this.listaRoles = data.sort((a, b) => a.idRol! - b.idRol!);
    });

      // Validamos si llegó data para activar el modo Edición
      if (this.usuarioData && this.usuarioData.usuario) {
        this.esEdicion = true;
        const usr = this.usuarioData.usuario;

        // Llenamos el formulario con los datos existentes
        this.form.patchValue({
          nombreusuario: usr.nombreusuario,
          idrol: usr.rol.idRol,
          activo: usr.activo !== false
        });

        // Deshabilitamos campos que no se pueden editar
        this.form.get('nombreusuario')?.disable();

        // En edición, la contraseña no es obligatoria en este modal
        this.form.get('passwordusuario')?.clearValidators();
        this.form.get('passwordusuario')?.updateValueAndValidity();
      }
  }

  guardar() {
    if (this.form.get('nombreusuario')?.invalid || this.form.get('passwordusuario')?.invalid || this.form.get('idrol')?.invalid) {
      this.form.markAllAsTouched();
      this.mensaje.open('Complete los campos requeridos', 'warning');
      return;
    }
      this.dialogRef.close(this.form.value);
  }

  cancelar() {
    this.dialogRef.close();
  }

}
