import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Order, Shipment } from '../models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly base = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Order[]> {
    return this.http.get<{ data: Order[]; meta: unknown }>(this.base)
      .pipe(map(r => r.data));
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<{ data: Order[]; meta: unknown }>(`${this.base}/my-orders`)
      .pipe(map(r => r.data));
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
