import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CompanyService } from '../../../../core/services/company.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Company, LicenseStatus, Role } from '../../../../core/models';

@Component({
  selector: 'app-companies-list',
  template: `
    <!-- Page header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">business</mat-icon>
          <h1 class="page-title">Empresas</h1>
        </div>
        <nav class="breadcrumb">
          <span>Dashboard</span>
          <mat-icon class="bc-sep">chevron_right</mat-icon>
          <span>Empresas</span>
        </nav>
      </div>
      <div class="page-actions">
        <span class="record-count">{{ filtered.length }} registo(s)</span>
        <button mat-raised-button color="primary"
                (click)="router.navigate(['/dashboard/' + role + '/companies/new'])">
          <mat-icon>add</mat-icon> Registar
        </button>
      </div>
    </div>

    <!-- Status filter -->
    <mat-button-toggle-group [(value)]="filterStatus" (change)="applyFilter()" class="mb-md">
      <mat-button-toggle value="">Todos</mat-button-toggle>
      <mat-button-toggle value="pending">Pendente</mat-button-toggle>
      <mat-button-toggle value="under_review">Em Revisão</mat-button-toggle>
      <mat-button-toggle value="active">Activa</mat-button-toggle>
      <mat-button-toggle value="rejected">Rejeitada</mat-button-toggle>
    </mat-button-toggle-group>

    <!-- Progress bar (above card) -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <!-- Table card -->
    <mat-card>
      <mat-card-content>

        <!-- Error state -->
        <div class="error-state" *ngIf="loadError">
          <mat-icon>error_outline</mat-icon>
          <p>Não foi possível carregar a lista de empresas. Verifique a sua ligação e tente novamente.</p>
          <button mat-stroked-button (click)="reload()">
            <mat-icon>refresh</mat-icon> Tentar novamente
          </button>
        </div>

        <!-- Table -->
        <table mat-table [dataSource]="filtered"
               *ngIf="!loading && !loadError"
               class="full-width">

          <!-- Nº column -->
          <ng-container matColumnDef="cd">
            <th mat-header-cell *matHeaderCellDef>Nº</th>
            <td mat-cell *matCellDef="let c"><strong>{{ c.cd }}</strong></td>
          </ng-container>

          <!-- Name column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let c">
              <span class="table-link">{{ c.name }}</span>
            </td>
          </ng-container>

          <!-- Country column -->
          <ng-container matColumnDef="country">
            <th mat-header-cell *matHeaderCellDef>País</th>
            <td mat-cell *matCellDef="let c">{{ c.country | titlecase }}</td>
          </ng-container>

          <!-- License status column -->
          <ng-container matColumnDef="licenseStatus">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let c">
              <app-status-badge [status]="c.licenseStatus"></app-status-badge>
            </td>
          </ng-container>

          <!-- Contact email column -->
          <ng-container matColumnDef="contactEmail">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let c">{{ c.contactEmail }}</td>
          </ng-container>

          <!-- Actions column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let c">
              <button mat-icon-button
                      (click)="$event.stopPropagation(); router.navigate(['/dashboard/' + role + '/companies', c.id])"
                      matTooltip="Ver detalhe da empresa"
                      aria-label="Ver detalhe">
                <mat-icon>open_in_new</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"
              (click)="router.navigate(['/dashboard/' + role + '/companies', row.id])"></tr>

          <!-- Empty state row -->
          <tr class="mat-mdc-row" *matNoDataRow>
            <td class="mat-mdc-cell" [attr.colspan]="cols.length">
              <div class="empty-state">
                <mat-icon class="empty-icon">business</mat-icon>
                <h3>Nenhuma empresa encontrada</h3>
                <p *ngIf="filterStatus">
                  Não existem empresas com o estado
                  "<strong>{{ filterStatus }}</strong>" neste momento.
                </p>
                <p *ngIf="!filterStatus">
                  Ainda não existe nenhuma empresa registada no sistema.
                </p>
                <button mat-stroked-button
                        (click)="router.navigate(['/dashboard/' + role + '/companies/new'])">
                  <mat-icon>add</mat-icon> Registar primeira empresa
                </button>
              </div>
            </td>
          </tr>
        </table>

      </mat-card-content>
    </mat-card>
  `,
})
export class CompaniesListComponent implements OnInit {
  companies: Company[] = [];
  filtered: Company[] = [];
  loading = false;
  loadError = false;
  role: Role | string = '';
  filterStatus = '';
  cols = ['cd', 'name', 'country', 'licenseStatus', 'contactEmail', 'actions'];

  constructor(public router: Router, private svc: CompanyService, private auth: AuthService) {}

  ngOnInit(): void {
    this.role = this.auth.getCurrentUser()?.role ?? '';
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.loadError = false;
    this.svc.getAll().subscribe({
      next: (data) => { this.companies = data; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }

  applyFilter(): void {
    this.filtered = this.filterStatus
      ? this.companies.filter((c) => c.licenseStatus === this.filterStatus)
      : this.companies;
  }
}
