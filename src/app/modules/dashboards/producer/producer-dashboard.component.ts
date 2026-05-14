import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { AuthService }    from '../../../core/services/auth.service';

@Component({
  selector: 'app-producer-dashboard',
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
          <span class="text-muted">Produtor · PRODUCER</span>
        </nav>
      </div>
      <button mat-raised-button color="primary"
              (click)="router.navigate(['/dashboard/producer/products/new'])">
        <mat-icon>add</mat-icon> Criar Produto
      </button>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <div class="stats-grid stats-grid-3">
      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/producer/products'])">
        <mat-icon class="stat-card-icon">edit_note</mat-icon>
        <div class="stat-label">Produtos em Rascunho</div>
        <div class="stat-number">{{ draftCount }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver rascunhos</div>
      </mat-card>

      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/producer/products'])">
        <mat-icon class="stat-card-icon">hourglass_empty</mat-icon>
        <div class="stat-label">Em Revisão (aguardam STATE)</div>
        <div class="stat-number">{{ reviewCount }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver em revisão</div>
      </mat-card>

      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/producer/products'])">
        <mat-icon class="stat-card-icon">verified</mat-icon>
        <div class="stat-label">Publicados Oficialmente</div>
        <div class="stat-number">{{ publishedCount }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Ver publicados</div>
      </mat-card>
    </div>
  `,
})
export class ProducerDashboardComponent implements OnInit {
  userName = ''; draftCount = 0; reviewCount = 0; publishedCount = 0; loading = false;

  constructor(public router: Router, private auth: AuthService, private svc: ProductService) {}

  ngOnInit(): void {
    this.userName = this.auth.getCurrentUser()?.fullName ?? '';
    this.loading = true;
    this.svc.getMyProducts().subscribe({
      next: (d) => {
        this.draftCount     = d.filter((p) => p.status === 'draft').length;
        this.reviewCount    = d.filter((p) => p.status === 'pending_review').length;
        this.publishedCount = d.filter((p) => p.status === 'published_official').length;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
