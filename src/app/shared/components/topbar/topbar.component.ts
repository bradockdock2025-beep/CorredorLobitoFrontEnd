import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthUser } from '../../../core/models';

const ROLE_LABELS: Record<string, string> = {
  state:      'Estado',
  staff:      'Técnico de Validação',
  specialist: 'Especialista de Preços',
  producer:   'Produtor',
  buyer:      'Comprador',
  operator:   'Operador Logístico',
  customs:    'Alfândega',
};

@Component({
  selector: 'app-topbar',
  template: `
    <mat-toolbar class="topbar">

      <!-- Toggle sidebar -->
      <button mat-icon-button (click)="toggleSidebar.emit()" aria-label="Expandir/colapsar menu" class="topbar-btn">
        <mat-icon>menu</mat-icon>
      </button>

      <!-- System name -->
      <div class="topbar-brand">
        <span class="brand-main">Corredor do Lobito</span>
        <span class="brand-sep">·</span>
        <span class="brand-sub">Plataforma Governamental</span>
      </div>

      <span class="spacer"></span>

      <!-- Avatar / user menu -->
      <button mat-icon-button [matMenuTriggerFor]="userMenu" aria-label="Menu do utilizador" class="avatar-btn">
        <div class="avatar">{{ initials }}</div>
      </button>

      <mat-menu #userMenu="matMenu" xPosition="before" class="user-menu">
        <div class="menu-user-info">
          <div class="menu-avatar-lg">{{ initials }}</div>
          <div>
            <div class="menu-name">{{ user?.fullName }}</div>
            <div class="menu-role">{{ roleLabel }}</div>
          </div>
        </div>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon>
          <span>Terminar Sessão</span>
        </button>
      </mat-menu>

    </mat-toolbar>
  `,
  styles: [`
    .topbar-btn {
      color: rgba(255,255,255,0.85) !important;
      margin-right: 8px;
    }
    .topbar-btn:hover { color: #fff !important; }

    .topbar-brand {
      display: flex;
      align-items: baseline;
      gap: 8px;
      overflow: hidden;
    }
    .brand-main {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.3px;
      white-space: nowrap;
    }
    .brand-sep { color: rgba(255,255,255,0.35); font-size: 14px; }
    .brand-sub {
      font-size: 12px;
      font-weight: 400;
      color: rgba(255,255,255,0.55);
      white-space: nowrap;
      letter-spacing: 0.2px;
    }
    @media (max-width: 600px) { .brand-sub { display: none; } }

    .spacer { flex: 1; }

    .avatar-btn { padding: 0 !important; }

    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(255,255,255,0.18);
      border: 1.5px solid rgba(255,255,255,0.3);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      transition: background 0.15s;
    }
    .avatar:hover { background: rgba(255,255,255,0.28); }

    .menu-user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      min-width: 220px;
    }
    .menu-avatar-lg {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #1a1a1a;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .menu-name { font-size: 14px; font-weight: 600; color: #1a1a1a; line-height: 1.2; }
    .menu-role {
      font-size: 11px;
      color: #9e9e9e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
  `],
})
export class TopbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  user: AuthUser | null = null;
  initials = '?';
  roleLabel = '';

  constructor(private auth: AuthService, private router: Router) {
    this.user = this.auth.getCurrentUser();
    if (this.user?.fullName) {
      this.initials = this.user.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('');
    }
    if (this.user?.role) {
      this.roleLabel = ROLE_LABELS[this.user.role] ?? this.user.role;
    }
  }

  logout(): void { this.auth.logout(); }
}
