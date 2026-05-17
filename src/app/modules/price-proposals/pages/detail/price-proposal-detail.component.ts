import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PriceProposalService } from '../../../../core/services/price-proposal.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PriceProposal, Role } from '../../../../core/models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-price-proposal-detail',
  styles: [`
    @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
    .sk { background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size:800px 100%; animation:shimmer 1.4s infinite linear; border-radius:4px; }
    .sk-title { height:28px; width:220px; }
    .sk-label { height:12px; width:120px; margin-bottom:20px; }
    .sk-field  { height:44px; margin-bottom:16px; }
    .detail-progress { position:sticky; top:0; z-index:10; margin-bottom:16px; }
  `],
  template: `
    <!-- Progress bar — always visible during any loading -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading" class="detail-progress"></mat-progress-bar>

    <!-- Skeleton loading -->
    <ng-container *ngIf="loading && !proposal">
      <div class="detail-header">
        <div class="detail-title-group">
          <nav class="breadcrumb"><span>Price Proposals</span><mat-icon class="bc-sep">chevron_right</mat-icon><span>A carregar…</span></nav>
          <div class="detail-title-row"><mat-icon class="page-icon">price_change</mat-icon><div class="sk sk-title"></div></div>
        </div>
      </div>
      <div class="detail-2col">
        <mat-card><mat-card-content class="card-section"><div class="sk sk-label"></div><div class="sk sk-field" *ngFor="let i of [1,2,3,4]"></div></mat-card-content></mat-card>
        <mat-card><mat-card-content class="card-section"><div class="sk sk-label"></div><div class="sk sk-field" *ngFor="let i of [1,2,3]"></div></mat-card-content></mat-card>
      </div>
    </ng-container>

    <!-- Error state -->
    <div class="error-state" *ngIf="!loading && !proposal && loadError">
      <mat-icon>error_outline</mat-icon>
      <p>Não foi possível carregar os dados. Verifique a sua ligação e tente novamente.</p>
      <button mat-stroked-button (click)="reload()"><mat-icon>refresh</mat-icon> Tentar novamente</button>
    </div>

    <!-- Real content -->
    <ng-container *ngIf="proposal">

      <!-- ── Header ─────────────────────────────────────────────────── -->
      <div class="detail-header">
        <div class="detail-title-group">
          <nav class="breadcrumb">
            <a (click)="back()">Price Proposals</a>
            <mat-icon class="bc-sep">chevron_right</mat-icon>
            <span>{{ proposal.cd }}</span>
          </nav>
          <div class="detail-title-row">
            <mat-icon class="page-icon">price_change</mat-icon>
            <h1 class="detail-title">{{ proposal.product?.name ?? '—' }}</h1>
            <app-status-badge [status]="proposal.status"></app-status-badge>
            <span class="id-text">{{ proposal.cd }}</span>
          </div>
          <p class="text-muted text-sm" *ngIf="!hasActions">
            {{ proposal.status === 'approved' ? 'Proposta aprovada e imutável.' : 'Sem acções disponíveis.' }}
          </p>
        </div>

        <div class="detail-actions">
          <!-- SPECIALIST -->
          <ng-container *ngIf="role === 'specialist'">
            <button mat-stroked-button *ngIf="canEdit" (click)="back()">
              <mat-icon>edit</mat-icon> Editar
            </button>
            <button mat-raised-button color="primary"
                    *ngIf="proposal.status === 'draft'"
                    (click)="submit()">
              <mat-icon>send</mat-icon> Submeter ao Estado
            </button>
          </ng-container>

          <!-- STATE: submitted -->
          <ng-container *ngIf="role === 'state' && proposal.status === 'submitted'">
            <button mat-stroked-button (click)="reject()">
              <mat-icon>block</mat-icon> Rejeitar
            </button>
            <button mat-raised-button color="primary" (click)="approve()">
              <mat-icon>verified</mat-icon> Aprovar Proposta
            </button>
          </ng-container>
        </div>
      </div>

      <!-- ── Two-column content ──────────────────────────────────────── -->
      <div class="detail-2col">

        <!-- Card: Informação da Proposta -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Informação da Proposta</p>
            <div class="detail-grid">
              <div class="detail-field">
                <label>Produto</label>
                <span>{{ proposal.product?.name ?? '—' }}</span>
              </div>
              <div class="detail-field">
                <label>Categoria</label>
                <span>{{ proposal.product?.category ?? '—' }}</span>
              </div>
              <div class="detail-field">
                <label>Preço Proposto</label>
                <span>{{ parseFloat(proposal.proposedPrice) | number:'1.2-2' }} {{ proposal.currency }}</span>
              </div>
              <div class="detail-field">
                <label>Criado em</label>
                <span>{{ proposal.createdAt | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="detail-field" *ngIf="proposal.submittedAt">
                <label>Submetido em</label>
                <span>{{ proposal.submittedAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="detail-field" *ngIf="proposal.approvedAt">
                <label>Aprovado em</label>
                <span>{{ proposal.approvedAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="detail-field" *ngIf="proposal.validFrom">
                <label>Válido de</label>
                <span>{{ proposal.validFrom | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="detail-field" *ngIf="proposal.validTo">
                <label>Válido até</label>
                <span>{{ proposal.validTo | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="detail-field" *ngIf="proposal.rejectionReason">
                <label>Motivo Rejeição</label>
                <span>{{ proposal.rejectionReason }}</span>
              </div>
            </div>

            <ng-container *ngIf="proposal.justification">
              <hr class="section-divider">
              <div class="detail-field">
                <label>Justificação</label>
                <span>{{ proposal.justification }}</span>
              </div>
            </ng-container>
          </mat-card-content>
        </mat-card>

        <!-- Card: Snapshot Oficial -->
        <mat-card *ngIf="proposal.snapshot">
          <mat-card-content class="card-section">
            <p class="card-section-title">Snapshot Oficial</p>

            <div class="snapshot-card">
              <div class="snapshot-title">
                <mat-icon>lock</mat-icon>
                SNAPSHOT OFICIAL — IMUTÁVEL
              </div>
              <div class="snapshot-price">
                {{ proposal.snapshot.approvedPriceUsd | number:'1.2-2' }} {{ proposal.snapshot.currency }}
              </div>
              <div class="detail-grid">
                <div class="detail-field">
                  <label>Produto</label>
                  <span>{{ proposal.snapshot.productName }}</span>
                </div>
                <div class="detail-field">
                  <label>Categoria</label>
                  <span>{{ proposal.snapshot.productCategory }}</span>
                </div>
                <div class="detail-field">
                  <label>Gerado em</label>
                  <span>{{ proposal.snapshot.generatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="detail-field" *ngIf="proposal.snapshot.validFrom">
                  <label>Período</label>
                  <span>
                    {{ proposal.snapshot.validFrom | date:'dd/MM/yyyy' }} →
                    {{ proposal.snapshot.validTo ? (proposal.snapshot.validTo | date:'dd/MM/yyyy') : '∞' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="info-banner mt-md">
              <mat-icon>info</mat-icon>
              <span>Esta proposta está aprovada e é imutável. O snapshot não pode ser alterado.</span>
            </div>
          </mat-card-content>
        </mat-card>

      </div>
    </ng-container>
  `,
})
export class PriceProposalDetailComponent implements OnInit {
  proposal: PriceProposal | null = null;
  loading = false;
  loadError = false;
  role: Role | null = null;
  readonly parseFloat = parseFloat;

  get canEdit(): boolean { return this.proposal?.status === 'draft' || this.proposal?.status === 'rejected'; }
  get hasActions(): boolean {
    if (!this.proposal) return false;
    if (this.role === 'specialist' && ['draft','rejected'].includes(this.proposal.status)) return true;
    if (this.role === 'state'      && this.proposal.status === 'submitted') return true;
    return false;
  }

  constructor(
    private route: ActivatedRoute, public router: Router,
    private svc: PriceProposalService, private auth: AuthService,
    private dialog: MatDialog, private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.role = this.auth.getCurrentUser()?.role ?? null;
    this.reload();
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading = true;
    this.loadError = false;
    this.svc.getById(id).subscribe({
      next: (p) => { this.proposal = p; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }

  back(): void { this.router.navigate([`/dashboard/${this.role}/price-proposals`]); }

  private open(data: ConfirmDialogData) {
    return this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, { data });
  }

  submit(): void {
    this.open({ title: 'Submeter Proposta', message: 'Submeter esta price proposal ao Estado para aprovação?', confirmText: 'Submeter' })
      .afterClosed().subscribe((r) => {
        if (!r) return;
        this.loading = true;
        this.svc.submit(this.proposal!.id).subscribe({
          next: (p) => { this.proposal = p; this.loading = false; this.snack.open('Proposta submetida ao Estado', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }

  approve(): void {
    this.open({ title: 'Aprovar Price Proposal', message: 'Aprovar esta proposta? Um snapshot imutável será gerado com o preço oficial.', confirmText: 'Aprovar' })
      .afterClosed().subscribe((r) => {
        if (!r) return;
        this.loading = true;
        this.svc.approve(this.proposal!.id).subscribe({
          next: (p) => { this.proposal = p; this.loading = false; this.snack.open('Proposta aprovada — snapshot gerado', 'Fechar', { duration: 4000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }

  reject(): void {
    this.open({ title: 'Rejeitar Proposta', message: 'Motivo da rejeição:', inputLabel: 'Motivo', inputRequired: true, confirmText: 'Rejeitar' })
      .afterClosed().subscribe((reason: string) => {
        if (!reason) return;
        this.loading = true;
        this.svc.reject(this.proposal!.id, reason).subscribe({
          next: (p) => { this.proposal = p; this.loading = false; this.snack.open('Proposta rejeitada', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }
}
