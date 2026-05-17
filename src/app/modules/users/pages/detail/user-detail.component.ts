import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService, SystemUser } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-detail',
  template: `
    <!-- Progress bar — always visible during load -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading" class="detail-progress"></mat-progress-bar>

    <!-- Skeleton loading -->
    <ng-container *ngIf="loading && !user">
      <div class="detail-header">
        <div class="detail-title-group">
          <nav class="breadcrumb">
            <span>Utilizadores</span>
            <mat-icon class="bc-sep">chevron_right</mat-icon>
            <span>A carregar…</span>
          </nav>
          <div class="detail-title-row">
            <mat-icon class="page-icon">person</mat-icon>
            <div class="sk sk-title"></div>
          </div>
        </div>
      </div>
      <div class="detail-2col">
        <mat-card>
          <mat-card-content class="card-section">
            <div class="sk sk-label"></div>
            <div class="detail-grid">
              <div class="sk sk-field" *ngFor="let i of [1,2,3,4,5,6,7]"></div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-content class="card-section">
            <div class="sk sk-label"></div>
            <div class="sk sk-field" *ngFor="let i of [1,2]"></div>
          </mat-card-content>
        </mat-card>
      </div>
    </ng-container>

    <!-- Error state -->
    <div class="error-state" *ngIf="!loading && !user && loadError">
      <mat-icon>error_outline</mat-icon>
      <p>Não foi possível carregar o utilizador. Verifique a sua ligação e tente novamente.</p>
      <button mat-stroked-button (click)="reload()">
        <mat-icon>refresh</mat-icon> Tentar novamente
      </button>
    </div>

    <!-- Real content -->
    <ng-container *ngIf="user">

      <!-- Header -->
      <div class="detail-header">
        <div class="detail-title-group">
          <nav class="breadcrumb">
            <a (click)="back()">Utilizadores</a>
            <mat-icon class="bc-sep">chevron_right</mat-icon>
            <span>{{ user.fullName }}</span>
          </nav>
          <div class="detail-title-row">
            <mat-icon class="page-icon">person</mat-icon>
            <h1 class="detail-title">{{ user.fullName }}</h1>
            <span class="chip"
                  [class.chip-solid]="user.status === 'active'"
                  [class.chip-gray]="user.status === 'blocked'">
              {{ user.status === 'active' ? 'Activo' : 'Bloqueado' }}
            </span>
          </div>
        </div>

        <!-- STATE-only actions -->
        <div class="detail-actions" *ngIf="role === 'state'">
          <button mat-stroked-button
                  *ngIf="user.status === 'active'"
                  (click)="block()">
            <mat-icon>block</mat-icon> Bloquear Utilizador
          </button>
          <button mat-raised-button color="primary"
                  *ngIf="user.status === 'blocked'"
                  (click)="unblock()">
            <mat-icon>check_circle</mat-icon> Desbloquear Utilizador
          </button>
        </div>
      </div>

      <!-- Two-column layout -->
      <div class="detail-2col">

        <!-- Card 1: Information -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Informação</p>
            <div class="detail-grid">
              <div class="detail-field">
                <label>Email</label>
                <span>{{ user.email }}</span>
              </div>
              <div class="detail-field">
                <label>Perfil</label>
                <span><span class="role-chip">{{ user.role }}</span></span>
              </div>
              <div class="detail-field">
                <label>Nº Registo</label>
                <span class="id-text">{{ user.cd }}</span>
              </div>
              <div class="detail-field">
                <label>Empresa</label>
                <span>{{ user.company?.name ?? (user.companyId ? '—' : '—') }}</span>
              </div>
              <div class="detail-field">
                <label>Registado em</label>
                <span class="timestamp">{{ user.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="detail-field">
                <label>Último Acesso</label>
                <span class="timestamp">
                  {{ user.lastLoginAt ? (user.lastLoginAt | date:'dd/MM/yyyy HH:mm') : '—' }}
                </span>
              </div>
              <div class="detail-field">
                <label>Actualizado em</label>
                <span class="timestamp">{{ user.updatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Card 2: Status -->
        <mat-card>
          <mat-card-content class="card-section">
            <p class="card-section-title">Estado</p>
            <div class="detail-grid">
              <div class="detail-field">
                <label>Estado actual</label>
                <span>
                  <span class="chip"
                        [class.chip-solid]="user.status === 'active'"
                        [class.chip-gray]="user.status === 'blocked'">
                    {{ user.status === 'active' ? 'Activo' : 'Bloqueado' }}
                  </span>
                </span>
              </div>
              <div class="detail-field">
                <label>Descrição</label>
                <span *ngIf="user.status === 'active'">
                  O utilizador tem acesso pleno ao sistema de acordo com o seu perfil.
                </span>
                <span *ngIf="user.status === 'blocked'">
                  O utilizador foi bloqueado e não consegue autenticar-se no sistema.
                  Apenas um utilizador com perfil STATE pode desbloquear este acesso.
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

      </div>
    </ng-container>

    <!-- Not found (no network error, simply does not exist) -->
    <div *ngIf="!loading && !user && !loadError" class="empty-state">
      <mat-icon class="empty-icon">person</mat-icon>
      <h3>Utilizador não encontrado</h3>
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
export class UserDetailComponent implements OnInit {
  user: SystemUser | null = null;
  loadError = false;
  loading = false;
  role: Role | string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userSvc: UserService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.role = this.auth.getCurrentUser()?.role ?? '';
    this.reload();
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading = true;
    this.loadError = false;
    this.userSvc.getById(id).subscribe({
      next: (u) => { this.user = u; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }

  back(): void {
    this.router.navigate([`/dashboard/${this.role}/users`]);
  }

  private openDialog(data: ConfirmDialogData) {
    return this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(
      ConfirmDialogComponent,
      { data },
    );
  }

  block(): void {
    this.openDialog({
      title: 'Bloquear Utilizador',
      message: 'Indique o motivo do bloqueio:',
      inputLabel: 'Motivo',
      inputRequired: true,
      confirmText: 'Bloquear',
    }).afterClosed().subscribe((reason: string) => {
      if (!reason) return;
      this.loading = true;
      this.userSvc.block(this.user!.id, reason).subscribe({
        next: (u) => {
          this.user = u;
          this.loading = false;
          this.snack.open('Utilizador bloqueado', 'Fechar', { duration: 3000 });
        },
        error: (e) => {
          this.loading = false;
          this.snack.open(e?.error?.message ?? 'Erro ao bloquear utilizador', 'Fechar', { duration: 3000 });
        },
      });
    });
  }

  unblock(): void {
    this.openDialog({
      title: 'Desbloquear Utilizador',
      message: 'Confirmar o desbloqueio deste utilizador? Terá acesso imediato ao sistema.',
      confirmText: 'Desbloquear',
    }).afterClosed().subscribe((confirmed: boolean | undefined) => {
      if (!confirmed) return;
      this.loading = true;
      this.userSvc.unblock(this.user!.id).subscribe({
        next: (u) => {
          this.user = u;
          this.loading = false;
          this.snack.open('Utilizador desbloqueado', 'Fechar', { duration: 3000 });
        },
        error: (e) => {
          this.loading = false;
          this.snack.open(e?.error?.message ?? 'Erro ao desbloquear utilizador', 'Fechar', { duration: 3000 });
        },
      });
    });
  }
}
