import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {CategoriaService} from '../../../../services/categoria.service';
import {SugerenciaService} from '../../../../services/sugerencia.service';
import {AuthService} from '../../../../services/auth.service';
import {Mensaje} from '../../../../core/mensaje';
import {ProductoSugerenciaRegistroDTO} from '../../../../models/sugerencia';
import {Utils} from '../../../../core/utils';

@Component({
  selector: 'app-sugerencia-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Sugerir Nuevo Producto</h2>
    <mat-dialog-content class="pt-2">
      <p class="text-secondary small mb-3">Si no encuentras un producto en el diccionario de materiales, llena este formulario.</p>

      <form [formGroup]="form" class="row g-3">
        <div class="col-12">
          <mat-form-field appearance="outline" class="w-100">
            <mat-label>Nombre Sugerido del Producto</mat-label>
            <input matInput formControlName="nombreSugerido" (input)="onInputMayusculas($event, 'nombreSugerido')" placeholder="Ej. Monitor Dell 24 pulgadas">
            @if (form.get('nombreSugerido')?.hasError('required') && form.get('nombreSugerido')?.touched) {
              <mat-error>Este campo es obligatorio</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="col-12">
          <mat-form-field appearance="outline" class="w-100">
            <mat-label>Categoría Sugerida (Opcional)</mat-label>
            <mat-select formControlName="idCategoria">
              @for (c of listaCategorias; track c.idCategoria) {
                <mat-option [value]="c.idCategoria">{{c.nombrecategoria}}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="col-12">
          <mat-form-field appearance="outline" class="w-100">
            <mat-label>¿Para qué se necesita? (Justificación)</mat-label>
            <textarea matInput formControlName="justificacion" rows="3" placeholder="Explique brevemente el motivo de la sugerencia..."></textarea>
            @if (form.get('justificacion')?.hasError('required') && form.get('justificacion')?.touched) {
              <mat-error>Este campo es obligatorio</mat-error>
            }
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="pb-3 pe-3">
      <button mat-button class="btn-cancel" (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button class="btn-confirm" color="primary" [disabled]="form.invalid || guardando" (click)="guardar()">
        {{ guardando ? 'Enviando...' : 'Enviar Sugerencia' }}
      </button>
    </mat-dialog-actions>
  `
})
export class SugerenciaDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<SugerenciaDialogComponent>);
  private catService = inject(CategoriaService);
  private sugerenciaService = inject(SugerenciaService);
  public authService = inject(AuthService);
  private mensaje = inject(Mensaje);
  private sn = inject(Utils);

  listaCategorias: any[] = [];
  guardando = false;

  form: FormGroup = this.fb.group({
    nombreSugerido: ['', Validators.required],
    idCategoria: [null],
    justificacion: ['', Validators.required]
  });

  ngOnInit() {
    this.catService.getCategoriasActivas().subscribe(data => this.listaCategorias = data);
  }

  onInputMayusculas(event: Event, controlName: string) {
    const control = this.form.get(controlName);
    this.sn.convertirAMayusculas(event, control);
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando = true;

    const dto: ProductoSugerenciaRegistroDTO = {
      nombreSugerido: this.form.value.nombreSugerido,
      idCategoria: this.form.value.idCategoria,
      justificacion: this.form.value.justificacion,
      idUsuarioSolicitante: this.authService.getIdUsuarioActual()
    };

    this.sugerenciaService.crearSugerencia(dto).subscribe({
      next: () => {
        this.mensaje.open('Sugerencia enviada correctamente', 'exito');
        this.dialogRef.close(true);
      },
      error: () => {
        this.guardando = false;
        this.mensaje.open('Error al enviar sugerencia', 'error');
      }
    });
  }
}
