import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MonthlyVolumeResponse, WeeklyRecordResponse } from '../../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/analytics';

  getMonthlyVolume(): Observable<MonthlyVolumeResponse> {
    return this.http.get<MonthlyVolumeResponse>(
      `${this.baseUrl}/monthly-volume`
    );
  }

  getWeeklyRecord(): Observable<WeeklyRecordResponse> {
    return this.http.get<WeeklyRecordResponse>(
      `${this.baseUrl}/weekly-record`
    );
  }
}