import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShipmentService } from '../../../../core/services/shipment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Shipment, Role, ShipmentStatus } from '../../../../core/models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-shipments-list',
  styles: [`
    .filter-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 18px; height: 18px; border-radius: 50%;
      background: #c5221f; color: #fff;
      font-size: 10px; font-weight: 700; margin-left: 4px;
    }

    .customs-hint {
      display: flex; align-items: flex-start; gap: 10px;
      margin-bottom: 16px; padding: 12px 14px;
      border: 1px solid #ffe082; border-radius: 10px;
      background: #fff8e1; color: #5f4322;
    }
    .customs-hint mat-icon {
      color: #f9a825;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .customs-hint strong,
    .customs-hint span {
      display: block;
    }

    .row-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .row-actions button[mat-stroked-button],
    .row-actions button[mat-raised-button] {
      min-width: auto;
    }
    .row-actions .approve-btn {
      color: #2e7d32;
      border-color: #a5d6a7;
    }
    .row-actions .reject-btn {
      color: #c5221f;
      border-color: #ef9a9a;
    }
    .row-actions .hold-btn {
      color: #ef6c00;
      border-color: #ffcc80;
    }
  `],
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

    <!-- Status filter — customs vê at_border em destaque, state/staff vêem todos -->
    <mat-button-toggle-group [(value)]="filterStatus" (change)="onFilterChange()" class="mb-md"
                             *ngIf="role === 'customs' || role === 'state' || role === 'staff'">
      <mat-button-toggle value="">Todos</mat-button-toggle>
      <mat-button-toggle value="at_border">
        Na Fronteira
        <span class="filter-badge" *ngIf="countByStatus('at_border') > 0">{{ countByStatus('at_border') }}</span>
      </mat-button-toggle>
      <mat-button-toggle value="in_transit">Em Trânsito</mat-button-toggle>
      <mat-button-toggle value="customs_approved">Aprovados</mat-button-toggle>
      <mat-button-toggle value="held">Retidos</mat-button-toggle>
    </mat-button-toggle-group>

    <div class="customs-hint" *ngIf="role === 'customs'">
      <mat-icon>gavel</mat-icon>
      <div>
        <strong>Acções CUSTOMS disponíveis na lista</strong>
        <span><strong>Na Fronteira</strong> permite aprovar, rejeitar ou reter. <strong>Em Trânsito</strong> permite reter.</span>
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
        <table mat-table [dataSource]="filtered"
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
              <div class="row-actions">
                <button mat-stroked-button class="approve-btn"
                        *ngIf="canCustomsApprove(s)"
                        [disabled]="isProcessing(s.id)"
                        (click)="approveFromList($event, s)">
                  <mat-icon>check_circle</mat-icon> Aprovar
                </button>
                <button mat-stroked-button class="reject-btn"
                        *ngIf="canCustomsApprove(s)"
                        [disabled]="isProcessing(s.id)"
                        (click)="rejectFromList($event, s)">
                  <mat-icon>cancel</mat-icon> Rejeitar
                </button>
                <button mat-stroked-button class="hold-btn"
                        *ngIf="canCustomsHold(s)"
                        [disabled]="isProcessing(s.id)"
                        (click)="holdFromList($event, s)">
                  <mat-icon>pause</mat-icon> Reter
                </button>
                <button mat-icon-button
                        (click)="openDetail($event, s)"
                        matTooltip="Ver detalhe"
                        aria-label="Ver detalhe">
                  <mat-icon>open_in_new</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"
              (click)="openDetail($event, row)"></tr>

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
  shipments:    Shipment[] = [];
  filtered:     Shipment[] = [];
  filterStatus  = '';
  loading       = false;
  loadError     = false;
  actionShipmentId: string | null = null;
  role: Role | string = '';
  cols = ['cd', 'route', 'status', 'lastLocation', 'eta', 'actions'];
  private readonly allowedFilters: ShipmentStatus[] = ['at_border', 'in_transit', 'customs_approved', 'held'];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private svc: ShipmentService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.role = this.auth.getCurrentUser()?.role ?? '';
    const requestedStatus = this.route.snapshot.queryParamMap.get('status');
    this.filterStatus = this.resolveInitialFilter(requestedStatus);
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.loadError = false;
    const obs$ = this.role === 'operator' ? this.svc.getMyShipments() : this.svc.getAll();
    obs$.subscribe({
      next: (d) => { this.shipments = d; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }

  applyFilter(): void {
    this.filtered = this.filterStatus
      ? this.shipments.filter((s) => s.status === this.filterStatus)
      : this.shipments;
  }

  onFilterChange(): void {
    this.applyFilter();
    this.syncFilterQueryParam();
  }

  countByStatus(status: string): number {
    return this.shipments.filter((s) => s.status === status).length;
  }

  canCustomsApprove(shipment: Shipment): boolean {
    return this.role === 'customs' && shipment.status === 'at_border';
  }

  canCustomsHold(shipment: Shipment): boolean {
    return this.role === 'customs' && ['at_border', 'in_transit'].includes(shipment.status);
  }

  isProcessing(shipmentId: string): boolean {
    return this.actionShipmentId === shipmentId;
  }

  openDetail(event: Event, shipment: Shipment): void {
    event.stopPropagation();
    this.router.navigate([`/dashboard/${this.role}/shipments`, shipment.id]);
  }

  approveFromList(event: Event, shipment: Shipment): void {
    event.stopPropagation();
    this.openDialog({
      title: 'Aprovar Embarque',
      message: `Aprovar o embarque ${shipment.cd} na fronteira:`,
      inputLabel: 'Notas (opcional)',
      confirmText: 'Confirmar Aprovação',
    }).afterClosed().subscribe((result) => {
      if (result === undefined) return;
      const notes = typeof result === 'string' ? result : undefined;
      this.actionShipmentId = shipment.id;
      this.svc.approve(shipment.id, notes).subscribe({
        next: () => this.finishAction('Embarque aprovado pela alfândega.'),
        error: (e) => this.failAction(e?.error?.message ?? 'Erro ao aprovar embarque.'),
      });
    });
  }

  rejectFromList(event: Event, shipment: Shipment): void {
    event.stopPropagation();
    this.openDialog({
      title: 'Rejeitar Embarque',
      message: `Motivo da rejeição do embarque ${shipment.cd}:`,
      inputLabel: 'Motivo *',
      inputRequired: true,
      confirmText: 'Confirmar Rejeição',
    }).afterClosed().subscribe((reason: string) => {
      if (!reason) return;
      this.actionShipmentId = shipment.id;
      this.svc.reject(shipment.id, reason).subscribe({
        next: () => this.finishAction('Embarque rejeitado.'),
        error: (e) => this.failAction(e?.error?.message ?? 'Erro ao rejeitar embarque.'),
      });
    });
  }

  holdFromList(event: Event, shipment: Shipment): void {
    event.stopPropagation();
    this.openDialog({
      title: 'Reter Embarque',
      message: `Motivo da retenção do embarque ${shipment.cd}:`,
      inputLabel: 'Motivo *',
      inputRequired: true,
      confirmText: 'Confirmar Retenção',
    }).afterClosed().subscribe((reason: string) => {
      if (!reason) return;
      this.actionShipmentId = shipment.id;
      this.svc.hold(shipment.id, reason).subscribe({
        next: () => this.finishAction('Embarque retido.'),
        error: (e) => this.failAction(e?.error?.message ?? 'Erro ao reter embarque.'),
      });
    });
  }

  private openDialog(data: ConfirmDialogData) {
    return this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, { data });
  }

  private resolveInitialFilter(status: string | null): string {
    if (status && this.allowedFilters.includes(status as ShipmentStatus)) {
      return status;
    }
    return this.role === 'customs' ? 'at_border' : '';
  }

  private syncFilterQueryParam(): void {
    if (this.role !== 'customs') return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: this.filterStatus || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private finishAction(message: string): void {
    this.actionShipmentId = null;
    this.snack.open(message, 'Fechar', { duration: 3000 });
    this.reload();
  }

  private failAction(message: string): void {
    this.actionShipmentId = null;
    this.snack.open(message, 'Fechar', { duration: 3000 });
  }
}
