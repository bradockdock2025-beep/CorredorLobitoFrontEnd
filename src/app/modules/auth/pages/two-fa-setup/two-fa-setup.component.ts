import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, TwoFASetupResponse } from '../../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

type SetupStep = 'loading' | 'scan' | 'verify' | 'done' | 'error';

@Component({
  selector: 'app-two-fa-setup',
  template: `
    <div class="setup-wrapper">
      <div class="setup-card">

        <div class="setup-header">
          <div class="gov-label">REPÚBLICA DE ANGOLA</div>
          <h1 class="app-title">Corredor do Lobito</h1>
          <p class="app-subtitle">Configuração de Autenticação em 2 Factores</p>
        </div>

        <!-- Loading -->
        <div class="center-block" *ngIf="step === 'loading'">
          <mat-spinner diameter="40"></mat-spinner>
          <p>A gerar QR code...</p>
        </div>

        <!-- Erro ao carregar -->
        <div class="error-block" *ngIf="step === 'error'">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <p>{{ errorMsg }}</p>
          <button mat-raised-button color="primary" (click)="loadSetup()">Tentar novamente</button>
          <button mat-button (click)="goToDashboard()">Ir para o dashboard</button>
        </div>

        <!-- Passo: digitalizar QR ─────────────────────────────────── -->
        <div *ngIf="step === 'scan'">
          <div class="step-label">
            <mat-icon class="step-num">looks_one</mat-icon>
            <span>Digitalize o QR code com o Google Authenticator, Authy ou Microsoft Authenticator</span>
          </div>

          <div class="qr-block">
            <img [src]="setupData!.qrCode" alt="QR Code 2FA" class="qr-img">
          </div>

          <div class="secret-block">
            <p class="secret-label">Ou introduza o código manualmente:</p>
            <code class="secret-code">{{ setupData!.secret }}</code>
          </div>

          <button mat-raised-button color="primary" class="next-btn" (click)="step = 'verify'">
            Já digitalizei → Introduzir código
          </button>
        </div>

        <!-- Passo: verificar código ──────────────────────────────── -->
        <div *ngIf="step === 'verify'">
          <div class="step-label">
            <mat-icon class="step-num">looks_two</mat-icon>
            <span>Introduza o código de 6 dígitos gerado pela app autenticadora</span>
          </div>

          <form [formGroup]="verifyForm" (ngSubmit)="onVerify()" class="verify-form">

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Código do autenticador</mat-label>
              <mat-icon matPrefix>pin</mat-icon>
              <input matInput formControlName="code" type="text" inputmode="numeric"
                     maxlength="6" placeholder="000000" autocomplete="one-time-code">
              <mat-error *ngIf="verifyForm.get('code')?.hasError('required')">Obrigatório</mat-error>
              <mat-error *ngIf="verifyForm.get('code')?.hasError('pattern')">6 dígitos numéricos</mat-error>
            </mat-form-field>

            <div class="error-msg" *ngIf="errorMsg">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMsg }}</span>
            </div>

            <button mat-raised-button color="primary" type="submit" class="next-btn" [disabled]="loading">
              <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
              <span *ngIf="!loading">Activar 2FA</span>
            </button>

            <button mat-button type="button" (click)="step = 'scan'">
              <mat-icon>arrow_back</mat-icon> Voltar ao QR code
            </button>

          </form>
        </div>

        <!-- Concluído ────────────────────────────────────────────── -->
        <div class="done-block" *ngIf="step === 'done'">
          <mat-icon class="done-icon">check_circle</mat-icon>
          <h2>2FA activado com sucesso!</h2>
          <p>A partir de agora, todos os logins nesta conta exigirão o código do autenticador.</p>
          <button mat-raised-button color="primary" (click)="goToDashboard()">
            Ir para o Dashboard
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .setup-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary) 0%, #0d2137 100%);
      padding: 24px;
    }

    .setup-card {
      background: #fff;
      border-radius: 12px;
      padding: 40px 36px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }

    .setup-header { text-align: center; margin-bottom: 28px; }

    .gov-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #c00;
      margin-bottom: 8px;
    }

    .app-title { font-size: 22px; font-weight: 700; color: var(--primary); margin: 0 0 4px; }
    .app-subtitle { font-size: 13px; color: #666; margin: 0; }

    .center-block { text-align: center; padding: 24px 0; }
    .center-block mat-spinner { margin: 0 auto 16px; }

    .error-block { text-align: center; }
    .error-icon { font-size: 48px; width: 48px; height: 48px; color: #c5221f; }

    .step-label {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #e8f0fe;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      font-size: 14px;
      color: var(--primary);
    }
    .step-num { color: var(--primary); flex-shrink: 0; margin-top: 1px; }

    .qr-block { text-align: center; margin: 0 0 16px; }
    .qr-img {
      width: 200px;
      height: 200px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
    }

    .secret-block { text-align: center; margin-bottom: 20px; }
    .secret-label { font-size: 12px; color: #888; margin-bottom: 6px; }
    .secret-code {
      font-family: monospace;
      font-size: 14px;
      background: #f5f5f5;
      padding: 8px 16px;
      border-radius: 6px;
      display: inline-block;
      letter-spacing: 2px;
      word-break: break-all;
    }

    .verify-form { display: flex; flex-direction: column; gap: 4px; }
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
    }

    .next-btn {
      width: 100%;
      height: 44px;
      font-size: 15px;
      font-weight: 600;
      margin-top: 8px;
      background: var(--primary) !important;
    }

    .done-block { text-align: center; padding: 16px 0; }
    .done-icon { font-size: 64px; width: 64px; height: 64px; color: #2e7d32; margin-bottom: 16px; }
    .done-block h2 { color: var(--primary); margin: 0 0 12px; }
    .done-block p { color: #555; font-size: 14px; margin-bottom: 24px; }

    mat-spinner { display: inline-block; }
  `],
})
export class TwoFASetupComponent implements OnInit {
  step: SetupStep = 'loading';
  setupData: TwoFASetupResponse | null = null;
  verifyForm: FormGroup;
  loading  = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  ngOnInit(): void {
    this.loadSetup();
  }

  loadSetup(): void {
    this.step     = 'loading';
    this.errorMsg = '';
    this.auth.setup2FA().subscribe({
      next: (data) => {
        this.setupData = data;
        this.step      = 'scan';
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg = err.error?.message ?? 'Erro ao gerar QR code. Tente novamente.';
        this.step     = 'error';
      },
    });
  }

  onVerify(): void {
    if (this.verifyForm.invalid) return;
    this.loading  = true;
    this.errorMsg = '';

    this.auth.verify2FA(this.verifyForm.value.code).subscribe({
      next: () => {
        this.loading = false;
        this.step    = 'done';
      },
      error: (err: HttpErrorResponse) => {
        this.loading  = false;
        this.errorMsg = err.error?.message ?? 'Código inválido. Verifique o relógio do dispositivo e tente novamente.';
      },
    });
  }

  goToDashboard(): void {
    const user = this.auth.getCurrentUser();
    if (user) {
      this.router.navigate([this.auth.getHomeRoute(user.role)]);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
