import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Report } from '../models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly base = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Report[]> {
    return this.http.get<{ data: Report[]; meta: unknown }>(this.base).pipe(map(r => r.data));
  }

  getMyReports(): Observable<Report[]> {
    return this.http.get<{ data: Report[]; meta: unknown }>(`${this.base}/my-reports`)
      .pipe(map(r => r.data));
  }

  getById(id: string): Observable<Report> {
    return this.http.get<Report>(`${this.base}/${id}`);
  }

  create(data: {
    title:           string;
    type:            string;
    period?:         string;
    targetAudience?: string;
    content?:        object;
  }): Observable<Report> {
    return this.http.post<Report>(this.base, data);
  }

  update(id: string, data: Partial<{
    title: string; type: string; period: string; targetAudience: string; content: object;
  }>): Observable<Report> {
    return this.http.put<Report>(`${this.base}/${id}`, data);
  }

  submit(id: string): Observable<Report> {
    return this.http.post<Report>(`${this.base}/${id}/submit`, {});
  }

  publish(id: string): Observable<Report> {
    return this.http.post<Report>(`${this.base}/${id}/publish`, {});
  }

  reject(id: string, reason: string): Observable<Report> {
    return this.http.post<Report>(`${this.base}/${id}/reject`, { reason });
  }
}
