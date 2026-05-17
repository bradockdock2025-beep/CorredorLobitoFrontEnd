import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanyService } from '../../../../core/services/company.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PdfService } from '../../../../core/services/pdf.service';
import { Company, Role } from '../../../../core/models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-company-detail',
  template: `

    <mat-progress-bar mode="indeterminate" *ngIf="loading" class="detail-progress"></mat-progress-bar>

    <!-- Skeleton -->
    <ng-container *ngIf="loading && !company">
      <div class="detail-header">
        <div class="detail-title-group">
          <nav class="breadcrumb"><span>Empresas</span><mat-icon class="bc-sep">chevron_right</mat-icon><span>A carregar…</span></nav>
          <div class="detail-title-row">
            <mat-icon class="page-icon">business</mat-icon>
            <div class="sk sk-title"></div>
          </div>
        </div>
      </div>
      <div class="detail-2col">
        <mat-card><mat-card-content class="card-section">
          <div class="sk sk-label"></div>
          <div class="detail-grid"><div class="sk sk-field" *ngFor="let i of [1,2,3,4,5,6]"></div></div>
        </mat-card-content></mat-card>
        <mat-card><mat-card-content class="card-section">
          <div class="sk sk-label"></div>
          <div class="sk sk-field" *ngFor="let i of [1,2,3]"></div>
        </mat-card-content></mat-card>
      </div>
    </ng-container>

    <!-- Error -->
    <div class="error-state" *ngIf="!loading && !company && loadError">
      <mat-icon>error_outline</mat-icon>
      <p>Não foi possível carregar a empresa.</p>
      <button mat-stroked-button (click)="reload()"><mat-icon>refresh</mat-icon> Tentar novamente</button>
    </div>

    <!-- Conteúdo -->
    <ng-container *ngIf="company">

      <!-- Banner de acção requerida STATE ──────────────────────────── -->
      <div class="action-banner" *ngIf="role === 'state' && company.licenseStatus === 'under_review'">
        <mat-icon>gavel</mat-icon>
        <div>
          <strong>Decisão Pendente</strong>
          <span>Esta empresa foi encaminhada pelo STAFF e aguarda a sua aprovação ou rejeição.</span>
        </div>
        <div class="banner-actions">
          <button mat-stroked-button class="banner-btn-reject" (click)="rejectLicense()">
            <mat-icon>block</mat-icon> Rejeitar
          </button>
          <button mat-raised-button class="banner-btn-approve" (click)="approveLicense()">
            <mat-icon>verified</mat-icon> Aprovar Licença
          </button>
        </div>
      </div>

      <!-- Banner de acção requerida STAFF pending ───────────────────── -->
      <div class="action-banner action-banner-staff" *ngIf="role === 'staff' && company.licenseStatus === 'pending'">
        <mat-icon>assignment</mat-icon>
        <div>
          <strong>Validação de Documentação Pendente</strong>
          <span>Valide a documentação desta empresa antes de a encaminhar ao STATE.</span>
        </div>
      </div>

      <!-- Banner STAFF under_review → encaminhar ───────────────────── -->
      <div class="action-banner action-banner-staff" *ngIf="role === 'staff' && company.licenseStatus === 'under_review'">
        <mat-icon>send</mat-icon>
        <div>
          <strong>Documentação Validada</strong>
          <span>Pode agora encaminhar esta empresa ao STATE para decisão de licenciamento.</span>
        </div>
        <div class="banner-actions">
          <button mat-raised-button class="banner-btn-approve" (click)="forwardToState()">
            <mat-icon>send</mat-icon> Encaminhar ao STATE
          </button>
        </div>
      </div>

      <!-- Header ───────────────────────────────────────────────────── -->
      <div class="detail-header">
        <div class="detail-title-group">
          <nav class="breadcrumb">
            <a (click)="back()">Empresas</a>
            <mat-icon class="bc-sep">chevron_right</mat-icon>
            <span>{{ company.cd }}</span>
          </nav>
          <div class="detail-title-row">
            <mat-icon class="page-icon">business</mat-icon>
            <h1 class="detail-title">{{ company.name }}</h1>
            <app-status-badge [status]="company.licenseStatus"></app-status-badge>
            <span class="id-text">{{ company.cd }}</span>
          </div>
        </div>

        <!-- Acções inline no header (secundárias) -->
        <div class="detail-actions">

          <!-- STAFF: pending → validar docs -->
          <ng-container *ngIf="role === 'staff' && company.licenseStatus === 'pending'">
            <button mat-stroked-button (click)="validateDocs(false)">
              <mat-icon>close</mat-icon> Devolver para Correcção
            </button>
            <button mat-raised-button color="primary" (click)="validateDocs(true)">
              <mat-icon>check</mat-icon> Validar Documentação
            </button>
          </ng-container>

          <!-- STATE: active → suspender + revogar -->
          <ng-container *ngIf="role === 'state' && company.licenseStatus === 'active'">
            <button mat-stroked-button (click)="revoke()">
              <mat-icon>gavel</mat-icon> Revogar
            </button>
            <button mat-raised-button color="warn" (click)="suspend()">
              <mat-icon>pause_circle</mat-icon> Suspender
            </button>
          </ng-container>

          <!-- STATE: suspended → revogar -->
          <ng-container *ngIf="role === 'state' && company.licenseStatus === 'suspended'">
            <button mat-stroked-button (click)="revoke()">
              <mat-icon>gavel</mat-icon> Revogar Licença
            </button>
          </ng-container>

          <!-- Licença PDF — visível quando active -->
          <button mat-stroked-button *ngIf="company.licenseStatus === 'active'"
                  (click)="downloadLicensePdf()" [disabled]="pdfLoading">
            <mat-spinner diameter="16" *ngIf="pdfLoading"></mat-spinner>
            <mat-icon *ngIf="!pdfLoading">picture_as_pdf</mat-icon>
            Licença PDF
          </button>

        </div>
      </div>

      <!-- Layout 2 colunas -->
      <div class="detail-2col">

        <!-- Col 1: Info geral -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Informação Geral</p>
            <div class="detail-grid">
              <div class="detail-field">
                <label>País</label>
                <span>{{ company.country | titlecase }}</span>
              </div>
              <div class="detail-field" *ngIf="company.companyType">
                <label>Tipo de Empresa</label>
                <span>{{ companyTypeLabel(company.companyType) }}</span>
              </div>
              <div class="detail-field">
                <label>Email</label>
                <span>{{ company.contactEmail }}</span>
              </div>
              <div class="detail-field">
                <label>Telefone</label>
                <span>{{ company.contactPhone || '—' }}</span>
              </div>
              <div class="detail-field">
                <label>Morada</label>
                <span>{{ company.address || '—' }}</span>
              </div>
              <div class="detail-field">
                <label>Registada em</label>
                <span>{{ company.createdAt | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="detail-field" *ngIf="company.licenseNumber">
                <label>Licença Nº</label>
                <span class="license-num">{{ company.licenseNumber }}</span>
              </div>
              <div class="detail-field" *ngIf="company.licenseExpiresAt">
                <label>Validade da Licença</label>
                <span>{{ company.licenseExpiresAt | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="detail-field" *ngIf="company.verifiedByState">
                <label>Verificado pelo STATE</label>
                <span class="verified-badge"><mat-icon>verified</mat-icon> Sim</span>
              </div>
              <div class="detail-field" *ngIf="company.rejectionReason">
                <label>Motivo de Rejeição</label>
                <span class="warn-text">{{ company.rejectionReason }}</span>
              </div>
              <div class="detail-field" *ngIf="company.suspensionReason">
                <label>Motivo de Suspensão</label>
                <span class="warn-text">{{ company.suspensionReason }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Col 2: Histórico + Validação STAFF -->
        <div class="col2-stack">

          <!-- Card: Validação do STAFF (visível quando existe) -->
          <mat-card *ngIf="company.documentationValidation">
            <mat-card-content class="card-section">
              <p class="card-section-title">Validação STAFF</p>
              <div class="validation-result" [class.valid]="company.documentationValidation.result === 'approved'"
                   [class.invalid]="company.documentationValidation.result === 'rejected'">
                <mat-icon>{{ company.documentationValidation.result === 'approved' ? 'check_circle' : 'cancel' }}</mat-icon>
                <span>{{ company.documentationValidation.result === 'approved' ? 'Documentação Aprovada' : 'Documentação Rejeitada' }}</span>
              </div>
              <p class="validation-notes">{{ company.documentationValidation.notes }}</p>
              <p class="validation-date" *ngIf="company.documentationValidation.validatedAt">
                Validado em {{ company.documentationValidation.validatedAt | date:'dd/MM/yyyy HH:mm' }}
              </p>
            </mat-card-content>
          </mat-card>

          <!-- Card: Histórico de Licenciamento -->
          <mat-card>
            <mat-card-content class="card-section">
              <p class="card-section-title">Histórico de Licenciamento</p>
              <div class="timeline">

                <div class="timeline-item">
                  <div class="tl-dot tl-done"><mat-icon>check</mat-icon></div>
                  <div class="tl-body">
                    <div class="tl-label">Empresa Registada</div>
                    <div class="tl-date">{{ company.createdAt | date:'dd/MM/yyyy' }}</div>
                  </div>
                </div>

                <div class="timeline-item"
                     *ngIf="['under_review','active','rejected','suspended'].includes(company.licenseStatus)">
                  <div class="tl-dot tl-done"><mat-icon>check</mat-icon></div>
                  <div class="tl-body">
                    <div class="tl-label">Documentação Validada — STAFF</div>
                    <div class="tl-sub" *ngIf="company.documentationValidation?.notes">
                      "{{ company.documentationValidation!.notes }}"
                    </div>
                  </div>
                </div>

                <div class="timeline-item"
                     *ngIf="company.licenseStatus === 'under_review'">
                  <div class="tl-dot tl-pending"><mat-icon>hourglass_empty</mat-icon></div>
                  <div class="tl-body">
                    <div class="tl-label tl-waiting">A aguardar decisão do STATE</div>
                  </div>
                </div>

                <div class="timeline-item"
                     *ngIf="['active','rejected','suspended'].includes(company.licenseStatus)">
                  <div class="tl-dot" [class.tl-done]="company.licenseStatus === 'active'"
                       [class.tl-rejected]="['rejected','suspended'].includes(company.licenseStatus)">
                    <mat-icon>{{ company.licenseStatus === 'active' ? 'verified' : 'block' }}</mat-icon>
                  </div>
                  <div class="tl-body">
                    <div class="tl-label">
                      Decisão STATE —
                      <app-status-badge [status]="company.licenseStatus"></app-status-badge>
                    </div>
                    <div class="tl-sub" *ngIf="company.licenseNumber">Licença: {{ company.licenseNumber }}</div>
                  </div>
                </div>

              </div>
            </mat-card-content>
          </mat-card>

        </div>
      </div>

      <!-- Documentos da empresa ──────────────────────────────────── -->
      <div class="mt-md">
        <app-documents-panel
          entityType="company"
          [entityId]="company.id"
          [documents]="company.documents ?? []"
          [autoLoad]="true">
        </app-documents-panel>
      </div>

    </ng-container>

    <!-- Not found -->
    <div *ngIf="!loading && !company && !loadError" class="empty-state">
      <mat-icon class="empty-icon">business</mat-icon>
      <h3>Empresa não encontrada</h3>
      <button mat-stroked-button (click)="back()"><mat-icon>arrow_back</mat-icon> Voltar</button>
    </div>
  `,
  styles: [`
    .detail-progress { position: sticky; top: 0; z-index: 10; margin-bottom: 16px; }

    /* ── Banners ──────────────────────────────────────────────────── */
    .action-banner {
      display: flex;
      align-items: center;
      gap: 14px;
      background: linear-gradient(135deg, var(--primary) 0%, #1565c0 100%);
      color: #fff;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 20px;
    }

    .action-banner-staff {
      background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
    }

    .action-banner > mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      opacity: 0.9;
    }

    .action-banner > div:nth-child(2) {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .action-banner strong { font-size: 15px; font-weight: 700; }
    .action-banner span   { font-size: 13px; opacity: 0.85; }

    .banner-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .banner-btn-approve {
      background: #fff !important;
      color: var(--primary) !important;
      font-weight: 700 !important;
    }

    .banner-btn-reject {
      border-color: rgba(255,255,255,0.5) !important;
      color: #fff !important;
    }

    /* ── Skeleton ─────────────────────────────────────────────────── */
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position:  400px 0; }
    }
    .sk {
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s infinite linear;
      border-radius: 4px;
    }
    .sk-title  { height: 28px; width: 240px; }
    .sk-label  { height: 12px; width: 120px; margin-bottom: 20px; }
    .sk-field  { height: 44px; margin-bottom: 16px; }

    /* ── Col 2 stack ─────────────────────────────────────────────── */
    .col2-stack { display: flex; flex-direction: column; gap: 16px; }

    /* ── Validação STAFF ─────────────────────────────────────────── */
    .validation-result {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 10px;
    }

    .validation-result.valid   { background: #e8f5e9; color: #2e7d32; }
    .validation-result.invalid { background: #fce8e6; color: #c5221f; }
    .validation-result mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .validation-notes { font-size: 13px; color: #555; margin: 0 0 6px; font-style: italic; }
    .validation-date  { font-size: 11px; color: #aaa; margin: 0; }

    /* ── Timeline ────────────────────────────────────────────────── */
    .timeline { display: flex; flex-direction: column; gap: 0; }

    .timeline-item {
      display: flex;
      gap: 12px;
      padding-bottom: 16px;
      position: relative;
    }

    .timeline-item:not(:last-child)::before {
      content: '';
      position: absolute;
      left: 12px;
      top: 28px;
      bottom: 0;
      width: 2px;
      background: #e0e0e0;
    }

    .tl-dot {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      z-index: 1;
    }

    .tl-dot mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .tl-done     { background: #2e7d32; color: #fff; }
    .tl-pending  { background: #fff8e1; color: #f57f17; border: 2px solid #f57f17; }
    .tl-rejected { background: #fce8e6; color: #c5221f; border: 2px solid #c5221f; }

    .tl-body { padding-top: 4px; }
    .tl-label { font-size: 13px; font-weight: 600; color: #333; }
    .tl-label.tl-waiting { color: #f57f17; }
    .tl-date  { font-size: 11px; color: #aaa; margin-top: 2px; }
    .tl-sub   { font-size: 12px; color: #777; margin-top: 4px; font-style: italic; }

    /* ── Fields ──────────────────────────────────────────────────── */
    .license-num {
      font-family: monospace;
      font-weight: 700;
      color: #2e7d32;
      font-size: 14px;
    }

    .verified-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #2e7d32;
      font-weight: 600;
    }
    .verified-badge mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .warn-text { color: #c5221f; font-size: 13px; }
  `],
})
export class CompanyDetailComponent implements OnInit {
  company:   Company | null = null;
  loading    = false;
  loadError  = false;
  pdfLoading = false;
  role: Role | null = null;

  constructor(
    private route: ActivatedRoute,
    private svc: CompanyService,
    private auth: AuthService,
    private pdfSvc: PdfService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.role = this.auth.getCurrentUser()?.role ?? null;
    this.reload();
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading   = true;
    this.loadError = false;
    this.svc.getById(id).subscribe({
      next: (c) => { this.company = c; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }

  back(): void { this.router.navigate([`/dashboard/${this.role}/companies`]); }

  downloadLicensePdf(): void {
    if (!this.company) return;
    this.pdfLoading = true;
    this.pdfSvc.getLicensePdf(this.company.id).subscribe({
      next: (res) => { this.pdfLoading = false; this.pdfSvc.openPdf(res); },
      error: (e) => { this.pdfLoading = false; this.snack.open(e?.error?.message ?? 'PDF ainda não gerado.', 'Fechar', { duration: 3000 }); },
    });
  }

  private open(data: ConfirmDialogData) {
    return this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, { data });
  }

  // ── STAFF: Validar documentação ──────────────────────────────────
  validateDocs(valid: boolean): void {
    this.open({
      title:         valid ? 'Validar Documentação' : 'Devolver para Correcção',
      message:       valid ? 'Confirmar validação dos documentos da empresa?' : 'Indique o motivo da devolução:',
      inputLabel:    valid ? 'Notas (opcional)' : 'Motivo',
      inputRequired: !valid,
      confirmText:   valid ? 'Validar' : 'Devolver',
    }).afterClosed().subscribe((result) => {
      if (result === undefined) return;
      const notes = typeof result === 'string' ? result : undefined;
      this.loading = true;
      this.svc.validateDocs(this.company!.id, valid, notes).subscribe({
        next: (c) => {
          this.company = c;
          this.loading = false;
          this.snack.open(
            valid ? 'Documentação validada. Pode agora encaminhar ao STATE.' : 'Empresa devolvida para correcção.',
            'Fechar', { duration: 4000 }
          );
        },
        error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
      });
    });
  }

  // ── STAFF: Encaminhar ao STATE (apenas quando under_review) ──────
  forwardToState(): void {
    this.open({
      title:       'Encaminhar ao STATE',
      message:     'Confirmar encaminhamento desta empresa ao STATE para decisão de licenciamento?',
      confirmText: 'Encaminhar',
    }).afterClosed().subscribe((r) => {
      if (!r) return;
      this.loading = true;
      this.svc.forwardToState(this.company!.id).subscribe({
        next: () => {
          // API devolve { message }, não Company — recarregar da API
          this.reload();
          this.snack.open('Empresa encaminhada ao STATE com sucesso.', 'Fechar', { duration: 4000 });
        },
        error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro ao encaminhar', 'Fechar', { duration: 3000 }); },
      });
    });
  }

  // ── STATE: Aprovar licença ───────────────────────────────────────
  approveLicense(): void {
    // Calcular data padrão: 2 anos a partir de hoje
    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 2);
    const defaultExpiryStr = defaultExpiry.toISOString().split('T')[0];

    this.open({
      title:          'Aprovar Licença',
      message:        'Preencha os dados da licença a emitir:',
      inputLabel:     'Número de Licença',
      inputRequired:  true,
      input2Label:    'Data de Validade',
      input2Type:     'date',
      input2Required: true,
      confirmText:    'Aprovar Licença',
    }).afterClosed().subscribe((result: { value: string; value2: string } | undefined) => {
      if (!result?.value || !result?.value2) return;
      this.loading = true;
      this.svc.approveLicense(this.company!.id, result.value, new Date(result.value2).toISOString()).subscribe({
        next: (c) => {
          this.company = c;
          this.loading = false;
          this.snack.open(`Licença ${result.value} aprovada com sucesso.`, 'Fechar', { duration: 5000 });
        },
        error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro ao aprovar', 'Fechar', { duration: 3000 }); },
      });
    });
  }

  // ── STATE: Rejeitar licença ──────────────────────────────────────
  rejectLicense(): void {
    this.open({
      title: 'Rejeitar Licença', message: 'Indique o motivo da rejeição:',
      inputLabel: 'Motivo', inputRequired: true, confirmText: 'Rejeitar',
    }).afterClosed().subscribe((reason: string) => {
      if (!reason) return;
      this.loading = true;
      this.svc.rejectLicense(this.company!.id, reason).subscribe({
        next: (c) => { this.company = c; this.loading = false; this.snack.open('Licença rejeitada.', 'Fechar', { duration: 3000 }); },
        error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
      });
    });
  }

  // ── STATE: Suspender ────────────────────────────────────────────
  suspend(): void {
    this.open({
      title: 'Suspender Empresa', message: 'Indique o motivo da suspensão:',
      inputLabel: 'Motivo', inputRequired: true, confirmText: 'Suspender',
    }).afterClosed().subscribe((reason: string) => {
      if (!reason) return;
      this.loading = true;
      this.svc.suspend(this.company!.id, reason).subscribe({
        next: (c) => { this.company = c; this.loading = false; this.snack.open('Empresa suspensa.', 'Fechar', { duration: 3000 }); },
        error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
      });
    });
  }

  // ── STATE: Revogar ──────────────────────────────────────────────
  revoke(): void {
    this.open({
      title: 'Revogar Licença', message: 'Esta acção revoga definitivamente a licença. Motivo:',
      inputLabel: 'Motivo', inputRequired: true, confirmText: 'Revogar',
    }).afterClosed().subscribe((reason: string) => {
      if (!reason) return;
      this.loading = true;
      this.svc.revoke(this.company!.id, reason).subscribe({
        next: (c) => { this.company = c; this.loading = false; this.snack.open('Licença revogada.', 'Fechar', { duration: 3000 }); },
        error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
      });
    });
  }

  companyTypeLabel(t: string): string {
    const m: Record<string, string> = {
      importer: 'Importador', exporter: 'Exportador',
      mixed: 'Misto', producer: 'Produtor', logistics: 'Logística',
    };
    return m[t] ?? t;
  }
}
