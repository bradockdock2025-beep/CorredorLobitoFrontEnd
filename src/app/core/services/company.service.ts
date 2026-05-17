import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Company, CompanyCountry, CompanyType } from '../models';

function extractList<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === 'object') {
    if ('data'  in (r as object)) return (r as { data: T[] }).data  ?? [];
    if ('items' in (r as object)) return (r as { items: T[] }).items ?? [];
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly base = `${environment.apiUrl}/companies`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Company[]> {
    return this.http.get<unknown>(`${this.base}?limit=100`).pipe(map(r => extractList<Company>(r)));
  }

  getById(id: string): Observable<Company> {
    return this.http.get<Company>(`${this.base}/${id}`);
  }

  create(data: {
    name:          string;
    country:       CompanyCountry;
    contactEmail:  string;
    companyType?:  CompanyType;
    contactPhone?: string;
    address?:      string;
  }): Observable<Company> {
    return this.http.post<Company>(this.base, data);
  }

  update(id: string, data: {
    name?:         string;
    companyType?:  CompanyType;
    contactEmail?: string;
    contactPhone?: string;
    address?:      string;
  }): Observable<Company> {
    return this.http.put<Company>(`${this.base}/${id}`, data);
  }

  validateDocs(id: string, valid: boolean, notes?: string): Observable<Company> {
    return this.http.post<Company>(`${this.base}/${id}/validate-documentation`, { valid, notes });
  }

  forwardToState(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/${id}/forward-to-state`, {});
  }

  approveLicense(id: string, licenseNumber: string, licenseExpiresAt: string): Observable<Company> {
    return this.http.post<Company>(`${this.base}/${id}/approve-license`, {
      licenseNumber,
      licenseExpiresAt,
    });
  }

  rejectLicense(id: string, reason: string): Observable<Company> {
    return this.http.post<Company>(`${this.base}/${id}/reject-license`, { reason });
  }

  suspend(id: string, reason: string): Observable<Company> {
    return this.http.post<Company>(`${this.base}/${id}/suspend`, { reason });
  }

  revoke(id: string, reason: string): Observable<Company> {
    return this.http.post<Company>(`${this.base}/${id}/revoke`, { reason });
  }
}
