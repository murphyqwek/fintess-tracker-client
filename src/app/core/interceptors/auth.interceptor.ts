import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
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
          switchMap(() => next(authReq))
        );
      }
      return throwError(() => error);
    })
  );
};
