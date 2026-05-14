import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Transaction, TransactionSummary } from '../models';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly base = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Transaction[]> {
    return this.http.get<{ data: Transaction[]; meta: unknown }>(this.base).pipe(map(r => r.data));
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

  cancel(id: string, reason: string): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.base}/${id}/cancel`, { reason });
  }
}
