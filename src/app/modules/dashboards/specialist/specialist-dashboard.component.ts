import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PriceProposalService } from '../../../core/services/price-proposal.service';
import { AuthService }          from '../../../core/services/auth.service';

@Component({
  selector: 'app-specialist-dashboard',
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
          <span class="text-muted">Especialista de Preços · SPECIALIST</span>
        </nav>
      </div>
      <button mat-raised-button color="primary"
              (click)="router.navigate(['/dashboard/specialist/price-proposals/new'])">
        <mat-icon>add</mat-icon> Nova Price Proposal
      </button>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <div class="stats-grid stats-grid-3">
      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/specialist/price-proposals'])">
        <mat-icon class="stat-card-icon">edit_note</mat-icon>
        <div class="stat-label">Propostas em Rascunho</div>
        <div class="stat-number">{{ draftCount }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver rascunhos</div>
      </mat-card>

      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/specialist/price-proposals'])">
        <mat-icon class="stat-card-icon">send</mat-icon>
        <div class="stat-label">Submetidas (aguardam STATE)</div>
        <div class="stat-number">{{ submittedCount }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver submetidas</div>
      </mat-card>

      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/specialist/price-proposals'])">
        <mat-icon class="stat-card-icon">verified</mat-icon>
        <div class="stat-label">Aprovadas</div>
        <div class="stat-number">{{ approvedCount }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver aprovadas</div>
      </mat-card>
    </div>
  `,
})
export class SpecialistDashboardComponent implements OnInit {
  userName = ''; draftCount = 0; submittedCount = 0; approvedCount = 0; loading = false;

  constructor(public router: Router, private auth: AuthService, private svc: PriceProposalService) {}

  ngOnInit(): void {
    this.userName = this.auth.getCurrentUser()?.fullName ?? '';
    this.loading = true;
    this.svc.getMyProposals().subscribe({
      next: (d) => {
        this.draftCount     = d.filter((p) => p.status === 'draft').length;
        this.submittedCount = d.filter((p) => p.status === 'submitted').length;
        this.approvedCount  = d.filter((p) => p.status === 'approved').length;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
