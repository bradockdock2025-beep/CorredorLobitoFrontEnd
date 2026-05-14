import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Order, Role, toNumber } from '../../../../core/models';

@Component({
  selector: 'app-orders-list',
  template: `
    <!-- Page header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">receipt_long</mat-icon>
          <h1 class="page-title">{{ role === 'buyer' ? 'Os Meus Pedidos' : 'Pedidos' }}</h1>
        </div>
        <nav class="breadcrumb">
          <span>Dashboard</span>
          <mat-icon class="bc-sep">chevron_right</mat-icon>
          <span>Pedidos</span>
        </nav>
      </div>
      <div class="page-actions">
        <span class="record-count">{{ orders.length }} registo(s)</span>
        <button mat-raised-button color="primary"
                *ngIf="role === 'buyer'"
                (click)="router.navigate(['/dashboard/buyer/orders/new'])">
          <mat-icon>add</mat-icon> Criar Pedido
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
          <p>Não foi possível carregar os pedidos. Verifique a sua ligação e tente novamente.</p>
          <button mat-stroked-button (click)="reload()">
            <mat-icon>refresh</mat-icon> Tentar novamente
          </button>
        </div>

        <!-- Table -->
        <table mat-table [dataSource]="orders"
               *ngIf="!loading && !loadError"
               class="full-width">

          <!-- Nº column -->
          <ng-container matColumnDef="cd">
            <th mat-header-cell *matHeaderCellDef>Nº</th>
            <td mat-cell *matCellDef="let o"><strong>{{ o.cd }}</strong></td>
          </ng-container>

          <!-- Company column -->
          <ng-container matColumnDef="company">
            <th mat-header-cell *matHeaderCellDef>Empresa</th>
            <td mat-cell *matCellDef="let o">{{ o.company?.name ?? '—' }}</td>
          </ng-container>

          <!-- Status column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let o">
              <app-status-badge [status]="o.status"></app-status-badge>
            </td>
          </ng-container>

          <!-- Net amount column -->
          <ng-container matColumnDef="netAmount">
            <th mat-header-cell *matHeaderCellDef>Valor Líquido</th>
            <td mat-cell *matCellDef="let o" class="nowrap">
              <span *ngIf="o.netAmount">{{ toNumber(o.netAmount) | number:'1.2-2' }}&nbsp;{{ o.currency }}</span>
              <span *ngIf="!o.netAmount" class="text-muted">—</span>
            </td>
          </ng-container>

          <!-- Tax amount column -->
          <ng-container matColumnDef="taxAmount">
            <th mat-header-cell *matHeaderCellDef>Imposto</th>
            <td mat-cell *matCellDef="let o" class="nowrap">
              <span *ngIf="o.taxAmount">{{ toNumber(o.taxAmount) | number:'1.2-2' }}&nbsp;{{ o.currency }}</span>
              <span *ngIf="!o.taxAmount" class="text-muted">—</span>
            </td>
          </ng-container>

          <!-- Total amount column -->
          <ng-container matColumnDef="totalAmount">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let o" class="nowrap">
              <span *ngIf="o.totalAmount">{{ toNumber(o.totalAmount) | number:'1.2-2' }}&nbsp;{{ o.currency }}</span>
              <span *ngIf="!o.totalAmount" class="text-muted">—</span>
            </td>
          </ng-container>

          <!-- Created at column -->
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Data</th>
            <td mat-cell *matCellDef="let o">
              <span class="timestamp">{{ o.createdAt | date:'dd/MM/yyyy' }}</span>
            </td>
          </ng-container>

          <!-- Actions column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let o">
              <button mat-icon-button
                      (click)="$event.stopPropagation(); router.navigate(['/dashboard/' + role + '/orders', o.id])"
                      matTooltip="Ver detalhe do pedido"
                      aria-label="Ver detalhe">
                <mat-icon>open_in_new</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"
              (click)="router.navigate(['/dashboard/' + role + '/orders', row.id])"></tr>

          <!-- Empty state row -->
          <tr class="mat-mdc-row" *matNoDataRow>
            <td class="mat-mdc-cell" [attr.colspan]="cols.length">
              <div class="empty-state">
                <mat-icon class="empty-icon">receipt_long</mat-icon>
                <h3>Nenhum pedido encontrado</h3>
                <p *ngIf="role === 'buyer'">
                  Ainda não efectuou nenhum pedido. Crie o seu primeiro pedido de importação.
                </p>
                <p *ngIf="role !== 'buyer'">
                  Ainda não existem pedidos registados no sistema.
                </p>
                <button mat-stroked-button
                        *ngIf="role === 'buyer'"
                        (click)="router.navigate(['/dashboard/buyer/orders/new'])">
                  <mat-icon>add</mat-icon> Criar primeiro pedido
                </button>
              </div>
            </td>
          </tr>
        </table>

      </mat-card-content>
    </mat-card>
  `,
})
export class OrdersListComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  loadError = false;
  role: Role | string = '';
  cols = ['cd', 'company', 'status', 'netAmount', 'taxAmount', 'totalAmount', 'createdAt', 'actions'];
  readonly toNumber = toNumber;

  constructor(public router: Router, private svc: OrderService, private auth: AuthService) {}

  ngOnInit(): void {
    this.role = this.auth.getCurrentUser()?.role ?? '';
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.loadError = false;
    const obs = this.role === 'buyer' ? this.svc.getMyOrders() : this.svc.getAll();
    obs.subscribe({
      next: (d) => { this.orders = d; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }
}
