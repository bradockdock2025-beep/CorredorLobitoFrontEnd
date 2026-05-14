import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../../core/services/product.service';
import { CompanyService } from '../../../../core/services/company.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Company } from '../../../../core/models';

@Component({
  selector: 'app-product-form',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">inventory_2</mat-icon>
          <h2 class="page-title">Novo Produto</h2>
        </div>
        <div class="breadcrumb">
          <a (click)="back()">Produtos</a>
          <span class="sep">›</span>
          <span>Novo Produto</span>
        </div>
      </div>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="saving"></mat-progress-bar>

    <mat-card class="card-sm">
      <mat-card-content>
        <div class="card-section">
          <form [formGroup]="form" (ngSubmit)="submit()" class="form">

            <mat-form-field appearance="outline">
              <mat-label>Nome do Produto *</mat-label>
              <input matInput formControlName="name">
              <mat-error>Campo obrigatório</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Categoria *</mat-label>
              <input matInput formControlName="category" placeholder="ex: general">
              <mat-hint>A categoria determina o imposto no pagamento</mat-hint>
              <mat-error>Campo obrigatório</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Descrição</mat-label>
              <textarea matInput formControlName="description" rows="3"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Empresa *</mat-label>
              <mat-select formControlName="companyId">
                <mat-option *ngFor="let c of activeCompanies" [value]="c.id">
                  {{ c.name }} — {{ c.country | titlecase }}
                </mat-option>
              </mat-select>
              <mat-error>Campo obrigatório</mat-error>
            </mat-form-field>

            <div class="form-actions">
              <button mat-button type="button" (click)="back()">Cancelar</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
                <mat-icon>add</mat-icon>
                Criar Produto
              </button>
            </div>

          </form>
        </div>
      </mat-card-content>
    </mat-card>
  `,
})
export class ProductFormComponent implements OnInit {
  form: FormGroup;
  saving = false;
  activeCompanies: Company[] = [];

  constructor(
    private fb: FormBuilder, private svc: ProductService,
    private companySvc: CompanyService, private auth: AuthService,
    private router: Router, private snack: MatSnackBar,
  ) {
    this.form = this.fb.group({
      name:        ['', Validators.required],
      category:    ['general', Validators.required],
      description: [''],
      companyId:   ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.companySvc.getAll().subscribe((cs) => {
      this.activeCompanies = cs.filter((c) => c.licenseStatus === 'active');
    });
  }

  back(): void { this.router.navigate([`/dashboard/${this.auth.getCurrentUser()?.role}/products`]); }

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.svc.create(this.form.value).subscribe({
      next: (p) => {
        this.snack.open('Produto criado', 'Fechar', { duration: 3000 });
        this.router.navigate([`/dashboard/${this.auth.getCurrentUser()?.role}/products`, p.id]);
      },
      error: (e) => { this.saving = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
    });
  }
}
