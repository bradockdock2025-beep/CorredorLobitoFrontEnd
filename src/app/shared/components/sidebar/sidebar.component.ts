import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthUser, Role } from '../../../core/models';

interface NavItem  { label: string; icon: string; route: string; }
interface NavGroup { type: 'group'; title: string; items: NavItem[]; expanded: boolean; }
interface NavLink  { type: 'link'; label: string; icon: string; route: string; }
type NavEntry = NavLink | NavGroup;

const NAV_CONFIG: Record<Role, NavEntry[]> = {
  admin: [
    { type: 'link', label: 'Dashboard', icon: 'admin_panel_settings', route: '/dashboard/admin' },
    { type: 'group', title: 'UTILIZADORES', expanded: true, items: [
      { label: 'Gerir Utilizadores', icon: 'group', route: '/dashboard/admin/users' },
    ]},
  ],
  state: [
    { type: 'link', label: 'Dashboard', icon: 'dashboard', route: '/dashboard/state' },
    { type: 'group', title: 'GESTÃO', expanded: true, items: [
      { label: 'Utilizadores',    icon: 'people',          route: '/dashboard/state/users' },
      { label: 'Empresas',        icon: 'business',        route: '/dashboard/state/companies' },
      { label: 'Produtos',        icon: 'inventory_2',     route: '/dashboard/state/products' },
      { label: 'Price Proposals', icon: 'price_change',    route: '/dashboard/state/price-proposals' },
    ]},
    { type: 'group', title: 'OPERAÇÕES', expanded: true, items: [
      { label: 'Pedidos',      icon: 'receipt_long',    route: '/dashboard/state/orders' },
      { label: 'Transacções',  icon: 'payments',        route: '/dashboard/state/transactions' },
      { label: 'Embarques',    icon: 'local_shipping',  route: '/dashboard/state/shipments' },
      { label: 'Impostos',     icon: 'account_balance', route: '/dashboard/state/taxes' },
    ]},
    { type: 'group', title: 'CONTEÚDO', expanded: false, items: [
      { label: 'Relatórios',  icon: 'description', route: '/dashboard/state/reports' },
      { label: 'Audit Log',   icon: 'history',     route: '/dashboard/state/audit-logs' },
    ]},
    { type: 'group', title: 'ANALYTICS', expanded: false, items: [
      { label: 'Visão Geral',  icon: 'bar_chart',     route: '/dashboard/state/analytics' },
      { label: 'Receita',      icon: 'payments',      route: '/dashboard/state/analytics/revenue' },
      { label: 'Logística',    icon: 'local_shipping',route: '/dashboard/state/analytics/logistics' },
      { label: 'Conformidade', icon: 'verified_user', route: '/dashboard/state/analytics/compliance' },
    ]},
  ],
  staff: [
    { type: 'link', label: 'Dashboard', icon: 'dashboard', route: '/dashboard/staff' },
    { type: 'group', title: 'GESTÃO', expanded: true, items: [
      { label: 'Utilizadores', icon: 'people',        route: '/dashboard/staff/users' },
      { label: 'Empresas',     icon: 'business',      route: '/dashboard/staff/companies' },
    ]},
    { type: 'group', title: 'OPERAÇÕES', expanded: true, items: [
      { label: 'Pedidos',     icon: 'receipt_long', route: '/dashboard/staff/orders' },
      { label: 'Transacções', icon: 'payments',      route: '/dashboard/staff/transactions' },
    ]},
    { type: 'group', title: 'ANALYTICS', expanded: false, items: [
      { label: 'Visão Geral', icon: 'bar_chart',      route: '/dashboard/staff/analytics' },
      { label: 'Receita',     icon: 'payments',       route: '/dashboard/staff/analytics/revenue' },
      { label: 'Logística',   icon: 'local_shipping', route: '/dashboard/staff/analytics/logistics' },
    ]},
  ],
  specialist: [
    { type: 'link', label: 'Dashboard', icon: 'dashboard', route: '/dashboard/specialist' },
    { type: 'group', title: 'PREÇOS', expanded: true, items: [
      { label: 'Price Proposals', icon: 'price_change', route: '/dashboard/specialist/price-proposals' },
    ]},
    { type: 'group', title: 'CONTEÚDO', expanded: false, items: [
      { label: 'Relatórios', icon: 'description', route: '/dashboard/specialist/reports' },
    ]},
  ],
  producer: [
    { type: 'link', label: 'Dashboard', icon: 'dashboard', route: '/dashboard/producer' },
    { type: 'group', title: 'CATÁLOGO', expanded: true, items: [
      { label: 'Produtos', icon: 'inventory_2', route: '/dashboard/producer/products' },
    ]},
  ],
  buyer: [
    { type: 'link', label: 'Dashboard', icon: 'dashboard', route: '/dashboard/buyer' },
    { type: 'group', title: 'COMPRAS', expanded: true, items: [
      { label: 'Os Meus Pedidos', icon: 'receipt_long', route: '/dashboard/buyer/orders' },
    ]},
  ],
  operator: [
    { type: 'link', label: 'Dashboard', icon: 'dashboard', route: '/dashboard/operator' },
    { type: 'group', title: 'LOGÍSTICA', expanded: true, items: [
      { label: 'Embarques', icon: 'local_shipping', route: '/dashboard/operator/shipments' },
    ]},
  ],
  customs: [
    { type: 'link', label: 'Dashboard', icon: 'dashboard', route: '/dashboard/customs' },
    { type: 'group', title: 'ALFÂNDEGA', expanded: true, items: [
      { label: 'Embarques', icon: 'local_shipping', route: '/dashboard/customs/shipments' },
    ]},
  ],
  analyst: [
    { type: 'link', label: 'Dashboard', icon: 'dashboard', route: '/dashboard/analyst' },
    { type: 'group', title: 'ANALYTICS', expanded: true, items: [
      { label: 'Visão Geral',  icon: 'bar_chart',     route: '/dashboard/analyst/analytics' },
      { label: 'Receita',      icon: 'payments',      route: '/dashboard/analyst/analytics/revenue' },
      { label: 'Logística',    icon: 'local_shipping',route: '/dashboard/analyst/analytics/logistics' },
      { label: 'Conformidade', icon: 'verified_user', route: '/dashboard/analyst/analytics/compliance' },
    ]},
    { type: 'group', title: 'CONTEÚDO', expanded: false, items: [
      { label: 'Relatórios', icon: 'description', route: '/dashboard/analyst/reports' },
    ]},
  ],
  compliance: [
    { type: 'link', label: 'Dashboard', icon: 'dashboard', route: '/dashboard/compliance' },
    { type: 'group', title: 'ANALYTICS', expanded: true, items: [
      { label: 'Visão Geral',  icon: 'bar_chart',     route: '/dashboard/compliance/analytics' },
      { label: 'Logística',    icon: 'local_shipping',route: '/dashboard/compliance/analytics/logistics' },
      { label: 'Conformidade', icon: 'verified_user', route: '/dashboard/compliance/analytics/compliance' },
    ]},
    { type: 'group', title: 'CONTEÚDO', expanded: false, items: [
      { label: 'Relatórios',  icon: 'description', route: '/dashboard/compliance/reports' },
      { label: 'Audit Log',   icon: 'history',     route: '/dashboard/compliance/audit-logs' },
    ]},
  ],
};

@Component({
  selector: 'app-sidebar',
  template: `
    <div class="sidebar-wrap">

      <!-- ── ZONA 1 — Perfil ──────────────────────────────────────── -->
      <div class="profile-zone">
        <div class="profile-avatar">{{ initials }}</div>
        <div class="profile-name">{{ user?.fullName }}</div>
        <div class="profile-actions">
          <div class="profile-action" (click)="goHome()" matRipple>
            <mat-icon>home</mat-icon>
            <span>Início</span>
          </div>
          <div class="profile-action disabled" matTooltip="Perfil — pós-MVP">
            <mat-icon>person</mat-icon>
            <span>Perfil</span>
          </div>
          <div class="profile-action logout" (click)="logout()" matRipple>
            <mat-icon>power_settings_new</mat-icon>
            <span>Sair</span>
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- ── ZONA 2 — Navegação ──────────────────────────────────── -->
      <nav class="sidebar-nav" aria-label="Navegação principal">

        <ng-container *ngFor="let entry of navEntries">

          <!-- Link directo -->
          <div *ngIf="entry.type === 'link'"
               class="nav-item"
               [class.active]="isActive(asLink(entry).route)"
               (click)="navigate(asLink(entry).route)"
               [attr.aria-current]="isActive(asLink(entry).route) ? 'page' : null"
               matRipple>
            <mat-icon class="nav-icon">{{ asLink(entry).icon }}</mat-icon>
            <span class="nav-label">{{ asLink(entry).label }}</span>
          </div>

          <!-- Grupo colapsável -->
          <ng-container *ngIf="entry.type === 'group'">
            <button class="nav-group-header"
                    (click)="asGroup(entry).expanded = !asGroup(entry).expanded"
                    [attr.aria-expanded]="asGroup(entry).expanded">
              <span class="nav-group-title">{{ asGroup(entry).title }}</span>
              <mat-icon class="nav-chevron" [class.rotated]="!asGroup(entry).expanded">
                expand_more
              </mat-icon>
            </button>

            <div class="nav-group-items" *ngIf="asGroup(entry).expanded">
              <div *ngFor="let item of asGroup(entry).items"
                   class="nav-item nav-subitem"
                   [class.active]="isActive(item.route)"
                   (click)="navigate(item.route)"
                   [attr.aria-current]="isActive(item.route) ? 'page' : null"
                   matRipple>
                <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
                <span class="nav-label">{{ item.label }}</span>
              </div>
            </div>
          </ng-container>

        </ng-container>
      </nav>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: hidden; }

    .sidebar-wrap {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* ── ZONA 1 ─────────────────────────────────────────────────── */
    .profile-zone {
      padding: 24px 16px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .profile-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #1a1a1a;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 1px;
      flex-shrink: 0;
    }

    .profile-name {
      font-size: 13px;
      font-weight: 600;
      color: #1a1a1a;
      text-align: center;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .profile-actions {
      display: flex;
      gap: 4px;
      margin-top: 4px;
    }

    .profile-action {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.12s;
      min-width: 52px;
    }
    .profile-action:hover { background: #f0f0f0; }
    .profile-action.disabled { opacity: 0.35; cursor: default; }
    .profile-action.logout:hover { background: #f5f5f5; }

    .profile-action mat-icon {
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
      color: #424242;
    }
    .profile-action span {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #757575;
    }

    /* ── ZONA 2 ─────────────────────────────────────────────────── */
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px 0 16px;
    }
    .sidebar-nav::-webkit-scrollbar { width: 4px; }
    .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
    .sidebar-nav::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 2px; }

    /* Grupo header */
    .nav-group-header {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px 6px;
      border: none;
      background: transparent;
      cursor: pointer;
      outline: none;
    }

    .nav-group-title {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #9e9e9e;
    }
    .nav-group-header:hover .nav-group-title { color: #424242; }

    .nav-chevron {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      color: #bdbdbd !important;
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }
    .nav-chevron.rotated { transform: rotate(-90deg); }
    .nav-group-header:hover .nav-chevron { color: #9e9e9e !important; }

    /* Nav item */
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 16px;
      cursor: pointer;
      transition: background 0.12s, color 0.12s;
      border-radius: 0;
      position: relative;
      overflow: hidden;
      min-height: 40px;
    }
    .nav-item:hover:not(.active) { background: #f5f5f5; }
    .nav-item.active {
      background: #1a1a1a;
      color: #fff;
    }

    .nav-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      color: #9e9e9e;
      flex-shrink: 0;
      transition: color 0.12s;
    }
    .nav-item:hover:not(.active) .nav-icon { color: #424242; }
    .nav-item.active .nav-icon { color: #fff !important; }

    .nav-label {
      font-size: 14px;
      font-weight: 400;
      color: #1a1a1a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
      transition: color 0.12s;
    }
    .nav-item.active .nav-label { color: #fff !important; font-weight: 500; }
    .nav-item:hover:not(.active) .nav-label { color: #1a1a1a; }

    /* Sub-items */
    .nav-subitem { padding-left: 40px; }
    .nav-subitem::before {
      content: '';
      position: absolute;
      left: 28px;
      top: 0;
      bottom: 0;
      width: 1px;
      background: #e0e0e0;
    }
    .nav-subitem.active::before { background: #fff; }
  `],
})
export class SidebarComponent implements OnInit {
  user: AuthUser | null = null;
  initials = '?';
  navEntries: NavEntry[] = [];

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
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
      this.navEntries = JSON.parse(JSON.stringify(NAV_CONFIG[this.user.role] ?? []));
    }
  }

  navigate(route: string): void { this.router.navigate([route]); }

  goHome(): void {
    if (this.user) this.router.navigate([this.auth.getHomeRoute(this.user.role)]);
  }

  logout(): void { this.auth.logout(); }

  isActive(route: string): boolean {
    const url = this.router.url;
    return url === route || (route !== `/dashboard/${this.user?.role}` && url.startsWith(route));
  }

  asLink(e: NavEntry): NavLink   { return e as NavLink; }
  asGroup(e: NavEntry): NavGroup { return e as NavGroup; }
}
