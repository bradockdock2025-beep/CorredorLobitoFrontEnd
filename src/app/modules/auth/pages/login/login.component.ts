import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-wrapper">
      <div class="login-card">

        <div class="login-header">
          <div class="gov-label">REPÚBLICA DE ANGOLA</div>
          <h1 class="app-title">Corredor do Lobito</h1>
          <p class="app-subtitle">Plataforma Governamental de Comércio Transfronteiriço</p>
        </div>

        <!-- ── PASSO 1: Email + Password ───────────────────────────── -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form" *ngIf="!show2FAInput">

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>E-mail</mat-label>
            <mat-icon matPrefix>email</mat-icon>
            <input matInput formControlName="email" type="email" autocomplete="email">
            <mat-error *ngIf="form.get('email')?.hasError('required')">E-mail é obrigatório</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">E-mail inválido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Senha</mat-label>
            <mat-icon matPrefix>lock</mat-icon>
            <input matInput formControlName="password" [type]="showPassword ? 'text' : 'password'" autocomplete="current-password">
            <button mat-icon-button matSuffix type="button" (click)="showPassword = !showPassword">
              <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.get('password')?.hasError('required')">Senha é obrigatória</mat-error>
          </mat-form-field>

          <div class="error-msg" *ngIf="errorMsg">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMsg }}</span>
          </div>

          <button
            mat-raised-button
            color="primary"
            type="submit"
            class="login-btn"
            [disabled]="loading"
          >
            <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
            <span *ngIf="!loading">Entrar</span>
          </button>

        </form>

        <!-- ── PASSO 2: Código TOTP (2FA activo) ────────────────────── -->
        <div class="twofa-block" *ngIf="show2FAInput">
          <div class="twofa-header">
            <mat-icon class="twofa-icon">security</mat-icon>
            <h2>Autenticação em 2 Factores</h2>
            <p>Abra o Google Authenticator e introduza o código de 6 dígitos.</p>
          </div>

          <form [formGroup]="twoFAForm" (ngSubmit)="onValidate2FA()" class="login-form">

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Código do autenticador</mat-label>
              <mat-icon matPrefix>pin</mat-icon>
              <input matInput formControlName="code" type="text" inputmode="numeric"
                     maxlength="6" placeholder="000000" autocomplete="one-time-code">
              <mat-error *ngIf="twoFAForm.get('code')?.hasError('required')">Código obrigatório</mat-error>
              <mat-error *ngIf="twoFAForm.get('code')?.hasError('pattern')">6 dígitos numéricos</mat-error>
            </mat-form-field>

            <div class="error-msg" *ngIf="errorMsg">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMsg }}</span>
            </div>

            <button mat-raised-button color="primary" type="submit" class="login-btn" [disabled]="loading">
              <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
              <span *ngIf="!loading">Verificar</span>
            </button>

            <button mat-button type="button" class="back-btn" (click)="resetTo2FALogin()">
              <mat-icon>arrow_back</mat-icon> Voltar ao login
            </button>

          </form>

          <p class="lost-device">Perdeu acesso ao autenticador? Contacte o administrador do sistema.</p>
        </div>

        <div class="login-footer" *ngIf="!show2FAInput">
          <span>Sessão válida por 8 horas</span>
          <div class="register-link">
            Empresa nova? <a routerLink="/login/register">Registar aqui</a>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary) 0%, #0d2137 100%);
      padding: 24px;
    }

    .login-card {
      background: #fff;
      border-radius: 12px;
      padding: 40px 36px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }

    .login-header { text-align: center; margin-bottom: 32px; }

    .gov-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #c00;
      margin-bottom: 8px;
    }

    .app-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--primary);
      margin: 0 0 4px;
    }

    .app-subtitle {
      font-size: 13px;
      color: #666;
      margin: 0;
    }

    .login-form { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #c5221f;
      font-size: 13px;
      background: #fce8e6;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 4px;
    }

    .login-btn {
      width: 100%;
      height: 44px;
      font-size: 15px;
      font-weight: 600;
      margin-top: 8px;
      background: var(--primary) !important;
    }

    .login-footer {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      color: #999;
    }

    .register-link {
      margin-top: 8px;
      font-size: 13px;
      color: #666;
    }
    .register-link a { color: var(--primary); font-weight: 600; text-decoration: none; }

    .twofa-block { display: flex; flex-direction: column; gap: 16px; }

    .twofa-header {
      text-align: center;
      margin-bottom: 8px;
    }
    .twofa-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--primary);
      margin-bottom: 8px;
    }
    .twofa-header h2 { color: var(--primary); margin: 0 0 8px; font-size: 20px; }
    .twofa-header p  { color: #555; font-size: 14px; margin: 0; }

    .back-btn { width: 100%; margin-top: 4px; color: #666; }

    .lost-device {
      font-size: 12px;
      color: #999;
      text-align: center;
      margin-top: 8px;
    }

    mat-spinner { display: inline-block; }
  `],
})
export class LoginComponent {
  form: FormGroup;
  twoFAForm: FormGroup;
  loading      = false;
  showPassword = false;
  errorMsg     = '';
  show2FAInput = false;
  private tempToken = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    this.twoFAForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading  = true;
    this.errorMsg = '';

    const { email, password } = this.form.value;

    this.auth.login(email, password).subscribe({
      next: (res) => {
        this.loading = false;

        if (!res.requires2fa) {
          // Cenário 1 — login completo, sem 2FA
          this.auth.saveSession(res.access_token!, res.user!);
          this.router.navigate([this.auth.getHomeRoute(res.user!.role)]);

        } else if (res.twoFactorSetup) {
          // Cenário 2 — 2FA obrigatório mas não configurado ainda
          this.auth.saveSession(res.access_token!, res.user!);
          this.router.navigate(['/login/2fa/setup']);

        } else {
          // Cenário 3 — 2FA activo → pedir código TOTP
          this.tempToken   = res.tempToken!;
          this.show2FAInput = true;
        }
      },
      error: (err: { status: number; error?: { message?: string; retryAfter?: number } }) => {
        this.loading = false;
        if (err.status === 401) {
          this.errorMsg = 'Credenciais inválidas.';
        } else if (err.status === 403) {
          this.errorMsg = 'Utilizador bloqueado. Contacte o administrador.';
        } else if (err.status === 429) {
          const seconds = err.error?.retryAfter ?? 60;
          this.errorMsg = `Demasiadas tentativas. Aguarde ${seconds} segundos.`;
        } else {
          this.errorMsg = 'Erro de ligação ao servidor.';
        }
      },
    });
  }

  onValidate2FA(): void {
    if (this.twoFAForm.invalid) return;
    this.loading  = true;
    this.errorMsg = '';

    const { code } = this.twoFAForm.value;

    this.auth.validate2FA(this.tempToken, code).subscribe({
      next: (res) => {
        this.loading = false;
        this.auth.saveSession(res.access_token, res.user);
        this.router.navigate([this.auth.getHomeRoute(res.user.role)]);
      },
      error: (err: { status: number }) => {
        this.loading = false;
        if (err.status === 401) {
          this.errorMsg = 'Código inválido ou token expirado. Tente novamente desde o início.';
        } else {
          this.errorMsg = 'Erro ao validar código. Tente novamente.';
        }
      },
    });
  }

  resetTo2FALogin(): void {
    this.show2FAInput = false;
    this.tempToken    = '';
    this.errorMsg     = '';
    this.twoFAForm.reset();
  }
}
