import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanyService } from '../../../../core/services/company.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-company-form',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">business</mat-icon>
          <h2 class="page-title">Registar Empresa</h2>
        </div>
        <div class="breadcrumb">
          <a (click)="back()">Empresas</a>
          <span class="sep">›</span>
          <span>Nova Empresa</span>
        </div>
      </div>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="saving"></mat-progress-bar>

    <mat-card class="card-sm">
      <mat-card-content>

        <div class="card-section">
          <p class="card-section-title">Informação Principal</p>
          <form [formGroup]="form" (ngSubmit)="submit()" class="form">

            <mat-form-field appearance="outline">
              <mat-label>Nome da Empresa *</mat-label>
              <input matInput formControlName="name">
              <mat-error *ngIf="form.get('name')?.hasError('required')">Campo obrigatório</mat-error>
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
              </mat-select>
              <mat-hint>O país determina as regras fiscais aplicadas</mat-hint>
              <mat-error *ngIf="form.get('country')?.hasError('required')">Campo obrigatório</mat-error>
            </mat-form-field>

          </form>
        </div>

        <div class="card-section">
          <p class="card-section-title">Contacto</p>
          <form [formGroup]="form" class="form">

            <mat-form-field appearance="outline">
              <mat-label>Email de Contacto *</mat-label>
              <input matInput formControlName="contactEmail" type="email">
              <mat-error *ngIf="form.get('contactEmail')?.hasError('required')">Campo obrigatório</mat-error>
              <mat-error *ngIf="form.get('contactEmail')?.hasError('email')">Email inválido</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Telefone</mat-label>
              <input matInput formControlName="contactPhone">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Morada</mat-label>
              <input matInput formControlName="address">
            </mat-form-field>

            <div class="form-actions">
              <button mat-button type="button" (click)="back()">Cancelar</button>
              <button mat-raised-button color="primary" type="submit" (click)="submit()" [disabled]="form.invalid || saving">
                <mat-icon>save</mat-icon>
                Registar Empresa
              </button>
            </div>

          </form>
        </div>

      </mat-card-content>
    </mat-card>
  `,
})
export class CompanyFormComponent {
  form: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private svc: CompanyService,
    private auth: AuthService,
    private router: Router,
    private snack: MatSnackBar,
  ) {
    this.form = this.fb.group({
      name:         ['', Validators.required],
      country:      ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: [''],
      address:      [''],
    });
  }

  back(): void {
    const role = this.auth.getCurrentUser()?.role;
    this.router.navigate([`/dashboard/${role}/companies`]);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.svc.create(this.form.value).subscribe({
      next: (c) => {
        this.snack.open('Empresa registada. Aguarda validação.', 'Fechar', { duration: 4000 });
        const role = this.auth.getCurrentUser()?.role;
        this.router.navigate([`/dashboard/${role}/companies`, c.id]);
      },
      error: (err) => {
        this.saving = false;
        this.snack.open(err?.error?.message ?? 'Erro ao registar empresa', 'Fechar', { duration: 4000 });
      },
    });
  }
}
