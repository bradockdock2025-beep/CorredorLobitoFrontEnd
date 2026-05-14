import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuditLog } from '../models';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly base = `${environment.apiUrl}/logs`;

  constructor(private http: HttpClient) {}

  getAll(filters?: { entity?: string; entityId?: string; action?: string }): Observable<AuditLog[]> {
    let params = new HttpParams();
    if (filters?.entity)   params = params.set('entity',   filters.entity);
    if (filters?.entityId) params = params.set('entityId', filters.entityId);
    if (filters?.action)   params = params.set('action',   filters.action);
    return this.http.get<{ data: AuditLog[]; meta: unknown }>(this.base, { params })
      .pipe(map(r => r.data));
  }

  getSuspiciousActivities(): Observable<AuditLog[]> {
    return this.http.get<{ data: AuditLog[]; meta: unknown }>(`${this.base}/suspicious-activities`)
      .pipe(map(r => r.data));
  }

  getById(id: string): Observable<AuditLog> {
    return this.http.get<AuditLog>(`${this.base}/${id}`);
  }
}
