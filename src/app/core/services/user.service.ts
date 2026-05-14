import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthUser, Role } from '../models';

export interface SystemUser extends AuthUser {
  cd:          string;
  status:      'active' | 'blocked';
  companyId:   string | null;
  lastLoginAt: string | null;
  createdAt:   string;
  updatedAt:   string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly base = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SystemUser[]> {
    return this.http.get<{ data: SystemUser[]; meta: unknown }>(this.base).pipe(map(r => r.data));
  }

  getById(id: string): Observable<SystemUser> {
    return this.http.get<SystemUser>(`${this.base}/${id}`);
  }

  create(data: { email: string; password: string; fullName: string; role: Role; companyId?: string }): Observable<SystemUser> {
    return this.http.post<SystemUser>(this.base, data);
  }

  update(id: string, data: { fullName?: string; companyId?: string }): Observable<SystemUser> {
    return this.http.put<SystemUser>(`${this.base}/${id}`, data);
  }

  block(id: string, reason: string): Observable<SystemUser> {
    return this.http.put<SystemUser>(`${this.base}/${id}/block`, { reason });
  }

  unblock(id: string): Observable<SystemUser> {
    return this.http.put<SystemUser>(`${this.base}/${id}/unblock`, {});
  }

  updateRole(id: string, role: Role): Observable<SystemUser> {
    return this.http.put<SystemUser>(`${this.base}/${id}/role`, { role });
  }
}
