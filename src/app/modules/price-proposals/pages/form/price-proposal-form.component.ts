import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PriceProposalService } from '../../../../core/services/price-proposal.service';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models';

@Component({
  selector: 'app-price-proposal-form',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">price_change</mat-icon>
          <h2 class="page-title">Nova Price Proposal</h2>
        </div>
        <div class="breadcrumb">
          <a (click)="router.navigate(['/dashboard/specialist/price-proposals'])">Price Proposals</a>
          <span class="sep">›</span>
          <span>Nova Proposta</span>
        </div>
      </div>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="saving"></mat-progress-bar>

    <mat-card class="card-sm">
      <mat-card-content>
        <div class="card-section">
          <form [formGroup]="form" (ngSubmit)="submit()" class="form">

            <mat-form-field appearance="outline">
              <mat-label>Produto *</mat-label>
              <mat-select formControlName="productId">
                <mat-option *ngFor="let p of publishedProducts" [value]="p.id">{{ p.name }}</mat-option>
              </mat-select>
              <mat-error>Campo obrigatório</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Preço Proposto *</mat-label>
              <input matInput type="number" formControlName="proposedPrice" min="0.01" step="0.01">
              <mat-hint>Valor em USD</mat-hint>
              <mat-error>Campo obrigatório</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Justificação</mat-label>
              <textarea matInput formControlName="justification" rows="3"></textarea>
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Válida de</mat-label>
                <input matInput [matDatepicker]="dp1" formControlName="validFrom">
                <mat-datepicker-toggle matSuffix [for]="dp1"></mat-datepicker-toggle>
                <mat-datepicker #dp1></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Válida até</mat-label>
                <input matInput [matDatepicker]="dp2" formControlName="validTo">
                <mat-datepicker-toggle matSuffix [for]="dp2"></mat-datepicker-toggle>
                <mat-datepicker #dp2></mat-datepicker>
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button mat-button type="button" (click)="router.navigate(['/dashboard/specialist/price-proposals'])">Cancelar</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
                <mat-icon>save</mat-icon>
                Guardar como Rascunho
              </button>
            </div>

          </form>
        </div>
      </mat-card-content>
    </mat-card>
  `,
})
export class PriceProposalFormComponent implements OnInit {
  form: FormGroup;
  saving = false;
  publishedProducts: Product[] = [];

  constructor(
    private fb: FormBuilder, private svc: PriceProposalService,
    private productSvc: ProductService, public router: Router, private snack: MatSnackBar,
  ) {
    this.form = this.fb.group({
      productId:     ['', Validators.required],
      proposedPrice: [null, [Validators.required, Validators.min(0.01)]],
      currency:      ['USD'],
      justification: [''],
      validFrom:     [null],
      validTo:       [null],
    });
  }

  ngOnInit(): void {
    this.productSvc.getAll().subscribe((ps) => {
      this.publishedProducts = ps.filter((p) => p.status === 'published_official');
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;
    this.svc.create({
      productId:     v.productId,
      proposedPrice: v.proposedPrice,
      currency:      'USD',
      justification: v.justification || undefined,
      validFrom:     v.validFrom ? new Date(v.validFrom).toISOString() : undefined,
      validTo:       v.validTo   ? new Date(v.validTo).toISOString()   : undefined,
    }).subscribe({
      next: (p) => {
        this.snack.open('Proposta criada como rascunho', 'Fechar', { duration: 3000 });
        this.router.navigate(['/dashboard/specialist/price-proposals', p.id]);
      },
      error: (e) => { this.saving = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
    });
  }
}
