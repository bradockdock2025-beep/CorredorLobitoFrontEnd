import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService }      from '../../../core/services/auth.service';
import { DashboardOverview, DashboardMetrics } from '../../../core/models';

@Component({
  selector: 'app-analytics-overview',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">dashboard</mat-icon>
          <h1 class="page-title">Dashboard Analítico</h1>
        </div>
        <nav class="breadcrumb">
          <span>Analytics</span>
          <mat-icon class="bc-sep">chevron_right</mat-icon>
          <span>Visão Geral</span>
        </nav>
      </div>
      <span class="text-muted text-sm nowrap" *ngIf="metrics">
        Actualizado: {{ metrics.generatedAt | date:'dd/MM/yyyy HH:mm' }}
      </span>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <div class="error-state" *ngIf="!loading && loadError">
      <mat-icon>error_outline</mat-icon>
      <p>Não foi possível carregar os dados. Tente novamente.</p>
      <button mat-stroked-button (click)="load()"><mat-icon>refresh</mat-icon> Tentar novamente</button>
    </div>

    <ng-container *ngIf="!loading && overview && metrics">

      <!-- ── Métricas principais ──────────────────────────────────── -->
      <div class="stats-grid stats-grid-4">
        <mat-card class="stat-card">
          <mat-icon class="stat-card-icon">business</mat-icon>
          <div class="stat-label">Empresas Activas</div>
          <div class="stat-number">{{ metrics.companies.active }}</div>
          <div class="stat-action">
            <mat-icon>trending_up</mat-icon>
            {{ metrics.companies.approvalRate }} taxa aprovação
          </div>
        </mat-card>

        <mat-card class="stat-card">
          <mat-icon class="stat-card-icon">inventory_2</mat-icon>
          <div class="stat-label">Produtos Publicados</div>
          <div class="stat-number">{{ metrics.products.published }}</div>
          <div class="stat-action">
            <mat-icon>trending_up</mat-icon>
            {{ metrics.products.publishRate }} taxa publicação
          </div>
        </mat-card>

        <mat-card class="stat-card">
          <mat-icon class="stat-card-icon">payments</mat-icon>
          <div class="stat-label">Receita Total (USD)</div>
          <div class="stat-number" style="font-size:32px">{{ metrics.revenue.allTime.total | number:'1.0-0' }}</div>
          <div class="stat-action">
            <mat-icon>receipt_long</mat-icon>
            {{ metrics.revenue.allTime.count }} transacções
          </div>
        </mat-card>

        <mat-card class="stat-card">
          <mat-icon class="stat-card-icon">local_shipping</mat-icon>
          <div class="stat-label">Embarques Aprovados</div>
          <div class="stat-number">{{ metrics.shipments.approved }}</div>
          <div class="stat-action">
            <mat-icon>trending_up</mat-icon>
            {{ metrics.shipments.approvalRate }} taxa aprovação
          </div>
        </mat-card>
      </div>

      <!-- ── Linha 2 — Detalhes por domínio ──────────────────────── -->
      <div class="analytics-grid">

        <!-- Empresas -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Empresas por Estado</p>
            <div class="metric-rows">
              <div class="metric-row" *ngFor="let s of companyStatuses">
                <span class="metric-label">{{ s.label }}</span>
                <div class="metric-bar-wrap">
                  <div class="metric-bar" [style.width.%]="barPct(s.value, metrics.companies.total)"></div>
                </div>
                <span class="metric-val">{{ s.value }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Pedidos -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Pedidos por Estado</p>
            <div class="metric-rows">
              <div class="metric-row" *ngFor="let s of orderStatuses">
                <span class="metric-label">{{ s.label }}</span>
                <div class="metric-bar-wrap">
                  <div class="metric-bar" [style.width.%]="barPct(s.value, metrics.orders.total)"></div>
                </div>
                <span class="metric-val">{{ s.value }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Receita últimos 30 dias -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Receita — Últimos 30 Dias</p>
            <div class="big-metric">
              <div class="big-number">{{ metrics.revenue.last30Days.total | number:'1.0-0' }}</div>
              <div class="big-label">USD</div>
            </div>
            <div class="metric-sub">{{ metrics.revenue.last30Days.count }} pedidos pagos</div>
            <mat-divider class="mt-md"></mat-divider>
            <div class="metric-row mt-md">
              <span class="metric-label">Média por transacção</span>
              <span class="metric-val">{{ metrics.revenue.allTime.average | number:'1.0-0' }} USD</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Máximo registado</span>
              <span class="metric-val">{{ metrics.revenue.allTime.max | number:'1.0-0' }} USD</span>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Actividade Audit (7d) -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Actividade Audit Log</p>
            <div class="big-metric">
              <div class="big-number">{{ metrics.auditActivity.last7Days }}</div>
              <div class="big-label">acções nos últimos 7 dias</div>
            </div>
            <mat-divider class="mt-md"></mat-divider>
            <div class="metric-row mt-md">
              <span class="metric-label">Total de registos</span>
              <span class="metric-val">{{ overview.auditLogs.total }}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Embarques retidos</span>
              <span class="metric-val">{{ metrics.shipments.held }}</span>
            </div>
          </mat-card-content>
        </mat-card>

      </div>

    </ng-container>
  `,
  styles: [`
    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-top: 20px;
    }
    @media (max-width: 900px) { .analytics-grid { grid-template-columns: 1fr; } }

    .metric-rows { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
    .metric-row  { display: flex; align-items: center; gap: 10px; }
    .metric-label{ font-size: 13px; color: var(--gray-600); min-width: 120px; }
    .metric-val  { font-size: 13px; font-weight: 600; color: var(--black); min-width: 32px; text-align: right; }
    .metric-bar-wrap {
      flex: 1;
      height: 6px;
      background: var(--gray-200);
      border-radius: 3px;
      overflow: hidden;
    }
    .metric-bar {
      height: 100%;
      background: var(--black);
      border-radius: 3px;
      transition: width 0.4s ease;
      min-width: 2px;
    }
    .big-metric { display: flex; align-items: baseline; gap: 8px; margin: 12px 0 4px; }
    .big-number  { font-size: 42px; font-weight: 300; color: var(--black); line-height: 1; }
    .big-label   { font-size: 13px; color: var(--gray-500); }
    .metric-sub  { font-size: 12px; color: var(--gray-500); }
  `],
})
export class AnalyticsOverviewComponent implements OnInit {
  overview: DashboardOverview | null = null;
  metrics:  DashboardMetrics  | null = null;
  loading   = false;
  loadError = false;

  companyStatuses: Array<{label: string; value: number}> = [];
  orderStatuses:   Array<{label: string; value: number}> = [];

  constructor(private svc: AnalyticsService, private auth: AuthService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading   = true;
    this.loadError = false;
    forkJoin({
      overview: this.svc.getDashboardOverview(),
      metrics:  this.svc.getDashboardMetrics(),
    }).subscribe({
      next: ({ overview, metrics }) => {
        this.overview = overview;
        this.metrics  = metrics;
        this.companyStatuses = [
          { label: 'Activas',     value: overview.companies['active']       ?? 0 },
          { label: 'Pendentes',   value: overview.companies['pending']      ?? 0 },
          { label: 'Em Revisão',  value: overview.companies['under_review'] ?? 0 },
          { label: 'Suspensas',   value: overview.companies['suspended']    ?? 0 },
          { label: 'Rejeitadas',  value: overview.companies['rejected']     ?? 0 },
        ];
        this.orderStatuses = [
          { label: 'Pagos',       value: overview.orders['paid']       ?? 0 },
          { label: 'Rascunho',    value: overview.orders['draft']      ?? 0 },
          { label: 'Bloqueados',  value: overview.orders['blocked']    ?? 0 },
          { label: 'Cancelados',  value: overview.orders['cancelled']  ?? 0 },
        ];
        this.loading = false;
      },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }

  barPct(value: number, total: number): number {
    if (!total) return 0;
    return Math.min(100, Math.round((value / total) * 100));
  }
}
