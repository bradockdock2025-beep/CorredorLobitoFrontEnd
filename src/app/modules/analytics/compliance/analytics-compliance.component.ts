import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ComplianceScore, RiskLevel } from '../../../core/models';

@Component({
  selector: 'app-analytics-compliance',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">verified_user</mat-icon>
          <h1 class="page-title">Score de Conformidade</h1>
        </div>
        <nav class="breadcrumb">
          <span>Analytics</span>
          <mat-icon class="bc-sep">chevron_right</mat-icon>
          <span>Conformidade</span>
        </nav>
      </div>
      <span class="text-muted text-sm nowrap" *ngIf="data">
        {{ data.generatedAt | date:'dd/MM/yyyy HH:mm' }}
      </span>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <div class="error-state" *ngIf="!loading && loadError">
      <mat-icon>error_outline</mat-icon>
      <p>Não foi possível carregar o score de conformidade.</p>
      <button mat-stroked-button (click)="load()"><mat-icon>refresh</mat-icon> Tentar novamente</button>
    </div>

    <ng-container *ngIf="!loading && data">

      <!-- Score global -->
      <mat-card class="score-hero">
        <mat-card-content class="card-section">
          <div class="score-layout">
            <div class="score-circle" [class]="'risk-' + data.riskLevel.toLowerCase()">
              <div class="score-num">{{ data.overallScore }}</div>
              <div class="score-max">/100</div>
            </div>
            <div class="score-info">
              <div class="risk-badge" [class]="'risk-badge-' + data.riskLevel.toLowerCase()">
                {{ riskLabel(data.riskLevel) }}
              </div>
              <h2 class="score-title">Score Global de Conformidade</h2>
              <p class="score-desc">Média dos 4 domínios operacionais: Empresas · Pedidos · Transacções · Embarques</p>
              <div class="score-meta">
                <span>Actividade Audit (30d): <strong>{{ data.auditActivity.last30Days }}</strong></span>
                <span>Acções de bloqueio: <strong>{{ data.auditActivity.blockedActions30d }}</strong></span>
                <span>Taxa de alerta: <strong>{{ data.auditActivity.alertRate }}</strong></span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Scores por domínio -->
      <div class="domain-grid">

        <mat-card class="domain-card">
          <mat-card-content class="card-section">
            <div class="domain-header">
              <mat-icon>business</mat-icon>
              <span class="card-section-title" style="margin:0">Empresas</span>
              <span class="domain-score">{{ data.scores.companies.score }}<span class="domain-score-max">/100</span></span>
            </div>
            <mat-progress-bar mode="determinate" [value]="data.scores.companies.score" class="domain-bar"></mat-progress-bar>
            <div class="domain-stats">
              <span>Total: {{ data.scores.companies.total }}</span>
              <span>Suspensas: {{ data.scores.companies.suspended }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="domain-card">
          <mat-card-content class="card-section">
            <div class="domain-header">
              <mat-icon>receipt_long</mat-icon>
              <span class="card-section-title" style="margin:0">Pedidos</span>
              <span class="domain-score">{{ data.scores.orders.score }}<span class="domain-score-max">/100</span></span>
            </div>
            <mat-progress-bar mode="determinate" [value]="data.scores.orders.score" class="domain-bar"></mat-progress-bar>
            <div class="domain-stats">
              <span>Total: {{ data.scores.orders.total }}</span>
              <span>Bloqueados: {{ data.scores.orders.blocked }}</span>
              <span>Cancelados: {{ data.scores.orders.cancelled }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="domain-card">
          <mat-card-content class="card-section">
            <div class="domain-header">
              <mat-icon>payments</mat-icon>
              <span class="card-section-title" style="margin:0">Transacções</span>
              <span class="domain-score">{{ data.scores.transactions.score }}<span class="domain-score-max">/100</span></span>
            </div>
            <mat-progress-bar mode="determinate" [value]="data.scores.transactions.score" class="domain-bar"></mat-progress-bar>
            <div class="domain-stats">
              <span>Total: {{ data.scores.transactions.total }}</span>
              <span>Bloqueadas: {{ data.scores.transactions.blocked }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="domain-card">
          <mat-card-content class="card-section">
            <div class="domain-header">
              <mat-icon>local_shipping</mat-icon>
              <span class="card-section-title" style="margin:0">Embarques</span>
              <span class="domain-score">{{ data.scores.shipments.score }}<span class="domain-score-max">/100</span></span>
            </div>
            <mat-progress-bar mode="determinate" [value]="data.scores.shipments.score" class="domain-bar"></mat-progress-bar>
            <div class="domain-stats">
              <span>Total: {{ data.scores.shipments.total }}</span>
              <span>Retidos: {{ data.scores.shipments.held }}</span>
              <span>Rejeitados: {{ data.scores.shipments.rejected }}</span>
            </div>
          </mat-card-content>
        </mat-card>

      </div>
    </ng-container>
  `,
  styles: [`
    .score-hero { margin-bottom: 20px; }
    .score-layout { display:flex; gap:32px; align-items:center; flex-wrap:wrap; }

    .score-circle {
      width: 120px; height: 120px; border-radius: 50%;
      display: flex; flex-direction: column; align-items:center; justify-content:center;
      background: #1a1a1a; color: #fff; flex-shrink: 0;
    }
    .score-circle.risk-medium { background: #424242; }
    .score-circle.risk-high   { background: #616161; }
    .score-circle.risk-critical { background: #757575; }

    .score-num  { font-size: 42px; font-weight: 300; line-height: 1; }
    .score-max  { font-size: 14px; color: rgba(255,255,255,.6); }

    .score-info { flex: 1; }
    .score-title { font-size: 18px; font-weight: 500; margin: 8px 0 4px; }
    .score-desc { font-size: 13px; color: var(--gray-600); margin-bottom: 12px; }
    .score-meta { display:flex; flex-wrap:wrap; gap:16px; font-size:13px; color:var(--gray-600); }

    .risk-badge {
      display: inline-block; padding: 3px 12px;
      border-radius: 12px; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.8px;
    }
    .risk-badge-low      { background: #1a1a1a; color: #fff; }
    .risk-badge-medium   { background: #424242; color: #fff; }
    .risk-badge-high     { background: #616161; color: #fff; }
    .risk-badge-critical { background: #9e9e9e; color: #fff; }

    .domain-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:16px; }
    @media (max-width:900px) { .domain-grid { grid-template-columns:1fr; } }

    .domain-header { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
    .domain-header mat-icon { color: var(--gray-500); font-size:18px; width:18px; height:18px; }
    .domain-score { margin-left:auto; font-size:22px; font-weight:500; color:var(--black); }
    .domain-score-max { font-size:13px; color:var(--gray-500); font-weight:400; }

    .domain-bar { margin-bottom: 10px; }
    .domain-stats { display:flex; flex-wrap:wrap; gap:12px; font-size:12px; color:var(--gray-600); }
  `],
})
export class AnalyticsComplianceComponent implements OnInit {
  data:      ComplianceScore | null = null;
  loading   = false;
  loadError = false;

  private readonly RISK_LABELS: Record<RiskLevel, string> = {
    LOW:      'Risco Baixo',
    MEDIUM:   'Risco Médio',
    HIGH:     'Risco Alto',
    CRITICAL: 'Risco Crítico',
  };

  constructor(private svc: AnalyticsService) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true; this.loadError = false;
    this.svc.getComplianceScore().subscribe({
      next: (d) => { this.data = d; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }

  riskLabel(level: RiskLevel): string { return this.RISK_LABELS[level] ?? level; }
}
