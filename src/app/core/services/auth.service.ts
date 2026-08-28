import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/internal/Observable';
import { User } from '../../models/user.model';
import { catchError, map, of, tap } from 'rxjs';
import { UserAuthModel } from '../../models/user.auth.model';
import { UserRegModel } from '../../models/user.reg.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  
  isAuthenticated = computed(() => !!this.currentUser());

  register(credentials: UserRegModel): Observable<User> {
    return this.http.post<User>(`api/v1/auth/register`, credentials, { withCredentials: true }).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  login(credentials: UserAuthModel): Observable<User> {
    return this.http.post<User>(`api/v1/auth/login`, credentials, { withCredentials: true }).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  logout(): Observable<any> {
    return this.http.post(`api/v1/auth/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      })
    );
  }

  checkAuth(): Observable<boolean> {
    return this.http.get<User>(`api/v1/test-auth`, { withCredentials: true }).pipe(
      tap(user => this.currentUser.set(user)),
      map(() => true),
      catchError(() => {
        this.currentUser.set(null);
        return of(false);
      })
    );
  }

  refreshToken(): Observable<any> {
    return this.http.post(`api/v1/auth/refresh`, {}, { withCredentials: true });
  }
}
