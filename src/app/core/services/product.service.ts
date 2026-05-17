import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Product } from '../models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly base = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<{ data: Product[]; meta: unknown }>(this.base).pipe(map(r => r.data));
  }

  getMyProducts(): Observable<Product[]> {
    return this.http.get<{ data: Product[]; meta: unknown }>(`${this.base}/my-products`)
      .pipe(map(r => r.data));
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
