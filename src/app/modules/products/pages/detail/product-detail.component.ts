import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Product, Role } from '../../../../core/models';
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
  `],
  template: `
    <!-- Progress bar — always visible during any loading -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading" class="detail-progress"></mat-progress-bar>

    <!-- Skeleton loading -->
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

    <!-- Error state -->
    <div class="error-state" *ngIf="!loading && !product && loadError">
      <mat-icon>error_outline</mat-icon>
      <p>Não foi possível carregar os dados. Verifique a sua ligação e tente novamente.</p>
      <button mat-stroked-button (click)="reload()"><mat-icon>refresh</mat-icon> Tentar novamente</button>
    </div>

    <!-- Real content -->
    <ng-container *ngIf="product">

      <!-- ── Header ─────────────────────────────────────────────────── -->
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
          <p class="text-muted text-sm" *ngIf="!hasActions">Sem acções disponíveis para o estado actual.</p>
        </div>

        <div class="detail-actions">
          <!-- PRODUCER: draft -->
          <ng-container *ngIf="role === 'producer'">
            <button mat-stroked-button
                    *ngIf="product.status === 'draft'"
                    (click)="router.navigate(['/dashboard/producer/products', product.id, 'edit'])">
              <mat-icon>edit</mat-icon> Editar Produto
            </button>
            <button mat-raised-button color="primary"
                    *ngIf="product.status === 'draft'"
                    (click)="requestPublication()">
              <mat-icon>publish</mat-icon> Solicitar Publicação
            </button>
          </ng-container>

          <!-- STATE -->
          <ng-container *ngIf="role === 'state'">
            <button mat-stroked-button
                    *ngIf="product.status === 'pending_review'"
                    (click)="rejectPublication()">
              <mat-icon>block</mat-icon> Rejeitar
            </button>
            <button mat-raised-button color="primary"
                    *ngIf="product.status === 'pending_review'"
                    (click)="approvePublication()">
              <mat-icon>verified</mat-icon> Aprovar Publicação
            </button>
            <button mat-raised-button color="primary"
                    *ngIf="product.status === 'published_official'"
                    (click)="suspend()">
              <mat-icon>pause_circle</mat-icon> Suspender Produto
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
                <label>Categoria</label>
                <span>{{ product.category }}</span>
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
                <label>Motivo Rejeição</label>
                <span>{{ product.rejectionReason }}</span>
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

        <!-- Card: Fluxo de Publicação -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Fluxo de Publicação</p>
            <div class="timeline">

              <div class="timeline-item">
                <div class="timeline-time">{{ product.createdAt | date:'dd/MM/yyyy' }}</div>
                <div class="timeline-label">Rascunho criado</div>
              </div>

              <div class="timeline-item"
                   *ngIf="['pending_review','published_official','rejected','suspended'].includes(product.status)">
                <div class="timeline-label">Publicação Solicitada</div>
              </div>

              <div class="timeline-item"
                   *ngIf="['published_official','rejected','suspended'].includes(product.status)">
                <div class="timeline-time" *ngIf="product.publishedAt">
                  {{ product.publishedAt | date:'dd/MM/yyyy' }}
                </div>
                <div class="timeline-label">
                  Decisão do Estado —
                  <app-status-badge [status]="product.status"></app-status-badge>
                </div>
              </div>

            </div>
          </mat-card-content>
        </mat-card>

      </div>
    </ng-container>
  `,
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  loading = false;
  loadError = false;
  role: Role | null = null;

  get hasActions(): boolean {
    if (!this.product) return false;
    if (this.role === 'producer' && this.product.status === 'draft') return true;
    if (this.role === 'state'    && ['pending_review','published_official'].includes(this.product.status)) return true;
    return false;
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

  requestPublication(): void {
    this.open({ title: 'Solicitar Publicação', message: 'Confirmar submissão ao STATE para revisão?', confirmText: 'Solicitar' })
      .afterClosed().subscribe((r) => {
        if (!r) return;
        this.loading = true;
        this.svc.requestPublication(this.product!.id).subscribe({
          next: (p) => { this.product = p; this.loading = false; this.snack.open('Publicação solicitada', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }

  approvePublication(): void {
    this.open({ title: 'Aprovar Publicação', message: 'Aprovar publicação oficial deste produto?', confirmText: 'Aprovar' })
      .afterClosed().subscribe((r) => {
        if (!r) return;
        this.loading = true;
        this.svc.approvePublication(this.product!.id).subscribe({
          next: (p) => { this.product = p; this.loading = false; this.snack.open('Produto publicado oficialmente', 'Fechar', { duration: 3000 }); },
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
          next: (p) => { this.product = p; this.loading = false; this.snack.open('Publicação rejeitada', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }

  suspend(): void {
    this.open({ title: 'Suspender Produto', message: 'Suspender este produto?', confirmText: 'Suspender' })
      .afterClosed().subscribe((r) => {
        if (!r) return;
        this.loading = true;
        this.svc.suspend(this.product!.id).subscribe({
          next: (p) => { this.product = p; this.loading = false; this.snack.open('Produto suspenso', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }
}
