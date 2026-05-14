import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Company, CompanyCountry } from '../models';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly base = `${environment.apiUrl}/companies`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Company[]> {
    return this.http.get<{ data: Company[]; meta: unknown }>(this.base).pipe(map(r => r.data));
  }

  getById(id: string): Observable<Company> {
    return this.http.get<Company>(`${this.base}/${id}`);
  }

  create(data: {
    name: string;
    country: CompanyCountry;
    contactEmail: string;
    contactPhone?: string;
    address?: string;
  }): Observable<Company> {
    return this.http.post<Company>(this.base, data);
  }

  update(id: string, data: {
    name?:         string;
    contactEmail?: string;
    contactPhone?: string;
    address?:      string;
  }): Observable<Company> {
    return this.http.put<Company>(`${this.base}/${id}`, data);
  }

  validateDocs(id: string, valid: boolean, notes?: string): Observable<Company> {
    return this.http.post<Company>(`${this.base}/${id}/validate-documentation`, { valid, notes });
  }

  forwardToState(id: string): Observable<Company> {
    return this.http.post<Company>(`${this.base}/${id}/forward-to-state`, {});
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
