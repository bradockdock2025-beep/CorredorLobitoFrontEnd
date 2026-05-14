# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Comandos

```bash
npm start            # Servidor de desenvolvimento em localhost:4200
npm run build        # Build de produção
npm run watch        # Build incremental (dev)
npm test             # Testes Karma/Jasmine (Chrome headless)
```

O backend deve estar a correr em `http://localhost:3000` antes de iniciar o frontend. A API URL é configurada em `src/environments/environment.ts`.

---

## Arquitectura

### Visão geral

Frontend Angular v14 + Angular Material v14 para o **Corredor do Lobito** — plataforma governamental de regulação de comércio transfronteiriço entre Angola, Zâmbia, RDC, Tanzânia, Zimbabwe e Moçambique. O State (governo) aprova cada etapa antes de avançar para a seguinte.

### Estrutura de módulos

```
src/app/
├── core/           — Singleton: modelos, serviços HTTP, interceptor, guards
├── shared/         — SharedModule reexportado por todos os feature modules
└── modules/        — Feature modules com lazy loading
```

**`core/`** nunca é importado directamente nos templates — apenas os serviços são injectados via DI. Contém:
- `models/index.ts` — todos os tipos TypeScript e helpers (`toNumber`, `formatRate`, `getErrorMessage`)
- `services/` — um serviço por domínio (company, product, price-proposal, order, shipment, tax, audit-log, auth)
- `interceptors/auth.interceptor.ts` — injeta `Authorization: Bearer <token>` em todos os pedidos; faz logout automático em 401
- `guards/auth.guard.ts` — redireciona para `/login` se não autenticado
- `guards/role.guard.ts` — lê `route.data.roles[]` e compara com `user.role`; redireciona para `/unauthorized` se inválido

**`shared/SharedModule`** exporta: `CommonModule`, `RouterModule`, `FormsModule`, `ReactiveFormsModule`, todos os módulos Angular Material usados no projecto, mais três componentes partilhados:
- `SidebarComponent` — sidenav fixa com navegação gerada a partir do role do utilizador; importar o `<app-sidebar>` como wrapper do conteúdo de cada feature
- `StatusBadgeComponent` — `<app-status-badge [status]="...">` mapeia qualquer status de qualquer entidade para label + cor
- `ConfirmDialogComponent` — diálogo de confirmação com input opcional; abrir via `MatDialog.open(ConfirmDialogComponent, { data: ConfirmDialogData })`

**Feature modules** seguem a convenção `modules/<domain>/<domain>.module.ts` com routes lazy-loaded. Cada módulo declara apenas os seus próprios componentes e importa `SharedModule`.

### Routing por role

Cada role tem um prefixo de rota exclusivo (`/dashboard/<role>/`). O `app-routing.module.ts` aplica `[AuthGuard, RoleGuard]` nos segmentos pai. O mesmo feature module (ex: `ShipmentsModule`) é reutilizado em múltiplos prefixos de role — a lógica de botões dentro do componente usa `this.auth.getCurrentUser()?.role` para mostrar/esconder acções.

```
/login                              → AuthModule (público)
/dashboard/state/...                → state only
/dashboard/staff/companies|orders   → staff only
/dashboard/specialist/price-proposals → specialist only
/dashboard/producer/products        → producer only
/dashboard/buyer/orders             → buyer only
/dashboard/operator/shipments       → operator only
/dashboard/customs/shipments        → customs only
```

Após login, `AuthService.getHomeRoute(role)` devolve a rota inicial correcta.

### Autenticação

Token JWT guardado em `localStorage` como `access_token`. O utilizador serializado fica em `localStorage` como `user`. Não existe refresh token — o utilizador faz re-login após 8h. O interceptor faz o logout e redirect automático quando a API devolve 401.

### Regras de negócio críticas (nunca violar no UI)

1. **Botões de acção condicionais por estado:** um botão só aparece quando o estado actual o permite (ver tabelas de estados em `FRONTEND-GUIDE.md` secção 8).
2. **Price proposals aprovadas são imutáveis:** nunca mostrar botão de editar quando `status === 'approved'`.
3. **Preços em order lines vêm sempre de `line.snapshotRef.approvedPriceUsd`**, nunca do produto directamente.
4. **O backend calcula impostos** no `POST /orders/:id/pay` — o frontend só exibe `order.taxAmount` e `order.totalAmount` após pagamento.
5. **Tracking é append-only:** só adicionar eventos, nunca editar os existentes.
6. **Audit log é só leitura:** não existe endpoint de escrita.
7. **Decimais monetários chegam como string** (`"450.00"`): usar sempre `toNumber()` ou `parseFloat()` antes de exibir.

### Adicionar um novo módulo

1. Criar `src/app/modules/<nome>/` com `<nome>.module.ts` e `pages/list/<nome>-list.component.ts`
2. O módulo importa `SharedModule` e define as suas rotas com `RouterModule.forChild(routes)`
3. Registar o lazy load em `app-routing.module.ts` sob o(s) prefixo(s) de role adequados com `[AuthGuard, RoleGuard]`
4. Adicionar o item de navegação em `SidebarComponent` no `NAV_MAP` do role correspondente

### Credenciais de desenvolvimento

Todas com password `Lobito@Dev2024!`:

| Role | Email |
|------|-------|
| state | state@lobito.gov |
| staff | staff@lobito.gov |
| specialist | specialist@lobito.gov |
| producer | producer@lobito.biz |
| buyer | buyer@lobito.biz |
| operator | operator@lobito.biz |
| customs | customs@lobito.gov |
