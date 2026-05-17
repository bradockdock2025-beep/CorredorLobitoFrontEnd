import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PriceProposal } from '../models';

function extractList<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === 'object') {
    if ('data'  in (r as object)) return (r as { data: T[] }).data  ?? [];
    if ('items' in (r as object)) return (r as { items: T[] }).items ?? [];
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class PriceProposalService {
  private readonly base = `${environment.apiUrl}/price-proposals`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PriceProposal[]> {
    return this.http.get<unknown>(`${this.base}?limit=100`).pipe(map(r => extractList<PriceProposal>(r)));
  }

  getMyProposals(): Observable<PriceProposal[]> {
    return this.http.get<unknown>(`${this.base}/my-proposals?limit=100`)
      .pipe(map(r => extractList<PriceProposal>(r)));
  }

  getById(id: string): Observable<PriceProposal> {
    return this.http.get<PriceProposal>(`${this.base}/${id}`);
  }

  create(data: {
    productId:      string;
    proposedPrice:  number;
    currency?:      string;
    justification?: string;
    validFrom?:     string;
    validTo?:       string;
  }): Observable<PriceProposal> {
    return this.http.post<PriceProposal>(this.base, data);
  }

  update(id: string, data: {
    proposedPrice?: number;
    justification?: string;
    validFrom?:     string;
    validTo?:       string;
  }): Observable<PriceProposal> {
    return this.http.put<PriceProposal>(`${this.base}/${id}`, data);
  }

  submit(id: string): Observable<PriceProposal> {
    return this.http.post<PriceProposal>(`${this.base}/${id}/submit`, {});
  }

  approve(id: string): Observable<PriceProposal> {
    return this.http.post<PriceProposal>(`${this.base}/${id}/approve`, {});
  }

  reject(id: string, reason: string): Observable<PriceProposal> {
    return this.http.post<PriceProposal>(`${this.base}/${id}/reject`, { reason });
  }
}
