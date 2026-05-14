import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanyService } from '../../../../core/services/company.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Company, Role } from '../../../../core/models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-company-detail',
  template: `

    <!-- ── Progress bar — sempre visível durante carregamento ────────── -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading" class="detail-progress"></mat-progress-bar>

    <!-- ── Skeleton loading ──────────────────────────────────────────── -->
    <ng-container *ngIf="loading && !company">
      <div class="detail-header">
        <div class="detail-title-group">
          <nav class="breadcrumb">
            <span>Empresas</span>
            <mat-icon class="bc-sep">chevron_right</mat-icon>
            <span>A carregar…</span>
          </nav>
          <div class="detail-title-row">
            <mat-icon class="page-icon">business</mat-icon>
            <div class="sk sk-title"></div>
          </div>
        </div>
      </div>
      <div class="detail-2col">
        <mat-card>
          <mat-card-content class="card-section">
            <div class="sk sk-label"></div>
            <div class="detail-grid">
              <div class="sk sk-field" *ngFor="let i of [1,2,3,4,5,6]"></div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-content class="card-section">
            <div class="sk sk-label"></div>
            <div class="sk sk-field" *ngFor="let i of [1,2,3]"></div>
          </mat-card-content>
        </mat-card>
      </div>
    </ng-container>

    <!-- ── Error state ────────────────────────────────────────────────── -->
    <div class="error-state" *ngIf="!loading && !company && loadError">
      <mat-icon>error_outline</mat-icon>
      <p>Não foi possível carregar a empresa. Verifique a sua ligação e tente novamente.</p>
      <button mat-stroked-button (click)="reload()">
        <mat-icon>refresh</mat-icon> Tentar novamente
      </button>
    </div>

    <!-- ── Conteúdo real ──────────────────────────────────────────────── -->
    <ng-container *ngIf="company">

      <!-- ── Header ─────────────────────────────────────────────────── -->
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
          <p class="text-muted text-sm" *ngIf="noActions">Sem acções disponíveis para o estado actual.</p>
        </div>

        <div class="detail-actions">
          <!-- STAFF: pending -->
          <ng-container *ngIf="role === 'staff' && company.licenseStatus === 'pending'">
            <button mat-stroked-button (click)="validateDocs(false)">
              <mat-icon>close</mat-icon> Devolver para Correcção
            </button>
            <button mat-raised-button color="primary" (click)="validateDocs(true)">
              <mat-icon>check</mat-icon> Validar Documentação
            </button>
            <button mat-raised-button color="primary" (click)="forwardToState()">
              <mat-icon>send</mat-icon> Encaminhar ao Estado
            </button>
          </ng-container>

          <!-- STATE: under_review -->
          <ng-container *ngIf="role === 'state' && company.licenseStatus === 'under_review'">
            <button mat-stroked-button (click)="rejectLicense()">
              <mat-icon>block</mat-icon> Rejeitar Licença
            </button>
            <button mat-raised-button color="primary" (click)="approveLicense()">
              <mat-icon>verified</mat-icon> Aprovar Licença
            </button>
          </ng-container>

          <!-- STATE: active -->
          <ng-container *ngIf="role === 'state' && company.licenseStatus === 'active'">
            <button mat-raised-button color="primary" (click)="suspend()">
              <mat-icon>pause_circle</mat-icon> Suspender Empresa
            </button>
          </ng-container>

          <!-- STATE: active or suspended → revoke -->
          <ng-container *ngIf="role === 'state' && ['active','suspended'].includes(company.licenseStatus)">
            <button mat-stroked-button (click)="revoke()">
              <mat-icon>gavel</mat-icon> Revogar Licença
            </button>
          </ng-container>
        </div>
      </div>

      <!-- ── Two-column content ──────────────────────────────────────── -->
      <div class="detail-2col">

        <!-- Card: Informação Geral -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Informação Geral</p>
            <div class="detail-grid">
              <div class="detail-field">
                <label>País</label>
                <span>{{ company.country | titlecase }}</span>
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
                <label>Licença Nº</label>
                <span>{{ company.licenseNumber || '—' }}</span>
              </div>
              <div class="detail-field">
                <label>Validade Licença</label>
                <span>{{ company.licenseExpiresAt ? (company.licenseExpiresAt | date:'dd/MM/yyyy') : '—' }}</span>
              </div>
              <div class="detail-field">
                <label>Registada em</label>
                <span>{{ company.createdAt | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="detail-field" *ngIf="company.rejectionReason">
                <label>Motivo Rejeição</label>
                <span>{{ company.rejectionReason }}</span>
              </div>
              <div class="detail-field" *ngIf="company.suspensionReason">
                <label>Motivo Suspensão</label>
                <span>{{ company.suspensionReason }}</span>
              </div>
              <div class="detail-field" *ngIf="company.validationNotes">
                <label>Notas de Validação</label>
                <span>{{ company.validationNotes }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Card: Histórico de Licenciamento -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Histórico de Licenciamento</p>
            <div class="timeline">

              <div class="timeline-item">
                <div class="timeline-time">{{ company.createdAt | date:'dd/MM/yyyy' }}</div>
                <div class="timeline-label">Empresa Registada</div>
              </div>

              <div class="timeline-item"
                   *ngIf="['under_review','active','rejected','suspended'].includes(company.licenseStatus)">
                <div class="timeline-label">Documentação Validada pelo STAFF</div>
                <div class="timeline-sub" *ngIf="company.validationNotes">{{ company.validationNotes }}</div>
              </div>

              <div class="timeline-item"
                   *ngIf="['active','rejected','suspended'].includes(company.licenseStatus)">
                <div class="timeline-label">
                  Decisão do Estado —
                  <app-status-badge [status]="company.licenseStatus"></app-status-badge>
                </div>
              </div>

            </div>
          </mat-card-content>
        </mat-card>

      </div>
    </ng-container>

    <!-- Not found (sem erro de rede, simplesmente não existe) -->
    <div *ngIf="!loading && !company && !loadError" class="empty-state">
      <mat-icon class="empty-icon">business</mat-icon>
      <h3>Empresa não encontrada</h3>
      <p>O registo que procura não existe ou foi removido.</p>
      <button mat-stroked-button (click)="back()">
        <mat-icon>arrow_back</mat-icon> Voltar à lista
      </button>
    </div>
  `,
  styles: [`
    .detail-progress { position: sticky; top: 0; z-index: 10; margin-bottom: 16px; }

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
  `],
})
export class CompanyDetailComponent implements OnInit {
  company: Company | null = null;
  loading   = false;
  loadError = false;
  role: Role | null = null;

  get noActions(): boolean {
    if (!this.company) return true;
    if (this.role === 'staff'  && this.company.licenseStatus === 'pending') return false;
    if (this.role === 'state'  && ['under_review','active'].includes(this.company.licenseStatus)) return false;
    return true;
  }

  constructor(
    private route: ActivatedRoute,
    private svc: CompanyService,
    private auth: AuthService,
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

  private open(data: ConfirmDialogData) {
    return this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, { data });
  }

  validateDocs(valid: boolean): void {
    this.open({
      title: valid ? 'Validar Documentação' : 'Devolver para Correcção',
      message: valid ? 'Confirmar validação dos documentos?' : 'Devolver documentação com nota:',
      inputLabel: 'Notas (opcional)',
      confirmText: valid ? 'Validar' : 'Devolver',
    }).afterClosed().subscribe((result) => {
      if (result === undefined) return;
      const notes = typeof result === 'string' ? result : undefined;
      this.loading = true;
      this.svc.validateDocs(this.company!.id, valid, notes).subscribe({
        next: (c) => { this.company = c; this.loading = false; this.snack.open('Documentação actualizada', 'Fechar', { duration: 3000 }); },
        error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
      });
    });
  }

  forwardToState(): void {
    this.open({ title: 'Encaminhar ao Estado', message: 'Encaminhar esta empresa ao STATE para decisão?', confirmText: 'Encaminhar' })
      .afterClosed().subscribe((r) => {
        if (!r) return;
        this.loading = true;
        this.svc.forwardToState(this.company!.id).subscribe({
          next: (c) => { this.company = c; this.loading = false; this.snack.open('Encaminhado ao Estado', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }

  approveLicense(): void {
    this.open({ title: 'Aprovar Licença', message: 'Indique o número de licença:', inputLabel: 'Número de Licença', inputRequired: true, confirmText: 'Aprovar' })
      .afterClosed().subscribe((licenseNumber: string) => {
        if (!licenseNumber) return;
        const exp = new Date(); exp.setFullYear(exp.getFullYear() + 2);
        this.loading = true;
        this.svc.approveLicense(this.company!.id, licenseNumber, exp.toISOString()).subscribe({
          next: (c) => { this.company = c; this.loading = false; this.snack.open('Licença aprovada', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }

  rejectLicense(): void {
    this.open({ title: 'Rejeitar Licença', message: 'Motivo da rejeição:', inputLabel: 'Motivo', inputRequired: true, confirmText: 'Rejeitar' })
      .afterClosed().subscribe((reason: string) => {
        if (!reason) return;
        this.loading = true;
        this.svc.rejectLicense(this.company!.id, reason).subscribe({
          next: (c) => { this.company = c; this.loading = false; this.snack.open('Licença rejeitada', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }

  suspend(): void {
    this.open({ title: 'Suspender Empresa', message: 'Motivo da suspensão:', inputLabel: 'Motivo', inputRequired: true, confirmText: 'Suspender' })
      .afterClosed().subscribe((reason: string) => {
        if (!reason) return;
        this.loading = true;
        this.svc.suspend(this.company!.id, reason).subscribe({
          next: (c) => { this.company = c; this.loading = false; this.snack.open('Empresa suspensa', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }

  revoke(): void {
    this.open({ title: 'Revogar Licença', message: 'Esta acção revoga definitivamente a licença. Motivo:', inputLabel: 'Motivo', inputRequired: true, confirmText: 'Revogar Licença' })
      .afterClosed().subscribe((reason: string) => {
        if (!reason) return;
        this.loading = true;
        this.svc.revoke(this.company!.id, reason).subscribe({
          next: (c) => { this.company = c; this.loading = false; this.snack.open('Licença revogada', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }
}
