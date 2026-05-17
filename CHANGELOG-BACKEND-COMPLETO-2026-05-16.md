# Corredor do Lobito — Changelog Backend Completo
> **Data:** 2026-05-16  
> **Versão:** 3.0  
> **Base URL Local:** `http://localhost:3000`  
> **Swagger:** `http://localhost:3000/docs`  
> **Autenticação:** Bearer JWT — obter via `POST /auth/login`

---

## Índice

1. [Segurança Global (FASE 1)](#1-segurança-global-fase-1)
2. [Auth — Todos os endpoints](#2-auth--todos-os-endpoints)
3. [2FA — Fluxo completo](#3-2fa--fluxo-completo)
4. [Users — Todos os endpoints](#4-users--todos-os-endpoints)
5. [Companies — Todos os endpoints](#5-companies--todos-os-endpoints)
6. [Products — Todos os endpoints](#6-products--todos-os-endpoints)
7. [Price Proposals — Todos os endpoints](#7-price-proposals--todos-os-endpoints)
8. [Orders — Todos os endpoints](#8-orders--todos-os-endpoints)
9. [Transactions — Todos os endpoints](#9-transactions--todos-os-endpoints)
10. [Shipments — Todos os endpoints](#10-shipments--todos-os-endpoints)
11. [Taxes — Todos os endpoints](#11-taxes--todos-os-endpoints)
12. [Reports — Todos os endpoints](#12-reports--todos-os-endpoints)
13. [Support Tickets — Módulo novo](#13-support-tickets--módulo-novo)
14. [Audit Logs — Todos os endpoints](#14-audit-logs--todos-os-endpoints)
15. [Dashboard e Analytics](#15-dashboard-e-analytics)
16. [Base de Dados — Todas as alterações](#16-base-de-dados--todas-as-alterações)
17. [Rate Limiting — Comportamento](#17-rate-limiting--comportamento)
18. [Audit Actions — Lista completa](#18-audit-actions--lista-completa)
19. [Modelo User — Campos actuais](#19-modelo-user--campos-actuais)

---

## 1. Segurança Global (FASE 1)

Aplicado a toda a API automaticamente — sem acção do frontend.

### HSTS (Helmet)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### CORS
- **Desenvolvimento:** aceita qualquer origem
- **Produção:** whitelist restrita — apenas domínios `corredor-lobito.gov`

### Validação de payload
- `forbidNonWhitelisted: true` — campos desconhecidos no body retornam **400**
- `transform: true` — tipos são convertidos automaticamente (string → number)

### Password mínimo
- **12 caracteres** em todos os endpoints que aceitam password

---

## 2. Auth — Todos os endpoints

### POST /auth/register
**Público** · Cria utilizador externo (buyer, producer, operator)

> ⚠️ **BREAKING CHANGE:** Campos de empresa (`companyName`, `companyCountry`, `companyEmail`, etc.) foram removidos. O registo cria apenas o utilizador. A empresa é criada em passo separado via `POST /companies`.

**Body:**
```json
{
  "email": "joao@empresa.ao",
  "password": "Senha123456!",
  "fullName": "João Silva",
  "phone": "+244923000001",
  "role": "producer"
}
```

Roles permitidos: `buyer` · `producer` · `operator`

**Resposta 201:**
```json
{
  "access_token": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "email": "joao@empresa.ao",
    "role": "producer",
    "fullName": "João Silva",
    "phone": "+244923000001",
    "companyId": null
  }
}
```

---

### POST /auth/login
**Público** · Rate limiting progressivo activo

**Body:**
```json
{
  "email": "state@lobito.gov",
  "password": "StateAdmin2024!"
}
```

**Resposta — role SEM 2FA** (buyer, producer, operator, etc.):
```json
{
  "access_token": "eyJhbGci...",
  "requires2fa": false,
  "twoFactorSetup": false,
  "user": {
    "id": "uuid",
    "email": "joao@empresa.ao",
    "role": "producer",
    "fullName": "João Silva",
    "phone": "+244923000001",
    "companyId": "uuid-empresa"
  }
}
```

**Resposta — role COM 2FA, ainda não configurado** (state, staff, specialist, compliance):
```json
{
  "access_token": "eyJhbGci...",
  "requires2fa": true,
  "twoFactorSetup": true,
  "user": { ... }
}
```
> `twoFactorSetup: true` → redirigir para ecrã de configuração 2FA

**Resposta — role COM 2FA activo:**
```json
{
  "requires2fa": true,
  "twoFactorSetup": false,
  "tempToken": "eyJhbGci...",
  "message": "Introduza o código do autenticador para concluir o login."
}
```
> Sem `access_token`. Usar `tempToken` em `POST /auth/2fa/validate`. Expira em 5 minutos.

**Erros:**
```json
{ "statusCode": 401, "message": "Credenciais inválidas" }
{ "statusCode": 403, "message": "Utilizador bloqueado. Contacte o STATE para desbloquear a conta." }
{ "statusCode": 429, "message": "Demasiadas tentativas. Aguarde X segundos.", "retryAfter": 60 }
```

---

### POST /auth/logout
**Autenticado**

```
POST /auth/logout
Authorization: Bearer <token>
```

**Resposta 200:**
```json
{ "message": "Sessão terminada com sucesso." }
```

---

### GET /auth/me
**Autenticado** · **NOVO**

Devolve perfil completo do utilizador autenticado com dados da empresa.

```
GET /auth/me
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "id": "uuid",
  "cd": "USR-0001",
  "email": "producer@empresa.ao",
  "fullName": "Nome Completo",
  "phone": "+244923000001",
  "role": "producer",
  "status": "active",
  "companyId": "uuid-empresa",
  "lastLoginAt": "2026-05-16T02:50:00.000Z",
  "createdAt": "2026-05-10T00:00:00.000Z",
  "twoFactorEnabled": false,
  "company": {
    "id": "uuid-empresa",
    "name": "Empresa XYZ Lda",
    "licenseStatus": "active"
  }
}
```

Para roles governamentais sem empresa, `company` é `null`.

---

### POST /auth/change-password
**Autenticado** · **NOVO**

```
POST /auth/change-password
Authorization: Bearer <token>

{
  "currentPassword": "SenhaAntiga123!",
  "newPassword": "SenhaNova456!"
}
```

**Resposta 200:**
```json
{ "message": "Password alterada com sucesso." }
```

**Erros:**
```json
{ "statusCode": 400, "message": "Password actual incorrecta." }
{ "statusCode": 400, "message": "A nova password não pode ser igual à actual." }
{ "statusCode": 400, "message": "A nova senha deve ter pelo menos 12 caracteres." }
```

> Gera audit log `CHANGE_PASSWORD`.

---

## 3. 2FA — Fluxo completo

Obrigatório para: `state` · `staff` · `specialist` · `compliance`

### POST /auth/2fa/setup
**Autenticado** · **NOVO** · Apenas roles com 2FA obrigatório

Gera segredo TOTP e QR code. Chamar uma única vez antes de activar.

```
POST /auth/2fa/setup
Authorization: Bearer <token>
```

**Resposta 200:**
```json
{
  "secret": "IBWDOJL5ORBTOVDIMRUES2C5HNFTSSJV",
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "message": "Escaneia o QR code com o Google Authenticator ou Authy..."
}
```

Usar o `qrCode` directamente:
```html
<img src="data:image/png;base64,iVBORw0KGgo..." width="200" height="200" />
```

**Erros:**
```json
{ "statusCode": 403, "message": "O role \"producer\" não requer 2FA." }
{ "statusCode": 400, "message": "O 2FA já está activado nesta conta." }
```

---

### POST /auth/2fa/verify
**Autenticado** · **NOVO** · Activar 2FA após escanear QR

```
POST /auth/2fa/verify
Authorization: Bearer <token>

{ "code": "482951" }
```

**Resposta 200:**
```json
{ "message": "2FA activado com sucesso. Todos os logins futuros exigirão o código do autenticador." }
```

**Erros:**
```json
{ "statusCode": 401, "message": "Código inválido. Verifique o relógio do dispositivo e tente novamente." }
{ "statusCode": 400, "message": "Segredo 2FA não encontrado. Chame POST /auth/2fa/setup primeiro." }
```

---

### POST /auth/2fa/validate
**Público** · **NOVO** · Segundo factor no login

```
POST /auth/2fa/validate

{
  "tempToken": "eyJhbGci...",
  "code": "739204"
}
```

**Resposta 200:**
```json
{
  "access_token": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "email": "state@lobito.gov",
    "role": "state",
    "fullName": "STATE Admin",
    "phone": null,
    "companyId": null
  }
}
```

**Erros:**
```json
{ "statusCode": 401, "message": "Código inválido." }
{ "statusCode": 401, "message": "Token temporário inválido ou expirado." }
```

---

### POST /auth/2fa/disable
**Autenticado** · **NOVO** · Desactivar 2FA com confirmação

```
POST /auth/2fa/disable
Authorization: Bearer <token>

{ "code": "591847" }
```

**Resposta 200:**
```json
{ "message": "2FA desactivado. O login voltará a exigir apenas email e password." }
```

---

## 4. Users — Todos os endpoints

### GET /users
**Roles:** `admin` · `state` · `staff`

```
GET /users?page=1&limit=20
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid", "cd": "USR-0001", "email": "user@lobito.gov",
      "fullName": "Nome", "phone": "+244923000001",
      "role": "staff", "status": "active",
      "companyId": null, "lastLoginAt": "2026-05-16T...",
      "createdAt": "2026-05-10T...", "updatedAt": "2026-05-16T..."
    }
  ],
  "meta": { "total": 26, "page": 1, "limit": 20, "totalPages": 2 }
}
```

---

### GET /users/:id
**Roles:** `admin` · `state` · `staff`

```
GET /users/uuid
Authorization: Bearer <token>
```

**Resposta:** mesmo objecto que o item em `GET /users`.

---

### POST /users
**Roles:** `admin`

Cria utilizador com qualquer role (incluindo roles governamentais).

```json
{
  "email": "novo@lobito.gov",
  "password": "Lobito@Dev2024!",
  "fullName": "Nome Completo",
  "phone": "+244923000001",
  "role": "staff",
  "companyId": null
}
```

Roles disponíveis: `admin` · `state` · `staff` · `specialist` · `analyst` · `compliance` · `customs` · `producer` · `buyer` · `operator` · `company`

**Resposta 201:** objecto user completo (sem passwordHash).

---

### PUT /users/:id
**Roles:** `admin`

Actualiza dados básicos — fullName, phone, companyId.

```json
{
  "fullName": "Nome Actualizado",
  "phone": "+244933999888",
  "companyId": "uuid-empresa"
}
```

Todos os campos são opcionais. Gera audit log `UPDATE_USER`.

---

### PUT /users/:id/block
**Roles:** `state`

```json
{ "reason": "Actividade suspeita detectada pelo COMPLIANCE." }
```

**Resposta 200:** objecto user com `status: "blocked"`.

> STATE não pode bloquear a própria conta — retorna 403.

---

### PUT /users/:id/unblock
**Roles:** `state`

```
PUT /users/uuid/unblock
Authorization: Bearer <token>
```

**Resposta 200:** objecto user com `status: "active"`.

---

### PUT /users/:id/role
**Roles:** `admin`

```json
{ "role": "specialist" }
```

> ADMIN não pode alterar o próprio role — retorna 403.

---

## 5. Companies — Todos os endpoints

### POST /companies
**Autenticado** · **ALTERADO**

Qualquer utilizador autenticado pode criar uma empresa.

> **Auto-link:** Se o utilizador tiver role `producer`, `buyer` ou `operator` e `companyId = null`, é automaticamente associado à empresa criada.  
> **Roles governamentais** (state, staff, admin, etc.) nunca são auto-ligados.

**Body:**
```json
{
  "name": "Empresa XYZ Lda",
  "country": "angola",
  "companyType": "producer",
  "contactEmail": "geral@xyz.ao",
  "contactPhone": "+244923000002",
  "address": "Rua da Samba, 100, Luanda"
}
```

`country`: `angola` · `zambia` · `drc` · `tanzania` · `zimbabwe` · `mozambique`  
`companyType` (opcional): `importer` · `exporter` · `mixed` · `producer` · `logistics`

**Resposta 201:**
```json
{
  "id": "uuid",
  "cd": "EMP-0020",
  "name": "Empresa XYZ Lda",
  "country": "angola",
  "companyType": "producer",
  "licenseStatus": "pending",
  "contactEmail": "geral@xyz.ao",
  "contactPhone": "+244923000002",
  "address": "Rua da Samba, 100, Luanda",
  "licenseNumber": null,
  "licenseExpiresAt": null,
  "verifiedByState": false,
  "documentationValidation": null,
  "createdAt": "2026-05-16T..."
}
```

> Gera audit log `CREATE_COMPANY`.

---

### GET /companies
**Roles:** `state` · `staff`

```
GET /companies?page=1&limit=20
```

**Resposta:** `{ data: [...], meta: { total, page, limit, totalPages } }`

---

### GET /companies/:id
**Autenticado**

Devolve empresa com todos os campos incluindo `documentationValidation` e `verifiedByState`.

---

### PUT /companies/:id
**Autenticado**

Actualiza campos de contacto (não altera licenseStatus nem campos regulatórios).

```json
{
  "name": "Nome Actualizado",
  "companyType": "exporter",
  "contactEmail": "novo@empresa.ao",
  "contactPhone": "+244923000003",
  "address": "Nova Morada"
}
```

---

### POST /companies/:id/validate-documentation
**Roles:** `staff`

STAFF valida documentação da empresa.

```json
{
  "valid": true,
  "notes": "Documentação completa e conforme. Todos os certificados válidos."
}
```

**Resposta — valid: true:**
```json
{
  "licenseStatus": "under_review",
  "documentationValidation": {
    "validatedAt": "2026-05-16T01:12:06.115Z",
    "validatedBy": "uuid-do-staff",
    "result": "approved",
    "notes": "Documentação completa e conforme."
  },
  "validatedByStaffId": "uuid-do-staff"
}
```

**Resposta — valid: false:**
```json
{
  "licenseStatus": "pending",
  "documentationValidation": {
    "result": "rejected",
    "notes": "Falta certidão de registo comercial actualizada."
  }
}
```

---

### POST /companies/:id/forward-to-state
**Roles:** `staff`

Empresa deve estar em `under_review`. Encaminha ao STATE para decisão.

**Resposta 200:**
```json
{ "message": "Empresa encaminhada ao STATE para decisão de licenciamento." }
```

---

### POST /companies/:id/approve-license
**Roles:** `state`

```json
{
  "licenseNumber": "LIC-AO-2026-0042",
  "licenseExpiresAt": "2028-12-31"
}
```

**Resposta 200:**
```json
{
  "licenseStatus": "active",
  "licenseNumber": "LIC-AO-2026-0042",
  "licenseExpiresAt": "2028-12-31T00:00:00.000Z",
  "verifiedByState": true,
  "approvedByStateId": "uuid-do-state"
}
```

---

### POST /companies/:id/reject-license
**Roles:** `state`

```json
{ "reason": "Documentação incompleta após segunda verificação." }
```

**Resposta:** empresa com `licenseStatus: "rejected"`.

---

### POST /companies/:id/suspend
**Roles:** `state`

```json
{ "reason": "Violação dos termos de operação transfronteiriça." }
```

**Resposta:** empresa com `licenseStatus: "suspended"`.

---

### POST /companies/:id/revoke
**Roles:** `state`

Revogação permanente. Empresa em `active` ou `suspended`.

```json
{ "reason": "Fraude documentada — revogação permanente." }
```

---

## 6. Products — Todos os endpoints

### GET /products
**Autenticado**

```
GET /products?page=1&limit=20
```

**Resposta:** `{ data: [...products com producer e company...], meta: {...} }`

Cada produto inclui:
```json
{
  "id": "uuid", "cd": "PRD-0001",
  "name": "Cimento Portland 50kg",
  "description": "Cimento tipo I",
  "category": "construção",
  "status": "published_official",
  "metadata": { "norma": "ISO 9001", "peso": "50kg" },
  "publishedAt": "2026-05-15T...",
  "producer": { "id": "uuid", "fullName": "João Silva" },
  "company": { "id": "uuid", "name": "Empresa XYZ" }
}
```

---

### GET /products/my-products
**Roles:** `producer`

Lista apenas produtos do producer autenticado.

---

### GET /products/:id
**Autenticado**

---

### POST /products
**Roles:** `producer`

A empresa do producer deve ter `licenseStatus: "active"`.

```json
{
  "name": "Cimento Portland 50kg",
  "description": "Cimento tipo I para construção civil",
  "category": "construção",
  "companyId": "uuid-da-empresa",
  "metadata": {
    "norma": "ISO 9001",
    "peso": "50kg",
    "resistencia": "C30",
    "certificado": "IANORQ-2026"
  }
}
```

**Resposta 201:** produto com `status: "draft"`.

---

### PUT /products/:id
**Roles:** `producer` · Apenas produtos em `draft`

```json
{
  "name": "Nome Actualizado",
  "description": "Nova descrição",
  "category": "nova-categoria",
  "metadata": { "peso": "25kg" }
}
```

---

### POST /products/:id/request-publication
**Roles:** `producer` · Produto deve estar em `draft`

```
POST /products/uuid/request-publication
Authorization: Bearer <producer_token>
```

**Resposta:** produto com `status: "pending_review"`.

---

### POST /products/:id/validate-technical
**Roles:** `staff` · Produto deve estar em `pending_review`

```json
{
  "valid": true,
  "notes": "Especificações técnicas completas e conformes com normas SADC."
}
```

`notes` mínimo 5 caracteres quando fornecido.

**Resposta — valid true:** produto com `status: "staff_validated"`.  
**Resposta — valid false:** produto retorna para `status: "pending_review"`.

---

### POST /products/:id/forward-product-to-state
**Roles:** `staff` · Produto deve estar em `staff_validated`

**Resposta 200:** produto + mensagem de encaminhamento.

---

### POST /products/:id/approve-publication
**Roles:** `state`

**Resposta:** produto com `status: "published_official"` e `publishedAt`.

---

### POST /products/:id/reject-publication
**Roles:** `state`

```json
{ "reason": "Especificações técnicas insuficientes para o mercado regional." }
```

**Resposta:** produto com `status: "rejected"`.

---

### POST /products/:id/suspend
**Roles:** `state` · Produto deve estar em `published_official`

**Resposta:** produto com `status: "suspended"`.

---

## 7. Price Proposals — Todos os endpoints

### GET /price-proposals
**Roles:** `state` · `specialist`

```
GET /price-proposals?page=1&limit=20
```

---

### GET /price-proposals/my-proposals
**Roles:** `specialist`

---

### GET /price-proposals/:id
**Autenticado**

---

### POST /price-proposals
**Roles:** `specialist`

```json
{
  "productId": "uuid-do-produto-published",
  "proposedPrice": 150.00,
  "currency": "USD",
  "justification": "Baseado na análise de mercado Q2 2026 — média regional de 145-155 USD/ton.",
  "validFrom": "2026-06-01T00:00:00.000Z",
  "validTo": "2026-12-31T23:59:59.000Z"
}
```

**Resposta 201:** proposta com `status: "draft"`.

---

### PUT /price-proposals/:id
**Roles:** `specialist` · Apenas propostas em `draft` ou `rejected`

---

### POST /price-proposals/:id/submit
**Roles:** `specialist`

**Resposta:** proposta com `status: "submitted"`.

---

### POST /price-proposals/:id/approve
**Roles:** `state`

**Resposta:** proposta com `status: "approved"` e snapshot imutável:
```json
{
  "status": "approved",
  "snapshot": {
    "snapshotVersion": "1.0",
    "generatedAt": "2026-05-16T...",
    "proposalId": "uuid",
    "productId": "uuid",
    "productName": "Cimento Portland 50kg",
    "productCategory": "construção",
    "approvedPriceUsd": 150.00,
    "currency": "USD",
    "validFrom": "2026-06-01T...",
    "validTo": "2026-12-31T...",
    "immutable": true
  }
}
```

---

### POST /price-proposals/:id/reject
**Roles:** `state`

```json
{ "reason": "Preço fora do intervalo de referência regional." }
```

---

## 8. Orders — Todos os endpoints

### GET /orders
**Roles:** `state` · `staff` · `specialist`

---

### GET /orders/my-orders
**Roles:** `buyer`

---

### GET /orders/:id
**Autenticado** · BUYER só vê os próprios pedidos

---

### POST /orders
**Roles:** `buyer`

> BUYER passa apenas `productId` e `qty`. O sistema resolve automaticamente `companyId` (do JWT), `priceProposalId` (proposta aprovada e vigente) e `unitPrice` (do snapshot).

```json
{
  "lines": [
    { "productId": "uuid-produto-1", "qty": 10 },
    { "productId": "uuid-produto-2", "qty": 5 }
  ]
}
```

**Resposta 201:**
```json
{
  "id": "uuid", "cd": "ORD-0019",
  "status": "draft",
  "buyerId": "uuid-buyer",
  "companyId": "uuid-empresa-buyer",
  "totalAmount": null,
  "taxAmount": null,
  "netAmount": null,
  "lines": [
    {
      "productId": "uuid",
      "qty": 10,
      "unitPrice": "150.0000",
      "priceProposalId": "uuid-proposta"
    }
  ]
}
```

---

### PUT /orders/:id
**Roles:** `buyer` · Apenas pedidos em `draft`

Actualizar linhas do pedido.

---

### POST /orders/:id/pay
**Roles:** `buyer`

Calcula impostos automaticamente e cria transacção.

**Resposta 200:**
```json
{
  "status": "paid",
  "netAmount": "1500.0000",
  "taxAmount": "210.0000",
  "totalAmount": "1710.0000",
  "paidAt": "2026-05-16T...",
  "transaction": {
    "id": "uuid",
    "cd": "TRX-0009",
    "amount": "1710.0000",
    "status": "completed"
  }
}
```

---

### POST /orders/:id/block
**Roles:** `state`

```json
{ "reason": "Suspeita de fraude — em investigação pelo COMPLIANCE." }
```

---

### POST /orders/:id/cancel
**Roles:** `state`

---

### POST /orders/:id/escalate-to-state
**Roles:** `staff`

---

## 9. Transactions — Todos os endpoints

Transacções são criadas automaticamente no pagamento do pedido.

### GET /transactions
**Roles:** `state` · `staff` · `specialist` · `compliance`

---

### GET /transactions/summary
**Roles:** `state` · `staff` · `specialist` · `compliance`

**Resposta:**
```json
{
  "counts": {
    "total": 9,
    "completed": 8,
    "blocked": 1,
    "cancelled": 0
  },
  "amounts": {
    "totalCompleted": "877.45",
    "average": "109.68",
    "max": "513.00",
    "min": "9.86"
  }
}
```

> Valores monetários são retornados como strings (tipo Decimal Prisma) — usar `parseFloat()` no frontend.

---

### GET /transactions/:id
**Roles:** `state` · `staff` · `specialist` · `compliance`

---

### POST /transactions/:id/block
**Roles:** `state`

```json
{ "reason": "Transacção bloqueada por ordem judicial." }
```

---

### POST /transactions/:id/cancel
**Roles:** `state`

---

## 10. Shipments — Todos os endpoints

### GET /shipments
**Roles:** `state` · `staff` · `customs`

```
GET /shipments?page=1&limit=20&status=at_border
```

Filtro por status opcional.

---

### GET /shipments/my-shipments
**Roles:** `operator`

---

### GET /shipments/order/:orderId
**Roles:** `state` · `staff` · `buyer` · `operator` · `customs` · `compliance`

BUYER rastreia o próprio embarque pelo orderId.

---

### GET /shipments/:id
**Roles:** `state` · `staff` · `customs` · `operator` · `compliance`

---

### POST /shipments
**Roles:** `operator` · Order deve estar em `paid`

```json
{
  "orderId": "uuid-do-pedido-pago",
  "origin": "Porto de Luanda, Angola",
  "destination": "Lusaka, Zâmbia",
  "eta": "2026-06-15T00:00:00.000Z"
}
```

**Resposta 201:** embarque com `status: "created"`.

---

### PUT /shipments/:id/tracking
**Roles:** `operator` · Apenas os próprios embarques

Tracking é **append-only** — eventos acumulam, nunca são apagados.

```json
{
  "location": "Fronteira de Luau, Angola",
  "status": "at_border",
  "notes": "Chegada à fronteira. Documentação entregue à alfândega."
}
```

---

### POST /shipments/:id/approve
**Roles:** `customs`

```json
{ "notes": "Documentação completa. Mercadoria conforme com manifesto." }
```

**Resposta:** embarque com `status: "customs_approved"`.

---

### POST /shipments/:id/reject
**Roles:** `customs`

```json
{ "reason": "Certificado de origem inválido — assinatura não reconhecida." }
```

---

### POST /shipments/:id/hold
**Roles:** `customs` · `state`

```json
{ "reason": "Mercadoria retida para inspecção especial — aguarda decisão STATE." }
```

---

## 11. Taxes — Todos os endpoints

### GET /taxes
**Autenticado**

```
GET /taxes?page=1&limit=20
```

---

### GET /taxes/country/:code
**Autenticado**

```
GET /taxes/country/angola
```

Devolve todas as taxas activas para o país.

---

### GET /taxes/:id
**Autenticado**

---

### POST /taxes
**Roles:** `state`

```json
{
  "name": "IVA Angola Geral",
  "category": "general",
  "country": "angola",
  "rate": 0.14,
  "effectiveFrom": "2026-01-01T00:00:00.000Z",
  "effectiveTo": null,
  "isActive": true
}
```

`rate` é um decimal: `0.14` = 14%

---

### PUT /taxes/:id
**Roles:** `state`

```json
{ "rate": 0.16, "isActive": true }
```

> `rate` é retornado como string `"0.16"` — usar `parseFloat()` no frontend.

---

## 12. Reports — Todos os endpoints

### GET /reports
**Autenticado**

---

### GET /reports/my-reports
**Autenticado** · Devolve apenas relatórios do utilizador autenticado

---

### GET /reports/:id
**Autenticado**

---

### POST /reports
**Roles:** `specialist` · `analyst` · `compliance`

```json
{
  "title": "Relatório Fiscal Q2 2026",
  "type": "fiscal",
  "period": "Q2 2026",
  "content": {
    "summary": "...",
    "data": { }
  },
  "targetAudience": "government"
}
```

`type`: `operational` · `fiscal` · `strategic` · `compliance`  
`targetAudience`: `public` · `government` · `internal`

---

### PUT /reports/:id
**Autenticado** · Apenas relatórios em `draft`

---

### POST /reports/:id/submit
**Autenticado** · Submete ao STATE para publicação

**Resposta:** relatório com `status: "submitted"`.

---

### POST /reports/:id/publish
**Roles:** `state`

**Resposta:** relatório com `status: "published"` e `publishedAt`.

---

### POST /reports/:id/reject
**Roles:** `state`

```json
{ "reason": "Dados insuficientes para suportar as conclusões." }
```

---

## 13. Support Tickets — Módulo novo

**NOVO — FASE 3 completa**

### GET /support-tickets
**Roles:** `state` · `staff` · `admin`

```
GET /support-tickets?page=1&limit=20
```

**Resposta:** `{ data: [...], meta: {...} }` — inclui dados do utilizador que abriu.

---

### GET /support-tickets/my-tickets
**Autenticado** · Qualquer role

---

### GET /support-tickets/:id
**Autenticado**

---

### POST /support-tickets
**Autenticado** · Qualquer role

```json
{
  "type": "licensing",
  "subject": "Empresa bloqueada sem notificação prévia",
  "content": {
    "description": "A empresa foi suspensa mas não recebemos qualquer notificação.",
    "companyId": "uuid-da-empresa",
    "documentos": ["licença-2026.pdf"]
  }
}
```

`type`: `technical` · `licensing` · `billing` · `compliance` · `other`

**Resposta 201:**
```json
{
  "id": "uuid",
  "cd": "TKT-0001",
  "userId": "uuid",
  "type": "licensing",
  "status": "open",
  "subject": "Empresa bloqueada sem notificação prévia",
  "content": { "description": "..." },
  "resolution": null,
  "resolvedByStaffId": null,
  "escalatedToState": false,
  "escalatedAt": null,
  "resolvedAt": null,
  "closedAt": null,
  "createdAt": "2026-05-16T..."
}
```

---

### PUT /support-tickets/:id
**Autenticado** · Apenas o dono · Apenas tickets em `open`

```json
{
  "subject": "Assunto corrigido",
  "content": { "description": "Descrição actualizada" }
}
```

---

### POST /support-tickets/:id/resolve
**Roles:** `staff` · `state` · `admin`

```json
{
  "resolution": "Empresa reactivada após verificação dos documentos. O bloqueio foi um erro administrativo corrigido."
}
```

`resolution` mínimo 10 caracteres.

**Resposta:** ticket com `status: "resolved"`.

---

### POST /support-tickets/:id/escalate
**Roles:** `staff`

```json
{
  "reason": "Situação requer decisão governamental — empresa alega discriminação no processo de licenciamento."
}
```

`reason` mínimo 10 caracteres.

**Resposta:** ticket com `status: "escalated"` e `escalatedToState: true`.

---

### POST /support-tickets/:id/close
**Autenticado** · Dono do ticket ou STATE

**Resposta:** ticket com `status: "closed"` e `closedAt`.

---

**Estados do ticket:**
```
open → resolve → resolved → close → closed
open → escalate → escalated → resolve → resolved → close → closed
```

---

## 14. Audit Logs — Todos os endpoints

### GET /logs
**Roles:** `state` · `compliance`

```
GET /logs?page=1&limit=20&entity=company&action=APPROVE_LICENSE
```

Filtros opcionais: `entity`, `action`, `entityId`

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid", "cd": "LOG-0137",
      "userId": "uuid", "role": "state",
      "action": "APPROVE_LICENSE",
      "entity": "company", "entityId": "uuid",
      "beforeJson": "{\"licenseStatus\":\"under_review\"}",
      "afterJson": "{\"licenseStatus\":\"active\"}",
      "meta": null,
      "ipAddress": "::1",
      "createdAt": "2026-05-16T..."
    }
  ],
  "meta": { "total": 137, "page": 1, "limit": 20, "totalPages": 7 }
}
```

> `beforeJson` e `afterJson` são strings JSON — usar `JSON.parse()` no frontend.

---

### GET /logs/suspicious-activities
**Roles:** `state` · `compliance`

Filtra automaticamente acções críticas: BLOCK_ORDER, CANCEL_ORDER, SUSPEND_COMPANY, REVOKE_COMPANY, REJECT_LICENSE, HOLD_SHIPMENT, CUSTOMS_REJECT, VALIDATE_DOCS_FAIL.

---

### GET /logs/:id
**Roles:** `state` · `compliance`

---

## 15. Dashboard e Analytics

### GET /dashboard
**Autenticado**

KPIs gerais do sistema.

---

### GET /dashboard/metrics
**Autenticado**

Métricas detalhadas.

---

### GET /analytics/revenue
**Roles:** `state` · `specialist` · `analyst` · `compliance`

Análise de receita e volume transaccional.

---

### GET /analytics/logistics-performance
**Roles:** `state` · `staff` · `specialist` · `analyst` · `compliance`

Performance logística — tempos de entrega, embarques por estado.

---

### GET /analytics/compliance-score
**Roles:** `state` · `specialist` · `analyst` · `compliance`

**Resposta:**
```json
{
  "overallScore": 94.2,
  "riskLevel": "LOW",
  "components": {
    "companyScore": 92.3,
    "orderScore": 96.1,
    "transactionScore": 97.8,
    "shipmentScore": 90.5
  }
}
```

`riskLevel`: `LOW` (≥90) · `MEDIUM` (75-89) · `HIGH` (60-74) · `CRITICAL` (<60)

---

## 16. Base de Dados — Todas as alterações

### Tabela `users` — colunas adicionadas

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| `phone` | VARCHAR(50) | NULL | Número de telefone |
| `twoFactorEnabled` | BOOLEAN | FALSE | 2FA activo |
| `twoFactorSecret` | VARCHAR(255) | NULL | Segredo TOTP base32 |
| `twoFactorVerifiedAt` | TIMESTAMP TZ | NULL | Data de activação do 2FA |
| `passwordChangedAt` | TIMESTAMP TZ | NULL | Última alteração de password |
| `forcePasswordChange` | BOOLEAN | FALSE | Forçar mudança no próximo login |

### Tabela `companies` — colunas adicionadas

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| `companyType` | ENUM | NULL | importer/exporter/mixed/producer/logistics |
| `documentationValidation` | JSONB | NULL | Resultado da validação STAFF |
| `verifiedByState` | BOOLEAN | FALSE | Aprovado pelo STATE |

### Tabela `products` — colunas adicionadas

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| `metadata` | JSONB | NULL | Especificações técnicas adicionais |

### Nova tabela `support_tickets`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | PK |
| `cd` | VARCHAR(20) | TKT-XXXX |
| `userId` | TEXT | FK → users.id |
| `type` | ENUM | technical/licensing/billing/compliance/other |
| `status` | ENUM | open/in_progress/resolved/escalated/closed |
| `subject` | VARCHAR(255) | Assunto |
| `content` | JSONB | Conteúdo estruturado |
| `resolution` | TEXT | Resolução do STAFF |
| `resolvedByStaffId` | TEXT | FK → users.id |
| `escalatedToState` | BOOLEAN | Se escalado |
| `escalatedAt` | TIMESTAMP TZ | Data de escalamento |
| `resolvedAt` | TIMESTAMP TZ | Data de resolução |
| `closedAt` | TIMESTAMP TZ | Data de encerramento |

---

## 17. Rate Limiting — Comportamento

Aplicado em `POST /auth/login` — dupla chave: por **email** + por **IP**.

| Tentativas | Bloqueio |
|---|---|
| 1–4 | Sem bloqueio |
| 5–6 | 1 minuto |
| 7–9 | 5 minutos |
| 10–14 | 15 minutos |
| 15+ | 60 minutos |

**Resposta quando bloqueado (429):**
```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Demasiadas tentativas de login. Aguarde 60 segundos antes de tentar novamente.",
  "retryAfter": 60,
  "blockedBy": "email"
}
```

**Desenvolvimento local:** IPs `127.0.0.1` / `::1` só bloqueados por email, nunca por IP.

---

## 18. Audit Actions — Lista completa

| Acção | Entidade | Quando |
|---|---|---|
| `LOGIN` | user | Cada login bem-sucedido |
| `CHANGE_PASSWORD` | user | Password alterada |
| `ENABLE_2FA` | user | 2FA activado |
| `LOGIN_2FA_OK` | user | Login com 2FA validado |
| `LOGIN_2FA_FAIL` | user | Código TOTP inválido |
| `DISABLE_2FA` | user | 2FA desactivado |
| `CREATE_USER` | user | ADMIN cria utilizador |
| `UPDATE_USER` | user | Dados actualizados |
| `BLOCK_USER` | user | STATE bloqueia |
| `UNBLOCK_USER` | user | STATE desbloqueia |
| `UPDATE_USER_ROLE` | user | Role alterado |
| `CREATE_COMPANY` | company | Empresa criada |
| `VALIDATE_DOCS_OK` | company | STAFF valida documentação OK |
| `VALIDATE_DOCS_FAIL` | company | STAFF rejeita documentação |
| `FORWARD_TO_STATE` | company | STAFF encaminha ao STATE |
| `APPROVE_LICENSE` | company | STATE aprova licença |
| `REJECT_LICENSE` | company | STATE rejeita licença |
| `SUSPEND_COMPANY` | company | STATE suspende empresa |
| `REVOKE_COMPANY` | company | STATE revoga empresa |
| `REQUEST_PUBLICATION` | product | PRODUCER solicita publicação |
| `STAFF_VALIDATE_PRODUCT_OK` | product | STAFF valida produto OK |
| `STAFF_VALIDATE_PRODUCT_FAIL` | product | STAFF rejeita produto |
| `STAFF_FORWARD_PRODUCT_TO_STATE` | product | STAFF encaminha produto |
| `APPROVE_PUBLICATION` | product | STATE aprova publicação |
| `REJECT_PUBLICATION` | product | STATE rejeita produto |
| `SUSPEND_PRODUCT` | product | STATE suspende produto |
| `SUBMIT_PRICE_PROPOSAL` | price_proposal | SPECIALIST submete proposta |
| `APPROVE_PRICE_PROPOSAL` | price_proposal | STATE aprova |
| `REJECT_PRICE_PROPOSAL` | price_proposal | STATE rejeita |
| `CREATE_ORDER` | order | BUYER cria pedido |
| `UPDATE_ORDER` | order | BUYER edita pedido |
| `PAY_ORDER` | order | Pedido pago |
| `BLOCK_ORDER` | order | STATE bloqueia |
| `CANCEL_ORDER` | order | STATE cancela |
| `ESCALATE_TO_STATE` | order | STAFF escala |
| `BLOCK_TRANSACTION` | transaction | STATE bloqueia |
| `CANCEL_TRANSACTION` | transaction | STATE cancela |
| `CREATE_SHIPMENT` | shipment | OPERATOR cria |
| `CUSTOMS_APPROVE` | shipment | CUSTOMS aprova |
| `CUSTOMS_REJECT` | shipment | CUSTOMS rejeita |
| `HOLD_SHIPMENT` | shipment | Retido |
| `CREATE_TICKET` | support_ticket | Ticket criado |
| `RESOLVE_TICKET` | support_ticket | STAFF resolve |
| `ESCALATE_TICKET` | support_ticket | STAFF escala |
| `CLOSE_TICKET` | support_ticket | Fechado |

---

## 19. Modelo User — Campos actuais

Todos os campos retornados em `GET /auth/me` e `GET /users/:id`:

```json
{
  "id": "uuid",
  "cd": "USR-0001",
  "email": "user@empresa.ao",
  "fullName": "Nome Completo",
  "phone": "+244923000001",
  "role": "producer",
  "status": "active",
  "companyId": "uuid-empresa",
  "lastLoginAt": "2026-05-16T02:50:00.000Z",
  "createdAt": "2026-05-10T00:00:00.000Z",
  "updatedAt": "2026-05-16T02:50:00.000Z",
  "twoFactorEnabled": false,
  "company": {
    "id": "uuid-empresa",
    "name": "Empresa XYZ Lda",
    "licenseStatus": "active"
  }
}
```

> `passwordHash`, `twoFactorSecret` e `forcePasswordChange` **nunca** são expostos na API.

---

*Corredor do Lobito · Backend Changelog Completo · v3.0 · 2026-05-16*
