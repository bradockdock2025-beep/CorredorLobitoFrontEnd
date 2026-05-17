import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Product, Role } from '../../../../core/models';

@Component({
  selector: 'app-products-list',
  template: `
    <!-- Page header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">inventory_2</mat-icon>
          <h1 class="page-title">Produtos</h1>
        </div>
        <nav class="breadcrumb">
          <span>Dashboard</span>
          <mat-icon class="bc-sep">chevron_right</mat-icon>
          <span>Produtos</span>
        </nav>
      </div>
      <div class="page-actions">
        <span class="record-count">{{ products.length }} registo(s)</span>
        <button mat-raised-button color="primary"
                *ngIf="role === 'producer'"
                (click)="router.navigate(['/dashboard/producer/products/new'])">
          <mat-icon>add</mat-icon> Criar Produto
        </button>
      </div>
    </div>

    <!-- Status filter (state/staff) -->
    <mat-button-toggle-group [(value)]="filterStatus" (change)="applyFilter()" class="mb-md"
                             *ngIf="role === 'state' || role === 'staff'">
      <mat-button-toggle value="">Todos</mat-button-toggle>
      <mat-button-toggle value="pending_review">Em Revisão</mat-button-toggle>
      <mat-button-toggle value="staff_validated">Validado STAFF</mat-button-toggle>
      <mat-button-toggle value="published_official">Publicado</mat-button-toggle>
      <mat-button-toggle value="rejected">Rejeitado</mat-button-toggle>
    </mat-button-toggle-group>

    <!-- Progress bar (above card) -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <!-- Table card -->
    <mat-card>
      <mat-card-content>

        <!-- Error state -->
        <div class="error-state" *ngIf="loadError">
          <mat-icon>error_outline</mat-icon>
          <p>Não foi possível carregar a lista de produtos. Verifique a sua ligação e tente novamente.</p>
          <button mat-stroked-button (click)="reload()">
            <mat-icon>refresh</mat-icon> Tentar novamente
          </button>
        </div>

        <!-- Table -->
        <table mat-table [dataSource]="filtered"
               *ngIf="!loading && !loadError"
               class="full-width">

          <!-- Nº column -->
          <ng-container matColumnDef="cd">
            <th mat-header-cell *matHeaderCellDef>Nº</th>
            <td mat-cell *matCellDef="let p"><strong>{{ p.cd }}</strong></td>
          </ng-container>

          <!-- Name column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let p">
              <span class="table-link">{{ p.name }}</span>
            </td>
          </ng-container>

          <!-- Category column -->
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Categoria</th>
            <td mat-cell *matCellDef="let p">{{ p.category }}</td>
          </ng-container>

          <!-- Status column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let p">
              <app-status-badge [status]="p.status"></app-status-badge>
            </td>
          </ng-container>

          <!-- Company column -->
          <ng-container matColumnDef="company">
            <th mat-header-cell *matHeaderCellDef>Empresa</th>
            <td mat-cell *matCellDef="let p">{{ p.company?.name ?? '—' }}</td>
          </ng-container>

          <!-- Actions column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p">
              <button mat-icon-button
                      (click)="$event.stopPropagation(); router.navigate(['/dashboard/' + role + '/products', p.id])"
                      matTooltip="Ver detalhe"
                      aria-label="Ver detalhe">
                <mat-icon>open_in_new</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"
              (click)="router.navigate(['/dashboard/' + role + '/products', row.id])"></tr>

          <!-- Empty state row -->
          <tr class="mat-mdc-row" *matNoDataRow>
            <td class="mat-mdc-cell" [attr.colspan]="cols.length">
              <div class="empty-state">
                <mat-icon class="empty-icon">inventory_2</mat-icon>
                <h3>Nenhum produto encontrado</h3>
                <p *ngIf="role === 'producer'">
                  Ainda não registou nenhum produto. Crie o primeiro produto para o disponibilizar no corredor.
                </p>
                <p *ngIf="role !== 'producer'">
                  Ainda não existe nenhum produto registado no sistema.
                </p>
                <button mat-stroked-button
                        *ngIf="role === 'producer'"
                        (click)="router.navigate(['/dashboard/producer/products/new'])">
                  <mat-icon>add</mat-icon> Criar primeiro produto
                </button>
              </div>
            </td>
          </tr>
        </table>

      </mat-card-content>
    </mat-card>
  `,
})
export class ProductsListComponent implements OnInit {
  products:     Product[] = [];
  filtered:     Product[] = [];
  filterStatus  = '';
  loading       = false;
  loadError     = false;
  role: Role | string = '';
  cols = ['cd', 'name', 'category', 'status', 'company', 'actions'];

  constructor(public router: Router, private svc: ProductService, private auth: AuthService) {}

  ngOnInit(): void {
    this.role = this.auth.getCurrentUser()?.role ?? '';
    this.reload();
  }

  applyFilter(): void {
    this.filtered = this.filterStatus
      ? this.products.filter((p) => p.status === this.filterStatus)
      : this.products;
  }

  reload(): void {
    this.loading = true;
    this.loadError = false;
    const obs$ = this.role === 'producer' ? this.svc.getMyProducts() : this.svc.getAll();
    obs$.subscribe({
      next: (d) => { this.products = d; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }
}
