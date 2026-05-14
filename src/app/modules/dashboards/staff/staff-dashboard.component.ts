import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CompanyService } from '../../../core/services/company.service';
import { AuthService }    from '../../../core/services/auth.service';

@Component({
  selector: 'app-staff-dashboard',
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
          <span class="text-muted">Técnico de Validação · STAFF</span>
        </nav>
      </div>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <div class="stats-grid stats-grid-2">
      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/staff/companies'])">
        <mat-icon class="stat-card-icon">pending_actions</mat-icon>
        <div class="stat-label">Empresas Pendentes (para validar)</div>
        <div class="stat-number">{{ pendingCount }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Validar documentação</div>
      </mat-card>

      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/staff/companies'])">
        <mat-icon class="stat-card-icon">hourglass_empty</mat-icon>
        <div class="stat-label">Em Revisão (aguardam STATE)</div>
        <div class="stat-number">{{ underReviewCount }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver empresas</div>
      </mat-card>
    </div>
  `,
})
export class StaffDashboardComponent implements OnInit {
  userName = ''; pendingCount = 0; underReviewCount = 0; loading = false;

  constructor(public router: Router, private auth: AuthService, private svc: CompanyService) {}

  ngOnInit(): void {
    this.userName = this.auth.getCurrentUser()?.fullName ?? '';
    this.loading = true;
    this.svc.getAll().subscribe({
      next: (d) => {
        this.pendingCount     = d.filter((c) => c.licenseStatus === 'pending').length;
        this.underReviewCount = d.filter((c) => c.licenseStatus === 'under_review').length;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
