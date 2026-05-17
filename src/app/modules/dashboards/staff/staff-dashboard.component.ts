import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CompanyService } from '../../../core/services/company.service';
import { ProductService } from '../../../core/services/product.service';
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
      <span class="text-muted text-sm nowrap">{{ today | date:'EEEE, d MMM yyyy' }}</span>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <div class="stats-grid stats-grid-4">

      <!-- Empresas a validar (pending) -->
      <mat-card class="stat-card" (click)="goTo('companies', 'pending')">
        <mat-icon class="stat-card-icon">pending_actions</mat-icon>
        <div class="stat-label">Empresas — Validar Docs</div>
        <div class="stat-number">{{ companiesPending }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Validar documentação</div>
      </mat-card>

      <!-- Empresas a encaminhar (under_review) -->
      <mat-card class="stat-card" (click)="goTo('companies', 'under_review')">
        <mat-icon class="stat-card-icon">send</mat-icon>
        <div class="stat-label">Empresas — Encaminhar ao STATE</div>
        <div class="stat-number">{{ companiesUnderReview }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Encaminhar</div>
      </mat-card>

      <!-- Produtos a validar tecnicamente (pending_review) -->
      <mat-card class="stat-card" (click)="goTo('products', 'pending_review')">
        <mat-icon class="stat-card-icon">engineering</mat-icon>
        <div class="stat-label">Produtos — Validar Especificações</div>
        <div class="stat-number">{{ productsPendingReview }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Validar técnico</div>
      </mat-card>

      <!-- Produtos a encaminhar (staff_validated) -->
      <mat-card class="stat-card" (click)="goTo('products', 'staff_validated')">
        <mat-icon class="stat-card-icon">inventory_2</mat-icon>
        <div class="stat-label">Produtos — Encaminhar ao STATE</div>
        <div class="stat-number">{{ productsValidated }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Encaminhar</div>
      </mat-card>

    </div>
  `,
})
export class StaffDashboardComponent implements OnInit {
  today    = new Date();
  userName = '';
  loading  = false;

  companiesPending    = 0;
  companiesUnderReview = 0;
  productsPendingReview = 0;
  productsValidated    = 0;

  constructor(
    public router: Router,
    private auth: AuthService,
    private companySvc: CompanyService,
    private productSvc: ProductService,
  ) {}

  ngOnInit(): void {
    this.userName = this.auth.getCurrentUser()?.fullName ?? '';
    this.loading  = true;

    forkJoin({
      companies: this.companySvc.getAll(),
      products:  this.productSvc.getAll(),
    }).subscribe({
      next: (d) => {
        this.companiesPending     = d.companies.filter((c) => c.licenseStatus === 'pending').length;
        this.companiesUnderReview = d.companies.filter((c) => c.licenseStatus === 'under_review').length;
        this.productsPendingReview = d.products.filter((p) => p.status === 'pending_review').length;
        this.productsValidated    = d.products.filter((p) => p.status === 'staff_validated').length;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  goTo(section: string, filter?: string): void {
    this.router.navigate([`/dashboard/staff/${section}`]);
  }
}
