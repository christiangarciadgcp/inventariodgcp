import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { NgxEchartsModule } from 'ngx-echarts';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomPaginatorIntl } from './core/custom-paginator';
import { authInterceptor } from './interceptors/auth-interceptor';
import { actividadInterceptor } from './interceptors/actividad-interceptor';
import { provideHotToastConfig } from '@ngxpert/hot-toast';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    importProvidersFrom(
      NgxEchartsModule.forRoot({
        echarts: () => import('echarts')
      })
    ),
    provideHotToastConfig(),
    provideHttpClient(withInterceptors([authInterceptor,actividadInterceptor])),

    { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }, provideHotToastConfig()
  ]
};
