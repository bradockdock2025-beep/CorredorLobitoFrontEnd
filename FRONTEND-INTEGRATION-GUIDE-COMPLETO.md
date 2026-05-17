# Corredor do Lobito — Guia Completo de Integração Frontend
> **Data:** 2026-05-17  
> **Versão:** 2.0 — Todos os módulos  
> **Base URL:** `http://localhost:3000` (dev)  
> **Autenticação:** `Authorization: Bearer <access_token>`  
> **Todos os JSON neste documento são respostas reais da API em produção**

---

## Índice

1. [Autenticação](#1-autenticação)
2. [2FA — Dois Factores](#2-2fa--dois-factores)
3. [Perfil do Utilizador](#3-perfil-do-utilizador)
4. [Utilizadores — ADMIN](#4-utilizadores--admin)
5. [Empresas](#5-empresas)
6. [Produtos](#6-produtos)
7. [Price Proposals](#7-price-proposals)
8. [Pedidos](#8-pedidos)
9. [Transações](#9-transações)
10. [Embarques](#10-embarques)
11. [Impostos](#11-impostos)
12. [Relatórios](#12-relatórios)
13. [Support Tickets](#13-support-tickets)
14. [Audit Logs](#14-audit-logs)
15. [Dashboard & Analytics](#15-dashboard--analytics)
16. [Compliance Alerts](#16-compliance-alerts)
17. [Documentos — Upload & Gestão](#17-documentos--upload--gestão)
18. [PDFs Emitidos — Download](#18-pdfs-emitidos--download)
19. [Verificação Pública — QR Code](#19-verificação-pública--qr-code)
20. [Paginação — Padrão Geral](#20-paginação--padrão-geral)
21. [Erros — Padrão Geral](#21-erros--padrão-geral)
22. [Acesso por Perfil — Tabela Completa](#22-acesso-por-perfil--tabela-completa)

---

## 1. Autenticação

### POST /auth/register
**Público** — criar conta externa (buyer, producer, operator)

**Body:**
```json
{
  "email": "joao@empresa.ao",
  "password": "Senha12345!",
  "fullName": "João Silva",
  "phone": "+244923000001",
  "role": "producer"
}
```
> `role` permitido: `buyer` · `producer` · `operator`  
> `password` mínimo 12 caracteres

**Resposta 201:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "requires2fa": false,
  "twoFactorSetup": false,
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
**Público** — autenticar qualquer utilizador

**Body:**
```json
{
  "email": "buyer@lobito.biz",
  "password": "Lobito@Dev2024!"
}
```

**Resposta A — Role sem 2FA (buyer, producer, operator, analyst, customs, admin):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "requires2fa": false,
  "twoFactorSetup": false,
  "user": {
    "id": "6bbea384-7d77-4863-b6e0-c2015eab5964",
    "email": "buyer@lobito.biz",
    "role": "buyer",
    "fullName": "Buyer Corp",
    "phone": null,
    "companyId": "62e2d8cc-def8-4da6-b717-323081e96542"
  }
}
```

**Resposta B — Role com 2FA obrigatório, ainda não configurado (state, staff, specialist, compliance):**
```json
{
  "access_token": "eyJhbGci...",
  "requires2fa": true,
  "twoFactorSetup": true,
  "user": { "id": "uuid", "email": "staff@lobito.gov", "role": "staff", "fullName": "Staff Officer" }
}
```
> ⚠️ Apesar de ter `access_token`, o frontend deve forçar configuração do 2FA antes de dar acesso.

**Resposta C — Role com 2FA activo:**
```json
{
  "requires2fa": true,
  "twoFactorSetup": false,
  "tempToken": "eyJhbGci...",
  "message": "Introduza o código do autenticador para concluir o login."
}
```
> Sem `access_token`. Usar `tempToken` em `POST /auth/2fa/validate`. Expira em **5 minutos**.

**Lógica de decisão no frontend:**
```javascript
const resp = await api.post('/auth/login', { email, password });

if (!resp.requires2fa) {
  // Login completo — guardar token
  localStorage.setItem('token', resp.access_token);
  router.push('/dashboard');

} else if (resp.twoFactorSetup === true) {
  // 2FA obrigatório mas não configurado
  store.setTempToken(resp.access_token);
  router.push('/auth/2fa/setup');

} else {
  // 2FA activo — pedir código TOTP
  store.setTempToken(resp.tempToken);
  router.push('/auth/2fa/validate');
}
```

**Erros:**
```json
{ "statusCode": 401, "message": "Credenciais inválidas", "error": "Unauthorized" }
{ "statusCode": 403, "message": "Utilizador bloqueado. Contacte o STATE para desbloquear a conta." }
{ "statusCode": 429, "message": "Demasiadas tentativas de login. Aguarde 60 segundos antes de tentar novamente.", "retryAfter": 60, "blockedBy": "email" }
```

---

### POST /auth/logout
**Autenticado**

```json
{ "message": "Sessão terminada com sucesso." }
```

---

### POST /auth/change-password
**Autenticado**

**Body:**
```json
{
  "currentPassword": "SenhaAntiga123!",
  "newPassword": "SenhaNova456!AB"
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
```

---

## 2. 2FA — Dois Factores

> Obrigatório para: `state` · `staff` · `specialist` · `compliance`

### POST /auth/2fa/setup
**Autenticado** — gera QR Code para escanear com Google Authenticator

**Sem body.**

**Resposta 200:**
```json
{
  "secret": "IBWDOJL5ORBTOVDIMRUES2C5HNFTSSJV",
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "message": "Escaneia o QR code com o Google Authenticator ou Authy..."
}
```

**Uso no frontend:**
```html
<img :src="qrCode" width="200" height="200" alt="QR Code 2FA" />
<p>Código manual: {{ secret }}</p>
```

---

### POST /auth/2fa/verify
**Autenticado** — confirmar setup com primeiro código

**Body:**
```json
{ "code": "482951" }
```

**Resposta 200:**
```json
{ "message": "2FA activado com sucesso. Todos os logins futuros exigirão o código do autenticador." }
```

---

### POST /auth/2fa/validate
**Público** — segundo factor no login (usa tempToken)

**Body:**
```json
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
    "fullName": "State Authority",
    "phone": null,
    "companyId": null
  }
}
```

---

### POST /auth/2fa/disable
**Autenticado** — desactivar 2FA

**Body:**
```json
{ "code": "591847" }
```

**Resposta 200:**
```json
{ "message": "2FA desactivado. O login voltará a exigir apenas email e password." }
```

---

## 3. Perfil do Utilizador

### GET /auth/me
**Autenticado** — dados do utilizador autenticado com empresa

**Resposta 200:**
```json
{
  "id": "6bbea384-7d77-4863-b6e0-c2015eab5964",
  "cd": "USR-0005",
  "email": "buyer@lobito.biz",
  "fullName": "Buyer Corp",
  "phone": null,
  "role": "buyer",
  "status": "active",
  "companyId": "62e2d8cc-def8-4da6-b717-323081e96542",
  "lastLoginAt": "2026-05-17T10:08:20.572Z",
  "createdAt": "2026-05-07T19:37:10.683Z",
  "twoFactorEnabled": false,
  "company": {
    "id": "62e2d8cc-def8-4da6-b717-323081e96542",
    "name": "Lobito Trade Lda",
    "licenseStatus": "active"
  }
}
```
> `company` é `null` para roles governamentais (state, staff, specialist, etc.)

---

## 4. Utilizadores — ADMIN

### GET /users
**Roles:** admin · state · staff  
**Query:** `?page=1&limit=20`

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "746a7d10-dec5-469f-98c1-5b796e0b0b12",
      "cd": "USR-0030",
      "email": "daniel@lobito.biz",
      "fullName": "Daniel Nvemba",
      "phone": "+244987678765",
      "role": "producer",
      "status": "active",
      "companyId": "7e72b208-798c-4ea1-9939-2b15e6d80a7b",
      "lastLoginAt": "2026-05-17T02:14:17.882Z",
      "createdAt": "2026-05-17T00:46:23.259Z",
      "updatedAt": "2026-05-17T02:14:17.883Z"
    }
  ],
  "meta": { "total": 30, "page": 1, "limit": 20, "totalPages": 2, "hasNext": true, "hasPrev": false }
}
```

### POST /users
**Roles:** admin — criar utilizador com qualquer role

**Body:**
```json
{
  "email": "novo.staff@lobito.gov",
  "password": "StaffPass2024!",
  "fullName": "Novo Staff",
  "phone": "+244923000099",
  "role": "staff",
  "companyId": null
}
```

### PUT /users/:id/block — **Roles:** state
```json
{ "reason": "Actividade suspeita detectada." }
```

### PUT /users/:id/role — **Roles:** admin
```json
{ "role": "specialist" }
```

---

## 5. Empresas

### POST /companies
**Autenticado** — qualquer utilizador pode criar empresa

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
> `country`: `angola` · `zambia` · `drc` · `tanzania` · `zimbabwe` · `mozambique`  
> `companyType`: `importer` · `exporter` · `mixed` · `producer` · `logistics`

**Resposta 201:**
```json
{
  "id": "uuid",
  "cd": "EMP-0021",
  "name": "Empresa XYZ Lda",
  "country": "angola",
  "companyType": "producer",
  "licenseStatus": "pending",
  "contactEmail": "geral@xyz.ao",
  "contactPhone": "+244923000002",
  "address": "Rua da Samba, 100, Luanda",
  "licenseNumber": null,
  "licenseExpiresAt": null,
  "rejectionReason": null,
  "suspensionReason": null,
  "validationNotes": null,
  "documentationValidation": null,
  "verifiedByState": false,
  "approvedByStateId": null,
  "validatedByStaffId": null,
  "licenseDocumentUrl": null,
  "createdAt": "2026-05-17T14:00:00.000Z",
  "updatedAt": "2026-05-17T14:00:00.000Z"
}
```

### GET /companies/:id
**Autenticado** — inclui array `documents[]`

**Resposta 200:**
```json
{
  "id": "62e2d8cc-def8-4da6-b717-323081e96542",
  "cd": "EMP-0001",
  "name": "Lobito Trade Lda",
  "country": "angola",
  "companyType": null,
  "contactEmail": "geral@lobitotrade.ao",
  "contactPhone": "+244 923 000 001",
  "address": "Rua da Industria, 42, Lobito",
  "licenseStatus": "active",
  "licenseNumber": "LIC-1778184204",
  "licenseExpiresAt": "2028-12-31T23:59:59.000Z",
  "rejectionReason": null,
  "suspensionReason": null,
  "validationNotes": "Documentação completa e válida",
  "documentationValidation": null,
  "verifiedByState": false,
  "licenseDocumentUrl": null,
  "createdAt": "2026-05-07T20:03:21.872Z",
  "updatedAt": "2026-05-17T14:00:00.000Z",
  "documents": []
}
```

### Fluxo de Licenciamento — Acções STATE/STAFF

```
POST /companies/:id/validate-documentation   → STAFF
Body: { "valid": true, "notes": "Documentação OK" }
Resposta: { licenseStatus: "under_review", documentationValidation: {...} }

POST /companies/:id/forward-to-state         → STAFF
Sem body. Resposta: { message: "Empresa encaminhada ao STATE..." }

POST /companies/:id/approve-license          → STATE
Body: { "licenseNumber": "LIC-AO-2026-0042", "licenseExpiresAt": "2028-12-31" }
Resposta: { licenseStatus: "active", licenseNumber: "...", verifiedByState: true }

POST /companies/:id/reject-license           → STATE
Body: { "reason": "Documentação insuficiente." }

POST /companies/:id/suspend                  → STATE
Body: { "reason": "Violação dos termos." }

POST /companies/:id/revoke                   → STATE
Body: { "reason": "Fraude documentada." }
```

**Estados da licença:**
```
pending → under_review → active
pending → rejected
active  → suspended → active (pode reactivar)
active  → rejected (revogação permanente)
```

---

## 6. Produtos

### GET /products
**Autenticado** — catálogo completo com paginação  
**Query:** `?page=1&limit=20`

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "fe760c85-30e5-445e-b9f4-9618099511f0",
      "cd": "PRD-0014",
      "name": "DIAMANTE",
      "description": "TESTE MINERALS",
      "category": "mineração",
      "producerId": "746a7d10-dec5-469f-98c1-5b796e0b0b12",
      "companyId": "7e72b208-798c-4ea1-9939-2b15e6d80a7b",
      "status": "published_official",
      "rejectionReason": null,
      "publishedAt": "2026-05-17T02:33:28.217Z",
      "metadata": { "DIA": "50KG" },
      "certificateUrl": null,
      "createdAt": "2026-05-17T02:25:13.929Z",
      "updatedAt": "2026-05-17T02:33:28.218Z",
      "producer": { "id": "uuid", "fullName": "Daniel Nvemba" },
      "company":  { "id": "uuid", "name": "ANGOEXPRESSO" }
    }
  ],
  "meta": { "total": 14, "page": 1, "limit": 20, "totalPages": 1, "hasNext": false, "hasPrev": false }
}
```

### GET /products/:id — inclui `documents[]`
```json
{
  "id": "fe760c85-...",
  "cd": "PRD-0014",
  "name": "DIAMANTE",
  "status": "published_official",
  "metadata": { "DIA": "50KG" },
  "certificateUrl": null,
  "producer": { "id": "uuid", "fullName": "Daniel Nvemba" },
  "company":  { "id": "uuid", "name": "ANGOEXPRESSO" },
  "documents": [
    {
      "id": "uuid",
      "cd": "DOC-0003",
      "type": "ficha_tecnica_produto",
      "name": "Ficha Técnica DIAMANTE",
      "fileName": "ficha.pdf",
      "mimeType": "application/pdf",
      "sizeBytes": 512000,
      "status": "accepted",
      "rejectedReason": null,
      "createdAt": "2026-05-17T14:00:00.000Z"
    }
  ]
}
```

### POST /products — **Roles:** producer
```json
{
  "name": "Cimento Portland 50kg",
  "description": "Cimento tipo I para construção civil de alta resistência",
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
> Empresa do producer deve ter `licenseStatus: "active"`  
> Resposta: produto com `status: "draft"`

### Fluxo de Publicação

```
POST /products/:id/request-publication       → PRODUCER
Sem body. status: draft → pending_review

POST /products/:id/validate-technical        → STAFF
Body: { "valid": true, "notes": "Especificações conformes." }
status: pending_review → staff_validated

POST /products/:id/forward-product-to-state  → STAFF
Sem body.

POST /products/:id/approve-publication       → STATE
Sem body. status: → published_official + publishedAt

POST /products/:id/reject-publication        → STATE
Body: { "reason": "Especificações insuficientes." }

POST /products/:id/suspend                   → STATE
Body: { "reason": "Não conformidade detectada." }
```

**Estados do produto:**
```
draft → pending_review → staff_validated → published_official
                       → pending_review (falhou validação STAFF)
                                        → rejected (STATE rejeitou)
published_official → suspended
```

---

## 7. Price Proposals

### GET /price-proposals
**Roles:** state · specialist  
**Query:** `?page=1&limit=20`

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "21d076ae-9e58-40e8-9e81-eb7ccb65e04d",
      "cd": "PP-0009",
      "productId": "fe760c85-30e5-445e-b9f4-9618099511f0",
      "createdById": "uuid-specialist",
      "approvedById": "uuid-state",
      "status": "approved",
      "proposedPrice": "345",
      "currency": "USD",
      "justification": "Análise de mercado Q2 2026.",
      "rejectionReason": null,
      "snapshot": {
        "snapshotVersion": "1.0",
        "generatedAt": "2026-05-17T02:38:37.115Z",
        "proposalId": "21d076ae-...",
        "productId": "fe760c85-...",
        "productName": "DIAMANTE",
        "productCategory": "mineração",
        "approvedPriceUsd": 345,
        "currency": "USD",
        "validFrom": "2026-05-16T23:00:00.000Z",
        "validTo": "2039-11-29T23:00:00.000Z",
        "immutable": true
      },
      "submittedAt": "2026-05-17T02:37:17.198Z",
      "approvedAt": "2026-05-17T02:38:37.115Z",
      "validFrom": "2026-05-16T23:00:00.000Z",
      "validTo": "2039-11-29T23:00:00.000Z",
      "createdAt": "2026-05-17T02:37:08.241Z",
      "product": {
        "id": "fe760c85-...",
        "name": "DIAMANTE",
        "category": "mineração"
      }
    }
  ],
  "meta": { "total": 9, "page": 1, "limit": 20, "totalPages": 1 }
}
```

> ⚠️ `proposedPrice` é string — usar `parseFloat()` para cálculos

### POST /price-proposals — **Roles:** specialist
```json
{
  "productId": "uuid-produto-published",
  "proposedPrice": 150.00,
  "currency": "USD",
  "justification": "Baseado na análise de mercado Q2 2026 — média regional 145-155 USD.",
  "validFrom": "2026-06-01T00:00:00.000Z",
  "validTo": "2026-12-31T23:59:59.000Z"
}
```

### Fluxo da Proposal
```
POST /price-proposals                        → SPECIALIST — cria draft
POST /price-proposals/:id/submit             → SPECIALIST — submete ao STATE
POST /price-proposals/:id/approve            → STATE — gera snapshot imutável
POST /price-proposals/:id/reject             → STATE — { reason: "..." }
```
> Após rejeição: SPECIALIST edita e re-submete.  
> Após aprovação: **imutável** — qualquer PUT retorna 403.

---

## 8. Pedidos

### GET /orders/my-orders
**Roles:** buyer  
**Query:** `?page=1&limit=20`

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "983dec02-1e97-4d76-af32-0f8325cbea11",
      "cd": "ORD-0024",
      "buyerId": "6bbea384-7d77-4863-b6e0-c2015eab5964",
      "companyId": "62e2d8cc-def8-4da6-b717-323081e96542",
      "status": "paid",
      "totalAmount": "2610",
      "taxAmount": "360",
      "netAmount": "2250",
      "currency": "USD",
      "blockedReason": null,
      "blockedById": null,
      "blockedAt": null,
      "paidAt": "2026-05-17T10:00:12.727Z",
      "createdAt": "2026-05-17T09:59:59.298Z",
      "updatedAt": "2026-05-17T10:00:12.728Z",
      "lines": [
        {
          "id": "2020cec4-...",
          "cd": "OL-0029",
          "orderId": "983dec02-...",
          "productId": "726d9b3c-...",
          "priceProposalId": "b2f0413d-...",
          "qty": 50,
          "unitPrice": "45",
          "taxRate": "0.16",
          "taxAmount": "360",
          "lineTotal": "2610",
          "snapshotRef": {
            "snapshotVersion": "1.0",
            "approvedPriceUsd": 45,
            "productName": "Cimento Portland 50kg",
            "productCategory": "general",
            "currency": "USD",
            "validFrom": "2026-01-01T00:00:00.000Z",
            "validTo": "2026-12-31T23:59:59.000Z",
            "immutable": true
          }
        }
      ]
    }
  ],
  "meta": { "total": 21, "page": 1, "limit": 20, "totalPages": 2, "hasNext": true, "hasPrev": false }
}
```

> ⚠️ `totalAmount`, `taxAmount`, `netAmount`, `unitPrice`, `taxRate`, `lineTotal` são **strings** — usar `parseFloat()`

### POST /orders — **Roles:** buyer
```json
{
  "lines": [
    { "productId": "uuid-produto-1", "qty": 10 },
    { "productId": "uuid-produto-2", "qty": 5 }
  ]
}
```
> Sistema resolve automaticamente: `companyId` (do JWT), `priceProposalId` (vigente), `unitPrice` (do snapshot)

### POST /orders/:id/pay — **Roles:** buyer

**Sem body.** Sistema calcula impostos automaticamente.

**Resposta 200:**
```json
{
  "id": "uuid",
  "cd": "ORD-0024",
  "status": "paid",
  "netAmount": "2250",
  "taxAmount": "360",
  "totalAmount": "2610",
  "paidAt": "2026-05-17T10:00:12.727Z"
}
```
> PDF da fatura e recibo gerados automaticamente após pagamento.

### Acções STATE sobre pedidos
```
POST /orders/:id/block        → Body: { "reason": "Suspeita de fraude." }
POST /orders/:id/cancel       → Body: { "reason": "Cancelado por decisão regulatória." }
POST /orders/:id/escalate-to-state → STAFF → Body: { "reason": "..." }
```

**Estados do pedido:**
```
draft → paid (BUYER paga)
draft → blocked (STATE bloqueia)
draft/paid → cancelled (STATE cancela)
```

---

## 9. Transações

### GET /transactions
**Roles:** state · staff · specialist · compliance  
**Query:** `?page=1&limit=20`

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "455cf825-670a-43c7-bdcd-be50c6f6f512",
      "cd": "TRX-0015",
      "orderId": "983dec02-1e97-4d76-af32-0f8325cbea11",
      "amount": "2610",
      "currency": "USD",
      "method": "bank_transfer",
      "status": "completed",
      "paidAt": "2026-05-17T10:00:15.821Z",
      "blockedAt": null,
      "blockedById": null,
      "blockedReason": null,
      "cancelledAt": null,
      "metadata": null,
      "invoiceUrl": "https://paydpuwjjuezmjfzxmvi.supabase.co/storage/v1/object/public/emitted-docs/invoices/.../fatura-ORD-0024.pdf",
      "receiptUrl": "https://paydpuwjjuezmjfzxmvi.supabase.co/storage/v1/object/public/emitted-docs/receipts/.../recibo-TRX-0015.pdf",
      "createdAt": "2026-05-17T10:00:15.822Z",
      "order": {
        "id": "983dec02-...",
        "cd": "ORD-0024",
        "buyerId": "6bbea384-..."
      }
    }
  ],
  "meta": { "total": 15, "page": 1, "limit": 20, "totalPages": 1 }
}
```

### GET /transactions/summary
**Roles:** state · staff · specialist · compliance

**Resposta 200:**
```json
{
  "counts": {
    "total": 15,
    "completed": 14,
    "blocked": 1,
    "cancelled": 0
  },
  "amounts": {
    "totalCompleted": "5232.17",
    "average": "373.73",
    "max": "2610",
    "min": "0"
  }
}
```
> ⚠️ Todos os valores monetários são strings — usar `parseFloat()`

### Acções STATE sobre transações
```
POST /transactions/:id/block  → Body: { "reason": "Transação suspeita." }
POST /transactions/:id/cancel → Sem body
```

---

## 10. Embarques

### GET /shipments
**Roles:** state · staff · customs  
**Query:** `?page=1&limit=20&status=at_border`

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "293d20c1-0378-46a8-bc37-bcbd18bef0a0",
      "cd": "SHP-0006",
      "orderId": "67ae9b90-7301-47a6-8c3f-bbe196876141",
      "operatorId": "05057304-ad29-4858-aa9e-08dfd552bdce",
      "status": "customs_approved",
      "origin": "Luanda, Angola",
      "destination": "Lusaka, Zambia",
      "eta": "2026-08-01T00:00:00.000Z",
      "lastLocation": "Fronteira Luau",
      "trackingEvents": [
        {
          "notes": "Embarcado.",
          "status": "in_transit",
          "location": "Porto de Luanda",
          "timestamp": "2026-05-13T22:18:59.066Z",
          "updatedBy": "uuid-operator"
        },
        {
          "notes": "Aguarda aduana.",
          "status": "at_border",
          "location": "Fronteira Luau",
          "timestamp": "2026-05-13T22:19:00.925Z",
          "updatedBy": "uuid-operator"
        }
      ],
      "holdReason": null,
      "operator": { "id": "uuid", "fullName": "Logistics Operator" },
      "customsDispatch": {
        "id": "4734f759-...",
        "cd": "DSP-0006",
        "status": "approved",
        "notes": "Documentação validada.",
        "rejectionReason": null,
        "validatedAt": "2026-05-13T22:19:11.274Z",
        "dispatchDocumentUrl": null
      },
      "documents": []
    }
  ],
  "meta": { "total": 6, "page": 1, "limit": 20 }
}
```

### POST /shipments — **Roles:** operator
```json
{
  "orderId": "uuid-do-pedido-pago",
  "origin": "Porto do Lobito, Angola",
  "destination": "Lusaka, Zâmbia",
  "eta": "2026-06-15T00:00:00.000Z"
}
```
> `order.status` deve ser `"paid"`

### PUT /shipments/:id/tracking — **Roles:** operator
```json
{
  "location": "Fronteira de Luau, Angola",
  "status": "at_border",
  "notes": "Chegada à fronteira. Documentação entregue à alfândega."
}
```
> ⚠️ Tracking é **append-only** — eventos acumulam, nunca são apagados.

### Acções CUSTOMS
```
POST /shipments/:id/approve  → Body: { "notes": "Documentação conforme." }
POST /shipments/:id/reject   → Body: { "reason": "Certificado de origem inválido." }
POST /shipments/:id/hold     → Body: { "reason": "Inspecção especial requerida." }
```

**Estados do embarque:**
```
created → in_transit → at_border → customs_approved → delivered
                                 → customs_rejected
                                 → held (aguarda decisão STATE)
```

---

## 11. Impostos

### GET /taxes
**Autenticado** — `?page=1&limit=20`

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "02271302-b600-4ebb-a70a-b8032a02c53f",
      "cd": "TAX-0008",
      "name": "IVA Angola Geral",
      "category": "general",
      "country": "angola",
      "rate": "0.16",
      "effectiveFrom": "2026-01-01T00:00:00.000Z",
      "effectiveTo": null,
      "isActive": true,
      "createdById": "uuid-state",
      "createdAt": "2026-05-16T01:40:29.766Z"
    }
  ],
  "meta": { "total": 8, "page": 1, "limit": 20 }
}
```
> `rate` é string — usar `parseFloat(rate) * 100` para exibir como percentagem (ex: `"0.16"` → `16%`)

### POST /taxes — **Roles:** state
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

### GET /taxes/country/:code
```
GET /taxes/country/angola
```
> Retorna todas as taxas activas para o país.

---

## 12. Relatórios

### POST /reports — **Roles:** specialist · analyst · compliance
```json
{
  "title": "Relatório Fiscal Q2 2026",
  "type": "fiscal",
  "period": "Q2 2026",
  "content": {
    "summary": "Análise do volume transaccional do segundo trimestre.",
    "data": { "totalUSD": 5232.17, "transactions": 15 }
  },
  "targetAudience": "government"
}
```
> `type`: `operational` · `fiscal` · `strategic` · `compliance`  
> `targetAudience`: `public` · `government` · `internal`

### Fluxo do Relatório
```
POST /reports                    → cria draft
PUT  /reports/:id                → edita (apenas draft)
POST /reports/:id/submit         → submete ao STATE
POST /reports/:id/publish        → STATE publica
POST /reports/:id/reject         → STATE devolve com motivo
```

---

## 13. Support Tickets

### POST /support-tickets — **Autenticado** — qualquer role
```json
{
  "type": "licensing",
  "subject": "Empresa bloqueada sem notificação",
  "content": {
    "description": "A empresa foi suspensa mas não recebemos nenhuma notificação prévia.",
    "companyId": "uuid-da-empresa"
  }
}
```
> `type`: `technical` · `licensing` · `billing` · `compliance` · `other`

**Resposta 201:**
```json
{
  "id": "uuid",
  "cd": "TKT-0001",
  "userId": "uuid",
  "type": "licensing",
  "status": "open",
  "subject": "Empresa bloqueada sem notificação",
  "content": { "description": "..." },
  "resolution": null,
  "resolvedByStaffId": null,
  "escalatedToState": false,
  "escalatedAt": null,
  "resolvedAt": null,
  "closedAt": null,
  "createdAt": "2026-05-17T14:00:00.000Z"
}
```

### GET /support-tickets/my-tickets — qualquer role
```json
{
  "data": [],
  "meta": { "total": 0, "page": 1, "limit": 20, "totalPages": 0, "hasNext": false, "hasPrev": false }
}
```

### Acções STAFF sobre tickets
```
POST /support-tickets/:id/resolve   → Body: { "resolution": "Problema resolvido. Empresa reactivada." }
POST /support-tickets/:id/escalate  → Body: { "reason": "Requer decisão STATE." }
POST /support-tickets/:id/close     → dono do ticket ou STATE — sem body
```

**Estados do ticket:**
```
open → resolve → resolved → close → closed
open → escalate → escalated → resolve → resolved → close → closed
```

---

## 14. Audit Logs

### GET /logs
**Roles:** state · compliance  
**Query:** `?page=1&limit=20&entity=company&action=APPROVE_LICENSE`

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "d6161bed-20bd-426e-91f3-27b6325c3dbe",
      "cd": "LOG-0302",
      "userId": "uuid",
      "role": "compliance",
      "action": "LOGIN",
      "entity": "user",
      "entityId": "uuid",
      "beforeJson": null,
      "afterJson": "{\"email\":\"compliance@lobito.gov\",\"ip\":\"::ffff:127.0.0.1\"}",
      "meta": null,
      "ipAddress": null,
      "createdAt": "2026-05-17T10:10:48.896Z"
    }
  ],
  "meta": { "total": 302, "page": 1, "limit": 20, "totalPages": 16 }
}
```

> ⚠️ `beforeJson` e `afterJson` são **strings JSON** — usar `JSON.parse()` para renderizar

```javascript
// Parsing correcto
const before = log.beforeJson ? JSON.parse(log.beforeJson) : null;
const after  = log.afterJson  ? JSON.parse(log.afterJson)  : null;
```

### GET /logs/suspicious-activities
**Roles:** state · compliance  
> Filtra automaticamente acções críticas: `BLOCK_ORDER`, `SUSPEND_COMPANY`, `REVOKE_COMPANY`, `REJECT_LICENSE`, `HOLD_SHIPMENT`, etc.

---

## 15. Dashboard & Analytics

### GET /dashboard
**Roles:** state · staff · analyst · compliance

**Resposta 200:**
```json
{
  "companies": { "active": 11, "pending": 9 },
  "products":  { "published_official": 10, "staff_validated": 2, "draft": 1, "suspended": 1 },
  "orders":    { "draft": 3, "paid": 18 },
  "transactions": { "completed": 14, "blocked": 1 },
  "shipments": { "customs_approved": 6 },
  "reports":   { "published": 4 },
  "auditLogs": { "total": 302 },
  "revenue": {
    "totalCompleted": 5232.17,
    "completedCount": 14,
    "currency": "USD"
  }
}
```

### GET /analytics/revenue
**Roles:** state · specialist · analyst · compliance

### GET /analytics/logistics-performance
**Roles:** state · staff · specialist · analyst · compliance

### GET /analytics/compliance-score
**Roles:** state · specialist · analyst · compliance

**Resposta 200:**
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
> `riskLevel`: `LOW` (≥90) · `MEDIUM` (75-89) · `HIGH` (60-74) · `CRITICAL` (<60)

---

## 16. Compliance Alerts

### GET /compliance-alerts
**Roles:** state · compliance  
**Query:** `?page=1&limit=20&severity=high&status=open&alertType=high_value_transaction`

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "78310816-2552-419c-aadd-a8e83b460ab8",
      "cd": "ALT-0001",
      "alertType": "recently_licensed_company",
      "severity": "medium",
      "status": "open",
      "entityId": "62e2d8cc-def8-4da6-b717-323081e96542",
      "entityType": "company",
      "detectedBy": "system",
      "reviewedBy": null,
      "resolvedBy": null,
      "resolvedAt": null,
      "metadata": {
        "orderId": "983dec02-...",
        "orderAmount": 2610,
        "daysSinceLicense": 9
      },
      "notes": null,
      "createdAt": "2026-05-17T10:00:25.617Z",
      "reviewer": null,
      "resolver": null
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20 }
}
```

**Tipos de alerta:**

| `alertType` | Descrição | Severidade típica |
|---|---|---|
| `high_value_transaction` | Transação > $5.000 | medium/high/critical |
| `recently_licensed_company` | Empresa < 30 dias com transação alta | medium |
| `suspicious_order_pattern` | Padrão suspeito de pedidos | medium/high |
| `blocked_user_activity` | Buyer com histórico de bloqueios | medium/high |
| `customs_evasion_attempt` | Embarque retido com mercadoria de alto valor | medium/high |
| `fiscal_discrepancy` | Discrepância fiscal detectada | high |
| `repeated_login_failures` | Múltiplas falhas de login | medium |
| `price_manipulation_attempt` | Preço anómalo detectado | high |

### GET /compliance-alerts/summary

**Resposta 200:**
```json
{
  "open": 1,
  "critical": 0,
  "bySeverity": { "medium": 1 },
  "byStatus": { "open": 1 },
  "topTypes": [
    { "type": "recently_licensed_company", "count": 1 }
  ]
}
```

### Acções sobre alertas
```
POST /compliance-alerts/:id/review   → compliance  — sem body
POST /compliance-alerts/:id/resolve  → state, compliance — Body: { "notes": "Falso positivo — empresa verificada." }
POST /compliance-alerts/:id/dismiss  → state — Body: { "notes": "Alerta dispensado após análise." }
```

**Estados do alerta:**
```
open → under_review → resolved
open → dismissed
```

---

## 17. Documentos — Upload & Gestão

### POST /documents/upload
**Autenticado** · `multipart/form-data`

| Campo | Tipo | Obrigatório |
|---|---|---|
| `file` | File (PDF/JPG/PNG, max 10MB) | ✅ |
| `entityType` | `company`/`product`/`shipment`/`order`/`report` | ✅ |
| `entityId` | UUID | ✅ |
| `type` | Tipo de documento (ver tabela abaixo) | ✅ |
| `name` | Nome descritivo | ✅ |

**Resposta 201:**
```json
{
  "id": "uuid",
  "cd": "DOC-0001",
  "entityType": "company",
  "entityId": "uuid",
  "type": "certidao_comercial",
  "name": "Certidão Comercial 2026",
  "fileName": "certidao.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 245760,
  "storageUrl": "https://...supabase.co/storage/v1/object/public/company-docs/...",
  "storagePath": "company-docs/uuid/.../certidao.pdf",
  "uploadedById": "uuid",
  "status": "pending",
  "rejectedReason": null,
  "validatedById": null,
  "validatedAt": null,
  "createdAt": "2026-05-17T14:30:00.000Z"
}
```

**Tipos de documento por entidade:**

| entityType | type | Obrigatório |
|---|---|---|
| `company` | `certidao_comercial` | ✅ |
| `company` | `certidao_fiscal` | ✅ |
| `company` | `alvara_actividade` | ✅ |
| `company` | `identificacao_representante` | ✅ |
| `company` | `comprovativo_morada` | ✅ |
| `company` | `estatutos` / `licenca_importacao_exportacao` | ❌ |
| `product` | `ficha_tecnica_produto` | ✅ |
| `product` | `certificado_qualidade` / `certificado_origem_produto` | ❌ |
| `shipment` | `fatura_comercial_embarque` | ✅ |
| `shipment` | `manifesto_carga` | ✅ |
| `shipment` | `certificado_origem_embarque` | ✅ |
| `shipment` | `guia_transporte` | ✅ |
| `shipment` | `apolice_seguro` / `declaracao_aduaneira` | ❌ |
| qualquer | `outro` | ❌ |

### GET /documents?entityType=&entityId=

**Resposta 200:** (array — vazio `[]` se não houver documentos)
```json
[
  {
    "id": "uuid",
    "cd": "DOC-0001",
    "type": "certidao_comercial",
    "name": "Certidão Comercial 2026",
    "fileName": "certidao.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 245760,
    "status": "pending",
    "rejectedReason": null,
    "createdAt": "2026-05-17T14:30:00.000Z",
    "uploadedBy":  { "id": "uuid", "fullName": "Lobito Trade Lda", "role": "producer" },
    "validatedBy": null
  }
]
```

**Status dos documentos:**

| `status` | Cor | Significado |
|---|---|---|
| `pending` | Amarelo | A aguardar validação STAFF |
| `accepted` | Verde | Aceite pelo STAFF |
| `rejected` | Vermelho | Rejeitado — ver `rejectedReason` |

### GET /documents/:id/download
```json
{
  "signedUrl": "https://...supabase.co/storage/v1/object/sign/company-docs/...?token=eyJ...&expiresIn=3600",
  "fileName": "certidao.pdf",
  "expiresIn": 3600
}
```
> URL expira em **60 minutos** — nunca guardar em cache.

### POST /documents/:id/accept — **Roles:** staff, state
Sem body. Muda `status` para `"accepted"`.

### POST /documents/:id/reject — **Roles:** staff, state
```json
{ "reason": "Documento ilegível. Submeta versão com melhor qualidade." }
```
> `reason` mínimo 10 caracteres.

### DELETE /documents/:id
> Apenas o dono · Apenas `status: "pending"`

```json
{ "message": "Documento apagado com sucesso." }
```

---

## 18. PDFs Emitidos — Download

Gerados automaticamente pelo sistema. O frontend obtém a URL pré-assinada.

| Endpoint | Gerado quando | Roles |
|---|---|---|
| `GET /companies/:id/license-pdf` | STATE aprova licença | qualquer autenticado |
| `GET /orders/:id/invoice-pdf` | BUYER paga | buyer do pedido + gov |
| `GET /orders/:id/receipt-pdf` | BUYER paga | buyer do pedido + gov |
| `GET /shipments/:id/dispatch-pdf` | CUSTOMS aprova | customs, operator, buyer, gov |

**Resposta de todos os endpoints PDF:**
```json
{
  "signedUrl": "https://paydpuwjjuezmjfzxmvi.supabase.co/storage/v1/object/sign/emitted-docs/invoices/.../fatura-ORD-0024.pdf?token=eyJ...",
  "fileName": "fatura-ORD-0024.pdf",
  "expiresIn": 3600
}
```

**Quando mostrar o botão de download:**

```javascript
// Licença
const showLicense = company.licenseStatus === 'active';

// Fatura e Recibo
const showInvoice = order.status === 'paid';

// Despacho Aduaneiro
const showDispatch = shipment.customsDispatch?.status === 'approved';
```

**Como usar:**
```javascript
const { data } = await api.get(`/orders/${orderId}/invoice-pdf`);
window.open(data.signedUrl, '_blank'); // abrir em novo separador
// ou
const a = document.createElement('a');
a.href = data.signedUrl;
a.download = data.fileName;
a.click(); // forçar download
```

**Erros:**
```json
{ "statusCode": 404, "message": "Fatura ainda não foi gerada. O pedido deve estar pago." }
{ "statusCode": 404, "message": "PDF da licença ainda não foi gerado. A licença deve estar activa." }
{ "statusCode": 404, "message": "PDF do despacho ainda não foi gerado. O embarque deve estar aprovado pela alfândega." }
```

---

## 19. Verificação Pública — QR Code

**Sem autenticação.** Destino dos QR Codes impressos nos PDFs.

### GET /verify/license/:companyId
```json
{
  "valid": true,
  "type": "license",
  "documentCode": "LIC-1778184204",
  "entity": "Lobito Trade Lda",
  "entityCode": "EMP-0001",
  "country": "angola",
  "status": "ACTIVE",
  "licenseNumber": "LIC-1778184204",
  "expiresAt": "2028-12-31T23:59:59.000Z",
  "isExpired": false,
  "verifiedByState": true,
  "hasDocument": true,
  "verifiedAt": "2026-05-17T14:00:00.000Z",
  "message": "✅ Licença válida e activa no Corredor do Lobito."
}
```

### GET /verify/invoice/:orderId
```json
{
  "valid": true,
  "type": "invoice",
  "documentCode": "FAT-ORD-0021",
  "orderCode": "ORD-0021",
  "transactionCode": "TRX-0010",
  "buyerCompany": "Lobito Trade Lda",
  "buyerCountry": "angola",
  "orderStatus": "paid",
  "totalAmount": "690",
  "taxAmount": "0",
  "netAmount": "690",
  "currency": "USD",
  "paidAt": "2026-05-17T02:39:38.405Z",
  "hasDocument": true,
  "verifiedAt": "2026-05-17T14:00:00.000Z",
  "message": "✅ Fatura válida — pagamento confirmado no Corredor do Lobito."
}
```

### GET /verify/receipt/:transactionId
```json
{
  "valid": true,
  "type": "receipt",
  "documentCode": "TRX-0010",
  "transactionCode": "TRX-0010",
  "orderCode": "ORD-0021",
  "amount": "690",
  "currency": "USD",
  "method": "bank_transfer",
  "transactionStatus": "completed",
  "paidAt": "2026-05-17T02:39:38.405Z",
  "hasDocument": true,
  "verifiedAt": "2026-05-17T14:00:00.000Z",
  "message": "✅ Recibo válido — pagamento completado no Corredor do Lobito."
}
```

### GET /verify/dispatch/:shipmentId
```json
{
  "valid": true,
  "type": "dispatch",
  "documentCode": "DSP-0001",
  "shipmentCode": "SHP-0001",
  "orderCode": "ORD-0019",
  "origin": "Porto do Lobito, Angola",
  "destination": "Lusaka, Zâmbia",
  "eta": "2026-03-20T00:00:00.000Z",
  "shipmentStatus": "customs_approved",
  "dispatchStatus": "approved",
  "approvedAt": "2026-03-15T09:00:00.000Z",
  "hasDocument": true,
  "verifiedAt": "2026-05-17T14:00:00.000Z",
  "message": "✅ Despacho válido — embarque aprovado pela alfândega do Corredor do Lobito."
}
```

---

## 20. Paginação — Padrão Geral

Todos os endpoints de listagem retornam:

```json
{
  "data": [...],
  "meta": {
    "total": 302,
    "page": 1,
    "limit": 20,
    "totalPages": 16,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Query params de paginação:**

| Param | Default | Descrição |
|---|---|---|
| `page` | `1` | Página actual |
| `limit` | `20` | Itens por página |

**Exemplo de uso no frontend:**
```javascript
const { data: resp } = await api.get('/orders', { params: { page: 2, limit: 10 } });
const { data: orders, meta } = resp;
// meta.total, meta.hasNext, meta.hasPrev
```

---

## 21. Erros — Padrão Geral

| HTTP | `error` | Causa comum |
|---|---|---|
| `400` | Bad Request | Validação de campo, estado inválido |
| `401` | Unauthorized | Token ausente, inválido ou expirado |
| `403` | Forbidden | Role sem permissão para o endpoint |
| `404` | Not Found | Entidade não encontrada |
| `429` | Too Many Requests | Rate limiting no login |

**Estrutura do erro:**
```json
{
  "statusCode": 403,
  "message": "Acesso negado. Roles permitidos: state, staff",
  "error": "Forbidden"
}
```

**Erros de validação (400):**
```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than or equal to 12 characters"],
  "error": "Bad Request"
}
```
> Quando `message` é array, cada item é um erro de validação de campo.

---

## 22. Acesso por Perfil — Tabela Completa

| Endpoint | buyer | producer | operator | staff | state | specialist | analyst | compliance | customs | admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `GET /auth/me` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /products` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /products` | — | ✅ | — | — | — | — | — | — | — | — |
| `GET /orders/my-orders` | ✅ | — | — | — | — | — | — | — | — | — |
| `GET /orders` | — | — | — | ✅ | ✅ | ✅ | — | — | — | — |
| `POST /orders` | ✅ | — | — | — | — | — | — | — | — | — |
| `POST /orders/:id/pay` | ✅ | — | — | — | — | — | — | — | — | — |
| `POST /orders/:id/block` | — | — | — | — | ✅ | — | — | — | — | — |
| `GET /transactions` | — | — | — | ✅ | ✅ | ✅ | — | ✅ | — | — |
| `GET /shipments` | — | — | — | ✅ | ✅ | — | — | — | ✅ | — |
| `GET /shipments/my-shipments` | — | — | ✅ | — | — | — | — | — | — | — |
| `POST /shipments` | — | — | ✅ | — | — | — | — | — | — | — |
| `POST /shipments/:id/approve` | — | — | — | — | — | — | — | — | ✅ | — |
| `GET /companies` | — | — | — | ✅ | ✅ | — | — | — | — | — |
| `POST /companies/:id/approve-license` | — | — | — | — | ✅ | — | — | — | — | — |
| `GET /price-proposals` | — | — | — | — | ✅ | ✅ | — | — | — | — |
| `POST /price-proposals` | — | — | — | — | — | ✅ | — | — | — | — |
| `GET /logs` | — | — | — | — | ✅ | — | — | ✅ | — | — |
| `GET /compliance-alerts` | — | — | — | — | ✅ | — | — | ✅ | — | — |
| `GET /dashboard` | — | — | — | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| `GET /users` | — | — | — | ✅ | ✅ | — | — | — | — | ✅ |
| `POST /users` | — | — | — | — | — | — | — | — | — | ✅ |
| `POST /documents/upload` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /documents/:id/accept` | — | — | — | ✅ | ✅ | — | — | — | — | — |
| `GET /verify/*` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |

> 🌐 = público, sem autenticação

---

## Notas Críticas para o Frontend

### Campos monetários — sempre `parseFloat()`
```javascript
// Estes campos chegam sempre como string:
// totalAmount, taxAmount, netAmount, unitPrice, taxRate, lineTotal, amount, rate, proposedPrice

const total = parseFloat(order.totalAmount); // "2610" → 2610
const taxa  = parseFloat(tax.rate) * 100;    // "0.16" → 16 (%)
```

### Logs — JSON.parse obrigatório
```javascript
const before = log.beforeJson ? JSON.parse(log.beforeJson) : null;
const after  = log.afterJson  ? JSON.parse(log.afterJson)  : null;
```

### Tracking de embarques — append-only
```javascript
// trackingEvents é um array que só cresce — nunca remover eventos
// Ordenar do mais recente para o mais antigo:
const events = [...shipment.trackingEvents].reverse();
```

### URLs de PDF — não guardar em cache
```javascript
// signedUrl expira em 60 minutos — sempre buscar novo URL antes de usar
const { data } = await api.get(`/orders/${id}/invoice-pdf`);
window.open(data.signedUrl); // usar imediatamente
```

### 2FA — tempToken expira em 5 minutos
```javascript
// Se o utilizador demorar mais de 5 min a introduzir o código:
// o validate vai retornar 401 "Token temporário inválido ou expirado"
// → redirect para login de novo
```

---

*Corredor do Lobito · Frontend Integration Guide Completo · v2.0 · 2026-05-17*  
*Todos os JSON são respostas reais da API — servidor local na data de geração*
