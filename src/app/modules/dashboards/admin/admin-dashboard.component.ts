import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService, SystemUser } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">admin_panel_settings</mat-icon>
          <h1 class="page-title">Dashboard — Admin</h1>
        </div>
        <nav class="breadcrumb">
          <span>Bom dia, <strong>{{ userName }}</strong></span>
          <mat-icon class="bc-sep">fiber_manual_record</mat-icon>
          <span class="text-muted">Gestão de Utilizadores · ADMIN</span>
        </nav>
      </div>
      <span class="text-muted text-sm nowrap">{{ today | date:'EEEE, d MMM yyyy' }}</span>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

    <div class="stats-grid stats-grid-4">
      <mat-card class="stat-card" (click)="router.navigate(['/dashboard/admin/users'])">
        <mat-icon class="stat-card-icon">group</mat-icon>
        <div class="stat-label">Total de Utilizadores</div>
        <div class="stat-number">{{ totalUsers }}</div>
        <div class="stat-action"><mat-icon>arrow_forward</mat-icon> Gerir utilizadores</div>
      </mat-card>

      <mat-card class="stat-card">
        <mat-icon class="stat-card-icon">check_circle</mat-icon>
        <div class="stat-label">Utilizadores Activos</div>
        <div class="stat-number">{{ activeUsers }}</div>
      </mat-card>

      <mat-card class="stat-card">
        <mat-icon class="stat-card-icon">block</mat-icon>
        <div class="stat-label">Utilizadores Bloqueados</div>
        <div class="stat-number">{{ blockedUsers }}</div>
      </mat-card>

      <mat-card class="stat-card">
        <mat-icon class="stat-card-icon">badge</mat-icon>
        <div class="stat-label">Roles Distintos</div>
        <div class="stat-number">{{ distinctRoles }}</div>
      </mat-card>
    </div>

    <mat-card>
      <mat-card-content class="card-section">
        <div class="section-header">
          <p class="card-section-title" style="margin:0">Utilizadores Recentes</p>
          <button mat-stroked-button (click)="router.navigate(['/dashboard/admin/users'])">
            <mat-icon>group</mat-icon> Ver todos
          </button>
        </div>

        <table mat-table [dataSource]="recentUsers" class="full-width mt-md">
          <ng-container matColumnDef="cd">
            <th mat-header-cell *matHeaderCellDef>Nº</th>
            <td mat-cell *matCellDef="let u"><strong>{{ u.cd }}</strong></td>
          </ng-container>
          <ng-container matColumnDef="fullName">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let u">{{ u.fullName }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>E-mail</th>
            <td mat-cell *matCellDef="let u">{{ u.email }}</td>
          </ng-container>
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Role</th>
            <td mat-cell *matCellDef="let u"><span class="role-chip">{{ u.role }}</span></td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let u">
              <span [class]="u.status === 'active' ? 'badge-active' : 'badge-blocked'">{{ u.status }}</span>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .section-header { display:flex; justify-content:space-between; align-items:center; }
    .badge-active  { background:#e8f5e9; color:#2e7d32; padding:2px 8px; border-radius:12px; font-size:12px; }
    .badge-blocked { background:#fce4ec; color:#c62828; padding:2px 8px; border-radius:12px; font-size:12px; }
  `],
})
export class AdminDashboardComponent implements OnInit {
  today = new Date();
  userName = '';
  loading = false;
  totalUsers   = 0;
  activeUsers  = 0;
  blockedUsers = 0;
  distinctRoles = 0;
  recentUsers: SystemUser[] = [];
  cols = ['cd', 'fullName', 'email', 'role', 'status'];

  constructor(
    public router: Router,
    private auth: AuthService,
    private userSvc: UserService,
  ) {}

  ngOnInit(): void {
    this.userName = this.auth.getCurrentUser()?.fullName ?? '';
    this.loading = true;
    this.userSvc.getAll().subscribe({
      next: (users) => {
        this.totalUsers    = users.length;
        this.activeUsers   = users.filter(u => u.status === 'active').length;
        this.blockedUsers  = users.filter(u => u.status === 'blocked').length;
        this.distinctRoles = new Set(users.map(u => u.role)).size;
        this.recentUsers   = users.slice(0, 5);
        this.loading       = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
