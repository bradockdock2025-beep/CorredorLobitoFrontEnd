import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Verificação pública de documentos — sem autenticação
  {
    path: 'verify',
    loadChildren: () => import('./modules/verify/verify.module').then((m) => m.VerifyModule),
  },

  {
    path: 'login',
    loadChildren: () => import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },


  {
    path: 'dashboard',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [

      // ── STATE ───────────────────────────────────────────────────────
      {
        path: 'state',
        canActivate: [RoleGuard],
        data: { roles: ['state'] },
        children: [
          { path: '', loadChildren: () => import('./modules/dashboards/dashboards.module').then((m) => m.StateDashboardModule) },
          { path: 'companies',        loadChildren: () => import('./modules/companies/companies.module').then((m) => m.CompaniesModule) },
          { path: 'products',         loadChildren: () => import('./modules/products/products.module').then((m) => m.ProductsModule) },
          { path: 'price-proposals',  loadChildren: () => import('./modules/price-proposals/price-proposals.module').then((m) => m.PriceProposalsModule) },
          { path: 'orders',           loadChildren: () => import('./modules/orders/orders.module').then((m) => m.OrdersModule) },
          { path: 'transactions',     loadChildren: () => import('./modules/transactions/transactions.module').then((m) => m.TransactionsModule) },
          { path: 'shipments',        loadChildren: () => import('./modules/shipments/shipments.module').then((m) => m.ShipmentsModule) },
          { path: 'taxes',            loadChildren: () => import('./modules/taxes/taxes.module').then((m) => m.TaxesModule) },
          { path: 'reports',          loadChildren: () => import('./modules/reports/reports.module').then((m) => m.ReportsModule) },
          { path: 'users',            loadChildren: () => import('./modules/users/users.module').then((m) => m.UsersModule) },
          { path: 'audit-logs',       loadChildren: () => import('./modules/audit-logs/audit-logs.module').then((m) => m.AuditLogsModule) },
          { path: 'analytics',        loadChildren: () => import('./modules/analytics/analytics.module').then((m) => m.AnalyticsModule) },
          { path: 'support-tickets',  loadChildren: () => import('./modules/support-tickets/support-tickets.module').then((m) => m.SupportTicketsModule) },
        ],
      },

      // ── STAFF ───────────────────────────────────────────────────────
      {
        path: 'staff',
        canActivate: [RoleGuard],
        data: { roles: ['staff'] },
        children: [
          { path: '', loadChildren: () => import('./modules/dashboards/dashboards.module').then((m) => m.StaffDashboardModule) },
          { path: 'companies',       loadChildren: () => import('./modules/companies/companies.module').then((m) => m.CompaniesModule) },
          { path: 'products',        loadChildren: () => import('./modules/products/products.module').then((m) => m.ProductsModule) },
          { path: 'orders',          loadChildren: () => import('./modules/orders/orders.module').then((m) => m.OrdersModule) },
          { path: 'transactions',    loadChildren: () => import('./modules/transactions/transactions.module').then((m) => m.TransactionsModule) },
          { path: 'users',           loadChildren: () => import('./modules/users/users.module').then((m) => m.UsersModule) },
          { path: 'analytics',       loadChildren: () => import('./modules/analytics/analytics.module').then((m) => m.AnalyticsModule) },
          { path: 'support-tickets', loadChildren: () => import('./modules/support-tickets/support-tickets.module').then((m) => m.SupportTicketsModule) },
        ],
      },

      // ── SPECIALIST ──────────────────────────────────────────────────
      {
        path: 'specialist',
        canActivate: [RoleGuard],
        data: { roles: ['specialist'] },
        children: [
          { path: '', loadChildren: () => import('./modules/dashboards/dashboards.module').then((m) => m.SpecialistDashboardModule) },
          { path: 'price-proposals', loadChildren: () => import('./modules/price-proposals/price-proposals.module').then((m) => m.PriceProposalsModule) },
          { path: 'reports',         loadChildren: () => import('./modules/reports/reports.module').then((m) => m.ReportsModule) },
          { path: 'support-tickets', loadChildren: () => import('./modules/support-tickets/support-tickets.module').then((m) => m.SupportTicketsModule) },
        ],
      },

      // ── PRODUCER ────────────────────────────────────────────────────
      {
        path: 'producer',
        canActivate: [RoleGuard],
        data: { roles: ['producer'] },
        children: [
          { path: '', loadChildren: () => import('./modules/dashboards/dashboards.module').then((m) => m.ProducerDashboardModule) },
          { path: 'products',        loadChildren: () => import('./modules/products/products.module').then((m) => m.ProductsModule) },
          { path: 'support-tickets', loadChildren: () => import('./modules/support-tickets/support-tickets.module').then((m) => m.SupportTicketsModule) },
        ],
      },

      // ── BUYER ───────────────────────────────────────────────────────
      {
        path: 'buyer',
        canActivate: [RoleGuard],
        data: { roles: ['buyer'] },
        children: [
          { path: '', loadChildren: () => import('./modules/dashboards/dashboards.module').then((m) => m.BuyerDashboardModule) },
          { path: 'orders',          loadChildren: () => import('./modules/orders/orders.module').then((m) => m.OrdersModule) },
          { path: 'support-tickets', loadChildren: () => import('./modules/support-tickets/support-tickets.module').then((m) => m.SupportTicketsModule) },
        ],
      },

      // ── OPERATOR ────────────────────────────────────────────────────
      {
        path: 'operator',
        canActivate: [RoleGuard],
        data: { roles: ['operator'] },
        children: [
          { path: '', loadChildren: () => import('./modules/dashboards/dashboards.module').then((m) => m.OperatorDashboardModule) },
          { path: 'shipments',       loadChildren: () => import('./modules/shipments/shipments.module').then((m) => m.ShipmentsModule) },
          { path: 'support-tickets', loadChildren: () => import('./modules/support-tickets/support-tickets.module').then((m) => m.SupportTicketsModule) },
        ],
      },

      // ── CUSTOMS ─────────────────────────────────────────────────────
      {
        path: 'customs',
        canActivate: [RoleGuard],
        data: { roles: ['customs'] },
        children: [
          { path: '', loadChildren: () => import('./modules/dashboards/dashboards.module').then((m) => m.CustomsDashboardModule) },
          { path: 'shipments',       loadChildren: () => import('./modules/shipments/shipments.module').then((m) => m.ShipmentsModule) },
          { path: 'support-tickets', loadChildren: () => import('./modules/support-tickets/support-tickets.module').then((m) => m.SupportTicketsModule) },
        ],
      },

      // ── ANALYST ─────────────────────────────────────────────────────
      {
        path: 'analyst',
        canActivate: [RoleGuard],
        data: { roles: ['analyst'] },
        children: [
          { path: '', loadChildren: () => import('./modules/dashboards/dashboards.module').then((m) => m.AnalystDashboardModule) },
          { path: 'analytics',       loadChildren: () => import('./modules/analytics/analytics.module').then((m) => m.AnalyticsModule) },
          { path: 'reports',         loadChildren: () => import('./modules/reports/reports.module').then((m) => m.ReportsModule) },
          { path: 'support-tickets', loadChildren: () => import('./modules/support-tickets/support-tickets.module').then((m) => m.SupportTicketsModule) },
        ],
      },

      // ── COMPLIANCE ──────────────────────────────────────────────────
      {
        path: 'compliance',
        canActivate: [RoleGuard],
        data: { roles: ['compliance'] },
        children: [
          { path: '', loadChildren: () => import('./modules/dashboards/dashboards.module').then((m) => m.ComplianceDashboardModule) },
          { path: 'analytics',       loadChildren: () => import('./modules/analytics/analytics.module').then((m) => m.AnalyticsModule) },
          { path: 'reports',         loadChildren: () => import('./modules/reports/reports.module').then((m) => m.ReportsModule) },
          { path: 'audit-logs',      loadChildren: () => import('./modules/audit-logs/audit-logs.module').then((m) => m.AuditLogsModule) },
          { path: 'support-tickets', loadChildren: () => import('./modules/support-tickets/support-tickets.module').then((m) => m.SupportTicketsModule) },
        ],
      },

      // ── ADMIN ─────────────────────────────────────────────────────
      {
        path: 'admin',
        canActivate: [RoleGuard],
        data: { roles: ['admin'] },
        children: [
          { path: '', loadChildren: () => import('./modules/dashboards/dashboards.module').then((m) => m.AdminDashboardModule) },
          { path: 'users',           loadChildren: () => import('./modules/users/users.module').then((m) => m.UsersModule) },
          { path: 'support-tickets', loadChildren: () => import('./modules/support-tickets/support-tickets.module').then((m) => m.SupportTicketsModule) },
        ],
      },

    ],
  },

  { path: 'unauthorized', redirectTo: '/login' },
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
