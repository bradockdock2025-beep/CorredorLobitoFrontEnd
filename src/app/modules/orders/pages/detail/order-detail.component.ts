import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderService } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PdfService } from '../../../../core/services/pdf.service';
import { Order, Shipment, ShipmentStatus, TrackingEvent, Role, toNumber } from '../../../../core/models';
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

          <!-- STAFF — escalar ao STATE -->
          <ng-container *ngIf="role === 'staff' && !['cancelled'].includes(order.status)">
            <button mat-stroked-button (click)="escalate()">
              <mat-icon>upload</mat-icon> Escalar ao STATE
            </button>
          </ng-container>

          <!-- PDFs — fatura + recibo quando pago -->
          <ng-container *ngIf="order.status === 'paid'">
            <button mat-stroked-button (click)="downloadInvoice()" [disabled]="pdfLoading">
              <mat-spinner diameter="16" *ngIf="pdfLoading === 'invoice'"></mat-spinner>
              <mat-icon *ngIf="pdfLoading !== 'invoice'">receipt_long</mat-icon>
              Fatura PDF
            </button>
            <button mat-stroked-button (click)="downloadReceipt()" [disabled]="pdfLoading">
              <mat-spinner diameter="16" *ngIf="pdfLoading === 'receipt'"></mat-spinner>
              <mat-icon *ngIf="pdfLoading !== 'receipt'">payments</mat-icon>
              Recibo PDF
            </button>
          </ng-container>

          <!-- BUYER — rastrear embarque -->
          <button mat-stroked-button *ngIf="role === 'buyer' && order.status === 'paid'"
                  (click)="toggleShipmentTracking()">
            <mat-icon>local_shipping</mat-icon>
            {{ showShipment ? 'Ocultar Tracking' : 'Ver Embarque' }}
          </button>

        </div>
      </div>

      <!-- ── Tracking do embarque (BUYER) ──────────────────────────────── -->
      <mat-card class="mt-md" *ngIf="role === 'buyer' && showShipment">
        <mat-card-content class="card-section">
          <p class="card-section-title">Tracking do Embarque</p>

          <mat-progress-bar mode="indeterminate" *ngIf="shipmentLoading"></mat-progress-bar>

          <div class="shipment-no-data" *ngIf="!shipmentLoading && !shipment && shipmentError">
            <mat-icon>info_outline</mat-icon>
            <span>{{ shipmentError }}</span>
          </div>

          <ng-container *ngIf="shipment">
            <!-- Banner de estado -->
            <div class="tracking-status-banner" [class]="'ts-' + shipment.status">
              <mat-icon>{{ trackingStatusIcon(shipment.status) }}</mat-icon>
              <div>
                <strong>{{ shipment.cd }}</strong>
                <span>{{ trackingMessage(shipment.status) }}</span>
              </div>
            </div>

            <div class="tracking-meta">
              <span><mat-icon class="meta-icon">place</mat-icon> {{ shipment.origin }}</span>
              <mat-icon>arrow_forward</mat-icon>
              <span>{{ shipment.destination }}</span>
              <span *ngIf="shipment.eta" class="eta-text">
                · ETA: {{ shipment.eta | date:'dd/MM/yyyy' }}
              </span>
            </div>

            <!-- Timeline de eventos (mais recente primeiro) -->
            <div class="tracking-timeline" *ngIf="sortedEvents().length > 0">
              <div class="tl-event" *ngFor="let ev of sortedEvents()">
                <div class="tl-event-dot">
                  <app-status-badge [status]="ev.status"></app-status-badge>
                </div>
                <div class="tl-event-body">
                  <span class="tl-event-loc">{{ ev.location }}</span>
                  <span class="tl-event-time">{{ ev.timestamp | date:'dd/MM/yyyy HH:mm' }}</span>
                  <span class="tl-event-notes" *ngIf="ev.notes">{{ ev.notes }}</span>
                </div>
              </div>
            </div>

            <p class="text-muted text-sm" *ngIf="sortedEvents().length === 0">
              Sem eventos de tracking registados ainda.
            </p>
          </ng-container>

        </mat-card-content>
      </mat-card>

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
              <td mat-cell *matCellDef="let l">{{ l.product?.name ?? '—' }}</td>
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

    /* Tracking do embarque */
    .tracking-status-banner {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;
      font-size: 14px;
    }
    .tracking-status-banner mat-icon { font-size: 24px; width: 24px; height: 24px; flex-shrink: 0; }
    .tracking-status-banner > div { display: flex; flex-direction: column; gap: 2px; }
    .tracking-status-banner strong { font-size: 14px; font-weight: 700; }
    .tracking-status-banner span   { font-size: 13px; }

    .ts-created, .ts-in_transit { background: #e3f2fd; color: #1565c0; }
    .ts-at_border               { background: #fff8e1; color: #f57f17; }
    .ts-customs_approved        { background: #e8f5e9; color: #2e7d32; }
    .ts-customs_rejected        { background: #fce8e6; color: #c5221f; }
    .ts-held                    { background: #fff3e0; color: #e65100; }
    .ts-delivered               { background: #e8f5e9; color: #1b5e20; }

    .tracking-meta {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: #555; margin-bottom: 16px;
    }
    .tracking-meta mat-icon { font-size: 16px; width: 16px; height: 16px; color: #888; }
    .meta-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; }
    .eta-text { color: #888; }

    .tracking-timeline { display: flex; flex-direction: column; gap: 0; }

    .tl-event {
      display: flex; gap: 12px; padding: 10px 0;
      border-bottom: 1px solid #f5f5f5;
    }
    .tl-event:last-child { border-bottom: none; }
    .tl-event-dot { padding-top: 2px; flex-shrink: 0; }
    .tl-event-body { display: flex; flex-direction: column; gap: 2px; }
    .tl-event-loc   { font-size: 14px; font-weight: 600; color: #333; }
    .tl-event-time  { font-size: 11px; color: #aaa; }
    .tl-event-notes { font-size: 12px; color: #777; font-style: italic; }

    .shipment-no-data {
      display: flex; align-items: center; gap: 8px;
      color: #888; font-size: 13px; padding: 12px 0;
    }
  `],
})
export class OrderDetailComponent implements OnInit {
  order:      Order | null = null;
  shipment:   Shipment | null = null;
  loading        = false;
  loadError      = false;
  shipmentLoading = false;
  shipmentError   = '';
  showShipment    = false;
  pdfLoading: 'invoice' | 'receipt' | null = null;
  role: Role | null = null;
  lineCols = ['product', 'qty', 'unitPrice', 'taxRate', 'lineTotal'];
  readonly toNumber = toNumber;

  get hasActions(): boolean {
    if (!this.order) return false;
    if (this.role === 'buyer'  && ['draft','paid'].includes(this.order.status)) return true;
    if (this.role === 'state'  && ['paid','blocked'].includes(this.order.status)) return true;
    if (this.role === 'staff'  && this.order.status !== 'cancelled') return true;
    return false;
  }

  constructor(
    private route: ActivatedRoute, public router: Router,
    private svc: OrderService, private auth: AuthService,
    private pdfSvc: PdfService,
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

  downloadInvoice(): void {
    if (!this.order) return;
    this.pdfLoading = 'invoice';
    this.pdfSvc.getInvoicePdf(this.order.id).subscribe({
      next: (res) => { this.pdfLoading = null; this.pdfSvc.openPdf(res); },
      error: (e) => { this.pdfLoading = null; this.snack.open(e?.error?.message ?? 'Fatura não disponível.', 'Fechar', { duration: 3000 }); },
    });
  }

  downloadReceipt(): void {
    if (!this.order) return;
    this.pdfLoading = 'receipt';
    this.pdfSvc.getReceiptPdf(this.order.id).subscribe({
      next: (res) => { this.pdfLoading = null; this.pdfSvc.openPdf(res); },
      error: (e) => { this.pdfLoading = null; this.snack.open(e?.error?.message ?? 'Recibo não disponível.', 'Fechar', { duration: 3000 }); },
    });
  }

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
    this.open({
      title: 'Cancelar Pedido',
      message: 'Esta acção é irreversível. Indique o motivo:',
      inputLabel: 'Motivo do cancelamento',
      inputRequired: true,
      confirmText: 'Cancelar Pedido',
    }).afterClosed().subscribe((reason: string) => {
      if (!reason) return;
      this.loading = true;
      this.svc.cancel(this.order!.id, reason).subscribe({
        next: (o) => { this.order = o; this.loading = false; this.snack.open('Pedido cancelado.', 'Fechar', { duration: 3000 }); },
        error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
      });
    });
  }

  escalate(): void {
    this.open({
      title: 'Escalar ao STATE',
      message: 'Descreva o motivo da escalada:',
      inputLabel: 'Motivo *',
      inputRequired: true,
      confirmText: 'Escalar',
    }).afterClosed().subscribe((reason: string) => {
      if (!reason) return;
      this.loading = true;
      this.svc.escalateToState(this.order!.id, reason).subscribe({
        next: () => { this.loading = false; this.snack.open('Pedido escalado ao STATE. Audit log registado.', 'Fechar', { duration: 4000 }); },
        error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro ao escalar.', 'Fechar', { duration: 3000 }); },
      });
    });
  }

  toggleShipmentTracking(): void {
    this.showShipment = !this.showShipment;
    if (this.showShipment && !this.shipment && !this.shipmentLoading) {
      this.loadShipment();
    }
  }

  loadShipment(): void {
    if (!this.order) return;
    this.shipmentLoading = true;
    this.shipmentError   = '';
    this.svc.getShipmentByOrderId(this.order.id).subscribe({
      next: (s) => { this.shipment = s; this.shipmentLoading = false; },
      error: (e) => {
        this.shipmentLoading = false;
        if (e.status === 404) {
          this.shipmentError = 'Ainda não existe embarque associado a este pedido.';
        } else {
          this.shipmentError = e?.error?.message ?? 'Erro ao carregar embarque.';
        }
      },
    });
  }

  sortedEvents(): TrackingEvent[] {
    if (!this.shipment?.trackingEvents) return [];
    return [...this.shipment.trackingEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  trackingMessage(status: ShipmentStatus): string {
    const m: Partial<Record<ShipmentStatus, string>> = {
      created:          'Embarque criado. O operador está a preparar a carga.',
      in_transit:       'Carga em trânsito para a fronteira.',
      at_border:        'Carga na fronteira — aguarda validação aduaneira.',
      customs_approved: 'Aprovado pela alfândega. Carga a caminho do destino.',
      customs_rejected: 'Rejeitado pela alfândega. Operador a corrigir documentação.',
      held:             'Carga retida para inspecção especial.',
      delivered:        'Carga entregue no destino.',
    };
    return m[status] ?? status;
  }

  trackingStatusIcon(status: ShipmentStatus): string {
    const m: Partial<Record<ShipmentStatus, string>> = {
      created: 'inventory', in_transit: 'local_shipping',
      at_border: 'hourglass_empty', customs_approved: 'verified',
      customs_rejected: 'cancel', held: 'warning', delivered: 'check_circle',
    };
    return m[status] ?? 'local_shipping';
  }
}
