import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService, SystemUser } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models';

@Component({
  selector: 'app-users-list',
  template: `
    <!-- Page header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">people</mat-icon>
          <h1 class="page-title">Utilizadores</h1>
        </div>
        <nav class="breadcrumb">
          <span>Dashboard</span>
          <mat-icon class="bc-sep">chevron_right</mat-icon>
          <span>Utilizadores</span>
        </nav>
      </div>
      <div class="page-actions">
        <span class="record-count">{{ users.length }} registo(s)</span>
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
          <p>Não foi possível carregar a lista de utilizadores. Verifique a sua ligação e tente novamente.</p>
          <button mat-stroked-button (click)="reload()">
            <mat-icon>refresh</mat-icon> Tentar novamente
          </button>
        </div>

        <!-- Table -->
        <table mat-table [dataSource]="users"
               *ngIf="!loading && !loadError"
               class="full-width">

          <!-- Nº column -->
          <ng-container matColumnDef="cd">
            <th mat-header-cell *matHeaderCellDef>Nº</th>
            <td mat-cell *matCellDef="let u">
              <span class="id-text">{{ u.cd }}</span>
            </td>
          </ng-container>

          <!-- Email column -->
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let u">{{ u.email }}</td>
          </ng-container>

          <!-- Full Name column -->
          <ng-container matColumnDef="fullName">
            <th mat-header-cell *matHeaderCellDef>Nome Completo</th>
            <td mat-cell *matCellDef="let u">
              <span class="table-link">{{ u.fullName }}</span>
            </td>
          </ng-container>

          <!-- Role column -->
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Perfil</th>
            <td mat-cell *matCellDef="let u">
              <span class="role-chip">{{ u.role }}</span>
            </td>
          </ng-container>

          <!-- Status column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let u">
              <span class="chip"
                    [class.chip-solid]="u.status === 'active'"
                    [class.chip-gray]="u.status === 'blocked'">
                {{ u.status === 'active' ? 'Activo' : 'Bloqueado' }}
              </span>
            </td>
          </ng-container>

          <!-- Last Login column -->
          <ng-container matColumnDef="lastLoginAt">
            <th mat-header-cell *matHeaderCellDef>Último Acesso</th>
            <td mat-cell *matCellDef="let u">
              <span class="timestamp">
                {{ u.lastLoginAt ? (u.lastLoginAt | date:'dd/MM/yyyy HH:mm') : '—' }}
              </span>
            </td>
          </ng-container>

          <!-- Actions column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let u">
              <button mat-icon-button
                      (click)="$event.stopPropagation(); router.navigate(['/dashboard/' + role + '/users', u.id])"
                      matTooltip="Ver detalhe do utilizador"
                      aria-label="Ver detalhe">
                <mat-icon>open_in_new</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"
              (click)="router.navigate(['/dashboard/' + role + '/users', row.id])"></tr>

          <!-- Empty state row -->
          <tr class="mat-mdc-row" *matNoDataRow>
            <td class="mat-mdc-cell" [attr.colspan]="cols.length">
              <div class="empty-state">
                <mat-icon class="empty-icon">people</mat-icon>
                <h3>Nenhum utilizador encontrado</h3>
                <p>Ainda não existe nenhum utilizador registado no sistema.</p>
              </div>
            </td>
          </tr>
        </table>

      </mat-card-content>
    </mat-card>
  `,
})
export class UsersListComponent implements OnInit {
  users: SystemUser[] = [];
  loading = false;
  loadError = false;
  role: Role | string = '';
  cols = ['cd', 'email', 'fullName', 'role', 'status', 'lastLoginAt', 'actions'];

  constructor(
    public router: Router,
    private userSvc: UserService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.role = this.auth.getCurrentUser()?.role ?? '';
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.loadError = false;
    this.userSvc.getAll().subscribe({
      next: (data) => { this.users = data; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }
}
