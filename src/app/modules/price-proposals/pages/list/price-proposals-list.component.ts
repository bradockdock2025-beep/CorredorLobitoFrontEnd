import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PriceProposalService } from '../../../../core/services/price-proposal.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PriceProposal, Role } from '../../../../core/models';

@Component({
  selector: 'app-price-proposals-list',
  template: `
    <!-- Page header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">price_change</mat-icon>
          <h1 class="page-title">Propostas de Preço</h1>
        </div>
        <nav class="breadcrumb">
          <span>Dashboard</span>
          <mat-icon class="bc-sep">chevron_right</mat-icon>
          <span>Propostas de Preço</span>
        </nav>
      </div>
      <div class="page-actions">
        <span class="record-count">{{ proposals.length }} registo(s)</span>
        <button mat-raised-button color="primary"
                *ngIf="role === 'specialist'"
                (click)="router.navigate(['/dashboard/specialist/price-proposals/new'])">
          <mat-icon>add</mat-icon> Nova Proposta
        </button>
      </div>
    </div>

    <!-- Progress bar (above card) -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <!-- Table card -->
    <mat-card>
      <mat-card-content>

        <!-- Error state -->
        <div class="error-state" *ngIf="loadError">
          <mat-icon>error_outline</mat-icon>
          <p>Não foi possível carregar as propostas de preço. Verifique a sua ligação e tente novamente.</p>
          <button mat-stroked-button (click)="reload()">
            <mat-icon>refresh</mat-icon> Tentar novamente
          </button>
        </div>

        <!-- Table -->
        <table mat-table [dataSource]="proposals"
               *ngIf="!loading && !loadError"
               class="full-width">

          <!-- Nº column -->
          <ng-container matColumnDef="cd">
            <th mat-header-cell *matHeaderCellDef>Nº</th>
            <td mat-cell *matCellDef="let p"><strong>{{ p.cd }}</strong></td>
          </ng-container>

          <!-- Product column -->
          <ng-container matColumnDef="product">
            <th mat-header-cell *matHeaderCellDef>Produto</th>
            <td mat-cell *matCellDef="let p">
              <span class="table-link">{{ p.product?.name ?? p.productId }}</span>
            </td>
          </ng-container>

          <!-- Proposed price column -->
          <ng-container matColumnDef="proposedPrice">
            <th mat-header-cell *matHeaderCellDef>Preço Proposto</th>
            <td mat-cell *matCellDef="let p" class="nowrap">
              {{ parseFloat(p.proposedPrice) | number:'1.2-2' }}&nbsp;{{ p.currency }}
            </td>
          </ng-container>

          <!-- Approved price column -->
          <ng-container matColumnDef="approvedPrice">
            <th mat-header-cell *matHeaderCellDef>Preço Aprovado</th>
            <td mat-cell *matCellDef="let p" class="nowrap">
              <span *ngIf="p.snapshot">
                {{ p.snapshot.approvedPriceUsd | number:'1.2-2' }}&nbsp;USD
              </span>
              <span *ngIf="!p.snapshot" class="text-muted">—</span>
            </td>
          </ng-container>

          <!-- Status column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let p">
              <app-status-badge [status]="p.status"></app-status-badge>
            </td>
          </ng-container>

          <!-- Actions column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p">
              <button mat-icon-button
                      (click)="$event.stopPropagation(); router.navigate(['/dashboard/' + role + '/price-proposals', p.id])"
                      matTooltip="Ver detalhe"
                      aria-label="Ver detalhe">
                <mat-icon>open_in_new</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"
              (click)="router.navigate(['/dashboard/' + role + '/price-proposals', row.id])"></tr>

          <!-- Empty state row -->
          <tr class="mat-mdc-row" *matNoDataRow>
            <td class="mat-mdc-cell" [attr.colspan]="cols.length">
              <div class="empty-state">
                <mat-icon class="empty-icon">price_change</mat-icon>
                <h3>Nenhuma proposta encontrada</h3>
                <p *ngIf="role === 'specialist'">
                  Ainda não submeteu nenhuma proposta de preço. Crie uma proposta para iniciar o processo de aprovação.
                </p>
                <p *ngIf="role !== 'specialist'">
                  Ainda não existem propostas de preço registadas no sistema.
                </p>
                <button mat-stroked-button
                        *ngIf="role === 'specialist'"
                        (click)="router.navigate(['/dashboard/specialist/price-proposals/new'])">
                  <mat-icon>add</mat-icon> Criar primeira proposta
                </button>
              </div>
            </td>
          </tr>
        </table>

      </mat-card-content>
    </mat-card>
  `,
})
export class PriceProposalsListComponent implements OnInit {
  proposals: PriceProposal[] = [];
  loading = false;
  loadError = false;
  role: Role | string = '';
  cols = ['cd', 'product', 'proposedPrice', 'approvedPrice', 'status', 'actions'];
  readonly parseFloat = parseFloat;

  constructor(public router: Router, private svc: PriceProposalService, private auth: AuthService) {}

  ngOnInit(): void {
    this.role = this.auth.getCurrentUser()?.role ?? '';
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.loadError = false;
    this.svc.getAll().subscribe({
      next: (d) => { this.proposals = d; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }
}
