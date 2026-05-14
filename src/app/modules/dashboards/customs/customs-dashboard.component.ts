import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ShipmentService } from '../../../core/services/shipment.service';
import { AuthService }     from '../../../core/services/auth.service';

@Component({
  selector: 'app-customs-dashboard',
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
          <span class="text-muted">Alfândega · CUSTOMS</span>
        </nav>
      </div>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <div class="stats-grid stats-grid-3">
      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/customs/shipments'])">
        <mat-icon class="stat-card-icon">border_style</mat-icon>
        <div class="stat-label">Na Fronteira (pendentes)</div>
        <div class="stat-number">{{ borderCount }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver pendentes</div>
      </mat-card>

      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/customs/shipments'])">
        <mat-icon class="stat-card-icon">check_circle</mat-icon>
        <div class="stat-label">Aprovados Alfândega</div>
        <div class="stat-number">{{ approvedCount }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver aprovados</div>
      </mat-card>

      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/customs/shipments'])">
        <mat-icon class="stat-card-icon">pause_circle</mat-icon>
        <div class="stat-label">Retidos</div>
        <div class="stat-number">{{ heldCount }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver retidos</div>
      </mat-card>
    </div>
  `,
})
export class CustomsDashboardComponent implements OnInit {
  userName = ''; borderCount = 0; approvedCount = 0; heldCount = 0; loading = false;

  constructor(public router: Router, private auth: AuthService, private svc: ShipmentService) {}

  ngOnInit(): void {
    this.userName = this.auth.getCurrentUser()?.fullName ?? '';
    this.loading = true;
    this.svc.getAll().subscribe({
      next: (d) => {
        this.borderCount   = d.filter((s) => s.status === 'at_border').length;
        this.approvedCount = d.filter((s) => s.status === 'customs_approved').length;
        this.heldCount     = d.filter((s) => s.status === 'held').length;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
