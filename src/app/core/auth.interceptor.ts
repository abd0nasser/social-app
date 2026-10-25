import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  const authed = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      // Expired / invalid token on a protected call: send the user back to the auth page.
      const isAuthCall = req.url.includes('/users/signin') || req.url.includes('/users/signup');
      if (err.status === 401 && token && !isAuthCall) auth.logout();
      return throwError(() => err);
    }),
  );
};
