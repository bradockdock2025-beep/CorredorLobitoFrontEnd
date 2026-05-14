import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ShipmentService } from '../../../../core/services/shipment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Shipment, Role } from '../../../../core/models';

@Component({
  selector: 'app-shipments-list',
  template: `
    <!-- Page header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">local_shipping</mat-icon>
          <h1 class="page-title">Embarques</h1>
        </div>
        <nav class="breadcrumb">
          <span>Dashboard</span>
          <mat-icon class="bc-sep">chevron_right</mat-icon>
          <span>Embarques</span>
        </nav>
      </div>
      <div class="page-actions">
        <span class="record-count">{{ shipments.length }} registo(s)</span>
        <button mat-raised-button color="primary"
                *ngIf="role === 'operator'"
                (click)="router.navigate(['/dashboard/operator/shipments/new'])">
          <mat-icon>add</mat-icon> Criar Embarque
        </button>
      </div>
    </div>

    <!-- Progress bar (above card) -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <!-- Table card -->
    <mat-card>
      <mat-card-content>

        <!-- Error state -->
        <div class="error-state" *ngIf="loadError">
          <mat-icon>error_outline</mat-icon>
          <p>Não foi possível carregar os embarques. Verifique a sua ligação e tente novamente.</p>
          <button mat-stroked-button (click)="reload()">
            <mat-icon>refresh</mat-icon> Tentar novamente
          </button>
        </div>

        <!-- Table -->
        <table mat-table [dataSource]="shipments"
               *ngIf="!loading && !loadError"
               class="full-width">

          <!-- Nº column -->
          <ng-container matColumnDef="cd">
            <th mat-header-cell *matHeaderCellDef>Nº</th>
            <td mat-cell *matCellDef="let s"><strong>{{ s.cd }}</strong></td>
          </ng-container>

          <!-- Route column -->
          <ng-container matColumnDef="route">
            <th mat-header-cell *matHeaderCellDef>Rota</th>
            <td mat-cell *matCellDef="let s" class="nowrap">
              <strong>{{ s.origin }}</strong>&nbsp;→&nbsp;{{ s.destination }}
            </td>
          </ng-container>

          <!-- Status column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let s">
              <app-status-badge [status]="s.status"></app-status-badge>
            </td>
          </ng-container>

          <!-- Last location column -->
          <ng-container matColumnDef="lastLocation">
            <th mat-header-cell *matHeaderCellDef>Última Localização</th>
            <td mat-cell *matCellDef="let s">{{ s.lastLocation ?? '—' }}</td>
          </ng-container>

          <!-- ETA column -->
          <ng-container matColumnDef="eta">
            <th mat-header-cell *matHeaderCellDef>ETA</th>
            <td mat-cell *matCellDef="let s">
              <span *ngIf="s.eta" class="timestamp">{{ s.eta | date:'dd/MM/yyyy' }}</span>
              <span *ngIf="!s.eta" class="text-muted">—</span>
            </td>
          </ng-container>

          <!-- Actions column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let s">
              <button mat-icon-button
                      (click)="$event.stopPropagation(); router.navigate(['/dashboard/' + role + '/shipments', s.id])"
                      matTooltip="Ver detalhe"
                      aria-label="Ver detalhe">
                <mat-icon>open_in_new</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"
              (click)="router.navigate(['/dashboard/' + role + '/shipments', row.id])"></tr>

          <!-- Empty state row -->
          <tr class="mat-mdc-row" *matNoDataRow>
            <td class="mat-mdc-cell" [attr.colspan]="cols.length">
              <div class="empty-state">
                <mat-icon class="empty-icon">local_shipping</mat-icon>
                <h3>Nenhum embarque encontrado</h3>
                <p *ngIf="role === 'operator'">
                  Ainda não existe nenhum embarque registado. Crie o primeiro registo de embarque para iniciar o rastreamento.
                </p>
                <p *ngIf="role !== 'operator'">
                  Ainda não existem embarques registados no sistema.
                </p>
                <button mat-stroked-button
                        *ngIf="role === 'operator'"
                        (click)="router.navigate(['/dashboard/operator/shipments/new'])">
                  <mat-icon>add</mat-icon> Criar primeiro embarque
                </button>
              </div>
            </td>
          </tr>
        </table>

      </mat-card-content>
    </mat-card>
  `,
})
export class ShipmentsListComponent implements OnInit {
  shipments: Shipment[] = [];
  loading = false;
  loadError = false;
  role: Role | string = '';
  cols = ['cd', 'route', 'status', 'lastLocation', 'eta', 'actions'];

  constructor(public router: Router, private svc: ShipmentService, private auth: AuthService) {}

  ngOnInit(): void {
    this.role = this.auth.getCurrentUser()?.role ?? '';
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.loadError = false;
    this.svc.getAll().subscribe({
      next: (d) => { this.shipments = d; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }
}
