import { Component, OnInit } from '@angular/core';
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

    <mat-progress-bar mode="indeterminate" *ngIf="saving"></mat-progress-bar>

    <mat-card class="card-sm">
      <mat-card-content>
        <div class="card-section">
          <form [formGroup]="form" (ngSubmit)="submit()" class="form">

            <mat-form-field appearance="outline">
              <mat-label>Pedido Pago *</mat-label>
              <mat-select formControlName="orderId">
                <mat-option *ngFor="let o of paidOrders" [value]="o.id">
                  {{ o.id | slice:0:8 }}... — {{ o.company?.name ?? '—' }}
                </mat-option>
              </mat-select>
              <mat-error>Campo obrigatório</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Origem *</mat-label>
              <input matInput formControlName="origin">
              <mat-hint>ex: Porto do Lobito, Angola</mat-hint>
              <mat-error>Campo obrigatório</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Destino *</mat-label>
              <input matInput formControlName="destination">
              <mat-hint>ex: Lusaka, Zâmbia</mat-hint>
              <mat-error>Campo obrigatório</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>ETA (data prevista de chegada)</mat-label>
              <input matInput [matDatepicker]="dp" formControlName="eta">
              <mat-datepicker-toggle matSuffix [for]="dp"></mat-datepicker-toggle>
              <mat-datepicker #dp></mat-datepicker>
            </mat-form-field>

            <div class="form-actions">
              <button mat-button type="button" (click)="router.navigate(['/dashboard/operator/shipments'])">Cancelar</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
                <mat-icon>local_shipping</mat-icon>
                Criar Embarque
              </button>
            </div>

          </form>
        </div>
      </mat-card-content>
    </mat-card>
  `,
})
export class ShipmentFormComponent implements OnInit {
  form: FormGroup;
  saving = false;
  paidOrders: Order[] = [];

  constructor(
    private fb: FormBuilder, private svc: ShipmentService,
    private orderSvc: OrderService, public router: Router, private snack: MatSnackBar,
  ) {
    this.form = this.fb.group({
      orderId:     ['', Validators.required],
      origin:      ['', Validators.required],
      destination: ['', Validators.required],
      eta:         [null],
    });
  }

  ngOnInit(): void {
    this.orderSvc.getAll().subscribe((os) => { this.paidOrders = os.filter((o) => o.status === 'paid'); });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;
    this.svc.create({ orderId: v.orderId, origin: v.origin, destination: v.destination, eta: v.eta ? new Date(v.eta).toISOString() : undefined }).subscribe({
      next: (s) => {
        this.snack.open('Embarque criado', 'Fechar', { duration: 3000 });
        this.router.navigate(['/dashboard/operator/shipments', s.id]);
      },
      error: (e) => { this.saving = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
    });
  }
}
