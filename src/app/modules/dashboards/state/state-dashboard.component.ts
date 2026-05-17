import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CompanyService }       from '../../../core/services/company.service';
import { ProductService }       from '../../../core/services/product.service';
import { PriceProposalService } from '../../../core/services/price-proposal.service';
import { OrderService }         from '../../../core/services/order.service';
import { AuditLogService }      from '../../../core/services/audit-log.service';
import { AuthService }          from '../../../core/services/auth.service';
import { AuditLog }             from '../../../core/models';

@Component({
  selector: 'app-state-dashboard',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">dashboard</mat-icon>
          <h1 class="page-title">Dashboard</h1>
        </div>
        <nav class="breadcrumb">
          <span>Bom dia, <strong>{{ userName }}</strong></span>
          <mat-icon class="bc-sep">fiber_manual_record</mat-icon>
          <span class="text-muted">Autoridade Máxima · STATE</span>
        </nav>
      </div>
      <span class="text-muted text-sm nowrap">{{ today | date:'EEEE, d MMM yyyy' }}</span>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <!-- Stat cards -->
    <div class="stats-grid stats-grid-4">
      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/state/companies'])">
        <mat-icon class="stat-card-icon">business</mat-icon>
        <div class="stat-label">Empresas Pendentes</div>
        <div class="stat-number">{{ pending }}</div>
        <div class="stat-action">
          <mat-icon>arrow_forward</mat-icon> Ver empresas
        </div>
      </mat-card>

      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/state/products'])">
        <mat-icon class="stat-card-icon">inventory_2</mat-icon>
        <div class="stat-label">Produtos em Revisão</div>
        <div class="stat-number">{{ pendingProducts }}</div>
        <div class="stat-action">
          <mat-icon>arrow_forward</mat-icon> Ver produtos
        </div>
      </mat-card>

      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/state/price-proposals'])">
        <mat-icon class="stat-card-icon">price_change</mat-icon>
        <div class="stat-label">Propostas Submetidas</div>
        <div class="stat-number">{{ submittedProposals }}</div>
        <div class="stat-action">
          <mat-icon>arrow_forward</mat-icon> Ver propostas
        </div>
      </mat-card>

      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/state/orders'])">
        <mat-icon class="stat-card-icon">receipt_long</mat-icon>
        <div class="stat-label">Pedidos Bloqueados</div>
        <div class="stat-number">{{ blockedOrders }}</div>
        <div class="stat-action">
          <mat-icon>arrow_forward</mat-icon> Ver pedidos
        </div>
      </mat-card>
    </div>

    <!-- Últimas acções -->
    <mat-card>
      <mat-card-content class="card-section">
        <div class="section-header">
          <p class="card-section-title" style="margin:0">Últimas Acções no Sistema</p>
          <button mat-stroked-button (click)="router.navigate(['/dashboard/state/audit-logs'])">
            <mat-icon>history</mat-icon> Ver Audit Log completo
          </button>
        </div>

        <table mat-table [dataSource]="recentLogs" class="full-width mt-md">
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Data/Hora</th>
            <td mat-cell *matCellDef="let l"><span class="timestamp">{{ l.createdAt | date:'dd/MM HH:mm' }}</span></td>
          </ng-container>
          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef>Acção</th>
            <td mat-cell *matCellDef="let l"><strong>{{ l.action }}</strong></td>
          </ng-container>
          <ng-container matColumnDef="entity">
            <th mat-header-cell *matHeaderCellDef>Entidade</th>
            <td mat-cell *matCellDef="let l">{{ l.entity }}</td>
          </ng-container>
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Por</th>
            <td mat-cell *matCellDef="let l"><span class="role-chip">{{ l.role }}</span></td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="logCols"></tr>
          <tr mat-row *matRowDef="let row; columns: logCols"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .section-header { display:flex; justify-content:space-between; align-items:center; }
  `],
})
export class StateDashboardComponent implements OnInit {
  today = new Date();
  userName = '';
  pending = 0; pendingProducts = 0; submittedProposals = 0; blockedOrders = 0;
  recentLogs: AuditLog[] = [];
  loading = false;
  logCols = ['createdAt', 'action', 'entity', 'role'];

  constructor(
    public router: Router, private auth: AuthService,
    private companySvc: CompanyService, private productSvc: ProductService,
    private proposalSvc: PriceProposalService, private orderSvc: OrderService,
    private logSvc: AuditLogService,
  ) {}

  ngOnInit(): void {
    this.userName = this.auth.getCurrentUser()?.fullName ?? '';
    this.loading = true;
    forkJoin({
      companies: this.companySvc.getAll(),
      products:  this.productSvc.getAll(),
      proposals: this.proposalSvc.getAll(),
      orders:    this.orderSvc.getAll(),
      logs:      this.logSvc.getAll(),
    }).subscribe({
      next: (d) => {
        this.pending            = d.companies.filter((c) => ['pending','under_review'].includes(c.licenseStatus)).length;
        this.pendingProducts    = d.products.filter((p) => p.status === 'staff_validated').length;
        this.submittedProposals = d.proposals.filter((p) => p.status === 'submitted').length;
        this.blockedOrders      = d.orders.filter((o) => o.status === 'blocked').length;
        this.recentLogs         = d.logs.slice(0, 5);
        this.loading            = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
