import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
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

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">

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

        <div class="login-footer">
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
      background: linear-gradient(135deg, #1a3c5e 0%, #0d2137 100%);
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
      color: #1a3c5e;
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
      background: #1a3c5e !important;
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
    .register-link a { color: #1a3c5e; font-weight: 600; text-decoration: none; }

    mat-spinner { display: inline-block; }
  `],
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
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
        const route = this.auth.getHomeRoute(res.user.role);
        this.router.navigate([route]);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 401) {
          this.errorMsg = 'Credenciais inválidas.';
        } else if (err.status === 403) {
          this.errorMsg = 'Utilizador bloqueado. Contacte o administrador.';
        } else {
          this.errorMsg = 'Erro de ligação ao servidor.';
        }
      },
    });
  }
}
