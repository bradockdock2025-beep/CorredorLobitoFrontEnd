import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Tax, CompanyCountry } from '../models';

@Injectable({ providedIn: 'root' })
export class TaxService {
  private readonly base = `${environment.apiUrl}/taxes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Tax[]> {
    return this.http.get<{ data: Tax[]; meta: unknown }>(this.base).pipe(map(r => r.data));
  }

  getByCountry(country: CompanyCountry | 'all'): Observable<Tax[]> {
    return this.http.get<{ data: Tax[]; meta: unknown }>(`${this.base}/country/${country}`)
      .pipe(map(r => r.data));
  }

  getById(id: string): Observable<Tax> {
    return this.http.get<Tax>(`${this.base}/${id}`);
  }

  create(data: {
    name:          string;
    category:      string;
    country:       string;
    rate:          number;
    effectiveFrom: string;
    effectiveTo?:  string;
    isActive?:     boolean;
  }): Observable<Tax> {
    return this.http.post<Tax>(this.base, data);
  }

  update(id: string, data: Partial<{
    name: string; category: string; country: string;
    rate: number; effectiveFrom: string; effectiveTo: string; isActive: boolean;
  }>): Observable<Tax> {
    return this.http.put<Tax>(`${this.base}/${id}`, data);
  }
}
