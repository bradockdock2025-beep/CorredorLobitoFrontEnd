import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { AuthService }  from '../../../core/services/auth.service';

@Component({
  selector: 'app-buyer-dashboard',
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
          <span class="text-muted">Comprador · BUYER</span>
        </nav>
      </div>
      <button mat-raised-button color="primary"
              (click)="router.navigate(['/dashboard/buyer/orders/new'])">
        <mat-icon>add</mat-icon> Criar Pedido
      </button>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <div class="stats-grid stats-grid-3">
      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/buyer/orders'])">
        <mat-icon class="stat-card-icon">receipt_long</mat-icon>
        <div class="stat-label">Pedidos em Rascunho</div>
        <div class="stat-number">{{ draftCount }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver rascunhos</div>
      </mat-card>

      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/buyer/orders'])">
        <mat-icon class="stat-card-icon">payment</mat-icon>
        <div class="stat-label">Pedidos Pagos</div>
        <div class="stat-number">{{ paidCount }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver pedidos pagos</div>
      </mat-card>

      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/buyer/orders'])">
        <mat-icon class="stat-card-icon">block</mat-icon>
        <div class="stat-label">Pedidos Bloqueados</div>
        <div class="stat-number">{{ blockedCount }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver bloqueados</div>
      </mat-card>
    </div>
  `,
})
export class BuyerDashboardComponent implements OnInit {
  userName = ''; draftCount = 0; paidCount = 0; blockedCount = 0; loading = false;

  constructor(public router: Router, private auth: AuthService, private svc: OrderService) {}

  ngOnInit(): void {
    this.userName = this.auth.getCurrentUser()?.fullName ?? '';
    this.loading = true;
    this.svc.getMyOrders().subscribe({
      next: (d) => {
        this.draftCount   = d.filter((o) => o.status === 'draft').length;
        this.paidCount    = d.filter((o) => o.status === 'paid').length;
        this.blockedCount = d.filter((o) => o.status === 'blocked').length;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
