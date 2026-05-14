import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaxService } from '../../../../core/services/tax.service';

@Component({
  selector: 'app-tax-form',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">account_balance</mat-icon>
          <h2 class="page-title">Nova Regra Fiscal</h2>
        </div>
        <div class="breadcrumb">
          <a (click)="router.navigate(['/dashboard/state/taxes'])">Impostos</a>
          <span class="sep">›</span>
          <span>Nova Regra</span>
        </div>
      </div>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="saving"></mat-progress-bar>

    <mat-card class="card-sm">
      <mat-card-content>

        <div class="card-section">
          <p class="card-section-title">Identificação</p>
          <form [formGroup]="form" class="form">

            <mat-form-field appearance="outline">
              <mat-label>Nome *</mat-label>
              <input matInput formControlName="name">
              <mat-error>Campo obrigatório</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>País *</mat-label>
              <mat-select formControlName="country">
                <mat-option value="angola">Angola</mat-option>
                <mat-option value="zambia">Zâmbia</mat-option>
                <mat-option value="drc">RDC</mat-option>
                <mat-option value="tanzania">Tanzânia</mat-option>
                <mat-option value="zimbabwe">Zimbabwe</mat-option>
                <mat-option value="mozambique">Moçambique</mat-option>
                <mat-option value="global">Global (fallback)</mat-option>
              </mat-select>
              <mat-error>Campo obrigatório</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Categoria *</mat-label>
              <input matInput formControlName="category" placeholder="ex: general">
              <mat-error>Campo obrigatório</mat-error>
            </mat-form-field>

          </form>
        </div>

        <div class="card-section">
          <p class="card-section-title">Taxa</p>
          <form [formGroup]="form" (ngSubmit)="submit()" class="form">

            <mat-form-field appearance="outline">
              <mat-label>Taxa (%) *</mat-label>
              <input matInput type="number" formControlName="rate" min="0" max="100" step="0.1">
              <mat-hint>Introduza a percentagem: ex: 14 para 14%</mat-hint>
              <mat-error>Campo obrigatório</mat-error>
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Vigência a partir de *</mat-label>
                <input matInput [matDatepicker]="dp1" formControlName="effectiveFrom">
                <mat-datepicker-toggle matSuffix [for]="dp1"></mat-datepicker-toggle>
                <mat-datepicker #dp1></mat-datepicker>
                <mat-error>Campo obrigatório</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Vigência até (opcional)</mat-label>
                <input matInput [matDatepicker]="dp2" formControlName="effectiveTo">
                <mat-datepicker-toggle matSuffix [for]="dp2"></mat-datepicker-toggle>
                <mat-datepicker #dp2></mat-datepicker>
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button mat-button type="button" (click)="router.navigate(['/dashboard/state/taxes'])">Cancelar</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
                <mat-icon>add</mat-icon>
                Criar Regra Fiscal
              </button>
            </div>

          </form>
        </div>

      </mat-card-content>
    </mat-card>
  `,
})
export class TaxFormComponent {
  form: FormGroup;
  saving = false;

  constructor(private fb: FormBuilder, private svc: TaxService, public router: Router, private snack: MatSnackBar) {
    this.form = this.fb.group({
      name:          ['', Validators.required],
      country:       ['', Validators.required],
      category:      ['general', Validators.required],
      rate:          [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      effectiveFrom: [null, Validators.required],
      effectiveTo:   [null],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;
    this.svc.create({
      name: v.name, country: v.country, category: v.category,
      rate: v.rate / 100,
      effectiveFrom: new Date(v.effectiveFrom).toISOString(),
      effectiveTo:   v.effectiveTo ? new Date(v.effectiveTo).toISOString() : undefined,
      isActive: true,
    }).subscribe({
      next: () => {
        this.snack.open('Regra fiscal criada', 'Fechar', { duration: 3000 });
        this.router.navigate(['/dashboard/state/taxes']);
      },
      error: (e) => { this.saving = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
    });
  }
}
