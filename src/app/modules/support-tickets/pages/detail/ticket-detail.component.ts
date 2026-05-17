import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupportTicketService } from '../../../../core/services/support-ticket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SupportTicket, TicketStatus, Role } from '../../../../core/models';
import { HttpErrorResponse } from '@angular/common/http';

const RESOLVER_ROLES: Role[] = ['state', 'staff', 'admin'];
const ESCALATOR_ROLES: Role[] = ['staff'];

@Component({
  selector: 'app-ticket-detail',
  template: `
    <div class="page-container">

      <div class="back-nav">
        <button mat-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon> Todos os tickets
        </button>
      </div>

      <div class="loading-block" *ngIf="loading && !ticket">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div class="error-banner" *ngIf="!loading && errorMsg && !ticket">
        <mat-icon>error_outline</mat-icon> {{ errorMsg }}
      </div>

      <ng-container *ngIf="ticket">

        <div class="detail-header">
          <div>
            <div class="detail-cd">{{ ticket.cd }}</div>
            <h1 class="detail-subject">{{ ticket.subject }}</h1>
            <div class="detail-badges">
              <span class="ticket-badge" [class]="'badge-' + ticket.status">{{ statusLabel(ticket.status) }}</span>
              <span class="type-badge">{{ typeLabel(ticket.type) }}</span>
              <span class="escalated-tag" *ngIf="ticket.escalatedToState">
                <mat-icon>arrow_upward</mat-icon> Escalado ao STATE
              </span>
            </div>
          </div>
          <div class="header-actions">
            <button mat-icon-button (click)="load()" matTooltip="Actualizar">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </div>

        <div class="detail-grid">

          <!-- Conteúdo do ticket -->
          <mat-card class="detail-card">
            <mat-card-header>
              <mat-card-title>Descrição</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="content-block" *ngFor="let entry of contentEntries()">
                <span class="content-key">{{ entry.key }}</span>
                <span class="content-val">{{ entry.value }}</span>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Metadados -->
          <mat-card class="detail-card meta-card">
            <mat-card-header>
              <mat-card-title>Detalhes</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="meta-row" *ngIf="ticket.user">
                <span class="meta-label">Criado por</span>
                <span>{{ ticket.user.fullName }} ({{ ticket.user.role }})</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Criado em</span>
                <span>{{ ticket.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="meta-row" *ngIf="ticket.escalatedAt">
                <span class="meta-label">Escalado em</span>
                <span>{{ ticket.escalatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="meta-row" *ngIf="ticket.resolvedAt">
                <span class="meta-label">Resolvido em</span>
                <span>{{ ticket.resolvedAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="meta-row" *ngIf="ticket.closedAt">
                <span class="meta-label">Fechado em</span>
                <span>{{ ticket.closedAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Resolução (se existir) -->
          <mat-card class="detail-card resolution-card" *ngIf="ticket.resolution">
            <mat-card-header>
              <mat-card-title>Resolução</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="resolution-text">{{ ticket.resolution }}</p>
            </mat-card-content>
          </mat-card>

          <!-- Acções para staff/state/admin -->
          <mat-card class="detail-card actions-card" *ngIf="canAct()">
            <mat-card-header>
              <mat-card-title>Acções</mat-card-title>
            </mat-card-header>
            <mat-card-content>

              <!-- Resolver -->
              <ng-container *ngIf="canResolve()">
                <form [formGroup]="resolveForm" (ngSubmit)="onResolve()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Resolução</mat-label>
                    <textarea matInput formControlName="resolution" rows="3"
                              placeholder="Descreva como o ticket foi resolvido..."></textarea>
                    <mat-error *ngIf="resolveForm.get('resolution')?.hasError('minlength')">Mínimo 10 caracteres</mat-error>
                  </mat-form-field>
                  <button mat-raised-button color="primary" type="submit" [disabled]="actionLoading">
                    <mat-icon>check_circle</mat-icon> Marcar como Resolvido
                  </button>
                </form>
                <mat-divider style="margin: 16px 0"></mat-divider>
              </ng-container>

              <!-- Escalar (apenas staff) -->
              <ng-container *ngIf="canEscalate()">
                <form [formGroup]="escalateForm" (ngSubmit)="onEscalate()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Motivo da escalada ao STATE</mat-label>
                    <textarea matInput formControlName="reason" rows="2"
                              placeholder="Explique por que este ticket precisa de decisão governamental..."></textarea>
                    <mat-error *ngIf="escalateForm.get('reason')?.hasError('minlength')">Mínimo 10 caracteres</mat-error>
                  </mat-form-field>
                  <button mat-stroked-button color="warn" type="submit" [disabled]="actionLoading">
                    <mat-icon>arrow_upward</mat-icon> Escalar ao STATE
                  </button>
                </form>
              </ng-container>

              <div class="action-error" *ngIf="actionError">
                <mat-icon>error_outline</mat-icon> {{ actionError }}
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Fechar ticket (dono ou STATE) -->
          <mat-card class="detail-card" *ngIf="canClose()">
            <mat-card-content>
              <button mat-stroked-button (click)="onClose()" [disabled]="actionLoading">
                <mat-icon>close</mat-icon> Fechar Ticket
              </button>
            </mat-card-content>
          </mat-card>

        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 900px; margin: 0 auto; }

    .back-nav { margin-bottom: 16px; }

    .loading-block { text-align: center; padding: 48px; }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fce8e6;
      color: #c5221f;
      padding: 12px 16px;
      border-radius: 8px;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .detail-cd { font-size: 12px; font-weight: 700; color: #888; margin-bottom: 4px; }
    .detail-subject { font-size: 22px; font-weight: 700; color: var(--primary); margin: 0 0 10px; }

    .detail-badges { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }

    .ticket-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 12px;
      border-radius: 20px;
      text-transform: uppercase;
    }
    .badge-open       { background: #e3f2fd; color: #1565c0; }
    .badge-in_progress{ background: #fff8e1; color: #f57f17; }
    .badge-escalated  { background: #fce4ec; color: #ad1457; }
    .badge-resolved   { background: #e8f5e9; color: #2e7d32; }
    .badge-closed     { background: #f5f5f5; color: #757575; }

    .type-badge {
      font-size: 11px;
      background: #e8eaf6;
      color: #3949ab;
      padding: 3px 12px;
      border-radius: 20px;
      font-weight: 600;
    }

    .escalated-tag {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      color: #ad1457;
      background: #fce4ec;
      padding: 3px 12px;
      border-radius: 20px;
    }
    .escalated-tag mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .detail-grid { display: flex; flex-direction: column; gap: 16px; }

    .detail-card { border-radius: 10px !important; }

    .content-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-bottom: 12px;
    }
    .content-key {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #888;
    }
    .content-val { font-size: 14px; color: #333; word-break: break-word; }

    .meta-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f5f5f5;
      font-size: 14px;
    }
    .meta-label { color: #888; font-weight: 500; }

    .resolution-text { font-size: 14px; color: #333; line-height: 1.6; }

    .full-width { width: 100%; }

    .action-error {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #c5221f;
      font-size: 13px;
      background: #fce8e6;
      padding: 8px 12px;
      border-radius: 6px;
      margin-top: 12px;
    }
  `],
})
export class TicketDetailComponent implements OnInit {
  ticket:        SupportTicket | null = null;
  loading        = true;
  errorMsg       = '';
  actionLoading  = false;
  actionError    = '';
  resolveForm:   FormGroup;
  escalateForm:  FormGroup;

  private ticketId = '';
  private userRole: Role | null = null;
  private userId   = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private ticketSvc: SupportTicketService,
    private auth: AuthService,
  ) {
    this.resolveForm  = this.fb.group({ resolution: ['', [Validators.required, Validators.minLength(10)]] });
    this.escalateForm = this.fb.group({ reason: ['', [Validators.required, Validators.minLength(10)]] });
  }

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    this.userRole = user?.role ?? null;
    this.userId   = user?.id ?? '';
    this.ticketId = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  load(): void {
    this.loading  = true;
    this.errorMsg = '';
    this.ticketSvc.getById(this.ticketId).subscribe({
      next: (t) => { this.ticket = t; this.loading = false; },
      error: () => { this.errorMsg = 'Erro ao carregar ticket.'; this.loading = false; },
    });
  }

  contentEntries(): { key: string; value: string }[] {
    if (!this.ticket?.content) return [];
    return Object.entries(this.ticket.content).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }));
  }

  canAct(): boolean {
    return RESOLVER_ROLES.includes(this.userRole as Role) || ESCALATOR_ROLES.includes(this.userRole as Role);
  }

  canResolve(): boolean {
    if (!this.ticket) return false;
    return RESOLVER_ROLES.includes(this.userRole as Role) &&
           ['open', 'in_progress', 'escalated'].includes(this.ticket.status);
  }

  canEscalate(): boolean {
    if (!this.ticket) return false;
    return ESCALATOR_ROLES.includes(this.userRole as Role) &&
           !this.ticket.escalatedToState &&
           ['open', 'in_progress'].includes(this.ticket.status);
  }

  canClose(): boolean {
    if (!this.ticket) return false;
    const isOwner = this.ticket.userId === this.userId;
    const isState = this.userRole === 'state';
    return (isOwner || isState) && ['resolved'].includes(this.ticket.status);
  }

  onResolve(): void {
    if (this.resolveForm.invalid) return;
    this.actionLoading = true;
    this.actionError   = '';
    this.ticketSvc.resolve(this.ticketId, this.resolveForm.value.resolution).subscribe({
      next: (t) => { this.ticket = t; this.actionLoading = false; this.resolveForm.reset(); },
      error: (err: HttpErrorResponse) => {
        this.actionError  = err.error?.message ?? 'Erro ao resolver ticket.';
        this.actionLoading = false;
      },
    });
  }

  onEscalate(): void {
    if (this.escalateForm.invalid) return;
    this.actionLoading = true;
    this.actionError   = '';
    this.ticketSvc.escalate(this.ticketId, this.escalateForm.value.reason).subscribe({
      next: (t) => { this.ticket = t; this.actionLoading = false; this.escalateForm.reset(); },
      error: (err: HttpErrorResponse) => {
        this.actionError  = err.error?.message ?? 'Erro ao escalar ticket.';
        this.actionLoading = false;
      },
    });
  }

  onClose(): void {
    this.actionLoading = true;
    this.ticketSvc.close(this.ticketId).subscribe({
      next: (t) => { this.ticket = t; this.actionLoading = false; },
      error: (err: HttpErrorResponse) => {
        this.actionError  = err.error?.message ?? 'Erro ao fechar ticket.';
        this.actionLoading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  statusLabel(s: TicketStatus): string {
    const map: Record<TicketStatus, string> = {
      open: 'Aberto', in_progress: 'Em curso',
      escalated: 'Escalado', resolved: 'Resolvido', closed: 'Fechado',
    };
    return map[s] ?? s;
  }

  typeLabel(t: string): string {
    const map: Record<string, string> = {
      technical: 'Técnico', licensing: 'Licenciamento',
      billing: 'Pagamento', compliance: 'Conformidade', other: 'Outro',
    };
    return map[t] ?? t;
  }
}
