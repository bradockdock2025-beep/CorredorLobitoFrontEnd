import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService, RegisterDto } from '../../../../core/services/auth.service';
import { CompanyService } from '../../../../core/services/company.service';
import { CompanyCountry, CompanyType } from '../../../../core/models';

type RegisterStep = 'user' | 'company' | 'done';

@Component({
  selector: 'app-register',
  template: `
    <div class="page">

      <!-- ── Painel esquerdo — marca ──────────────────────────────── -->
      <div class="brand-panel">
        <div class="brand-inner">
          <div class="gov-chip">REPÚBLICA DE ANGOLA</div>

          <div class="brand-logo">
            <mat-icon class="logo-icon">route</mat-icon>
          </div>

          <h1 class="brand-title">Corredor do Lobito</h1>
          <p class="brand-sub">Plataforma Governamental de<br>Comércio Transfronteiriço</p>

          <div class="brand-features">
            <div class="feature-item">
              <mat-icon>verified</mat-icon>
              <span>Licenciamento digital integrado</span>
            </div>
            <div class="feature-item">
              <mat-icon>swap_horiz</mat-icon>
              <span>6 países do Corredor do Lobito</span>
            </div>
            <div class="feature-item">
              <mat-icon>security</mat-icon>
              <span>Plataforma governamental segura</span>
            </div>
            <div class="feature-item">
              <mat-icon>track_changes</mat-icon>
              <span>Rastreio de embarques em tempo real</span>
            </div>
          </div>

          <div class="brand-footer">
            Já tem conta?
            <a routerLink="/login" class="brand-link">Entrar aqui</a>
          </div>
        </div>
      </div>

      <!-- ── Painel direito — formulário ─────────────────────────── -->
      <div class="form-panel">
        <div class="form-inner">

          <!-- Indicador de progresso -->
          <div class="stepper" *ngIf="step !== 'done'">
            <div class="step" [class.active]="step === 'user'" [class.completed]="step === 'company'">
              <div class="step-dot">
                <mat-icon *ngIf="step === 'company'">check</mat-icon>
                <span *ngIf="step === 'user'">1</span>
              </div>
              <span class="step-label-text">Conta</span>
            </div>
            <div class="step-connector" [class.filled]="step === 'company'"></div>
            <div class="step" [class.active]="step === 'company'">
              <div class="step-dot"><span>2</span></div>
              <span class="step-label-text">Empresa</span>
            </div>
          </div>

          <!-- ── PASSO 1: Dados do utilizador ──────────────────── -->
          <ng-container *ngIf="step === 'user'">
            <div class="form-heading">
              <h2>Criar conta</h2>
              <p>Preencha os seus dados pessoais para começar.</p>
            </div>

            <form [formGroup]="userForm" (ngSubmit)="onSubmitUser()" class="field-stack">

              <div class="field-group">
                <label class="field-label">Nome completo <span class="req">*</span></label>
                <mat-form-field appearance="outline" class="full-width">
                  <input matInput formControlName="fullName" placeholder="João Silva">
                  <mat-error *ngIf="userForm.get('fullName')?.hasError('required')">Obrigatório</mat-error>
                </mat-form-field>
              </div>

              <div class="field-group">
                <label class="field-label">E-mail <span class="req">*</span></label>
                <mat-form-field appearance="outline" class="full-width">
                  <input matInput formControlName="email" type="email" placeholder="email@empresa.ao">
                  <mat-error *ngIf="userForm.get('email')?.hasError('required')">Obrigatório</mat-error>
                  <mat-error *ngIf="userForm.get('email')?.hasError('email')">E-mail inválido</mat-error>
                </mat-form-field>
              </div>

              <div class="field-group">
                <label class="field-label">Telefone <span class="optional">(opcional)</span></label>
                <mat-form-field appearance="outline" class="full-width">
                  <input matInput formControlName="phone" placeholder="+244 923 000 001">
                </mat-form-field>
              </div>

              <div class="field-row">
                <div class="field-group flex-1">
                  <label class="field-label">Senha <span class="req">*</span></label>
                  <mat-form-field appearance="outline" class="full-width">
                    <input matInput formControlName="password" [type]="showPwd ? 'text' : 'password'" placeholder="Mín. 12 caracteres">
                    <button mat-icon-button matSuffix type="button" (click)="showPwd = !showPwd" tabindex="-1">
                      <mat-icon>{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                    <mat-error *ngIf="userForm.get('password')?.hasError('required')">Obrigatório</mat-error>
                    <mat-error *ngIf="userForm.get('password')?.hasError('minlength')">Mínimo 12 caracteres</mat-error>
                  </mat-form-field>
                </div>

                <div class="field-group flex-1">
                  <label class="field-label">Função <span class="req">*</span></label>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-select formControlName="role">
                      <mat-option value="buyer">Comprador</mat-option>
                      <mat-option value="producer">Produtor</mat-option>
                      <mat-option value="operator">Operador Logístico</mat-option>
                    </mat-select>
                    <mat-error>Obrigatório</mat-error>
                  </mat-form-field>
                </div>
              </div>

              <div class="error-banner" *ngIf="errorMsg">
                <mat-icon>error_outline</mat-icon>
                <span>{{ errorMsg }}</span>
              </div>

              <button mat-flat-button class="cta-btn" type="submit" [disabled]="loading">
                <mat-spinner diameter="18" *ngIf="loading"></mat-spinner>
                <span *ngIf="!loading">Continuar</span>
                <mat-icon *ngIf="!loading">arrow_forward</mat-icon>
              </button>

            </form>
          </ng-container>

          <!-- ── PASSO 2: Dados da empresa ─────────────────────── -->
          <ng-container *ngIf="step === 'company'">
            <div class="form-heading">
              <h2>Dados da empresa</h2>
              <p>Registe a empresa para iniciar o processo de licenciamento.</p>
            </div>

            <form [formGroup]="companyForm" (ngSubmit)="onSubmitCompany()" class="field-stack">

              <div class="field-group">
                <label class="field-label">Nome da empresa <span class="req">*</span></label>
                <mat-form-field appearance="outline" class="full-width">
                  <input matInput formControlName="name" placeholder="Ex: Empresa XYZ Lda">
                  <mat-error>Obrigatório</mat-error>
                </mat-form-field>
              </div>

              <div class="field-row">
                <div class="field-group flex-1">
                  <label class="field-label">País <span class="req">*</span></label>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-select formControlName="country">
                      <mat-option value="angola">Angola</mat-option>
                      <mat-option value="zambia">Zâmbia</mat-option>
                      <mat-option value="drc">RDC</mat-option>
                      <mat-option value="tanzania">Tanzânia</mat-option>
                      <mat-option value="zimbabwe">Zimbabwe</mat-option>
                      <mat-option value="mozambique">Moçambique</mat-option>
                    </mat-select>
                    <mat-error>Obrigatório</mat-error>
                  </mat-form-field>
                </div>

                <div class="field-group flex-1">
                  <label class="field-label">Tipo de empresa</label>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-select formControlName="companyType" placeholder="Seleccionar">
                      <mat-option value="">Não especificado</mat-option>
                      <mat-option value="importer">Importador</mat-option>
                      <mat-option value="exporter">Exportador</mat-option>
                      <mat-option value="mixed">Misto</mat-option>
                      <mat-option value="producer">Produtor</mat-option>
                      <mat-option value="logistics">Logística</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
              </div>

              <div class="field-group">
                <label class="field-label">E-mail de contacto <span class="req">*</span></label>
                <mat-form-field appearance="outline" class="full-width">
                  <input matInput formControlName="contactEmail" type="email" placeholder="geral@empresa.ao">
                  <mat-error *ngIf="companyForm.get('contactEmail')?.hasError('required')">Obrigatório</mat-error>
                  <mat-error *ngIf="companyForm.get('contactEmail')?.hasError('email')">E-mail inválido</mat-error>
                </mat-form-field>
              </div>

              <div class="field-row">
                <div class="field-group flex-1">
                  <label class="field-label">Telefone</label>
                  <mat-form-field appearance="outline" class="full-width">
                    <input matInput formControlName="contactPhone" placeholder="+244 923 000 002">
                  </mat-form-field>
                </div>

                <div class="field-group flex-1">
                  <label class="field-label">Morada</label>
                  <mat-form-field appearance="outline" class="full-width">
                    <input matInput formControlName="address" placeholder="Rua, n.º, cidade">
                  </mat-form-field>
                </div>
              </div>

              <div class="error-banner" *ngIf="errorMsg">
                <mat-icon>error_outline</mat-icon>
                <span>{{ errorMsg }}</span>
              </div>

              <button mat-flat-button class="cta-btn" type="submit" [disabled]="loading">
                <mat-spinner diameter="18" *ngIf="loading"></mat-spinner>
                <span *ngIf="!loading">Registar empresa</span>
                <mat-icon *ngIf="!loading">check</mat-icon>
              </button>

              <button mat-button type="button" class="skip-btn" (click)="skipCompany()">
                Associar empresa mais tarde
              </button>

            </form>
          </ng-container>

          <!-- ── Sucesso ────────────────────────────────────────── -->
          <div class="done-block" *ngIf="step === 'done'">
            <div class="done-icon-wrap">
              <mat-icon>check_circle</mat-icon>
            </div>
            <h2>Registo concluído!</h2>

            <ng-container *ngIf="companyName">
              <p>A empresa <strong>{{ companyName }}</strong> foi registada e aguarda validação do STAFF e aprovação do STATE.</p>
              <div class="info-note">
                <mat-icon>info</mat-icon>
                <span>Pode fazer login, mas não conseguirá criar pedidos enquanto a licença estiver pendente.</span>
              </div>
            </ng-container>

            <ng-container *ngIf="!companyName">
              <p>A sua conta foi criada com sucesso. Pode associar uma empresa posteriormente.</p>
            </ng-container>

            <a routerLink="/login" mat-flat-button class="cta-btn done-link">
              Ir para o Login
              <mat-icon>login</mat-icon>
            </a>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }

    /* ── Layout ───────────────────────────────────────────────────── */
    .page {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* ── Painel esquerdo — marca ──────────────────────────────────── */
    .brand-panel {
      width: 38%;
      min-width: 280px;
      background: linear-gradient(160deg, var(--primary) 0%, #0d2137 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 36px;
      position: relative;
      overflow: hidden;
    }

    .brand-panel::before {
      content: '';
      position: absolute;
      top: -80px;
      right: -80px;
      width: 240px;
      height: 240px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
    }

    .brand-panel::after {
      content: '';
      position: absolute;
      bottom: -60px;
      left: -60px;
      width: 180px;
      height: 180px;
      border-radius: 50%;
      background: rgba(255,255,255,0.03);
    }

    .brand-inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
      max-width: 320px;
    }

    .gov-chip {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: #ef5350;
      background: rgba(239,83,80,0.12);
      border: 1px solid rgba(239,83,80,0.25);
      border-radius: 4px;
      padding: 4px 10px;
      display: inline-block;
      width: fit-content;
    }

    .brand-logo {
      width: 56px;
      height: 56px;
      background: rgba(255,255,255,0.1);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #fff;
    }

    .brand-title {
      font-size: 26px;
      font-weight: 700;
      color: #fff;
      margin: 0;
      line-height: 1.2;
    }

    .brand-sub {
      font-size: 13px;
      color: rgba(255,255,255,0.55);
      margin: 0;
      line-height: 1.6;
    }

    .brand-features {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-top: 8px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      color: rgba(255,255,255,0.75);
      font-size: 13px;
    }

    .feature-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(255,255,255,0.45);
      flex-shrink: 0;
    }

    .brand-footer {
      margin-top: 16px;
      font-size: 13px;
      color: rgba(255,255,255,0.45);
      border-top: 1px solid rgba(255,255,255,0.08);
      padding-top: 20px;
    }

    .brand-link {
      color: #90caf9;
      font-weight: 600;
      text-decoration: none;
      margin-left: 4px;
    }
    .brand-link:hover { text-decoration: underline; }

    /* ── Painel direito — formulário ──────────────────────────────── */
    .form-panel {
      flex: 1;
      background: #fafafa;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      overflow-y: auto;
      padding: 40px 24px;
    }

    .form-inner {
      width: 100%;
      max-width: 500px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    /* ── Stepper ──────────────────────────────────────────────────── */
    .stepper {
      display: flex;
      align-items: center;
      gap: 0;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .step-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #e0e0e0;
      color: #bbb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      transition: all 0.25s;
    }

    .step.active .step-dot {
      background: var(--primary);
      color: #fff;
    }

    .step.completed .step-dot {
      background: #2e7d32;
      color: #fff;
    }

    .step-label-text {
      font-size: 11px;
      color: #bbb;
      font-weight: 500;
    }

    .step.active .step-label-text   { color: var(--primary); font-weight: 700; }
    .step.completed .step-label-text { color: #2e7d32; }

    .step-connector {
      flex: 1;
      height: 2px;
      background: #e0e0e0;
      margin: 0 8px 16px;
      transition: background 0.3s;
    }

    .step-connector.filled { background: #2e7d32; }

    /* ── Cabeçalho do formulário ──────────────────────────────────── */
    .form-heading h2 {
      font-size: 22px;
      font-weight: 700;
      color: #1a2e42;
      margin: 0 0 6px;
    }

    .form-heading p {
      font-size: 14px;
      color: #888;
      margin: 0;
    }

    /* ── Campos ───────────────────────────────────────────────────── */
    .field-stack { display: flex; flex-direction: column; gap: 2px; }

    .field-group { display: flex; flex-direction: column; gap: 0; }

    .field-row {
      display: flex;
      gap: 16px;
    }

    .flex-1 { flex: 1; min-width: 0; }

    .field-label {
      font-size: 12px;
      font-weight: 600;
      color: #555;
      margin-bottom: 4px;
      display: block;
    }

    .req { color: #e53935; margin-left: 2px; }

    .optional { font-weight: 400; color: #aaa; }

    .full-width { width: 100%; }

    /* Reduzir padding interno do mat-form-field */
    ::ng-deep .mat-form-field-wrapper { padding-bottom: 12px !important; }
    ::ng-deep .mat-form-field-outline { border-radius: 8px !important; }
    ::ng-deep .mat-form-field-outline-start { border-radius: 8px 0 0 8px !important; }
    ::ng-deep .mat-form-field-outline-end   { border-radius: 0 8px 8px 0 !important; }
    ::ng-deep .mat-form-field-flex { height: 44px !important; align-items: center !important; }
    ::ng-deep .mat-select-trigger, ::ng-deep .mat-input-element { font-size: 14px !important; }

    /* ── Erro ─────────────────────────────────────────────────────── */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fce8e6;
      color: #c5221f;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-top: 4px;
    }
    .error-banner mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }

    /* ── Botões ───────────────────────────────────────────────────── */
    .cta-btn {
      height: 46px !important;
      background: var(--primary) !important;
      color: #fff !important;
      border-radius: 10px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      margin-top: 8px;
      width: 100%;
      text-decoration: none;
    }

    .skip-btn {
      width: 100%;
      color: #aaa !important;
      font-size: 13px !important;
    }

    /* ── Sucesso ──────────────────────────────────────────────────── */
    .done-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 16px;
      padding: 32px 0;
    }

    .done-icon-wrap {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #e8f5e9;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .done-icon-wrap mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #2e7d32;
    }

    .done-block h2 {
      font-size: 22px;
      font-weight: 700;
      color: #1a2e42;
      margin: 0;
    }

    .done-block p {
      font-size: 14px;
      color: #555;
      margin: 0;
      max-width: 380px;
    }

    .info-note {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: #fff8e1;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 13px;
      color: #795548;
      text-align: left;
      max-width: 400px;
    }
    .info-note mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }

    .done-link { width: 280px; margin-top: 8px; }

    mat-spinner { display: inline-block; }
  `],
})
export class RegisterComponent implements OnInit {
  userForm!:    FormGroup;
  companyForm!: FormGroup;

  step:        RegisterStep = 'user';
  loading     = false;
  showPwd     = false;
  errorMsg    = '';
  companyName = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private companySvc: CompanyService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      email:    ['', [Validators.required, Validators.email]],
      phone:    [''],
      password: ['', [Validators.required, Validators.minLength(12)]],
      role:     ['buyer', Validators.required],
    });

    this.companyForm = this.fb.group({
      name:         ['', Validators.required],
      country:      ['angola', Validators.required],
      companyType:  [''],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: [''],
      address:      [''],
    });
  }

  onSubmitUser(): void {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }

    this.loading  = true;
    this.errorMsg = '';

    const v = this.userForm.value;
    const dto: RegisterDto = {
      email:    v.email,
      password: v.password,
      fullName: v.fullName,
      role:     v.role,
    };
    if (v.phone?.trim()) dto.phone = v.phone.trim();

    this.auth.register(dto).subscribe({
      next: () => { this.loading = false; this.step = 'company'; },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        const data = err.error;
        this.errorMsg = Array.isArray(data?.message) ? data.message.join(' | ') : (data?.message ?? 'Erro ao registar.');
      },
    });
  }

  onSubmitCompany(): void {
    if (this.companyForm.invalid) { this.companyForm.markAllAsTouched(); return; }

    this.loading  = true;
    this.errorMsg = '';

    const v = this.companyForm.value;
    const payload: {
      name:          string;
      country:       CompanyCountry;
      contactEmail:  string;
      companyType?:  CompanyType;
      contactPhone?: string;
      address?:      string;
    } = {
      name:         v.name,
      country:      v.country as CompanyCountry,
      contactEmail: v.contactEmail,
    };
    if (v.companyType)  payload.companyType  = v.companyType as CompanyType;
    if (v.contactPhone) payload.contactPhone = v.contactPhone;
    if (v.address)      payload.address      = v.address;

    this.companySvc.create(payload).subscribe({
      next: (company) => { this.loading = false; this.companyName = company.name; this.step = 'done'; },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        const data = err.error;
        this.errorMsg = Array.isArray(data?.message) ? data.message.join(' | ') : (data?.message ?? 'Erro ao criar empresa.');
      },
    });
  }

  skipCompany(): void {
    this.companyName = '';
    this.step        = 'done';
  }
}
