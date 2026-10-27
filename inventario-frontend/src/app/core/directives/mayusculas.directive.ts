import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  // Se admiten ambos selectores para que funcione con Mayusculas o appMayusculas
  selector: '[Mayusculas]',
  standalone: true
})
export class MayusculasDirective {
  private el = inject(ElementRef<HTMLInputElement>);
  private ngControl = inject(NgControl, { optional: true });

  // Recibe 'event: Event' para que coincida con el argumento '$event'
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = this.el.nativeElement;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    const valorMayusculas = input.value.toUpperCase();
    input.value = valorMayusculas;

    // Actualiza el FormControl reactivo sin disparar bucles infinitos
    if (this.ngControl && this.ngControl.control) {
      this.ngControl.control.setValue(valorMayusculas, { emitEvent: false });
    }

    // Mantiene la posición del cursor mientras se escribe
    if (start !== null && end !== null) {
      input.setSelectionRange(start, end);
    }
  }
}
