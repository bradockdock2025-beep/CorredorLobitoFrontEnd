import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService }       from '../../../core/services/auth.service';
import { DashboardOverview } from '../../../core/models';

@Component({
  selector: 'app-compliance-dashboard',
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
          <span class="text-muted">Conformidade · COMPLIANCE</span>
        </nav>
      </div>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <div class="stats-grid stats-grid-3" *ngIf="data">
      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/compliance/analytics'])">
        <mat-icon class="stat-card-icon">business</mat-icon>
        <div class="stat-label">Empresas Activas</div>
        <div class="stat-number">{{ data.companies['active'] ?? 0 }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver overview</div>
      </mat-card>
      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/compliance/analytics/logistics'])">
        <mat-icon class="stat-card-icon">local_shipping</mat-icon>
        <div class="stat-label">Embarques</div>
        <div class="stat-number">{{ data.shipments['customs_approved'] ?? 0 }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver logística</div>
      </mat-card>
      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/compliance/analytics/compliance'])">
        <mat-icon class="stat-card-icon">verified_user</mat-icon>
        <div class="stat-label">Score Conformidade</div>
        <div class="stat-number">—</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver score</div>
      </mat-card>
    </div>
  `,
})
export class ComplianceDashboardComponent implements OnInit {
  userName = '';
  data:    DashboardOverview | null = null;
  loading  = false;

  constructor(public router: Router, private auth: AuthService, private svc: AnalyticsService) {}

  ngOnInit(): void {
    this.userName = this.auth.getCurrentUser()?.fullName ?? '';
    this.loading  = true;
    this.svc.getDashboardOverview().subscribe({
      next: (d) => { this.data = d; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
