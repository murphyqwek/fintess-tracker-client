import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkoutListResponse, CreateWorkoutRequest } from '../../models/workout.model';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/workout';

  getWorkouts(limit: number = 3, cursor?: string): Observable<WorkoutListResponse> {
    let params = new HttpParams().set('limit', limit.toString());

    if (cursor) {
      params = params.set('cursor', cursor);
    }

    return this.http.get<WorkoutListResponse>(this.apiUrl, { params });
  }

  createWorkout(workout: CreateWorkoutRequest, idempotencyKey: string): Observable<number | string | { id: number | string }> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey
    });

    return this.http.post<number | string | { id: number | string }>(this.apiUrl, workout, { headers });
  }
}