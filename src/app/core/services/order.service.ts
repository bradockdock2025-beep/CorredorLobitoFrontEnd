import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Order, Shipment } from '../models';

function extractList<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === 'object') {
    if ('data'  in (r as object)) return (r as { data: T[] }).data  ?? [];
    if ('items' in (r as object)) return (r as { items: T[] }).items ?? [];
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly base = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Order[]> {
    return this.http.get<unknown>(`${this.base}?limit=100`)
      .pipe(map(r => extractList<Order>(r)));
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<unknown>(`${this.base}/my-orders?limit=100`)
      .pipe(map(r => extractList<Order>(r)));
  }

  getById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.base}/${id}`);
  }

  // companyId vem do JWT, priceProposalId resolvido pelo sistema
  create(data: { lines: Array<{ productId: string; qty: number }> }): Observable<Order> {
    return this.http.post<Order>(this.base, data);
  }

  update(id: string, data: { lines: Array<{ productId: string; qty: number }> }): Observable<Order> {
    return this.http.put<Order>(`${this.base}/${id}`, data);
  }

  pay(id: string): Observable<Order> {
    return this.http.post<Order>(`${this.base}/${id}/pay`, {});
  }

  block(id: string, reason: string): Observable<Order> {
    return this.http.post<Order>(`${this.base}/${id}/block`, { reason });
  }

  cancel(id: string, reason: string): Observable<Order> {
    return this.http.post<Order>(`${this.base}/${id}/cancel`, { reason });
  }

  escalateToState(id: string, reason: string, urgencyLevel?: string): Observable<{ message?: string }> {
    return this.http.post<{ message?: string }>(`${this.base}/${id}/escalate-to-state`, {
      reason,
      ...(urgencyLevel ? { urgencyLevel } : {}),
    });
  }

  getShipmentByOrderId(orderId: string): Observable<Shipment> {
    return this.http.get<Shipment>(`${environment.apiUrl}/shipments/order/${orderId}`);
  }
}
