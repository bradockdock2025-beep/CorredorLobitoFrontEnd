import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService, RegisterDto } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  template: `
    <div class="register-wrapper">
      <div class="register-card">

        <div class="register-header">
          <div class="gov-label">REPÚBLICA DE ANGOLA</div>
          <h1 class="app-title">Corredor do Lobito</h1>
          <p class="app-subtitle">Registo de Nova Empresa</p>
        </div>

        <!-- Passo 1: tipo de registo -->
        <div class="step-toggle" *ngIf="!submitted">
          <button mat-stroked-button [class.active]="mode === 'new'" (click)="mode = 'new'">
            Nova Empresa
          </button>
          <button mat-stroked-button [class.active]="mode === 'existing'" (click)="mode = 'existing'">
            Juntar a Empresa Existente
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="register-form" *ngIf="!submitted">

          <!-- Dados do utilizador -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nome completo</mat-label>
            <input matInput formControlName="fullName">
            <mat-error *ngIf="form.get('fullName')?.hasError('required')">Obrigatório</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>E-mail</mat-label>
            <input matInput formControlName="email" type="email">
            <mat-error *ngIf="form.get('email')?.hasError('required')">Obrigatório</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">E-mail inválido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Senha</mat-label>
            <input matInput formControlName="password" [type]="showPwd ? 'text' : 'password'">
            <button mat-icon-button matSuffix type="button" (click)="showPwd = !showPwd">
              <mat-icon>{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.get('password')?.hasError('required')">Obrigatório</mat-error>
            <mat-error *ngIf="form.get('password')?.hasError('minlength')">Mínimo 8 caracteres</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Função</mat-label>
            <mat-select formControlName="role">
              <mat-option value="buyer">Comprador (Buyer)</mat-option>
              <mat-option value="producer">Produtor (Producer)</mat-option>
              <mat-option value="operator">Operador Logístico (Operator)</mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('role')?.hasError('required')">Obrigatório</mat-error>
          </mat-form-field>

          <!-- Campos para empresa existente -->
          <ng-container *ngIf="mode === 'existing'">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>ID da Empresa</mat-label>
              <input matInput formControlName="companyId" placeholder="uuid-da-empresa">
              <mat-hint>UUID da empresa à qual pretende juntar-se</mat-hint>
              <mat-error *ngIf="form.get('companyId')?.hasError('required')">Obrigatório</mat-error>
            </mat-form-field>
          </ng-container>

          <!-- Campos para nova empresa -->
          <ng-container *ngIf="mode === 'new'">
            <mat-divider></mat-divider>
            <p class="section-label">Dados da Empresa</p>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nome da Empresa</mat-label>
              <input matInput formControlName="companyName">
              <mat-error *ngIf="form.get('companyName')?.hasError('required')">Obrigatório</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>País</mat-label>
              <mat-select formControlName="companyCountry">
                <mat-option value="angola">Angola</mat-option>
                <mat-option value="zambia">Zâmbia</mat-option>
                <mat-option value="drc">RDC</mat-option>
                <mat-option value="tanzania">Tanzânia</mat-option>
                <mat-option value="zimbabwe">Zimbabwe</mat-option>
                <mat-option value="mozambique">Moçambique</mat-option>
              </mat-select>
              <mat-error *ngIf="form.get('companyCountry')?.hasError('required')">Obrigatório</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>E-mail da Empresa</mat-label>
              <input matInput formControlName="companyEmail" type="email">
              <mat-error *ngIf="form.get('companyEmail')?.hasError('required')">Obrigatório</mat-error>
              <mat-error *ngIf="form.get('companyEmail')?.hasError('email')">E-mail inválido</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Telefone da Empresa</mat-label>
              <input matInput formControlName="companyPhone" placeholder="+244 923 000 001">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Morada</mat-label>
              <input matInput formControlName="companyAddress">
            </mat-form-field>
          </ng-container>

          <div class="error-msg" *ngIf="errorMsg">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMsg }}</span>
          </div>

          <button mat-raised-button color="primary" type="submit" class="submit-btn" [disabled]="loading">
            <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
            <span *ngIf="!loading">Registar</span>
          </button>

          <div class="login-link">
            Já tem conta? <a routerLink="/login">Entrar</a>
          </div>

        </form>

        <!-- Sucesso -->
        <div class="success-block" *ngIf="submitted">
          <mat-icon class="success-icon">check_circle</mat-icon>
          <h2>Registo concluído!</h2>
          <p>A empresa <strong>{{ companyName }}</strong> foi registada e aguarda validação do STAFF e aprovação do STATE.</p>
          <p class="pending-note">Pode fazer login, mas não conseguirá criar pedidos enquanto a licença estiver <em>pendente</em>.</p>
          <button mat-raised-button color="primary" routerLink="/login">Ir para o Login</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .register-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a3c5e 0%, #0d2137 100%);
      padding: 24px;
    }

    .register-card {
      background: #fff;
      border-radius: 12px;
      padding: 40px 36px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }

    .register-header { text-align: center; margin-bottom: 24px; }

    .gov-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #c00;
      margin-bottom: 8px;
    }

    .app-title { font-size: 22px; font-weight: 700; color: #1a3c5e; margin: 0 0 4px; }
    .app-subtitle { font-size: 13px; color: #666; margin: 0; }

    .step-toggle {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
    }
    .step-toggle button { flex: 1; }
    .step-toggle button.active { background: #1a3c5e; color: #fff; }

    .register-form { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }

    .section-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
      margin: 12px 0 4px;
    }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #c5221f;
      font-size: 13px;
      background: #fce8e6;
      padding: 8px 12px;
      border-radius: 6px;
    }

    .submit-btn { width: 100%; height: 44px; font-size: 15px; font-weight: 600; margin-top: 8px; background: #1a3c5e !important; }

    .login-link { text-align: center; font-size: 13px; color: #666; margin-top: 12px; }
    .login-link a { color: #1a3c5e; font-weight: 600; text-decoration: none; }

    .success-block { text-align: center; padding: 16px 0; }
    .success-icon { font-size: 64px; width: 64px; height: 64px; color: #2e7d32; margin-bottom: 16px; }
    .success-block h2 { color: #1a3c5e; margin: 0 0 12px; }
    .success-block p { color: #555; font-size: 14px; }
    .pending-note { background: #fff8e1; padding: 10px; border-radius: 6px; font-size: 13px !important; }

    mat-spinner { display: inline-block; }
    mat-divider { margin: 12px 0 8px; }
  `],
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  mode: 'new' | 'existing' = 'new';
  loading    = false;
  showPwd    = false;
  errorMsg   = '';
  submitted  = false;
  companyName = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      fullName:       ['', Validators.required],
      email:          ['', [Validators.required, Validators.email]],
      password:       ['', [Validators.required, Validators.minLength(8)]],
      role:           ['buyer', Validators.required],
      companyId:      [''],
      companyName:    [''],
      companyCountry: ['angola'],
      companyEmail:   ['', Validators.email],
      companyPhone:   [''],
      companyAddress: [''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;

    if (this.mode === 'existing' && !v.companyId?.trim()) {
      this.errorMsg = 'Indique o ID da empresa existente.';
      return;
    }
    if (this.mode === 'new' && (!v.companyName?.trim() || !v.companyCountry || !v.companyEmail?.trim())) {
      this.errorMsg = 'Preencha o nome, país e e-mail da empresa.';
      return;
    }

    this.loading  = true;
    this.errorMsg = '';

    const dto: RegisterDto = {
      email:    v.email,
      password: v.password,
      fullName: v.fullName,
      role:     v.role,
    };

    if (this.mode === 'existing') {
      dto.companyId = v.companyId;
    } else {
      dto.companyName    = v.companyName;
      dto.companyCountry = v.companyCountry;
      dto.companyEmail   = v.companyEmail;
      if (v.companyPhone)   dto.companyPhone   = v.companyPhone;
      if (v.companyAddress) dto.companyAddress = v.companyAddress;
    }

    this.auth.register(dto).subscribe({
      next: (res) => {
        this.loading     = false;
        this.submitted   = true;
        this.companyName = res.company?.name ?? '';
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        const data = err.error;
        if (Array.isArray(data?.message)) {
          this.errorMsg = data.message.join(' | ');
        } else {
          this.errorMsg = data?.message ?? 'Erro ao registar. Tente novamente.';
        }
      },
    });
  }
}
