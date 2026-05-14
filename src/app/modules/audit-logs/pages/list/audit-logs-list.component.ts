import { Component, OnInit } from '@angular/core';
import { AuditLogService } from '../../../../core/services/audit-log.service';
import { AuditLog } from '../../../../core/models';

@Component({
  selector: 'app-audit-logs-list',
  template: `
    <!-- Page header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">history</mat-icon>
          <h1 class="page-title">Audit Log</h1>
        </div>
        <nav class="breadcrumb">
          <span>Dashboard</span>
          <mat-icon class="bc-sep">chevron_right</mat-icon>
          <span>Audit Log</span>
        </nav>
      </div>
      <div class="page-actions">
        <span class="record-count">{{ logs.length }} registo(s)</span>
      </div>
    </div>

    <!-- Info banner (read-only notice) -->
    <div class="info-banner">
      <mat-icon>lock</mat-icon>
      Apenas leitura — registo imutável de todas as acções realizadas no sistema.
    </div>

    <!-- Entity filter -->
    <mat-form-field appearance="outline" class="mb-md">
      <mat-label>Filtrar por Entidade</mat-label>
      <mat-select [(value)]="filterEntity" (selectionChange)="load()">
        <mat-option value="">Todas</mat-option>
        <mat-option value="company">Empresa</mat-option>
        <mat-option value="product">Produto</mat-option>
        <mat-option value="price_proposal">Proposta de Preço</mat-option>
        <mat-option value="order">Pedido</mat-option>
        <mat-option value="shipment">Embarque</mat-option>
      </mat-select>
    </mat-form-field>

    <!-- Progress bar (above card) -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <!-- Log card -->
    <mat-card>
      <mat-card-content>

        <!-- Error state -->
        <div class="error-state" *ngIf="loadError">
          <mat-icon>error_outline</mat-icon>
          <p>Não foi possível carregar o audit log. Verifique a sua ligação e tente novamente.</p>
          <button mat-stroked-button (click)="load()">
            <mat-icon>refresh</mat-icon> Tentar novamente
          </button>
        </div>

        <!-- Accordion log list -->
        <mat-accordion *ngIf="!loading && !loadError && logs.length > 0" multi="false">
          <mat-expansion-panel *ngFor="let l of logs">

            <mat-expansion-panel-header>
              <mat-panel-title class="log-panel-header">
                <strong class="id-text">{{ l.cd }}</strong>
                <span class="timestamp">{{ l.createdAt | date:'dd/MM HH:mm:ss' }}</span>
                <strong class="log-action-text">{{ l.action }}</strong>
                <span class="log-entity-text">{{ l.entity }}</span>
                <span class="role-chip">{{ l.role }}</span>
              </mat-panel-title>
            </mat-expansion-panel-header>

            <!-- Panel body -->
            <div class="detail-grid mb-md">
              <div class="detail-field">
                <label>Entidade / ID</label>
                <span>{{ l.entity }}&nbsp;/&nbsp;<span class="id-text">{{ l.entityId }}</span></span>
              </div>
              <div class="detail-field">
                <label>Utilizador</label>
                <span class="id-text">{{ l.userId }}</span>
              </div>
              <div class="detail-field">
                <label>Data / Hora</label>
                <span class="timestamp">{{ l.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</span>
              </div>
            </div>

            <ng-container *ngIf="l.beforeJson">
              <p class="card-section-title">Antes</p>
              <pre class="log-json">{{ formatJson(l.beforeJson) }}</pre>
            </ng-container>

            <ng-container *ngIf="l.afterJson">
              <p class="card-section-title mt-md">Depois</p>
              <pre class="log-json">{{ formatJson(l.afterJson) }}</pre>
            </ng-container>

          </mat-expansion-panel>
        </mat-accordion>

        <!-- Empty state -->
        <div class="empty-state" *ngIf="!loading && !loadError && logs.length === 0">
          <mat-icon class="empty-icon">history</mat-icon>
          <h3>Nenhum registo encontrado</h3>
          <p *ngIf="filterEntity">
            Não existem entradas de audit log para a entidade
            "<strong>{{ filterEntity }}</strong>" com os filtros actuais.
          </p>
          <p *ngIf="!filterEntity">
            Ainda não foram registadas acções no sistema.
          </p>
        </div>

      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .log-json {
      background: var(--gray-100);
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-sm);
      padding: 12px;
      font-size: 12px;
      font-family: 'Courier New', monospace;
      overflow-x: auto;
      max-height: 200px;
      margin: 0;
    }
  `],
})
export class AuditLogsListComponent implements OnInit {
  logs: AuditLog[] = [];
  loading = false;
  loadError = false;
  filterEntity = '';

  constructor(private svc: AuditLogService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.loadError = false;
    const filters = this.filterEntity ? { entity: this.filterEntity } : undefined;
    this.svc.getAll(filters).subscribe({
      next: (d) => { this.logs = d; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }

  formatJson(raw: string): string {
    try { return JSON.stringify(JSON.parse(raw), null, 2); }
    catch { return raw; }
  }
}
