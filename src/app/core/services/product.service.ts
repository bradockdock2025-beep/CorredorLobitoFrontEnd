import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Product } from '../models';

function extractList<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === 'object') {
    if ('data'  in (r as object)) return (r as { data: T[] }).data  ?? [];
    if ('items' in (r as object)) return (r as { items: T[] }).items ?? [];
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly base = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<unknown>(`${this.base}?limit=100`).pipe(map(r => extractList<Product>(r)));
  }

  getMyProducts(): Observable<Product[]> {
    return this.http.get<unknown>(`${this.base}/my-products?limit=100`)
      .pipe(map(r => extractList<Product>(r)));
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.base}/${id}`);
  }

  create(data: {
    name:        string;
    description?: string;
    category:    string;
    companyId:   string;
    metadata?:   Record<string, string>;
  }): Observable<Product> {
    return this.http.post<Product>(this.base, data);
  }

  update(id: string, data: { name?: string; description?: string; category?: string }): Observable<Product> {
    return this.http.put<Product>(`${this.base}/${id}`, data);
  }

  requestPublication(id: string): Observable<Product> {
    return this.http.post<Product>(`${this.base}/${id}/request-publication`, {});
  }

  validateTechnical(id: string, valid: boolean, notes?: string): Observable<Product> {
    return this.http.post<Product>(`${this.base}/${id}/validate-technical`, { valid, notes });
  }

  forwardProductToState(id: string): Observable<Product> {
    return this.http.post<Product>(`${this.base}/${id}/forward-product-to-state`, {});
  }

  approvePublication(id: string): Observable<Product> {
    return this.http.post<Product>(`${this.base}/${id}/approve-publication`, {});
  }

  rejectPublication(id: string, reason: string): Observable<Product> {
    return this.http.post<Product>(`${this.base}/${id}/reject-publication`, { reason });
  }

  suspend(id: string): Observable<Product> {
    return this.http.post<Product>(`${this.base}/${id}/suspend`, {});
  }
}
