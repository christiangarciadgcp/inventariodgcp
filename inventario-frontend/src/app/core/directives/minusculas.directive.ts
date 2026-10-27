import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appMinusculas], [Minusculas]',
  standalone: true
})
export class MinusculasDirective {
  private el = inject(ElementRef<HTMLInputElement>);
  private ngControl = inject(NgControl, { optional: true });

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = this.el.nativeElement;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    const valorMinusculas = input.value.toLowerCase();
    input.value = valorMinusculas;

    // Actualiza el FormControl reactivo sin generar bucles
    if (this.ngControl && this.ngControl.control) {
      this.ngControl.control.setValue(valorMinusculas, { emitEvent: false });
    }

    // Mantiene la posición del cursor
    if (start !== null && end !== null) {
      input.setSelectionRange(start, end);
    }
  }
}
