import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TransactionService } from '../../../../core/services/transaction.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Transaction, TransactionSummary, Role, toNumber } from '../../../../core/models';

@Component({
  selector: 'app-transactions-list',
  template: `
    <!-- ── Page header ──────────────────────────────────────────────── -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">payments</mat-icon>
          <h1 class="page-title">Transacções</h1>
        </div>
        <nav class="breadcrumb">
          <span>Dashboard</span>
          <mat-icon class="bc-sep">chevron_right</mat-icon>
          <span>Transacções</span>
        </nav>
      </div>
      <div class="page-actions">
        <span class="record-count">{{ transactions.length }} registo(s)</span>
      </div>
    </div>

    <!-- ── Progress bar ─────────────────────────────────────────────── -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <!-- ── Summary banner ───────────────────────────────────────────── -->
    <div class="info-banner" *ngIf="summary">
      <mat-icon>info</mat-icon>
      <span>
        <strong>Resumo:</strong>
        Concluídas: <strong>{{ summary.counts['completed'] }}</strong>
        &nbsp;·&nbsp;
        Pendentes: <strong>{{ summary.counts['pending'] }}</strong>
        &nbsp;·&nbsp;
        Bloqueadas: <strong>{{ summary.counts['blocked'] }}</strong>
        &nbsp;·&nbsp;
        Canceladas: <strong>{{ summary.counts['cancelled'] }}</strong>
        &nbsp;·&nbsp;
        Reembolsadas: <strong>{{ summary.counts['refunded'] }}</strong>
        <ng-container *ngIf="summary.amounts['completed']">
          &nbsp;·&nbsp;
          Total concluído: <strong>{{ toNumber(summary.amounts['completed']) | number:'1.2-2' }} USD</strong>
        </ng-container>
      </span>
    </div>

    <!-- ── Table card ───────────────────────────────────────────────── -->
    <mat-card>
      <mat-card-content>

        <!-- Error state -->
        <div class="error-state" *ngIf="loadError">
          <mat-icon>error_outline</mat-icon>
          <p>Não foi possível carregar as transacções. Verifique a sua ligação e tente novamente.</p>
          <button mat-stroked-button (click)="reload()">
            <mat-icon>refresh</mat-icon> Tentar novamente
          </button>
        </div>

        <!-- Table -->
        <table mat-table [dataSource]="transactions"
               *ngIf="!loading && !loadError"
               class="full-width">

          <!-- Nº column -->
          <ng-container matColumnDef="cd">
            <th mat-header-cell *matHeaderCellDef>Nº</th>
            <td mat-cell *matCellDef="let t">
              <strong class="id-text">{{ t.cd }}</strong>
            </td>
          </ng-container>

          <!-- Order column -->
          <ng-container matColumnDef="orderId">
            <th mat-header-cell *matHeaderCellDef>Pedido</th>
            <td mat-cell *matCellDef="let t">
              <span class="id-text">{{ t.order?.cd ?? '—' }}</span>
            </td>
          </ng-container>

          <!-- Amount column -->
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Valor</th>
            <td mat-cell *matCellDef="let t" class="nowrap">
              {{ toNumber(t.amount) | number:'1.2-2' }}&nbsp;{{ t.currency }}
            </td>
          </ng-container>

          <!-- Method column -->
          <ng-container matColumnDef="method">
            <th mat-header-cell *matHeaderCellDef>Método</th>
            <td mat-cell *matCellDef="let t">{{ t.method | titlecase }}</td>
          </ng-container>

          <!-- Status column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let t">
              <app-status-badge [status]="t.status"></app-status-badge>
            </td>
          </ng-container>

          <!-- Paid at column -->
          <ng-container matColumnDef="paidAt">
            <th mat-header-cell *matHeaderCellDef>Data Pagamento</th>
            <td mat-cell *matCellDef="let t">
              <span *ngIf="t.paidAt" class="timestamp">{{ t.paidAt | date:'dd/MM/yyyy HH:mm' }}</span>
              <span *ngIf="!t.paidAt" class="text-muted">—</span>
            </td>
          </ng-container>

          <!-- Actions column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let t">
              <button mat-icon-button
                      (click)="$event.stopPropagation(); router.navigate(['/dashboard/' + role + '/transactions', t.id])"
                      matTooltip="Ver detalhe da transacção"
                      aria-label="Ver detalhe">
                <mat-icon>open_in_new</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"
              (click)="router.navigate(['/dashboard/' + role + '/transactions', row.id])"></tr>

          <!-- Empty state row -->
          <tr class="mat-mdc-row" *matNoDataRow>
            <td class="mat-mdc-cell" [attr.colspan]="cols.length">
              <div class="empty-state">
                <mat-icon class="empty-icon">payments</mat-icon>
                <h3>Nenhuma transacção encontrada</h3>
                <p>Ainda não existem transacções registadas no sistema.</p>
              </div>
            </td>
          </tr>
        </table>

      </mat-card-content>
    </mat-card>
  `,
})
export class TransactionsListComponent implements OnInit {
  transactions: Transaction[] = [];
  summary: TransactionSummary | null = null;
  loading = false;
  loadError = false;
  role: Role | string = '';
  cols = ['cd', 'orderId', 'amount', 'method', 'status', 'paidAt', 'actions'];
  readonly toNumber = toNumber;

  constructor(
    public router: Router,
    private transactionSvc: TransactionService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.role = this.auth.getCurrentUser()?.role ?? '';
    this.reload();
    this.loadSummary();
  }

  reload(): void {
    this.loading = true;
    this.loadError = false;
    this.transactionSvc.getAll().subscribe({
      next: (data) => { this.transactions = data; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }

  loadSummary(): void {
    this.transactionSvc.getSummary().subscribe({
      next: (s) => { this.summary = s; },
      error: () => { /* summary is optional — fail silently */ },
    });
  }
}
