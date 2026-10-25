import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Hash URLs (#/feed, #/profile …) just like the reference demo.
    provideRouter(routes, withHashLocation(), withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
