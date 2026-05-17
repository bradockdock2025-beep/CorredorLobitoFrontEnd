import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TransactionService } from '../../../../core/services/transaction.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Transaction, Role, toNumber } from '../../../../core/models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-transaction-detail',
  template: `
    <!-- ── Progress bar — always rendered while loading ─────────────── -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading" class="detail-progress"></mat-progress-bar>

    <!-- ── Skeleton loading ──────────────────────────────────────────── -->
    <ng-container *ngIf="loading && !tx">
      <div class="detail-header">
        <div class="detail-title-group">
          <nav class="breadcrumb">
            <span>Transacções</span>
            <mat-icon class="bc-sep">chevron_right</mat-icon>
            <span>A carregar…</span>
          </nav>
          <div class="detail-title-row">
            <mat-icon class="page-icon">payment</mat-icon>
            <div class="sk sk-title"></div>
          </div>
        </div>
      </div>
      <div class="detail-2col">
        <mat-card>
          <mat-card-content class="card-section">
            <div class="sk sk-label"></div>
            <div class="detail-grid">
              <div class="sk sk-field" *ngFor="let i of [1,2,3,4,5,6]"></div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-content class="card-section">
            <div class="sk sk-label"></div>
            <div class="sk sk-field" *ngFor="let i of [1,2,3,4]"></div>
          </mat-card-content>
        </mat-card>
      </div>
    </ng-container>

    <!-- ── Error state ───────────────────────────────────────────────── -->
    <div class="error-state" *ngIf="!loading && !tx && loadError">
      <mat-icon>error_outline</mat-icon>
      <p>Não foi possível carregar a transacção. Verifique a sua ligação e tente novamente.</p>
      <button mat-stroked-button (click)="reload()">
        <mat-icon>refresh</mat-icon> Tentar novamente
      </button>
    </div>

    <!-- ── Real content ──────────────────────────────────────────────── -->
    <ng-container *ngIf="tx">

      <!-- ── Header ─────────────────────────────────────────────────── -->
      <div class="detail-header">
        <div class="detail-title-group">
          <nav class="breadcrumb">
            <a (click)="back()">Transacções</a>
            <mat-icon class="bc-sep">chevron_right</mat-icon>
            <span>{{ tx.cd }}</span>
          </nav>
          <div class="detail-title-row">
            <mat-icon class="page-icon">payment</mat-icon>
            <h1 class="detail-title">{{ tx.cd }}</h1>
            <app-status-badge [status]="tx.status"></app-status-badge>
          </div>
        </div>

        <!-- ── Actions — STATE only ───────────────────────────────── -->
        <div class="detail-actions" *ngIf="role === 'state'">
          <button mat-raised-button
                  *ngIf="tx.status === 'completed'"
                  (click)="block()">
            <mat-icon>block</mat-icon> Bloquear
          </button>
          <button mat-raised-button
                  *ngIf="tx.status === 'completed' || tx.status === 'blocked'"
                  (click)="cancel()">
            <mat-icon>cancel</mat-icon> Cancelar
          </button>
        </div>
      </div>

      <!-- ── Two-column content ──────────────────────────────────────── -->
      <div class="detail-2col">

        <!-- Card 1: Transaction details -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Detalhes da Transacção</p>
            <div class="detail-grid">

              <div class="detail-field">
                <label>Nº Transacção</label>
                <span class="id-text">{{ tx.cd }}</span>
              </div>

              <div class="detail-field">
                <label>Pedido</label>
                <span class="id-text">{{ tx.order?.cd ?? '—' }}</span>
              </div>

              <div class="detail-field">
                <label>Valor</label>
                <span class="nowrap">{{ toNumber(tx.amount) | number:'1.2-2' }} USD</span>
              </div>

              <div class="detail-field">
                <label>Moeda</label>
                <span>{{ tx.currency }}</span>
              </div>

              <div class="detail-field">
                <label>Método</label>
                <span>{{ tx.method | titlecase }}</span>
              </div>

              <div class="detail-field">
                <label>Estado</label>
                <app-status-badge [status]="tx.status"></app-status-badge>
              </div>

            </div>
          </mat-card-content>
        </mat-card>

        <!-- Card 2: Dates and state -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Datas e Estado</p>
            <div class="detail-grid">

              <div class="detail-field">
                <label>Data de Pagamento</label>
                <span *ngIf="tx.paidAt" class="timestamp">{{ tx.paidAt | date:'dd/MM/yyyy HH:mm' }}</span>
                <span *ngIf="!tx.paidAt" class="text-muted">—</span>
              </div>

              <div class="detail-field">
                <label>Bloqueada em</label>
                <span *ngIf="tx.blockedAt" class="timestamp">{{ tx.blockedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                <span *ngIf="!tx.blockedAt" class="text-muted">—</span>
              </div>

              <div class="detail-field">
                <label>Motivo do Bloqueio</label>
                <span *ngIf="tx.blockedReason">{{ tx.blockedReason }}</span>
                <span *ngIf="!tx.blockedReason" class="text-muted">—</span>
              </div>

              <div class="detail-field">
                <label>Cancelada em</label>
                <span *ngIf="tx.cancelledAt" class="timestamp">{{ tx.cancelledAt | date:'dd/MM/yyyy HH:mm' }}</span>
                <span *ngIf="!tx.cancelledAt" class="text-muted">—</span>
              </div>

            </div>
          </mat-card-content>
        </mat-card>

      </div>
    </ng-container>

    <!-- ── Not found ─────────────────────────────────────────────────── -->
    <div *ngIf="!loading && !tx && !loadError" class="empty-state">
      <mat-icon class="empty-icon">payments</mat-icon>
      <h3>Transacção não encontrada</h3>
      <p>O registo que procura não existe ou foi removido.</p>
      <button mat-stroked-button (click)="back()">
        <mat-icon>arrow_back</mat-icon> Voltar à lista
      </button>
    </div>
  `,
  styles: [`
    .detail-progress { position: sticky; top: 0; z-index: 10; margin-bottom: 16px; }

    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position:  400px 0; }
    }
    .sk {
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s infinite linear;
      border-radius: 4px;
    }
    .sk-title  { height: 28px; width: 240px; }
    .sk-label  { height: 12px; width: 120px; margin-bottom: 20px; }
    .sk-field  { height: 44px; margin-bottom: 16px; }
  `],
})
export class TransactionDetailComponent implements OnInit {
  tx: Transaction | null = null;
  loading = false;
  loadError = false;
  role: Role | string = '';
  readonly toNumber = toNumber;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private transactionSvc: TransactionService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.role = this.auth.getCurrentUser()?.role ?? '';
    this.reload();
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading = true;
    this.loadError = false;
    this.transactionSvc.getById(id).subscribe({
      next: (t) => { this.tx = t; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }

  back(): void {
    this.router.navigate([`/dashboard/${this.role}/transactions`]);
  }

  private open(data: ConfirmDialogData) {
    return this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(
      ConfirmDialogComponent,
      { data },
    );
  }

  block(): void {
    this.open({
      title: 'Bloquear Transacção',
      message: 'Indique o motivo do bloqueio:',
      inputLabel: 'Motivo',
      inputRequired: true,
      confirmText: 'Bloquear',
    }).afterClosed().subscribe((reason: string) => {
      if (!reason) return;
      this.loading = true;
      this.transactionSvc.block(this.tx!.id, reason).subscribe({
        next: (t) => {
          this.tx = t;
          this.loading = false;
          this.snack.open('Transacção bloqueada', 'Fechar', { duration: 3000 });
        },
        error: (e) => {
          this.loading = false;
          this.snack.open(e?.error?.message ?? 'Erro ao bloquear', 'Fechar', { duration: 3000 });
        },
      });
    });
  }

  cancel(): void {
    this.open({
      title: 'Cancelar Transacção',
      message: 'Tem a certeza que pretende cancelar esta transacção?',
      inputLabel: 'Motivo (opcional)',
      confirmText: 'Cancelar',
    }).afterClosed().subscribe((result) => {
      if (result === undefined) return;
      const reason = typeof result === 'string' ? result : '';
      this.loading = true;
      this.transactionSvc.cancel(this.tx!.id).subscribe({
        next: (t) => {
          this.tx = t;
          this.loading = false;
          this.snack.open('Transacção cancelada', 'Fechar', { duration: 3000 });
        },
        error: (e) => {
          this.loading = false;
          this.snack.open(e?.error?.message ?? 'Erro ao cancelar', 'Fechar', { duration: 3000 });
        },
      });
    });
  }
}
