import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReportsService } from '../../../../core/services/reports.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Report, Role } from '../../../../core/models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-report-detail',
  styles: [`
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
    .sk-title  { height: 28px; width: 260px; }
    .sk-label  { height: 12px; width: 120px; margin-bottom: 20px; }
    .sk-field  { height: 44px; margin-bottom: 16px; }
    .detail-progress { position: sticky; top: 0; z-index: 10; margin-bottom: 16px; }
  `],
  template: `
    <!-- Progress bar — always visible during any loading -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading" class="detail-progress"></mat-progress-bar>

    <!-- Skeleton loading -->
    <ng-container *ngIf="loading && !report">
      <div class="detail-header">
        <div class="detail-title-group">
          <nav class="breadcrumb">
            <span>Relatórios</span>
            <mat-icon class="bc-sep">chevron_right</mat-icon>
            <span>A carregar…</span>
          </nav>
          <div class="detail-title-row">
            <mat-icon class="page-icon">description</mat-icon>
            <div class="sk sk-title"></div>
          </div>
        </div>
      </div>
      <div class="detail-2col">
        <mat-card>
          <mat-card-content class="card-section">
            <div class="sk sk-label"></div>
            <div class="sk sk-field" *ngFor="let i of [1,2,3,4]"></div>
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

    <!-- Error state -->
    <div class="error-state" *ngIf="!loading && !report && loadError">
      <mat-icon>error_outline</mat-icon>
      <p>Não foi possível carregar os dados do relatório. Verifique a sua ligação e tente novamente.</p>
      <button mat-stroked-button (click)="reload()">
        <mat-icon>refresh</mat-icon> Tentar novamente
      </button>
    </div>

    <!-- Real content -->
    <ng-container *ngIf="report">

      <!-- ── Header ─────────────────────────────────────────────────── -->
      <div class="detail-header">
        <div class="detail-title-group">
          <nav class="breadcrumb">
            <a (click)="back()">Relatórios</a>
            <mat-icon class="bc-sep">chevron_right</mat-icon>
            <span class="nowrap">{{ report.title }}</span>
          </nav>
          <div class="detail-title-row">
            <mat-icon class="page-icon">description</mat-icon>
            <h1 class="detail-title">{{ report.title }}</h1>
            <app-status-badge [status]="report.status"></app-status-badge>
          </div>
        </div>

        <div class="detail-actions">
          <!-- DRAFT: author or eligible role can submit -->
          <ng-container *ngIf="canSubmit">
            <button mat-raised-button color="primary" (click)="submit()">
              <mat-icon>send</mat-icon> Submeter
            </button>
          </ng-container>

          <!-- SUBMITTED: state can publish or reject -->
          <ng-container *ngIf="canPublish">
            <button mat-stroked-button (click)="reject()">
              <mat-icon>cancel</mat-icon> Rejeitar
            </button>
            <button mat-raised-button color="primary" (click)="publish()">
              <mat-icon>publish</mat-icon> Publicar
            </button>
          </ng-container>
        </div>
      </div>

      <!-- ── Two-column layout ──────────────────────────────────────── -->
      <div class="detail-2col">

        <!-- Card 1: Information -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Informação</p>
            <div class="detail-grid">

              <div class="detail-field">
                <label>Nº</label>
                <span class="id-text">{{ report.cd }}</span>
              </div>

              <div class="detail-field">
                <label>Título</label>
                <span>{{ report.title }}</span>
              </div>

              <div class="detail-field">
                <label>Tipo</label>
                <span>{{ report.type | titlecase }}</span>
              </div>

              <div class="detail-field">
                <label>Audiência</label>
                <span>{{ report.targetAudience | titlecase }}</span>
              </div>

              <div class="detail-field">
                <label>Período</label>
                <span>{{ report.period ?? '—' }}</span>
              </div>

              <div class="detail-field">
                <label>Autor</label>
                <span>{{ report.author?.fullName ?? '—' }}</span>
              </div>

              <div class="detail-field">
                <label>Criado em</label>
                <span class="timestamp">{{ report.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>

              <div class="detail-field">
                <label>Publicado em</label>
                <span *ngIf="report.publishedAt" class="timestamp">
                  {{ report.publishedAt | date:'dd/MM/yyyy HH:mm' }}
                </span>
                <span *ngIf="!report.publishedAt" class="text-muted">—</span>
              </div>

            </div>
          </mat-card-content>
        </mat-card>

        <!-- Card 2: Status & Timeline -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Estado do Relatório</p>

            <div class="mb-md">
              <app-status-badge [status]="report.status"></app-status-badge>
            </div>

            <div class="timeline">

              <!-- Created -->
              <div class="timeline-item">
                <div class="timeline-time">{{ report.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
                <div class="timeline-label">Criado</div>
                <div class="timeline-sub" *ngIf="report.author?.fullName">
                  por {{ report.author!.fullName }}
                </div>
              </div>

              <!-- Submitted -->
              <div class="timeline-item"
                   *ngIf="report.status === 'submitted' || report.status === 'published'">
                <div class="timeline-time">
                  {{ report.updatedAt | date:'dd/MM/yyyy HH:mm' }}
                </div>
                <div class="timeline-label">Submetido</div>
              </div>

              <!-- Published -->
              <div class="timeline-item" *ngIf="report.status === 'published'">
                <div class="timeline-time">
                  {{ report.publishedAt | date:'dd/MM/yyyy HH:mm' }}
                </div>
                <div class="timeline-label">Publicado</div>
              </div>

            </div>
          </mat-card-content>
        </mat-card>

      </div>
    </ng-container>
  `,
})
export class ReportDetailComponent implements OnInit {
  report: Report | null = null;
  loadError = false;
  loading = false;
  role: Role | string = '';
  userId = '';

  private readonly ELIGIBLE_ROLES: Role[] = ['analyst', 'specialist', 'compliance'];

  get canSubmit(): boolean {
    if (!this.report) return false;
    return this.report.status === 'draft' && this.ELIGIBLE_ROLES.includes(this.role as Role);
  }

  get canPublish(): boolean {
    if (!this.report) return false;
    return this.report.status === 'submitted' && this.role === 'state';
  }

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private reportsService: ReportsService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    this.role   = user?.role ?? '';
    this.userId = user?.id   ?? '';
    this.reload();
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading   = true;
    this.loadError = false;
    this.reportsService.getById(id).subscribe({
      next:  (r) => { this.report = r; this.loading = false; },
      error: ()  => { this.loading = false; this.loadError = true; },
    });
  }

  back(): void {
    this.router.navigate([`/dashboard/${this.role}/reports`]);
  }

  private openDialog(data: ConfirmDialogData) {
    return this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(
      ConfirmDialogComponent, { data },
    );
  }

  submit(): void {
    this.openDialog({
      title:       'Submeter Relatório',
      message:     'Tem a certeza que pretende submeter este relatório para revisão?',
      confirmText: 'Submeter',
    }).afterClosed().subscribe((result) => {
      if (!result) return;
      this.loading = true;
      this.reportsService.submit(this.report!.id).subscribe({
        next:  (r) => { this.report = r; this.loading = false; this.snack.open('Relatório submetido', 'Fechar', { duration: 3000 }); },
        error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro ao submeter', 'Fechar', { duration: 4000 }); },
      });
    });
  }

  publish(): void {
    this.openDialog({
      title:       'Publicar Relatório',
      message:     'Tem a certeza que pretende publicar este relatório? Esta acção não pode ser revertida.',
      confirmText: 'Publicar',
    }).afterClosed().subscribe((result) => {
      if (!result) return;
      this.loading = true;
      this.reportsService.publish(this.report!.id).subscribe({
        next:  (r) => { this.report = r; this.loading = false; this.snack.open('Relatório publicado', 'Fechar', { duration: 3000 }); },
        error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro ao publicar', 'Fechar', { duration: 4000 }); },
      });
    });
  }

  reject(): void {
    this.openDialog({
      title:         'Rejeitar Relatório',
      message:       'Indique o motivo da rejeição deste relatório.',
      inputLabel:    'Motivo',
      inputRequired: true,
      confirmText:   'Rejeitar',
    }).afterClosed().subscribe((reason: string) => {
      if (!reason) return;
      this.loading = true;
      this.reportsService.reject(this.report!.id, reason).subscribe({
        next:  (r) => { this.report = r; this.loading = false; this.snack.open('Relatório rejeitado', 'Fechar', { duration: 3000 }); },
        error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro ao rejeitar', 'Fechar', { duration: 4000 }); },
      });
    });
  }
}
