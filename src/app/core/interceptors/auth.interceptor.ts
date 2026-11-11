import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SKIP_AUTH_REDIRECT } from './auth.context';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const authReq = req.clone({
    withCredentials: true
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthRequest = /\/auth\/(login|register|refresh|logout)(?:[/?#]|$)/.test(authReq.url);
      if (error.status === 401 && !isAuthRequest) {
        return authService.refreshToken().pipe(
          catchError((refreshError: HttpErrorResponse) => {
            if (refreshError.status === 401 && !authReq.context.get(SKIP_AUTH_REDIRECT)) {
              authService.redirectToLogin();
            }
            return throwError(() => refreshError);
          }),
          switchMap(() => next(authReq))
        );
      }
      return throwError(() => error);
    })
  );
};
