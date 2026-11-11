import {
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { HouseholdDataSource } from './core/repositories/data-source';
import { DemoDataSource } from './core/repositories/demo-data.source';
import { HttpDataSource } from './core/repositories/http-data.source';
import { environment } from '../environments/environment';
import { authInterceptor } from './core/services/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: HouseholdDataSource,
      useClass: environment.useDemo ? DemoDataSource : HttpDataSource,
    },
  ],
};
