import { Injectable, inject } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';

export type TipoSnack = 'exito' | 'error' | 'warning' | 'info' | 'loading';

@Injectable({
  providedIn: 'root'
})
export class Mensaje {

  private _toast = inject(HotToastService);

  open(mensaje: string, tipo: TipoSnack) {

    const baseOptions = {
      position: 'top-center' as const,
      dismissible: true,
      duration: tipo === 'error' ? 6000 : 4000,
      theme: 'ios' as const
    };

    const sharedStyle = {
      borderRadius: '16px',
      padding: '16px 16px',
      boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -2px rgba(0,0,0,0.05)',
      fontWeight: '600',
      fontSize: '15px'
    };

    switch (tipo) {
      case 'exito':
        this._toast.success(mensaje, {
          ...baseOptions,
          iconTheme: {primary: '#0f5132', secondary: '#d1e7dd'},
          style: {
            ...sharedStyle,
            background: '#d1e7dd',
            color: '#0f5132',
            border: '1px solid #badbcc'
          }
        });
        break;

      case 'error':
        this._toast.error(mensaje, {
          ...baseOptions,
          iconTheme: {primary: '#842029', secondary: '#f8d7da'},
          style: {
            ...sharedStyle,
            background: '#f8d7da',
            color: '#842029',
            border: '1px solid #f5c2c7'
          }
        });
        break;

      case 'warning':
        this._toast.warning(mensaje, {
          ...baseOptions,
          iconTheme: {primary: '#664d03', secondary: '#fff3cd'},
          style: {
            ...sharedStyle,
            background: '#fff3cd',
            color: '#664d03',
            border: '1px solid #ffecb5'
          }
        });
        break;

      case 'info':
        this._toast.info(mensaje, {
          ...baseOptions,
          iconTheme: {primary: '#055160', secondary: '#cff4fc'},
          style: {
            ...sharedStyle,
            background: '#cff4fc',
            color: '#055160',
            border: '1px solid #b6effb'
          }
        });
        break;

      case 'loading':
        this._toast.loading(mensaje, {
          ...baseOptions,
          iconTheme: {primary: '#495057', secondary: '#f8f9fa'},
          style: {
            ...sharedStyle,
            background: '#f8f9fa',
            color: '#495057',
            border: '1px solid #dee2e6'
          }
        });
        break;
    }

  }
}
