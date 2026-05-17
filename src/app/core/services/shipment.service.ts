import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Shipment, CustomsDispatch, ShipmentStatus } from '../models';

function extractList<T>(r: T[] | { data: T[] } | { items: T[] } | unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === 'object') {
    if ('data'  in (r as object)) return (r as { data: T[] }).data  ?? [];
    if ('items' in (r as object)) return (r as { items: T[] }).items ?? [];
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class ShipmentService {
  private readonly base = `${environment.apiUrl}/shipments`;

  constructor(private http: HttpClient) {}

  getAll(status?: ShipmentStatus): Observable<Shipment[]> {
    const params = status
      ? `?status=${status}&limit=100`
      : '?limit=100';
    return this.http.get<unknown>(`${this.base}${params}`).pipe(map(r => extractList<Shipment>(r)));
  }

  getMyShipments(): Observable<Shipment[]> {
    return this.http.get<unknown>(`${this.base}/my-shipments?limit=100`)
      .pipe(map(r => extractList<Shipment>(r)));
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
