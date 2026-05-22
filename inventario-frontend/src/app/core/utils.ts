import { Injectable, inject } from '@angular/core';
import {AbstractControl} from '@angular/forms';

@Injectable({
    providedIn: 'root'
  })
  export class Utils {

    formatearNombre(nombre: string): string {
        if (!nombre) return 'Usuario';
        return nombre.split('.')
          .map(parte => parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase())
          .join(' ');
      }

    obtenerIniciales(nombre: string | undefined): string {
    if (!nombre) return '';

    const partes = nombre.split('.');

    if (partes.length > 1) {
        const inicialNombre = partes[0].charAt(0);
        const inicialApellido = partes[1].charAt(0);
        return (inicialNombre + inicialApellido).toUpperCase();
    }

    return nombre.substring(0, 2).toUpperCase();
    }

    soloNumeros(event : any){
      const charCode = (event.which) ? event.which : event.keyCode;

      if (charCode > 31 && (charCode < 48 || charCode > 57 )){
        event.preventDefault();
      }
    }

    formatearTelefono(valorActual: string): string {
      if (!valorActual) return '';

      let soloNumeros = valorActual.replace(/\D/g, '');

      if (soloNumeros.length > 4) {
        return soloNumeros.substring(0, 4) + '-' + soloNumeros.substring(4, 8);
      }

      return soloNumeros;
    }

    formatearEstado(estado: string): string {
      if (!estado) return '';
      return estado.replace(/_/g, ' ');
    }

  convertirAMayusculas(event: any, control: AbstractControl | null): void {
    if (!control) return;

    const input = event.target as HTMLInputElement;
    const valorEnMayusculas = input.value.toUpperCase();

    control.setValue(valorEnMayusculas, { emitEvent: false });
  }

  }
