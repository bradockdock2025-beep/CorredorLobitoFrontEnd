import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupportTicketService } from '../../../../core/services/support-ticket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SupportTicket, TicketStatus, Role } from '../../../../core/models';

const ADMIN_ROLES: Role[] = ['state', 'staff', 'admin'];

@Component({
  selector: 'app-ticket-list',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Tickets de Suporte</h1>
          <p class="page-subtitle">{{ isAdmin ? 'Todos os tickets do sistema' : 'Os meus tickets' }}</p>
        </div>
        <button mat-raised-button color="primary" (click)="openNew()">
          <mat-icon>add</mat-icon> Novo Ticket
        </button>
      </div>

      <div class="loading-block" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div class="error-banner" *ngIf="!loading && errorMsg">
        <mat-icon>error_outline</mat-icon> {{ errorMsg }}
      </div>

      <div class="empty-state" *ngIf="!loading && !errorMsg && tickets.length === 0">
        <mat-icon>support_agent</mat-icon>
        <p>Sem tickets {{ isAdmin ? 'no sistema' : 'abertos' }}.</p>
        <button mat-raised-button color="primary" (click)="openNew()">Abrir primeiro ticket</button>
      </div>

      <div class="ticket-grid" *ngIf="!loading && tickets.length > 0">
        <mat-card class="ticket-card" *ngFor="let t of tickets" (click)="openDetail(t.id)">
          <mat-card-content>
            <div class="ticket-top">
              <span class="ticket-cd">{{ t.cd }}</span>
              <span class="ticket-badge" [class]="'badge-' + t.status">{{ statusLabel(t.status) }}</span>
            </div>
            <p class="ticket-subject">{{ t.subject }}</p>
            <div class="ticket-meta">
              <span class="ticket-type">
                <mat-icon class="meta-icon">category</mat-icon>{{ typeLabel(t.type) }}
              </span>
              <span class="ticket-date">
                <mat-icon class="meta-icon">schedule</mat-icon>{{ t.createdAt | date:'dd/MM/yyyy' }}
              </span>
              <span *ngIf="isAdmin && t.user" class="ticket-user">
                <mat-icon class="meta-icon">person</mat-icon>{{ t.user.fullName }}
              </span>
            </div>
            <div class="escalated-tag" *ngIf="t.escalatedToState">
              <mat-icon>arrow_upward</mat-icon> Escalado ao STATE
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1100px; margin: 0 auto; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .page-title { font-size: 24px; font-weight: 700; color: var(--primary); margin: 0; }
    .page-subtitle { font-size: 14px; color: #888; margin: 4px 0 0; }

    .loading-block { text-align: center; padding: 48px; }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fce8e6;
      color: #c5221f;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 64px 24px;
      color: #999;
    }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; margin-bottom: 16px; }
    .empty-state p { font-size: 16px; margin-bottom: 24px; }

    .ticket-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .ticket-card {
      cursor: pointer;
      transition: box-shadow 0.2s;
      border-radius: 10px !important;
    }
    .ticket-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important; }

    .ticket-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .ticket-cd { font-size: 12px; font-weight: 700; color: #888; }

    .ticket-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-open       { background: #e3f2fd; color: #1565c0; }
    .badge-in_progress{ background: #fff8e1; color: #f57f17; }
    .badge-escalated  { background: #fce4ec; color: #ad1457; }
    .badge-resolved   { background: #e8f5e9; color: #2e7d32; }
    .badge-closed     { background: #f5f5f5; color: #757575; }

    .ticket-subject {
      font-size: 15px;
      font-weight: 600;
      color: var(--primary);
      margin: 0 0 12px;
      line-height: 1.3;
    }

    .ticket-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .ticket-type, .ticket-date, .ticket-user {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #888;
    }

    .meta-icon { font-size: 14px; width: 14px; height: 14px; }

    .escalated-tag {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 10px;
      font-size: 12px;
      font-weight: 600;
      color: #ad1457;
      background: #fce4ec;
      padding: 4px 10px;
      border-radius: 20px;
      width: fit-content;
    }
    .escalated-tag mat-icon { font-size: 14px; width: 14px; height: 14px; }
  `],
})
export class TicketListComponent implements OnInit {
  tickets: SupportTicket[] = [];
  loading  = true;
  errorMsg = '';
  isAdmin  = false;

  constructor(
    private ticketSvc: SupportTicketService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    this.isAdmin = ADMIN_ROLES.includes(user?.role as Role);
    this.load();
  }

  load(): void {
    this.loading  = true;
    this.errorMsg = '';

    if (this.isAdmin) {
      this.ticketSvc.getAll().subscribe({
        next: (res) => { this.tickets = res.data; this.loading = false; },
        error: () => { this.errorMsg = 'Erro ao carregar tickets.'; this.loading = false; },
      });
    } else {
      this.ticketSvc.getMyTickets().subscribe({
        next: (data) => { this.tickets = data; this.loading = false; },
        error: () => { this.errorMsg = 'Erro ao carregar tickets.'; this.loading = false; },
      });
    }
  }

  openDetail(id: string): void {
    this.router.navigate(['..', id], { relativeTo: null });
    // navegação relativa ao módulo injectada via RouterLink na verdade;
    // usamos navigate com URL absoluto construído abaixo
    const user = this.auth.getCurrentUser();
    if (user) {
      this.router.navigate([`/dashboard/${user.role}/support-tickets`, id]);
    }
  }

  openNew(): void {
    const user = this.auth.getCurrentUser();
    if (user) {
      this.router.navigate([`/dashboard/${user.role}/support-tickets/new`]);
    }
  }

  statusLabel(s: TicketStatus): string {
    const map: Record<TicketStatus, string> = {
      open:        'Aberto',
      in_progress: 'Em curso',
      escalated:   'Escalado',
      resolved:    'Resolvido',
      closed:      'Fechado',
    };
    return map[s] ?? s;
  }

  typeLabel(t: string): string {
    const map: Record<string, string> = {
      technical:  'Técnico',
      licensing:  'Licenciamento',
      billing:    'Pagamento',
      compliance: 'Conformidade',
      other:      'Outro',
    };
    return map[t] ?? t;
  }
}
