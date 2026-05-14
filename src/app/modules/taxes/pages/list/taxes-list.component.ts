import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TaxService } from '../../../../core/services/tax.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Tax, formatRate } from '../../../../core/models';

@Component({
  selector: 'app-taxes-list',
  template: `
    <!-- Page header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">account_balance</mat-icon>
          <h1 class="page-title">Regras Fiscais</h1>
        </div>
        <nav class="breadcrumb">
          <span>Dashboard</span>
          <mat-icon class="bc-sep">chevron_right</mat-icon>
          <span>Impostos</span>
        </nav>
      </div>
      <div class="page-actions">
        <span class="record-count">{{ taxes.length }} registo(s)</span>
        <button mat-raised-button color="primary"
                *ngIf="role === 'state'"
                (click)="router.navigate(['/dashboard/state/taxes/new'])">
          <mat-icon>add</mat-icon> Nova Regra
        </button>
      </div>
    </div>

    <!-- Info banner -->
    <div class="info-banner">
      <mat-icon>info</mat-icon>
      As taxas são aplicadas automaticamente no pagamento de pedidos. O sistema usa a taxa do país
      da empresa compradora. Se não houver taxa específica, aplica-se a taxa global (15%).
    </div>

    <!-- Progress bar (above card) -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <!-- Table card -->
    <mat-card>
      <mat-card-content>

        <!-- Error state -->
        <div class="error-state" *ngIf="loadError">
          <mat-icon>error_outline</mat-icon>
          <p>Não foi possível carregar as regras fiscais. Verifique a sua ligação e tente novamente.</p>
          <button mat-stroked-button (click)="reload()">
            <mat-icon>refresh</mat-icon> Tentar novamente
          </button>
        </div>

        <!-- Table -->
        <table mat-table [dataSource]="taxes"
               *ngIf="!loading && !loadError"
               class="full-width">

          <!-- Nº column -->
          <ng-container matColumnDef="cd">
            <th mat-header-cell *matHeaderCellDef>Nº</th>
            <td mat-cell *matCellDef="let t"><strong>{{ t.cd }}</strong></td>
          </ng-container>

          <!-- Name column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let t">
              <span class="table-link">{{ t.name }}</span>
            </td>
          </ng-container>

          <!-- Country column -->
          <ng-container matColumnDef="country">
            <th mat-header-cell *matHeaderCellDef>País</th>
            <td mat-cell *matCellDef="let t">{{ t.country | titlecase }}</td>
          </ng-container>

          <!-- Category column -->
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Categoria</th>
            <td mat-cell *matCellDef="let t">{{ t.category }}</td>
          </ng-container>

          <!-- Rate column -->
          <ng-container matColumnDef="rate">
            <th mat-header-cell *matHeaderCellDef>Taxa</th>
            <td mat-cell *matCellDef="let t" class="nowrap">
              <strong>{{ formatRate(t.rate) }}</strong>
            </td>
          </ng-container>

          <!-- Effective from column -->
          <ng-container matColumnDef="effectiveFrom">
            <th mat-header-cell *matHeaderCellDef>Vigência</th>
            <td mat-cell *matCellDef="let t" class="nowrap">
              <span class="timestamp">
                {{ t.effectiveFrom | date:'dd/MM/yyyy' }}
                <ng-container *ngIf="t.effectiveTo">
                  &nbsp;→&nbsp;{{ t.effectiveTo | date:'dd/MM/yyyy' }}
                </ng-container>
                <ng-container *ngIf="!t.effectiveTo">&nbsp;→&nbsp;∞</ng-container>
              </span>
            </td>
          </ng-container>

          <!-- Is active column -->
          <ng-container matColumnDef="isActive">
            <th mat-header-cell *matHeaderCellDef>Activa</th>
            <td mat-cell *matCellDef="let t">
              <mat-icon [class.text-muted]="!t.isActive">
                {{ t.isActive ? 'check_circle' : 'cancel' }}
              </mat-icon>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"
              (click)="router.navigate(['/dashboard/' + role + '/taxes', row.id])"></tr>

          <!-- Empty state row -->
          <tr class="mat-mdc-row" *matNoDataRow>
            <td class="mat-mdc-cell" [attr.colspan]="cols.length">
              <div class="empty-state">
                <mat-icon class="empty-icon">account_balance</mat-icon>
                <h3>Nenhuma regra fiscal encontrada</h3>
                <p *ngIf="role === 'state'">
                  Ainda não existem regras fiscais configuradas. Crie a primeira regra para activar a tributação automática nos pedidos.
                </p>
                <p *ngIf="role !== 'state'">
                  Ainda não existem regras fiscais configuradas no sistema.
                </p>
                <button mat-stroked-button
                        *ngIf="role === 'state'"
                        (click)="router.navigate(['/dashboard/state/taxes/new'])">
                  <mat-icon>add</mat-icon> Criar primeira regra fiscal
                </button>
              </div>
            </td>
          </tr>
        </table>

      </mat-card-content>
    </mat-card>
  `,
})
export class TaxesListComponent implements OnInit {
  taxes: Tax[] = [];
  loading = false;
  loadError = false;
  role: string = '';
  cols = ['cd', 'name', 'country', 'category', 'rate', 'effectiveFrom', 'isActive'];
  readonly formatRate = formatRate;

  constructor(public router: Router, private svc: TaxService, private auth: AuthService) {}

  ngOnInit(): void {
    this.role = this.auth.getCurrentUser()?.role ?? '';
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.loadError = false;
    this.svc.getAll().subscribe({
      next: (d) => { this.taxes = d; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }
}
