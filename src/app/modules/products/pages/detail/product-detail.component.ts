import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Product, Role } from '../../../../core/models';
import { PdfService } from '../../../../core/services/pdf.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-product-detail',
  styles: [`
    @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
    .sk { background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size:800px 100%; animation:shimmer 1.4s infinite linear; border-radius:4px; }
    .sk-title { height:28px; width:220px; }
    .sk-label { height:12px; width:120px; margin-bottom:20px; }
    .sk-field  { height:44px; margin-bottom:16px; }
    .detail-progress { position:sticky; top:0; z-index:10; margin-bottom:16px; }

    /* Banners */
    .action-banner {
      display: flex; align-items: center; gap: 14px;
      background: linear-gradient(135deg, var(--primary) 0%, #1565c0 100%);
      color: #fff; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px;
    }
    .action-banner-staff {
      background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
    }
    .action-banner-warn {
      background: linear-gradient(135deg, #e65100 0%, #f57c00 100%);
    }
    .action-banner > mat-icon { font-size: 28px; width: 28px; height: 28px; flex-shrink: 0; opacity: 0.9; }
    .action-banner > div:nth-child(2) { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .action-banner strong { font-size: 15px; font-weight: 700; }
    .action-banner span   { font-size: 13px; opacity: 0.85; }
    .banner-actions { display: flex; gap: 8px; flex-shrink: 0; }
    .banner-btn-approve { background: #fff !important; color: var(--primary) !important; font-weight: 700 !important; }
    .banner-btn-reject  { border-color: rgba(255,255,255,0.5) !important; color: #fff !important; }

    /* Metadata table */
    .metadata-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 0;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
    }
    .meta-key, .meta-val { padding: 8px 12px; font-size: 13px; }
    .meta-key { background: #f5f5f5; font-weight: 600; color: #555; border-bottom: 1px solid #e0e0e0; }
    .meta-val { color: #333; border-bottom: 1px solid #e0e0e0; }
    .meta-key:last-of-type, .meta-val:last-of-type { border-bottom: none; }

    /* Timeline */
    .timeline { display: flex; flex-direction: column; }
    .tl-item  { display: flex; gap: 12px; padding-bottom: 16px; position: relative; }
    .tl-item:not(:last-child)::before {
      content:''; position:absolute; left:12px; top:28px; bottom:0; width:2px; background:#e0e0e0;
    }
    .tl-dot {
      width:26px; height:26px; border-radius:50%; display:flex; align-items:center;
      justify-content:center; flex-shrink:0; z-index:1;
    }
    .tl-dot mat-icon { font-size:14px; width:14px; height:14px; }
    .tl-done     { background:#2e7d32; color:#fff; }
    .tl-pending  { background:#fff8e1; color:#f57f17; border:2px solid #f57f17; }
    .tl-rejected { background:#fce8e6; color:#c5221f; border:2px solid #c5221f; }
    .tl-body     { padding-top:4px; }
    .tl-label    { font-size:13px; font-weight:600; color:#333; }
    .tl-label.tl-waiting { color:#f57f17; }
    .tl-date     { font-size:11px; color:#aaa; margin-top:2px; }
    .tl-sub      { font-size:12px; color:#777; margin-top:4px; font-style:italic; }
  `],
  template: `
    <mat-progress-bar mode="indeterminate" *ngIf="loading" class="detail-progress"></mat-progress-bar>

    <!-- Skeleton -->
    <ng-container *ngIf="loading && !product">
      <div class="detail-header">
        <div class="detail-title-group">
          <nav class="breadcrumb"><span>Produtos</span><mat-icon class="bc-sep">chevron_right</mat-icon><span>A carregar…</span></nav>
          <div class="detail-title-row"><mat-icon class="page-icon">inventory_2</mat-icon><div class="sk sk-title"></div></div>
        </div>
      </div>
      <div class="detail-2col">
        <mat-card><mat-card-content class="card-section"><div class="sk sk-label"></div><div class="sk sk-field" *ngFor="let i of [1,2,3,4]"></div></mat-card-content></mat-card>
        <mat-card><mat-card-content class="card-section"><div class="sk sk-label"></div><div class="sk sk-field" *ngFor="let i of [1,2,3]"></div></mat-card-content></mat-card>
      </div>
    </ng-container>

    <!-- Error -->
    <div class="error-state" *ngIf="!loading && !product && loadError">
      <mat-icon>error_outline</mat-icon>
      <p>Não foi possível carregar os dados.</p>
      <button mat-stroked-button (click)="reload()"><mat-icon>refresh</mat-icon> Tentar novamente</button>
    </div>

    <ng-container *ngIf="product">

      <!-- ── Banners de acção ─────────────────────────────────────── -->

      <!-- STAFF: pending_review → validar técnico -->
      <div class="action-banner action-banner-staff"
           *ngIf="role === 'staff' && product.status === 'pending_review'">
        <mat-icon>engineering</mat-icon>
        <div>
          <strong>Validação Técnica Necessária</strong>
          <span>Analise as especificações do produto e valide ou devolva ao produtor.</span>
        </div>
        <div class="banner-actions">
          <button mat-stroked-button class="banner-btn-reject" (click)="validateTechnical(false)">
            <mat-icon>close</mat-icon> Devolver
          </button>
          <button mat-raised-button class="banner-btn-approve" (click)="validateTechnical(true)">
            <mat-icon>check</mat-icon> Validar Especificações
          </button>
        </div>
      </div>

      <!-- STAFF: staff_validated → encaminhar ao STATE -->
      <div class="action-banner action-banner-staff"
           *ngIf="role === 'staff' && product.status === 'staff_validated'">
        <mat-icon>send</mat-icon>
        <div>
          <strong>Pronto para Encaminhar ao STATE</strong>
          <span>As especificações foram validadas. Encaminhe o produto para decisão de publicação.</span>
        </div>
        <div class="banner-actions">
          <button mat-raised-button class="banner-btn-approve" (click)="forwardToState()">
            <mat-icon>send</mat-icon> Encaminhar ao STATE
          </button>
        </div>
      </div>

      <!-- STATE: staff_validated (após forward STAFF) → aprovar/rejeitar -->
      <div class="action-banner"
           *ngIf="role === 'state' && product.status === 'staff_validated'">
        <mat-icon>gavel</mat-icon>
        <div>
          <strong>Decisão de Publicação Pendente</strong>
          <span>Este produto foi encaminhado pelo STAFF e aguarda a sua aprovação para publicação oficial.</span>
        </div>
        <div class="banner-actions">
          <button mat-stroked-button class="banner-btn-reject" (click)="rejectPublication()">
            <mat-icon>block</mat-icon> Rejeitar
          </button>
          <button mat-raised-button class="banner-btn-approve" (click)="approvePublication()">
            <mat-icon>verified</mat-icon> Aprovar Publicação
          </button>
        </div>
      </div>

      <!-- ── Header ──────────────────────────────────────────────── -->
      <div class="detail-header">
        <div class="detail-title-group">
          <nav class="breadcrumb">
            <a (click)="back()">Produtos</a>
            <mat-icon class="bc-sep">chevron_right</mat-icon>
            <span>{{ product.cd }}</span>
          </nav>
          <div class="detail-title-row">
            <mat-icon class="page-icon">inventory_2</mat-icon>
            <h1 class="detail-title">{{ product.name }}</h1>
            <app-status-badge [status]="product.status"></app-status-badge>
            <span class="id-text">{{ product.cd }}</span>
          </div>
        </div>

        <div class="detail-actions">
          <!-- PRODUCER: draft → editar + solicitar publicação -->
          <ng-container *ngIf="role === 'producer' && product.status === 'draft'">
            <button mat-stroked-button
                    (click)="router.navigate(['/dashboard/producer/products', product.id, 'edit'])">
              <mat-icon>edit</mat-icon> Editar
            </button>
            <button mat-raised-button color="primary" (click)="requestPublication()">
              <mat-icon>publish</mat-icon> Solicitar Publicação
            </button>
          </ng-container>

          <!-- STATE: published_official → suspender -->
          <ng-container *ngIf="role === 'state' && product.status === 'published_official'">
            <button mat-raised-button color="warn" (click)="suspend()">
              <mat-icon>pause_circle</mat-icon> Suspender Produto
            </button>
          </ng-container>
        </div>
      </div>

      <!-- ── Layout 2 colunas ───────────────────────────────────── -->
      <div class="detail-2col">

        <!-- Col 1: Info geral + metadata -->
        <div class="col1-stack" style="display:flex;flex-direction:column;gap:16px">

          <mat-card>
            <mat-card-content class="card-section">
              <p class="card-section-title">Informação Geral</p>
              <div class="detail-grid">
                <div class="detail-field">
                  <label>Categoria</label>
                  <span>{{ product.category | titlecase }}</span>
                </div>
                <div class="detail-field">
                  <label>Empresa</label>
                  <span>{{ product.company?.name ?? '—' }}</span>
                </div>
                <div class="detail-field">
                  <label>Produtor</label>
                  <span>{{ product.producer?.fullName ?? '—' }}</span>
                </div>
                <div class="detail-field">
                  <label>Criado em</label>
                  <span>{{ product.createdAt | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="detail-field" *ngIf="product.publishedAt">
                  <label>Publicado em</label>
                  <span>{{ product.publishedAt | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="detail-field" *ngIf="product.rejectionReason">
                  <label>Motivo de Rejeição</label>
                  <span style="color:#c5221f">{{ product.rejectionReason }}</span>
                </div>
              </div>
              <ng-container *ngIf="product.description">
                <hr class="section-divider">
                <div class="detail-field">
                  <label>Descrição</label>
                  <span>{{ product.description }}</span>
                </div>
              </ng-container>
            </mat-card-content>
          </mat-card>

          <!-- Especificações técnicas (metadata) -->
          <mat-card *ngIf="metadataEntries.length > 0">
            <mat-card-content class="card-section">
              <p class="card-section-title">Especificações Técnicas</p>
              <div class="metadata-grid">
                <ng-container *ngFor="let e of metadataEntries">
                  <div class="meta-key">{{ e.key }}</div>
                  <div class="meta-val">{{ e.value }}</div>
                </ng-container>
              </div>
            </mat-card-content>
          </mat-card>

        </div>

        <!-- Col 2: Fluxo de publicação (timeline) -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Fluxo de Publicação</p>
            <div class="timeline">

              <div class="tl-item">
                <div class="tl-dot tl-done"><mat-icon>check</mat-icon></div>
                <div class="tl-body">
                  <div class="tl-label">Rascunho criado pelo Produtor</div>
                  <div class="tl-date">{{ product.createdAt | date:'dd/MM/yyyy' }}</div>
                </div>
              </div>

              <div class="tl-item"
                   *ngIf="['pending_review','staff_validated','published_official','rejected','suspended'].includes(product.status)">
                <div class="tl-dot tl-done"><mat-icon>check</mat-icon></div>
                <div class="tl-body">
                  <div class="tl-label">Publicação solicitada ao STAFF</div>
                </div>
              </div>

              <!-- STAFF validou -->
              <div class="tl-item"
                   *ngIf="product.status === 'pending_review'">
                <div class="tl-dot tl-pending"><mat-icon>hourglass_empty</mat-icon></div>
                <div class="tl-body">
                  <div class="tl-label tl-waiting">A aguardar validação técnica do STAFF</div>
                </div>
              </div>

              <div class="tl-item"
                   *ngIf="['staff_validated','published_official','rejected','suspended'].includes(product.status)">
                <div class="tl-dot tl-done"><mat-icon>check</mat-icon></div>
                <div class="tl-body">
                  <div class="tl-label">Especificações validadas pelo STAFF</div>
                </div>
              </div>

              <!-- STAFF encaminhou / STATE a decidir -->
              <div class="tl-item"
                   *ngIf="product.status === 'staff_validated'">
                <div class="tl-dot tl-pending"><mat-icon>hourglass_empty</mat-icon></div>
                <div class="tl-body">
                  <div class="tl-label tl-waiting">A aguardar encaminhamento ao STATE</div>
                </div>
              </div>

              <!-- Decisão final STATE -->
              <div class="tl-item"
                   *ngIf="['published_official','rejected','suspended'].includes(product.status)">
                <div class="tl-dot"
                     [class.tl-done]="product.status === 'published_official'"
                     [class.tl-rejected]="['rejected','suspended'].includes(product.status)">
                  <mat-icon>{{ product.status === 'published_official' ? 'verified' : 'block' }}</mat-icon>
                </div>
                <div class="tl-body">
                  <div class="tl-label">
                    Decisão STATE —
                    <app-status-badge [status]="product.status"></app-status-badge>
                  </div>
                  <div class="tl-date" *ngIf="product.publishedAt">
                    {{ product.publishedAt | date:'dd/MM/yyyy' }}
                  </div>
                  <div class="tl-sub" *ngIf="product.rejectionReason">
                    "{{ product.rejectionReason }}"
                  </div>
                </div>
              </div>

            </div>
          </mat-card-content>
        </mat-card>

      </div>

      <!-- Documentos do produto ────────────────────────────────── -->
      <div class="mt-md">
        <app-documents-panel
          entityType="product"
          [entityId]="product.id"
          [documents]="product.documents ?? []"
          [autoLoad]="true">
        </app-documents-panel>
      </div>

    </ng-container>
  `,
})
export class ProductDetailComponent implements OnInit {
  product:   Product | null = null;
  loading    = false;
  loadError  = false;
  role: Role | null = null;

  get metadataEntries(): { key: string; value: string }[] {
    if (!this.product?.metadata) return [];
    return Object.entries(this.product.metadata).map(([key, value]) => ({
      key,
      value: String(value),
    }));
  }

  constructor(
    private route: ActivatedRoute, public router: Router,
    private svc: ProductService, private auth: AuthService,
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
      next: (p) => { this.product = p; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }

  back(): void { this.router.navigate([`/dashboard/${this.role}/products`]); }

  private open(data: ConfirmDialogData) {
    return this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, { data });
  }

  // ── PRODUCER ────────────────────────────────────────────────────
  requestPublication(): void {
    this.open({ title: 'Solicitar Publicação', message: 'Submeter produto ao STAFF para validação técnica?', confirmText: 'Solicitar' })
      .afterClosed().subscribe((r) => {
        if (!r) return;
        this.loading = true;
        this.svc.requestPublication(this.product!.id).subscribe({
          next: (p) => { this.product = p; this.loading = false; this.snack.open('Publicação solicitada ao STAFF.', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }

  // ── STAFF: validar técnico (pending_review) ──────────────────────
  validateTechnical(valid: boolean): void {
    this.open({
      title:         valid ? 'Validar Especificações' : 'Devolver ao Produtor',
      message:       valid ? 'Confirmar validação técnica do produto?' : 'Indique o motivo da devolução:',
      inputLabel:    valid ? 'Notas (opcional)' : 'Motivo',
      inputRequired: !valid,
      confirmText:   valid ? 'Validar' : 'Devolver',
    }).afterClosed().subscribe((result) => {
      if (result === undefined) return;
      const notes = typeof result === 'string' ? result : undefined;
      this.loading = true;
      this.svc.validateTechnical(this.product!.id, valid, notes).subscribe({
        next: (p) => {
          this.product = p;
          this.loading = false;
          this.snack.open(
            valid ? 'Especificações validadas. Pode agora encaminhar ao STATE.' : 'Produto devolvido ao produtor.',
            'Fechar', { duration: 4000 }
          );
        },
        error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
      });
    });
  }

  // ── STAFF: encaminhar ao STATE (staff_validated) ─────────────────
  forwardToState(): void {
    this.open({ title: 'Encaminhar ao STATE', message: 'Encaminhar este produto ao STATE para decisão de publicação?', confirmText: 'Encaminhar' })
      .afterClosed().subscribe((r) => {
        if (!r) return;
        this.loading = true;
        this.svc.forwardProductToState(this.product!.id).subscribe({
          next: (p) => { this.product = p; this.loading = false; this.snack.open('Produto encaminhado ao STATE.', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro ao encaminhar', 'Fechar', { duration: 3000 }); },
        });
      });
  }

  // ── STATE ────────────────────────────────────────────────────────
  approvePublication(): void {
    this.open({ title: 'Aprovar Publicação', message: 'Aprovar publicação oficial deste produto no Corredor do Lobito?', confirmText: 'Aprovar' })
      .afterClosed().subscribe((r) => {
        if (!r) return;
        this.loading = true;
        this.svc.approvePublication(this.product!.id).subscribe({
          next: (p) => { this.product = p; this.loading = false; this.snack.open('Produto publicado oficialmente.', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }

  rejectPublication(): void {
    this.open({ title: 'Rejeitar Publicação', message: 'Motivo da rejeição:', inputLabel: 'Motivo', inputRequired: true, confirmText: 'Rejeitar' })
      .afterClosed().subscribe((reason: string) => {
        if (!reason) return;
        this.loading = true;
        this.svc.rejectPublication(this.product!.id, reason).subscribe({
          next: (p) => { this.product = p; this.loading = false; this.snack.open('Publicação rejeitada.', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }

  suspend(): void {
    this.open({ title: 'Suspender Produto', message: 'Suspender este produto? Ficará indisponível para novas encomendas.', confirmText: 'Suspender' })
      .afterClosed().subscribe((r) => {
        if (!r) return;
        this.loading = true;
        this.svc.suspend(this.product!.id).subscribe({
          next: (p) => { this.product = p; this.loading = false; this.snack.open('Produto suspenso.', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }
}
