import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderService } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Order, Role, toNumber } from '../../../../core/models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-order-detail',
  template: `

    <!-- ── Progress bar — SEMPRE visível durante carregamento ──────── -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading" class="detail-progress"></mat-progress-bar>

    <!-- ── Skeleton loading — enquanto carrega o pedido ────────────── -->
    <ng-container *ngIf="loading && !order">
      <div class="detail-header">
        <div class="detail-title-group">
          <nav class="breadcrumb">
            <span>Pedidos</span>
            <mat-icon class="bc-sep">chevron_right</mat-icon>
            <span>A carregar…</span>
          </nav>
          <div class="detail-title-row">
            <mat-icon class="page-icon">receipt_long</mat-icon>
            <div class="skeleton-title"></div>
          </div>
        </div>
      </div>
      <div class="skeleton-cards">
        <mat-card class="skeleton-card">
          <mat-card-content class="card-section">
            <div class="skeleton-label"></div>
            <div class="skeleton-grid">
              <div class="skeleton-field" *ngFor="let i of [1,2,3,4]"></div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="skeleton-card mt-md">
          <mat-card-content class="card-section">
            <div class="skeleton-label"></div>
            <div class="skeleton-table-row" *ngFor="let i of [1,2]"></div>
          </mat-card-content>
        </mat-card>
      </div>
    </ng-container>

    <!-- ── Error state ─────────────────────────────────────────────── -->
    <div class="error-state" *ngIf="!loading && !order && loadError">
      <mat-icon>error_outline</mat-icon>
      <p>Não foi possível carregar o pedido. Verifique a sua ligação e tente novamente.</p>
      <button mat-stroked-button (click)="reload()">
        <mat-icon>refresh</mat-icon> Tentar novamente
      </button>
    </div>

    <!-- ── Conteúdo real — só aparece após carregamento ────────────── -->
    <ng-container *ngIf="order">

      <!-- ── Header ─────────────────────────────────────────────────── -->
      <div class="detail-header">
        <div class="detail-title-group">
          <nav class="breadcrumb">
            <a (click)="back()">Pedidos</a>
            <mat-icon class="bc-sep">chevron_right</mat-icon>
            <span>Pedido {{ order.cd }}</span>
          </nav>
          <div class="detail-title-row">
            <mat-icon class="page-icon">receipt_long</mat-icon>
            <h1 class="detail-title">Pedido {{ order.cd }}</h1>
            <app-status-badge [status]="order.status"></app-status-badge>
          </div>
          <p class="text-muted text-sm" *ngIf="!hasActions">Sem acções disponíveis para o estado actual.</p>
        </div>

        <div class="detail-actions">
          <!-- BUYER: draft -->
          <ng-container *ngIf="role === 'buyer' && order.status === 'draft'">
            <button mat-raised-button color="primary" (click)="pay()">
              <mat-icon>payment</mat-icon> Pagar Pedido
            </button>
          </ng-container>

          <!-- STATE -->
          <ng-container *ngIf="role === 'state'">
            <button mat-raised-button color="primary"
                    *ngIf="order.status === 'paid'"
                    (click)="block()">
              <mat-icon>block</mat-icon> Bloquear Pedido
            </button>
            <button mat-raised-button color="primary"
                    *ngIf="order.status === 'blocked'"
                    (click)="cancel()">
              <mat-icon>cancel</mat-icon> Cancelar Pedido
            </button>
          </ng-container>
        </div>
      </div>

      <!-- ── Info card ───────────────────────────────────────────────── -->
      <mat-card>
        <mat-card-content class="card-section">
          <p class="card-section-title">Informação do Pedido</p>
          <div class="detail-grid">
            <div class="detail-field">
              <label>Empresa</label>
              <span>{{ order.company?.name ?? '—' }}</span>
            </div>
            <div class="detail-field">
              <label>País</label>
              <span>{{ order.company?.country | titlecase }}</span>
            </div>
            <div class="detail-field">
              <label>Comprador</label>
              <span>{{ order.buyer?.fullName ?? '—' }}</span>
            </div>
            <div class="detail-field">
              <label>Criado em</label>
              <span>{{ order.createdAt | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="detail-field" *ngIf="order.paidAt">
              <label>Pago em</label>
              <span>{{ order.paidAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="detail-field" *ngIf="order.blockedReason">
              <label>Motivo Bloqueio</label>
              <span>{{ order.blockedReason }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- ── Lines card ──────────────────────────────────────────────── -->
      <mat-card class="mt-md" *ngIf="order.lines?.length">
        <mat-card-content class="card-section">
          <p class="card-section-title">Linhas do Pedido</p>

          <table mat-table [dataSource]="order.lines!" class="full-width">

            <ng-container matColumnDef="product">
              <th mat-header-cell *matHeaderCellDef>Produto</th>
              <td mat-cell *matCellDef="let l">{{ l.product?.name ?? l.productId }}</td>
            </ng-container>

            <ng-container matColumnDef="qty">
              <th mat-header-cell *matHeaderCellDef>Qty</th>
              <td mat-cell *matCellDef="let l">{{ l.qty }}</td>
            </ng-container>

            <ng-container matColumnDef="unitPrice">
              <th mat-header-cell *matHeaderCellDef>Preço Un.</th>
              <td mat-cell *matCellDef="let l">
                {{ (l.snapshotRef ? l.snapshotRef.approvedPriceUsd : toNumber(l.unitPrice)) | number:'1.2-2' }} USD
              </td>
            </ng-container>

            <ng-container matColumnDef="taxRate">
              <th mat-header-cell *matHeaderCellDef>Imposto</th>
              <td mat-cell *matCellDef="let l">
                {{ l.taxRate ? (toNumber(l.taxRate) * 100 | number:'1.0-0') + '%' : '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="lineTotal">
              <th mat-header-cell *matHeaderCellDef>Total Linha</th>
              <td mat-cell *matCellDef="let l">
                {{ l.lineTotal ? (toNumber(l.lineTotal) | number:'1.2-2') + ' USD' : '—' }}
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="lineCols"></tr>
            <tr mat-row *matRowDef="let row; columns: lineCols"></tr>
          </table>

          <!-- Totais -->
          <div class="totals-box" *ngIf="order.totalAmount">
            <div class="totals-row">
              <span>Subtotal (net)</span>
              <span>{{ toNumber(order.netAmount) | number:'1.2-2' }} {{ order.currency }}</span>
            </div>
            <div class="totals-row">
              <span>Imposto ({{ order.company?.country | titlecase }})</span>
              <span>{{ toNumber(order.taxAmount) | number:'1.2-2' }} {{ order.currency }}</span>
            </div>
            <div class="totals-row total-final">
              <span>TOTAL</span>
              <span>{{ toNumber(order.totalAmount) | number:'1.2-2' }} {{ order.currency }}</span>
            </div>
          </div>

        </mat-card-content>
      </mat-card>

    </ng-container>
  `,
  styles: [`
    /* Progress bar fixo no topo */
    .detail-progress {
      position: sticky;
      top: 0;
      z-index: 10;
      margin-bottom: 16px;
    }

    /* Skeleton animation */
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    .skeleton-base {
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s infinite linear;
      border-radius: 4px;
    }
    .skeleton-title {
      height: 28px;
      width: 260px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s infinite linear;
      border-radius: 4px;
    }
    .skeleton-cards { display: flex; flex-direction: column; gap: 0; }
    .skeleton-card { min-height: 140px; }
    .skeleton-label {
      height: 12px;
      width: 140px;
      margin-bottom: 20px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s infinite linear;
      border-radius: 4px;
    }
    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 20px;
    }
    .skeleton-field {
      height: 42px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s infinite linear;
      border-radius: 4px;
    }
    .skeleton-table-row {
      height: 44px;
      margin-bottom: 8px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s infinite linear;
      border-radius: 4px;
    }
  `],
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  loading = false;
  loadError = false;
  role: Role | null = null;
  lineCols = ['product', 'qty', 'unitPrice', 'taxRate', 'lineTotal'];
  readonly toNumber = toNumber;

  get hasActions(): boolean {
    if (!this.order) return false;
    if (this.role === 'buyer'  && this.order.status === 'draft') return true;
    if (this.role === 'state'  && ['paid','blocked'].includes(this.order.status)) return true;
    return false;
  }

  constructor(
    private route: ActivatedRoute, public router: Router,
    private svc: OrderService, private auth: AuthService,
    private dialog: MatDialog, private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.role = this.auth.getCurrentUser()?.role ?? null;
    this.reload();
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading   = true;
    this.loadError = false;
    this.svc.getById(id).subscribe({
      next: (o) => { this.order = o; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }

  back(): void { this.router.navigate([`/dashboard/${this.role}/orders`]); }

  private open(data: ConfirmDialogData) {
    return this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, { data });
  }

  pay(): void {
    this.open({ title: 'Confirmar Pagamento', message: 'O imposto será calculado automaticamente pelo sistema com base no país da empresa e categoria dos produtos.', confirmText: 'Confirmar Pagamento' })
      .afterClosed().subscribe((r) => {
        if (!r) return;
        this.loading = true;
        this.svc.pay(this.order!.id).subscribe({
          next: (o) => {
            this.order = o;
            this.loading = false;
            this.snack.open(`Pedido pago! Total: ${toNumber(o.totalAmount).toFixed(2)} USD`, 'Fechar', { duration: 5000 });
          },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }

  block(): void {
    this.open({ title: 'Bloquear Pedido', message: 'Motivo do bloqueio:', inputLabel: 'Motivo', inputRequired: true, confirmText: 'Bloquear' })
      .afterClosed().subscribe((reason: string) => {
        if (!reason) return;
        this.loading = true;
        this.svc.block(this.order!.id, reason).subscribe({
          next: (o) => { this.order = o; this.loading = false; this.snack.open('Pedido bloqueado', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }

  cancel(): void {
    this.open({ title: 'Cancelar Pedido', message: 'Cancelar este pedido definitivamente?', confirmText: 'Cancelar' })
      .afterClosed().subscribe((r) => {
        if (!r) return;
        this.loading = true;
        this.svc.cancel(this.order!.id).subscribe({
          next: (o) => { this.order = o; this.loading = false; this.snack.open('Pedido cancelado', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }
}
