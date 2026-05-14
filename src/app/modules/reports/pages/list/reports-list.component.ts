import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReportsService } from '../../../../core/services/reports.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Report, Role } from '../../../../core/models';

@Component({
  selector: 'app-reports-list',
  template: `
    <!-- Page header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">description</mat-icon>
          <h1 class="page-title">Relatórios</h1>
        </div>
        <nav class="breadcrumb">
          <span>Dashboard</span>
          <mat-icon class="bc-sep">chevron_right</mat-icon>
          <span>Relatórios</span>
        </nav>
      </div>
      <div class="page-actions">
        <span class="record-count">{{ reports.length }} registo(s)</span>
        <button mat-raised-button color="primary"
                *ngIf="canCreate"
                (click)="router.navigate(['/dashboard/' + role + '/reports/new'])">
          <mat-icon>add</mat-icon> Novo Relatório
        </button>
      </div>
    </div>

    <!-- Progress bar -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <!-- Table card -->
    <mat-card>
      <mat-card-content>

        <!-- Error state -->
        <div class="error-state" *ngIf="loadError && !loading">
          <mat-icon>error_outline</mat-icon>
          <p>Não foi possível carregar os relatórios. Verifique a sua ligação e tente novamente.</p>
          <button mat-stroked-button (click)="reload()">
            <mat-icon>refresh</mat-icon> Tentar novamente
          </button>
        </div>

        <!-- Table -->
        <table mat-table [dataSource]="reports"
               *ngIf="!loading && !loadError"
               class="full-width">

          <!-- Nº column -->
          <ng-container matColumnDef="cd">
            <th mat-header-cell *matHeaderCellDef>Nº</th>
            <td mat-cell *matCellDef="let r">
              <span class="id-text">{{ r.cd }}</span>
            </td>
          </ng-container>

          <!-- Title column -->
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Título</th>
            <td mat-cell *matCellDef="let r" style="font-weight:500">{{ r.title }}</td>
          </ng-container>

          <!-- Type column -->
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Tipo</th>
            <td mat-cell *matCellDef="let r">{{ r.type | titlecase }}</td>
          </ng-container>

          <!-- Status column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let r">
              <app-status-badge [status]="r.status"></app-status-badge>
            </td>
          </ng-container>

          <!-- Author column -->
          <ng-container matColumnDef="author">
            <th mat-header-cell *matHeaderCellDef>Autor</th>
            <td mat-cell *matCellDef="let r">{{ r.author?.fullName ?? '—' }}</td>
          </ng-container>

          <!-- Published At column -->
          <ng-container matColumnDef="publishedAt">
            <th mat-header-cell *matHeaderCellDef>Publicado em</th>
            <td mat-cell *matCellDef="let r">
              <span *ngIf="r.publishedAt" class="timestamp">{{ r.publishedAt | date:'dd/MM/yyyy' }}</span>
              <span *ngIf="!r.publishedAt" class="text-muted">—</span>
            </td>
          </ng-container>

          <!-- Actions column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r">
              <button mat-icon-button
                      (click)="$event.stopPropagation(); router.navigate(['/dashboard/' + role + '/reports', r.id])"
                      matTooltip="Ver detalhe"
                      aria-label="Ver detalhe">
                <mat-icon>open_in_new</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"
              (click)="router.navigate(['/dashboard/' + role + '/reports', row.id])"></tr>

          <!-- Empty state row -->
          <tr class="mat-mdc-row" *matNoDataRow>
            <td class="mat-mdc-cell" [attr.colspan]="cols.length">
              <div class="empty-state">
                <mat-icon class="empty-icon">description</mat-icon>
                <h3>Nenhum relatório encontrado</h3>
                <p *ngIf="canCreate">
                  Ainda não existe nenhum relatório registado. Crie o primeiro relatório.
                </p>
                <p *ngIf="!canCreate">
                  Ainda não existem relatórios registados no sistema.
                </p>
                <button mat-stroked-button
                        *ngIf="canCreate"
                        (click)="router.navigate(['/dashboard/' + role + '/reports/new'])">
                  <mat-icon>add</mat-icon> Criar primeiro relatório
                </button>
              </div>
            </td>
          </tr>
        </table>

      </mat-card-content>
    </mat-card>
  `,
})
export class ReportsListComponent implements OnInit {
  reports: Report[] = [];
  loading = false;
  loadError = false;
  role: Role | string = '';
  canCreate = false;
  cols = ['cd', 'title', 'type', 'status', 'author', 'publishedAt', 'actions'];

  private readonly CREATE_ROLES: Role[] = ['analyst', 'specialist', 'compliance'];
  private readonly MY_REPORTS_ROLES: Role[] = ['analyst', 'specialist', 'compliance'];

  constructor(
    public router: Router,
    private reportsService: ReportsService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    this.role = user?.role ?? '';
    this.canCreate = this.CREATE_ROLES.includes(this.role as Role);
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.loadError = false;

    const obs$ = this.MY_REPORTS_ROLES.includes(this.role as Role)
      ? this.reportsService.getMyReports()
      : this.reportsService.getAll();

    obs$.subscribe({
      next: (data) => { this.reports = data; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }
}
