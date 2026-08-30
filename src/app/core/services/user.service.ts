import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/user/me';

  getCurrentUser(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.apiUrl);
  }

  updateCurrentUser(profile: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.patch<UserProfile>(this.apiUrl, profile);
  }
}