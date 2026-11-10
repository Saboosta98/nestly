import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { HouseholdDataSource } from './core/repositories/data-source';
import { DemoDataSource } from './core/repositories/demo-data.source';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    // Swap DemoDataSource for an AppwriteDataSource in a later phase.
    { provide: HouseholdDataSource, useClass: DemoDataSource },
  ],
};
