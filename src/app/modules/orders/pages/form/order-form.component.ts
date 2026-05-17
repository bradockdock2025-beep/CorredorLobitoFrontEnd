import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderService }   from '../../../../core/services/order.service';
import { ProductService } from '../../../../core/services/product.service';
import { Product, Order, toNumber } from '../../../../core/models';

interface CartItem { productId: string; productName: string; category: string; qty: number; }

@Component({
  selector: 'app-order-form',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">shopping_cart</mat-icon>
          <h2 class="page-title">Novo Pedido</h2>
        </div>
        <nav class="breadcrumb">
          <a (click)="router.navigate(['/dashboard/buyer/orders'])">Os Meus Pedidos</a>
          <mat-icon class="bc-sep">chevron_right</mat-icon>
          <span>Novo Pedido</span>
        </nav>
      </div>
    </div>

    <!-- Progress bar global -->
    <mat-progress-bar mode="indeterminate"
                      *ngIf="loadingProducts || creatingOrder || paying"></mat-progress-bar>

    <mat-card>
      <mat-card-content>

        <mat-stepper [linear]="true" #stepper>

          <!-- ══════════════════════════════════════════════════════════
               STEP 1 — Seleccionar Produtos
               ══════════════════════════════════════════════════════════ -->
          <mat-step [completed]="cart.length > 0">
            <ng-template matStepLabel>Produtos</ng-template>
            <div class="card-section">
              <p class="card-section-title">Produtos Disponíveis</p>

              <!-- Lista de produtos -->
              <div class="product-grid" *ngIf="!loadingProducts">
                <mat-card class="product-card"
                          *ngFor="let p of publishedProducts"
                          [class.selected]="isInCart(p.id)"
                          (click)="quickAdd(p)">
                  <mat-card-content class="product-card-body">
                    <div class="product-info">
                      <div class="product-name">{{ p.name }}</div>
                      <div class="text-sm text-muted">{{ p.category }} · {{ p.company?.name }}</div>
                      <span class="id-text">{{ p.cd }}</span>
                    </div>
                    <div class="product-action">
                      <mat-icon *ngIf="isInCart(p.id)" class="check-icon">check_circle</mat-icon>
                      <mat-icon *ngIf="!isInCart(p.id)" class="add-icon">add_circle_outline</mat-icon>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>

              <div class="empty-state" *ngIf="!loadingProducts && publishedProducts.length === 0">
                <mat-icon class="empty-icon">inventory_2</mat-icon>
                <h3>Nenhum produto disponível</h3>
                <p>Não existem produtos publicados disponíveis para encomenda.</p>
              </div>

              <!-- Carrinho actual -->
              <ng-container *ngIf="cart.length > 0">
                <mat-divider class="mt-md"></mat-divider>
                <p class="card-section-title mt-md">Carrinho ({{ cart.length }} item(s))</p>
                <table class="lines-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Categoria</th>
                      <th>Quantidade</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of cart; let i = index">
                      <td>{{ item.productName }}</td>
                      <td class="text-muted">{{ item.category }}</td>
                      <td>
                        <div class="qty-control">
                          <button mat-icon-button (click)="decreaseQty(i)" [disabled]="item.qty <= 1">
                            <mat-icon>remove</mat-icon>
                          </button>
                          <span class="qty-value">{{ item.qty }}</span>
                          <button mat-icon-button (click)="increaseQty(i)">
                            <mat-icon>add</mat-icon>
                          </button>
                        </div>
                      </td>
                      <td>
                        <button mat-icon-button (click)="removeFromCart(i)"
                                matTooltip="Remover" aria-label="Remover do carrinho">
                          <mat-icon>delete_outline</mat-icon>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ng-container>

              <div class="info-banner mt-md">
                <mat-icon>info</mat-icon>
                <span>
                  O preço oficial de cada produto será calculado pelo sistema após confirmar
                  a encomenda. O imposto é calculado no pagamento.
                </span>
              </div>

              <div class="form-actions">
                <button mat-button type="button"
                        (click)="router.navigate(['/dashboard/buyer/orders'])">
                  Cancelar
                </button>
                <button mat-raised-button color="primary"
                        [disabled]="cart.length === 0"
                        (click)="createOrder(stepper)">
                  <mat-icon>arrow_forward</mat-icon> Confirmar Encomenda ({{ cart.length }})
                </button>
              </div>
            </div>
          </mat-step>

          <!-- ══════════════════════════════════════════════════════════
               STEP 2 — Revisão do Pedido (após POST /orders)
               ══════════════════════════════════════════════════════════ -->
          <mat-step [completed]="!!createdOrder">
            <ng-template matStepLabel>Revisão</ng-template>
            <div class="card-section">

              <ng-container *ngIf="creatingOrder">
                <div class="empty-state">
                  <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
                  <p class="mt-md text-muted">A criar pedido e calcular preços…</p>
                </div>
              </ng-container>

              <ng-container *ngIf="!creatingOrder && createdOrder">
                <div class="order-review-header">
                  <div class="detail-field">
                    <label>Referência</label>
                    <span class="id-text">{{ createdOrder.cd }}</span>
                  </div>
                  <div class="detail-field">
                    <label>Empresa</label>
                    <span>{{ createdOrder.company?.name ?? '—' }}</span>
                  </div>
                  <div class="detail-field">
                    <label>País</label>
                    <span>{{ createdOrder.company?.country | titlecase }}</span>
                  </div>
                </div>

                <p class="card-section-title mt-md">Linhas do Pedido</p>
                <table class="lines-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Qty</th>
                      <th class="nowrap">Preço Un. (oficial)</th>
                      <th class="nowrap">Subtotal (s/ imposto)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let l of createdOrder.lines">
                      <td>
                        <div>{{ l.product?.name ?? '—' }}</div>
                      </td>
                      <td>{{ l.qty }}</td>
                      <td class="nowrap">{{ toNumber(l.unitPrice) | number:'1.2-2' }} {{ createdOrder.currency }}</td>
                      <td class="nowrap">{{ toNumber(l.unitPrice) * l.qty | number:'1.2-2' }} {{ createdOrder.currency }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="subtotal-row">
                      <td colspan="3" class="text-right">Subtotal (s/ imposto)</td>
                      <td class="nowrap"><strong>{{ subtotalEstimate | number:'1.2-2' }} {{ createdOrder.currency }}</strong></td>
                    </tr>
                  </tfoot>
                </table>

                <div class="info-banner mt-md">
                  <mat-icon>payments</mat-icon>
                  <span>
                    O imposto (IVA) será calculado automaticamente no pagamento com base
                    no país da sua empresa e na categoria de cada produto.
                  </span>
                </div>

                <div class="form-actions">
                  <button mat-button type="button" (click)="cancelOrder()">
                    <mat-icon>close</mat-icon> Cancelar Pedido
                  </button>
                  <button mat-raised-button color="primary"
                          (click)="proceedToPayment(stepper)">
                    <mat-icon>payment</mat-icon> Confirmar Pagamento
                  </button>
                </div>
              </ng-container>

            </div>
          </mat-step>

          <!-- ══════════════════════════════════════════════════════════
               STEP 3 — Confirmação de Pagamento
               ══════════════════════════════════════════════════════════ -->
          <mat-step>
            <ng-template matStepLabel>Pagamento</ng-template>
            <div class="card-section">

              <!-- A pagar... -->
              <ng-container *ngIf="paying">
                <div class="empty-state">
                  <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
                  <p class="mt-md text-muted">A processar pagamento e calcular impostos…</p>
                </div>
              </ng-container>

              <!-- Recibo após pagamento -->
              <ng-container *ngIf="!paying && paidOrder">
                <div class="receipt-header">
                  <mat-icon class="receipt-icon">check_circle</mat-icon>
                  <div>
                    <h3 class="receipt-title">Pagamento Confirmado</h3>
                    <div class="text-sm text-muted">{{ paidOrder.cd }} · {{ paidOrder.paidAt | date:'dd/MM/yyyy HH:mm' }}</div>
                  </div>
                </div>

                <div class="order-review-header mt-md">
                  <div class="detail-field">
                    <label>Empresa</label>
                    <span>{{ paidOrder.company?.name ?? '—' }}</span>
                  </div>
                  <div class="detail-field">
                    <label>País</label>
                    <span>{{ paidOrder.company?.country | titlecase }}</span>
                  </div>
                </div>

                <p class="card-section-title mt-md">Resumo Financeiro</p>
                <div class="totals-box">
                  <div class="totals-row">
                    <span>Subtotal (sem imposto)</span>
                    <span>{{ toNumber(paidOrder.netAmount) | number:'1.2-2' }} {{ paidOrder.currency }}</span>
                  </div>
                  <div class="totals-row">
                    <span>IVA ({{ paidOrder.company?.country | titlecase }})</span>
                    <span>{{ toNumber(paidOrder.taxAmount) | number:'1.2-2' }} {{ paidOrder.currency }}</span>
                  </div>
                  <div class="totals-row total-final">
                    <span>TOTAL PAGO</span>
                    <span>{{ toNumber(paidOrder.totalAmount) | number:'1.2-2' }} {{ paidOrder.currency }}</span>
                  </div>
                </div>

                <div class="form-actions">
                  <button mat-raised-button color="primary"
                          (click)="router.navigate(['/dashboard/buyer/orders', paidOrder.id])">
                    <mat-icon>receipt_long</mat-icon> Ver Pedido Completo
                  </button>
                </div>
              </ng-container>

            </div>
          </mat-step>

        </mat-stepper>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    /* Produto grid */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px;
      margin-bottom: 4px;
    }
    .product-card {
      cursor: pointer;
      transition: box-shadow 0.15s, border-color 0.15s;
      border: 2px solid transparent !important;
    }
    .product-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; }
    .product-card.selected { border-color: var(--black) !important; }
    .product-card-body { display: flex; justify-content: space-between; align-items: center; padding: 12px !important; }
    .product-name { font-size: 14px; font-weight: 500; color: var(--black); }
    .check-icon { color: var(--black) !important; }
    .add-icon   { color: var(--gray-400) !important; }

    /* Qty control */
    .qty-control { display: flex; align-items: center; gap: 4px; }
    .qty-value   { font-size: 15px; font-weight: 600; min-width: 24px; text-align: center; }

    /* Order review */
    .order-review-header {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 8px;
    }
    .text-right { text-align: right; padding-right: 8px; }

    /* Receipt */
    .receipt-header { display: flex; align-items: center; gap: 16px; }
    .receipt-icon   { font-size: 48px !important; width: 48px !important; height: 48px !important; color: var(--black); }
    .receipt-title  { font-size: 18px; font-weight: 600; margin: 0 0 4px; }

    /* Subtotal row */
    .subtotal-row td { border-top: 2px solid var(--gray-300); padding-top: 10px; font-size: 13px; color: var(--gray-600); }
  `],
})
export class OrderFormComponent implements OnInit {
  loadingProducts = false;
  creatingOrder   = false;
  paying          = false;

  publishedProducts: Product[] = [];
  cart: CartItem[] = [];

  createdOrder: Order | null = null;
  paidOrder:    Order | null = null;

  readonly toNumber = toNumber;

  get subtotalEstimate(): number {
    if (!this.createdOrder?.lines) return 0;
    return this.createdOrder.lines.reduce(
      (sum, l) => sum + toNumber(l.unitPrice) * l.qty, 0
    );
  }

  constructor(
    private svc:        OrderService,
    private productSvc: ProductService,
    public  router:     Router,
    private snack:      MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadingProducts = true;
    this.productSvc.getAll().subscribe({
      next: (ps) => {
        this.publishedProducts = ps.filter((p) => p.status === 'published_official');
        this.loadingProducts   = false;
      },
      error: () => { this.loadingProducts = false; },
    });
  }

  // ── Carrinho ───────────────────────────────────────────────────────────────

  isInCart(productId: string): boolean {
    return this.cart.some((i) => i.productId === productId);
  }

  quickAdd(product: Product): void {
    if (this.isInCart(product.id)) return;
    this.cart.push({
      productId:   product.id,
      productName: product.name,
      category:    product.category,
      qty:         1,
    });
  }

  increaseQty(i: number): void { this.cart[i].qty++; }
  decreaseQty(i: number): void { if (this.cart[i].qty > 1) this.cart[i].qty--; }
  removeFromCart(i: number): void { this.cart.splice(i, 1); }

  // ── Step 1 → Step 2: POST /orders ─────────────────────────────────────────

  createOrder(stepper: any): void {
    if (this.cart.length === 0) return;
    this.creatingOrder = true;

    this.svc.create({
      lines: this.cart.map(({ productId, qty }) => ({ productId, qty })),
    }).subscribe({
      next: (order) => {
        // Buscar GET /orders/:id para ter o unitPrice nas linhas
        this.svc.getById(order.id).subscribe({
          next: (fullOrder) => {
            this.createdOrder  = fullOrder;
            this.creatingOrder = false;
            stepper.next();
          },
          error: () => {
            this.createdOrder  = order;
            this.creatingOrder = false;
            stepper.next();
          },
        });
      },
      error: (e) => {
        this.creatingOrder = false;
        const msg = Array.isArray(e?.error?.message)
          ? e.error.message.join(' ')
          : (e?.error?.message ?? 'Erro ao criar pedido. Verifique se a sua empresa tem licença activa.');
        this.snack.open(msg, 'Fechar', { duration: 6000 });
      },
    });
  }

  cancelOrder(): void {
    this.createdOrder = null;
    this.cart = [];
  }

  // ── Step 2 → Step 3: POST /orders/:id/pay ─────────────────────────────────

  proceedToPayment(stepper: any): void {
    if (!this.createdOrder) return;
    this.paying = true;
    stepper.next();

    this.svc.pay(this.createdOrder.id).subscribe({
      next: (paid) => {
        // GET /orders/:id para ter as lines com taxRate, taxAmount e lineTotal
        this.svc.getById(paid.id).subscribe({
          next: (fullPaid) => { this.paidOrder = fullPaid; this.paying = false; },
          error: ()        => { this.paidOrder = paid;     this.paying = false; },
        });
      },
      error: (e) => {
        this.paying = false;
        this.snack.open(e?.error?.message ?? 'Erro no pagamento', 'Fechar', { duration: 5000 });
        stepper.previous();
      },
    });
  }
}
