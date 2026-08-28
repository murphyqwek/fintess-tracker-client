// services/exercise.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Exercise, PageResponse } from '../../models/exercise.model';

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/exercise';

  getExercises(
    page: number, 
    size: number, 
    name?: string, 
    muscleIds?: number[]
  ): Observable<PageResponse<Exercise>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (name) {
      params = params.set('name', name);
    }

    if (muscleIds && muscleIds.length > 0) {
      // Angular HttpParams умеет отправлять массивы, если добавлять их через append
      muscleIds.forEach(id => {
        params = params.append('muscleIds', id);
      });
    }

    return this.http.get<PageResponse<Exercise>>(this.apiUrl, { params });
  }
}