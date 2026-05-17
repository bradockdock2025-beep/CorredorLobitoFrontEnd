import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Transaction, TransactionSummary } from '../models';

function extractList<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === 'object') {
    if ('data'  in (r as object)) return (r as { data: T[] }).data  ?? [];
    if ('items' in (r as object)) return (r as { items: T[] }).items ?? [];
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly base = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Transaction[]> {
    return this.http.get<unknown>(`${this.base}?limit=100`).pipe(map(r => extractList<Transaction>(r)));
  }

  getSummary(): Observable<TransactionSummary> {
    return this.http.get<TransactionSummary>(`${this.base}/summary`);
  }

  getById(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.base}/${id}`);
  }

  block(id: string, reason: string): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.base}/${id}/block`, { reason });
  }

  cancel(id: string): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.base}/${id}/cancel`, {});
  }
}
