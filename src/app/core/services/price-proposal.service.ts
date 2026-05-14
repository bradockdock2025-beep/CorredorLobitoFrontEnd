import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PriceProposal } from '../models';

@Injectable({ providedIn: 'root' })
export class PriceProposalService {
  private readonly base = `${environment.apiUrl}/price-proposals`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PriceProposal[]> {
    return this.http.get<{ data: PriceProposal[]; meta: unknown }>(this.base).pipe(map(r => r.data));
  }

  getMyProposals(): Observable<PriceProposal[]> {
    return this.http.get<{ data: PriceProposal[]; meta: unknown }>(`${this.base}/my-proposals`)
      .pipe(map(r => r.data));
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
