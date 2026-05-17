import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SupportTicket, TicketType } from '../models';

export interface TicketPage {
  data: SupportTicket[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreateTicketDto {
  type:    TicketType;
  subject: string;
  content: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class SupportTicketService {
  private readonly base = `${environment.apiUrl}/support-tickets`;

  constructor(private http: HttpClient) {}

  // state · staff · admin — lista todos
  getAll(page = 1, limit = 20): Observable<TicketPage> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<TicketPage>(this.base, { params });
  }

  // qualquer role — tickets do utilizador autenticado
  getMyTickets(): Observable<SupportTicket[]> {
    return this.http
      .get<TicketPage | SupportTicket[]>(`${this.base}/my-tickets`)
      .pipe(map((res) => (Array.isArray(res) ? res : (res as TicketPage).data)));
  }

  getById(id: string): Observable<SupportTicket> {
    return this.http.get<SupportTicket>(`${this.base}/${id}`);
  }

  create(dto: CreateTicketDto): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(this.base, dto);
  }

  update(id: string, dto: Partial<Pick<CreateTicketDto, 'subject' | 'content'>>): Observable<SupportTicket> {
    return this.http.put<SupportTicket>(`${this.base}/${id}`, dto);
  }

  resolve(id: string, resolution: string): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.base}/${id}/resolve`, { resolution });
  }

  escalate(id: string, reason: string): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.base}/${id}/escalate`, { reason });
  }

  close(id: string): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.base}/${id}/close`, {});
  }
}
