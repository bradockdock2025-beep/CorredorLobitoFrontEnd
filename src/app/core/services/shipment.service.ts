import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Shipment, CustomsDispatch, ShipmentStatus } from '../models';

@Injectable({ providedIn: 'root' })
export class ShipmentService {
  private readonly base = `${environment.apiUrl}/shipments`;

  constructor(private http: HttpClient) {}

  getAll(status?: ShipmentStatus): Observable<Shipment[]> {
    const url = status ? `${this.base}?status=${status}` : this.base;
    return this.http.get<{ data: Shipment[]; meta: unknown }>(url).pipe(map(r => r.data));
  }

  getMyShipments(): Observable<Shipment[]> {
    return this.http.get<{ data: Shipment[]; meta: unknown }>(`${this.base}/my-shipments`)
      .pipe(map(r => r.data));
  }

  getByOrderId(orderId: string): Observable<Shipment> {
    return this.http.get<Shipment>(`${this.base}/order/${orderId}`);
  }

  getById(id: string): Observable<Shipment> {
    return this.http.get<Shipment>(`${this.base}/${id}`);
  }

  create(data: { orderId: string; origin: string; destination: string; eta?: string }): Observable<Shipment> {
    return this.http.post<Shipment>(this.base, data);
  }

  updateTracking(id: string, data: { location: string; status: ShipmentStatus; notes?: string }): Observable<Shipment> {
    return this.http.put<Shipment>(`${this.base}/${id}/tracking`, data);
  }

  approve(id: string, notes?: string): Observable<CustomsDispatch> {
    return this.http.post<CustomsDispatch>(`${this.base}/${id}/approve`, { notes });
  }

  reject(id: string, reason: string): Observable<CustomsDispatch> {
    return this.http.post<CustomsDispatch>(`${this.base}/${id}/reject`, { reason });
  }

  hold(id: string, reason: string): Observable<Shipment> {
    return this.http.post<Shipment>(`${this.base}/${id}/hold`, { reason });
  }
}
