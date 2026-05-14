import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { RevenueAnalytics } from '../../../core/models';

@Component({
  selector: 'app-analytics-revenue',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">payments</mat-icon>
          <h1 class="page-title">Análise de Receita</h1>
        </div>
        <nav class="breadcrumb">
          <span>Analytics</span>
          <mat-icon class="bc-sep">chevron_right</mat-icon>
          <span>Receita</span>
        </nav>
      </div>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <div class="error-state" *ngIf="!loading && loadError">
      <mat-icon>error_outline</mat-icon>
      <p>Não foi possível carregar os dados de receita.</p>
      <button mat-stroked-button (click)="load()"><mat-icon>refresh</mat-icon> Tentar novamente</button>
    </div>

    <ng-container *ngIf="!loading && data">

      <!-- Resumo total -->
      <div class="stats-grid stats-grid-3">
        <mat-card class="stat-card">
          <mat-icon class="stat-card-icon">paid</mat-icon>
          <div class="stat-label">Receita Total</div>
          <div class="stat-number" style="font-size:36px">{{ data.allTime.total | number:'1.0-0' }}</div>
          <div class="stat-action">USD · {{ data.allTime.count }} transacções</div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon class="stat-card-icon">flag</mat-icon>
          <div class="stat-label">Top País</div>
          <div class="stat-number" style="font-size:24px;text-transform:capitalize">
            {{ topCountry?.country ?? '—' }}
          </div>
          <div class="stat-action" *ngIf="topCountry">
            {{ topCountry.total | number:'1.0-0' }} USD
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon class="stat-card-icon">star</mat-icon>
          <div class="stat-label">Top Produto</div>
          <div class="stat-number" style="font-size:18px;font-weight:500;line-height:1.3">
            {{ data.topProducts[0]?.name ?? '—' }}
          </div>
          <div class="stat-action" *ngIf="data.topProducts[0]">
            {{ data.topProducts[0].total | number:'1.0-0' }} USD
          </div>
        </mat-card>
      </div>

      <div class="revenue-grid">

        <!-- Por País -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Receita por País</p>
            <div class="metric-rows">
              <div class="metric-row" *ngFor="let c of data.byCountry | slice:0:6">
                <span class="metric-label" style="text-transform:capitalize">{{ c.country }}</span>
                <div class="metric-bar-wrap">
                  <div class="metric-bar" [style.width.%]="barPct(c.total, data.allTime.total)"></div>
                </div>
                <span class="metric-val">{{ c.total | number:'1.0-0' }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Top Produtos -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Top 5 Produtos por Receita</p>
            <table class="simple-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Unidades</th>
                  <th>Total (USD)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of data.topProducts">
                  <td>{{ p.name }}</td>
                  <td>{{ p.units }}</td>
                  <td><strong>{{ p.total | number:'1.0-0' }}</strong></td>
                </tr>
              </tbody>
            </table>
          </mat-card-content>
        </mat-card>

        <!-- Evolução Mensal -->
        <mat-card class="full-col">
          <mat-card-content class="card-section">
            <p class="card-section-title">Evolução Mensal (últimos 90 dias)</p>
            <div class="bar-chart">
              <div class="bar-col" *ngFor="let m of data.monthly">
                <div class="bar-value">{{ m.total | number:'1.0-0' }}</div>
                <div class="bar-body"
                     [style.height.%]="barPct(m.total, maxMonthly)"
                     [class.bar-active]="m.total > 0">
                </div>
                <div class="bar-label">{{ m.month }}</div>
              </div>
              <div class="bar-empty" *ngIf="data.monthly.length === 0">
                Sem dados para o período seleccionado.
              </div>
            </div>
          </mat-card-content>
        </mat-card>

      </div>
    </ng-container>
  `,
  styles: [`
    .revenue-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;
    }
    .full-col { grid-column: 1 / -1; }
    @media (max-width: 900px) { .revenue-grid { grid-template-columns: 1fr; } }

    .metric-rows { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
    .metric-row  { display: flex; align-items: center; gap: 10px; }
    .metric-label{ font-size: 13px; color: var(--gray-600); min-width: 110px; }
    .metric-val  { font-size: 13px; font-weight: 600; min-width: 60px; text-align: right; }
    .metric-bar-wrap { flex:1; height:6px; background:var(--gray-200); border-radius:3px; overflow:hidden; }
    .metric-bar  { height:100%; background:var(--black); border-radius:3px; transition:width .4s; min-width:2px; }

    .simple-table { width:100%; border-collapse:collapse; font-size:13px; }
    .simple-table th { text-align:left; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:var(--gray-500); padding:6px 8px; border-bottom:2px solid var(--gray-200); }
    .simple-table td { padding:8px 8px; border-bottom:1px solid var(--gray-100); }

    .bar-chart { display:flex; align-items:flex-end; gap:8px; height:180px; padding-top:24px; position:relative; }
    .bar-col { display:flex; flex-direction:column; align-items:center; flex:1; height:100%; }
    .bar-value { font-size:10px; color:var(--gray-500); margin-bottom:4px; white-space:nowrap; }
    .bar-body { width:100%; max-width:40px; background:var(--gray-200); border-radius:3px 3px 0 0; transition:height .4s; min-height:3px; }
    .bar-body.bar-active { background:var(--black); }
    .bar-label { font-size:10px; color:var(--gray-500); margin-top:6px; white-space:nowrap; }
    .bar-empty { color:var(--gray-500); font-size:13px; text-align:center; width:100%; }
  `],
})
export class AnalyticsRevenueComponent implements OnInit {
  data:      RevenueAnalytics | null = null;
  loading   = false;
  loadError = false;
  maxMonthly = 1;

  get topCountry() { return this.data?.byCountry.find(c => c.total > 0) ?? null; }

  constructor(private svc: AnalyticsService) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true; this.loadError = false;
    this.svc.getRevenue().subscribe({
      next: (d) => {
        this.data      = d;
        this.maxMonthly = Math.max(1, ...d.monthly.map(m => m.total));
        this.loading   = false;
      },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }

  barPct(v: number, total: number): number {
    if (!total) return 0;
    return Math.min(100, Math.round((v / total) * 100));
  }
}
