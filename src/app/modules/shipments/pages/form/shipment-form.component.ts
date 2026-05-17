import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShipmentService } from '../../../../core/services/shipment.service';
import { OrderService } from '../../../../core/services/order.service';
import { Order } from '../../../../core/models';

@Component({
  selector: 'app-shipment-form',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">local_shipping</mat-icon>
          <h2 class="page-title">Novo Embarque</h2>
        </div>
        <div class="breadcrumb">
          <a (click)="router.navigate(['/dashboard/operator/shipments'])">Embarques</a>
          <span class="sep">›</span>
          <span>Novo Embarque</span>
        </div>
      </div>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="saving || validating"></mat-progress-bar>

    <mat-card>
      <mat-card-content>

        <!-- ── PASSO 1: Identificar o pedido ───────────────────────── -->
        <div class="card-section">
          <p class="card-section-title">
            <span class="step-num">1</span> Identificar o Pedido Pago
          </p>
          <p class="step-hint">Introduza o código do pedido (ex: <strong>ORD-0019</strong>) que foi pago pelo comprador e que precisa de ser expedido.</p>

          <div class="order-lookup">
            <mat-form-field appearance="outline" class="lookup-field">
              <mat-label>Código do Pedido</mat-label>
              <mat-icon matPrefix>receipt_long</mat-icon>
              <input matInput [(ngModel)]="orderIdInput"
                     placeholder="ORD-0001"
                     (keydown.enter)="lookupOrder()">
              <mat-hint>Código ORD-XXXX partilhado pelo comprador</mat-hint>
            </mat-form-field>
            <button mat-raised-button color="primary"
                    (click)="lookupOrder()"
                    [disabled]="!orderIdInput.trim() || validating">
              <mat-icon>search</mat-icon>
              Verificar Pedido
            </button>
          </div>

          <!-- Resultado da pesquisa -->
          <div class="order-error" *ngIf="orderError">
            <mat-icon>error_outline</mat-icon>
            <span>{{ orderError }}</span>
          </div>

          <div class="order-found" *ngIf="foundOrder">
            <div class="order-found-header">
              <mat-icon class="found-icon">check_circle</mat-icon>
              <div>
                <strong>Pedido encontrado e válido</strong>
                <span>Este pedido está pago e pode ser embarcado.</span>
              </div>
            </div>
            <div class="order-details">
              <div class="order-field">
                <span class="od-label">Código</span>
                <span class="od-val order-cd">{{ foundOrder.cd }}</span>
              </div>
              <div class="order-field">
                <span class="od-label">Empresa Compradora</span>
                <span class="od-val">{{ foundOrder.company?.name ?? '—' }}</span>
              </div>
              <div class="order-field">
                <span class="od-label">Valor Total</span>
                <span class="od-val">{{ formatAmount(foundOrder.totalAmount) }} {{ foundOrder.currency }}</span>
              </div>
              <div class="order-field">
                <span class="od-label">Pago em</span>
                <span class="od-val">{{ foundOrder.paidAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="order-field">
                <span class="od-label">Linhas</span>
                <span class="od-val">{{ foundOrder.lines?.length ?? '—' }} artigo(s)</span>
              </div>
            </div>
          </div>
        </div>

        <mat-divider *ngIf="foundOrder"></mat-divider>

        <!-- ── PASSO 2: Dados do embarque ──────────────────────────── -->
        <div class="card-section" *ngIf="foundOrder">
          <p class="card-section-title">
            <span class="step-num">2</span> Dados do Embarque
          </p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="form">

            <mat-form-field appearance="outline">
              <mat-label>Origem *</mat-label>
              <mat-icon matPrefix>place</mat-icon>
              <input matInput formControlName="origin" placeholder="ex: Porto do Lobito, Angola">
              <mat-hint>Local de partida da mercadoria</mat-hint>
              <mat-error>Obrigatório</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Destino *</mat-label>
              <mat-icon matPrefix>flag</mat-icon>
              <input matInput formControlName="destination" placeholder="ex: Lusaka, Zâmbia">
              <mat-hint>Local de chegada da mercadoria</mat-hint>
              <mat-error>Obrigatório</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>ETA — Data Prevista de Chegada</mat-label>
              <mat-icon matPrefix>event</mat-icon>
              <input matInput [matDatepicker]="dp" formControlName="eta">
              <mat-datepicker-toggle matSuffix [for]="dp"></mat-datepicker-toggle>
              <mat-datepicker #dp></mat-datepicker>
              <mat-hint>Opcional — estimativa de chegada ao destino</mat-hint>
            </mat-form-field>

            <div class="form-actions">
              <button mat-button type="button"
                      (click)="router.navigate(['/dashboard/operator/shipments'])">
                Cancelar
              </button>
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="form.invalid || saving">
                <mat-icon>local_shipping</mat-icon>
                Criar Embarque
              </button>
            </div>

          </form>
        </div>

      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      background: var(--primary);
      color: #fff;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 700;
      margin-right: 8px;
    }

    .step-hint { font-size: 13px; color: #888; margin: 0 0 16px; }

    .order-lookup {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .lookup-field { flex: 1; }

    .order-lookup button {
      margin-top: 4px;
      flex-shrink: 0;
      height: 56px;
    }

    .order-error {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fce8e6;
      color: #c5221f;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-top: 12px;
    }
    .order-error mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }

    .order-found {
      margin-top: 16px;
      border: 1px solid #c8e6c9;
      border-radius: 10px;
      overflow: hidden;
    }

    .order-found-header {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #e8f5e9;
      padding: 14px 16px;
    }

    .found-icon { font-size: 24px; width: 24px; height: 24px; color: #2e7d32; flex-shrink: 0; }

    .order-found-header > div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .order-found-header strong { font-size: 14px; color: #1b5e20; }
    .order-found-header span   { font-size: 12px; color: #388e3c; }

    .order-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      padding: 0;
    }

    .order-field {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 10px 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .order-field:nth-child(odd)  { border-right: 1px solid #f0f0f0; }
    .order-field:nth-last-child(-n+2) { border-bottom: none; }

    .od-label { font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.4px; }
    .od-val   { font-size: 14px; color: #333; }
    .order-cd { font-family: monospace; font-weight: 700; color: var(--primary); }
  `],
})
export class ShipmentFormComponent {
  form: FormGroup;
  saving      = false;
  validating  = false;
  orderIdInput = '';
  foundOrder: Order | null = null;
  orderError  = '';

  constructor(
    private fb: FormBuilder,
    private svc: ShipmentService,
    private orderSvc: OrderService,
    public router: Router,
    private snack: MatSnackBar,
  ) {
    this.form = this.fb.group({
      origin:      ['', Validators.required],
      destination: ['', Validators.required],
      eta:         [null],
    });
  }

  lookupOrder(): void {
    const id = this.orderIdInput.trim();
    if (!id) return;

    this.validating  = true;
    this.foundOrder  = null;
    this.orderError  = '';

    this.orderSvc.getById(id).subscribe({
      next: (order) => {
        this.validating = false;
        if (order.status !== 'paid') {
          this.orderError = `O pedido ${order.cd} tem o estado "${order.status}". Apenas pedidos pagos podem ser embarcados.`;
        } else {
          this.foundOrder = order;
        }
      },
      error: (err) => {
        this.validating = false;
        if (err.status === 404) {
          this.orderError = 'Pedido não encontrado. Verifique o código ORD-XXXX e tente novamente.';
        } else if (err.status === 403) {
          this.orderError = 'Sem permissão para aceder a este pedido.';
        } else {
          this.orderError = err.error?.message ?? 'Erro ao verificar o pedido.';
        }
      },
    });
  }

  formatAmount(val: string | null): string {
    if (!val) return '—';
    return parseFloat(val).toFixed(2);
  }

  submit(): void {
    if (this.form.invalid || !this.foundOrder) return;
    this.saving = true;

    const v = this.form.value;
    this.svc.create({
      orderId:     this.foundOrder.id,
      origin:      v.origin,
      destination: v.destination,
      eta:         v.eta ? new Date(v.eta).toISOString() : undefined,
    }).subscribe({
      next: (s) => {
        this.snack.open('Embarque criado com sucesso.', 'Fechar', { duration: 3000 });
        this.router.navigate(['/dashboard/operator/shipments', s.id]);
      },
      error: (e) => {
        this.saving = false;
        this.snack.open(e?.error?.message ?? 'Erro ao criar embarque', 'Fechar', { duration: 4000 });
      },
    });
  }
}
