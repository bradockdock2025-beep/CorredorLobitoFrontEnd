import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { LogisticsPerformance } from '../../../core/models';

@Component({
  selector: 'app-analytics-logistics',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">local_shipping</mat-icon>
          <h1 class="page-title">Performance Logística</h1>
        </div>
        <nav class="breadcrumb">
          <span>Analytics</span>
          <mat-icon class="bc-sep">chevron_right</mat-icon>
          <span>Logística</span>
        </nav>
      </div>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <div class="error-state" *ngIf="!loading && loadError">
      <mat-icon>error_outline</mat-icon>
      <p>Não foi possível carregar os dados de logística.</p>
      <button mat-stroked-button (click)="load()"><mat-icon>refresh</mat-icon> Tentar novamente</button>
    </div>

    <ng-container *ngIf="!loading && data">

      <div class="stats-grid stats-grid-3">
        <mat-card class="stat-card">
          <mat-icon class="stat-card-icon">local_shipping</mat-icon>
          <div class="stat-label">Total de Embarques</div>
          <div class="stat-number">{{ data.shipments.total }}</div>
          <div class="stat-action"><mat-icon>trending_up</mat-icon> {{ data.shipments.approvalRate }} aprovados</div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon class="stat-card-icon">check_circle</mat-icon>
          <div class="stat-label">Aprovados pela Alfândega</div>
          <div class="stat-number">{{ data.customs.approved }}</div>
          <div class="stat-action"><mat-icon>trending_up</mat-icon> {{ data.customs.approvalRate }} taxa</div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon class="stat-card-icon">pause_circle</mat-icon>
          <div class="stat-label">Retidos / Rejeitados</div>
          <div class="stat-number">{{ data.customs.held + data.customs.rejected }}</div>
          <div class="stat-action">{{ data.customs.held }} retidos · {{ data.customs.rejected }} rejeitados</div>
        </mat-card>
      </div>

      <div class="logistics-grid">

        <!-- Embarques por estado -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Embarques por Estado</p>
            <div class="metric-rows">
              <div class="metric-row" *ngFor="let s of shipmentStatuses">
                <span class="metric-label">{{ s.label }}</span>
                <div class="metric-bar-wrap">
                  <div class="metric-bar" [style.width.%]="barPct(s.value, data.shipments.total)"></div>
                </div>
                <span class="metric-val">{{ s.value }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Alfândega -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Despachos Aduaneiros</p>
            <div class="customs-summary">
              <div class="customs-row">
                <span>Total de despachos</span>
                <strong>{{ data.customs.total }}</strong>
              </div>
              <div class="customs-row">
                <span>Aprovados</span>
                <strong>{{ data.customs.approved }}</strong>
              </div>
              <div class="customs-row">
                <span>Pendentes</span>
                <strong>{{ data.customs.pending }}</strong>
              </div>
              <div class="customs-row">
                <span>Retidos</span>
                <strong>{{ data.customs.held }}</strong>
              </div>
              <div class="customs-row">
                <span>Rejeitados</span>
                <strong>{{ data.customs.rejected }}</strong>
              </div>
              <mat-divider class="mt-md"></mat-divider>
              <div class="customs-row mt-md">
                <span>Taxa de aprovação</span>
                <strong>{{ data.customs.approvalRate }}</strong>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Top Rotas -->
        <mat-card class="full-col">
          <mat-card-content class="card-section">
            <p class="card-section-title">Top Rotas por Volume</p>
            <div class="routes-list">
              <div class="route-row" *ngFor="let r of data.topRoutes; let i = index">
                <span class="route-rank">#{{ i + 1 }}</span>
                <mat-icon style="font-size:16px;width:16px;height:16px;flex-shrink:0">local_shipping</mat-icon>
                <span class="route-name">{{ r.route }}</span>
                <span class="route-count">{{ r.count }} embarque(s)</span>
              </div>
              <p class="text-muted text-sm" *ngIf="data.topRoutes.length === 0">
                Nenhuma rota registada.
              </p>
            </div>
          </mat-card-content>
        </mat-card>

      </div>
    </ng-container>
  `,
  styles: [`
    .logistics-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px; }
    .full-col { grid-column:1/-1; }
    @media (max-width:900px) { .logistics-grid { grid-template-columns:1fr; } }

    .metric-rows { display:flex; flex-direction:column; gap:10px; margin-top:8px; }
    .metric-row  { display:flex; align-items:center; gap:10px; }
    .metric-label{ font-size:13px; color:var(--gray-600); min-width:140px; }
    .metric-val  { font-size:13px; font-weight:600; min-width:28px; text-align:right; }
    .metric-bar-wrap { flex:1; height:6px; background:var(--gray-200); border-radius:3px; overflow:hidden; }
    .metric-bar  { height:100%; background:var(--black); border-radius:3px; transition:width .4s; min-width:2px; }

    .customs-summary { display:flex; flex-direction:column; gap:10px; }
    .customs-row { display:flex; justify-content:space-between; font-size:14px; }
    .customs-row span { color:var(--gray-700); }

    .routes-list { display:flex; flex-direction:column; gap:10px; }
    .route-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--gray-100); }
    .route-rank { font-size:11px; font-weight:700; color:var(--gray-400); min-width:24px; }
    .route-name { flex:1; font-size:13px; color:var(--black); }
    .route-count { font-size:12px; font-weight:600; color:var(--gray-600); white-space:nowrap; }
  `],
})
export class AnalyticsLogisticsComponent implements OnInit {
  data:      LogisticsPerformance | null = null;
  loading   = false;
  loadError = false;

  shipmentStatuses: Array<{label: string; value: number}> = [];

  constructor(private svc: AnalyticsService) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true; this.loadError = false;
    this.svc.getLogisticsPerformance().subscribe({
      next: (d) => {
        this.data = d;
        const s = d.shipments.byStatus;
        this.shipmentStatuses = [
          { label: 'Aprovados Alfândega', value: s['customs_approved'] ?? 0 },
          { label: 'Em Trânsito',         value: s['in_transit']       ?? 0 },
          { label: 'Na Fronteira',        value: s['at_border']        ?? 0 },
          { label: 'Criados',             value: s['created']          ?? 0 },
          { label: 'Retidos',             value: s['held']             ?? 0 },
          { label: 'Rejeitados',          value: s['customs_rejected'] ?? 0 },
          { label: 'Entregues',           value: s['delivered']        ?? 0 },
        ];
        this.loading = false;
      },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }

  barPct(v: number, total: number): number {
    if (!total) return 0;
    return Math.min(100, Math.round((v / total) * 100));
  }
}
