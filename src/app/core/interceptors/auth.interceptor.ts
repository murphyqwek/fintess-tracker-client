import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';

// Флаг и сабжект вынесены за пределы функции, чтобы сохранять состояние между запросами
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const authReq = req.clone({
    withCredentials: true // Для отправки куки с токенами
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !authReq.url.includes('/login') && !authReq.url.includes('/refresh')) {
        return handle401Error(authReq, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(request: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null); // Сбрасываем сабжект

    return authService.refreshToken().pipe(
      switchMap((tokenResponse) => {
        isRefreshing = false;
        // Даем сигнал остальным запросам в очереди, что рефреш успешен
        refreshTokenSubject.next(tokenResponse);
        // Повторяем оригинальный запрос (с withCredentials он подхватит новую куку)
        return next(request);
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout(); // Разлогиниваем, если рефреш тоже протух
        return throwError(() => err);
      })
    );
  } else {
    // Если рефреш УЖЕ идет, мы ставим этот запрос в ожидание
    return refreshTokenSubject.pipe(
      filter(token => token !== null), // Ждем, пока token не станет не null (значит рефреш прошел)
      take(1), // Берем 1 значение и отписываемся
      switchMap(() => {
        // Повторяем запрос после успешного рефреша
        return next(request);
      })
    );
  }
}