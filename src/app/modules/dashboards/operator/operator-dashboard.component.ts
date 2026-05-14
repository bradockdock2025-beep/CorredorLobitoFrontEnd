import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ShipmentService } from '../../../core/services/shipment.service';
import { AuthService }     from '../../../core/services/auth.service';

@Component({
  selector: 'app-operator-dashboard',
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
          <span class="text-muted">Operador Logístico · OPERATOR</span>
        </nav>
      </div>
      <button mat-raised-button color="primary"
              (click)="router.navigate(['/dashboard/operator/shipments/new'])">
        <mat-icon>add</mat-icon> Criar Embarque
      </button>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <div class="stats-grid stats-grid-3">
      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/operator/shipments'])">
        <mat-icon class="stat-card-icon">local_shipping</mat-icon>
        <div class="stat-label">Embarques Criados</div>
        <div class="stat-number">{{ createdCount }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver embarques</div>
      </mat-card>

      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/operator/shipments'])">
        <mat-icon class="stat-card-icon">directions_car</mat-icon>
        <div class="stat-label">Em Trânsito</div>
        <div class="stat-number">{{ transitCount }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver em trânsito</div>
      </mat-card>

      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/operator/shipments'])">
        <mat-icon class="stat-card-icon">border_color</mat-icon>
        <div class="stat-label">Na Fronteira</div>
        <div class="stat-number">{{ borderCount }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver na fronteira</div>
      </mat-card>
    </div>
  `,
})
export class OperatorDashboardComponent implements OnInit {
  userName = ''; createdCount = 0; transitCount = 0; borderCount = 0; loading = false;

  constructor(public router: Router, private auth: AuthService, private svc: ShipmentService) {}

  ngOnInit(): void {
    this.userName = this.auth.getCurrentUser()?.fullName ?? '';
    this.loading = true;
    this.svc.getAll().subscribe({
      next: (d) => {
        this.createdCount = d.filter((s) => s.status === 'created').length;
        this.transitCount = d.filter((s) => s.status === 'in_transit').length;
        this.borderCount  = d.filter((s) => s.status === 'at_border').length;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
