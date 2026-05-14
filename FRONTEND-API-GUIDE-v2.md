# Corredor do Lobito — Frontend API Integration Guide
> **Versão:** 3.0 · **Data:** 2026-05-12  
> **Base URL (dev):** `http://localhost:3000`  
> **Base URL (prod):** `https://api.corredor-lobito.gov`  
> **Total de endpoints:** 65  
> **Autenticação:** Bearer JWT — excepto `POST /auth/login` e `POST /auth/register`

---

## Índice

1. [Autenticação e Registo](#1-autenticação-e-registo)
2. [Padrões Globais](#2-padrões-globais)
3. [Contas de Desenvolvimento](#3-contas-de-desenvolvimento)
4. [Users](#4-users)
5. [Companies](#5-companies)
6. [Products](#6-products)
7. [Price Proposals](#7-price-proposals)
8. [Taxes](#8-taxes)
9. [Orders](#9-orders)
10. [Transactions](#10-transactions)
11. [Shipments](#11-shipments)
12. [Reports](#12-reports)
13. [Audit Logs](#13-audit-logs)
14. [Dashboard & Analytics](#14-dashboard--analytics)
15. [Enums de Referência](#15-enums-de-referência)
16. [Matriz de Acesso por Role](#16-matriz-de-acesso-por-role)
17. [Fluxo End-to-End Completo](#17-fluxo-end-to-end-completo)

---

## 1. Autenticação e Registo

### POST /auth/login
**Público** (sem token)

**Request:**
```json
{ "email": "buyer@lobito.biz", "password": "Lobito@Dev2024!" }
```

**Response 200:**
```json
{
  "access_token": "eyJhbGci...",
  "user": {
    "id":       "uuid",
    "email":    "buyer@lobito.biz",
    "role":     "buyer",
    "fullName": "Buyer Corp"
  }
}
```

**Erros:** `401` credenciais inválidas · `403` utilizador bloqueado

---

### POST /auth/register ⭐ NOVO
**Público** (sem token) — Auto-registo para empresas e utilizadores externos

Permite a qualquer empresa ou pessoa registar-se na plataforma como `buyer`, `producer` ou `operator`. Cria o utilizador e a empresa num único passo. A empresa fica em `pending` até STAFF + STATE aprovarem.

**Request — nova empresa:**
```json
{
  "email":          "comprador@empresa.ao",
  "password":       "Senha@Segura123!",
  "fullName":       "Nome Completo",
  "role":           "buyer",
  "companyName":    "Nova Empresa Lda",
  "companyCountry": "angola",
  "companyEmail":   "geral@empresa.ao",
  "companyPhone":   "+244 923 000 001",
  "companyAddress": "Rua do Lobito, 42, Luanda"
}
```

**Request — juntar-se a empresa já existente:**
```json
{
  "email":     "outro.buyer@empresa.ao",
  "password":  "Senha@Segura123!",
  "fullName":  "Segundo Comprador",
  "role":      "buyer",
  "companyId": "uuid-da-empresa-existente"
}
```

> `role` aceita apenas: `buyer` · `producer` · `operator`  
> Roles governamentais (state, staff, etc.) não podem ser auto-registados.

**Response 201:**
```json
{
  "access_token": "eyJhbGci...",
  "user": {
    "id":        "uuid",
    "email":     "comprador@empresa.ao",
    "role":      "buyer",
    "fullName":  "Nome Completo",
    "companyId": "uuid-da-empresa"
  },
  "company": {
    "id":            "uuid",
    "cd":            "EMP-0012",
    "name":          "Nova Empresa Lda",
    "country":       "angola",
    "licenseStatus": "pending",
    "message":       "Empresa registada. Aguarda validação do STAFF e aprovação do STATE para operar."
  }
}
```

**Erros:** `409` email já registado · `409` email de empresa já registado · `400` campos da empresa em falta · `404` companyId não encontrado

> **Importante:** o utilizador recebe JWT imediatamente e pode fazer login, mas **não consegue criar pedidos nem produtos** enquanto a empresa estiver em `pending`. O sistema bloqueia automaticamente com erro 400.

---

### Como usar o token

```javascript
// Guardar após login/register
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('user', JSON.stringify(data.user));

// Usar em todos os pedidos
const token = localStorage.getItem('access_token');
fetch('/companies', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 2. Padrões Globais

### Paginação

Todos os endpoints de listagem aceitam:

| Param | Default | Máximo |
|-------|---------|--------|
| `page` | 1 | — |
| `limit` | 20 | 100 |

**Envelope de resposta:**
```json
{
  "data": [ ... ],
  "meta": { "total": 45, "page": 1, "limit": 20, "totalPages": 3, "hasNext": true, "hasPrev": false }
}
```

### Erros

```json
{ "statusCode": 400, "error": "Bad Request", "message": "Descrição" }
```

| Código | Quando |
|--------|--------|
| `400` | Dados inválidos ou regra de negócio violada |
| `401` | Token ausente, inválido ou expirado |
| `403` | Role sem permissão |
| `404` | Recurso não encontrado |
| `409` | Conflito (email duplicado, etc.) |

### Campos monetários (Decimal → string)

O PostgreSQL/Prisma retorna `Decimal` como string. Converter sempre:
```javascript
const total  = Number(order.totalAmount);   // "38.76" → 38.76
const taxPct = Number(tax.rate) * 100;       // "0.14"  → 14 (%)
```

---

## 3. Contas de Desenvolvimento

Password: **`Lobito@Dev2024!`** em todas as contas.

| Email | Role | Função |
|-------|------|--------|
| `admin@lobito.gov` | admin | Gestão de utilizadores |
| `state@lobito.gov` | state | Aprovações e decisões |
| `staff@lobito.gov` | staff | Validação operacional |
| `specialist@lobito.gov` | specialist | Price proposals |
| `analyst@lobito.gov` | analyst | Relatórios e KPIs |
| `compliance@lobito.gov` | compliance | Auditoria |
| `producer@lobito.biz` | producer | Catálogo de produtos |
| `buyer@lobito.biz` | buyer | Pedidos e pagamentos |
| `operator@lobito.biz` | operator | Embarques |
| `customs@lobito.gov` | customs | Validação aduaneira |

---

## 4. Users

### GET /users
Roles: `admin` · `state` · `staff`  · Paginação suportada

**Response (item):**
```json
{
  "id": "uuid", "cd": "USR-0001",
  "email": "staff@lobito.gov", "fullName": "Staff Officer",
  "role": "staff", "status": "active",
  "companyId": null, "lastLoginAt": "2026-05-12T10:00:00.000Z",
  "createdAt": "2026-05-09T15:40:00.000Z"
}
```

### GET /users/:id
Roles: `admin` · `state` · `staff`

### POST /users
Role: `admin`

**Request:**
```json
{
  "email":     "novo@lobito.gov",
  "password":  "Senha@Segura123!",
  "fullName":  "Nome Completo",
  "role":      "staff",
  "companyId": null
}
```

### PUT /users/:id
Role: `admin`

```json
{ "fullName": "Nome Actualizado", "companyId": "uuid" }
```

### PUT /users/:id/block
Role: `state`

```json
{ "reason": "Motivo com mínimo 10 caracteres." }
```

### PUT /users/:id/unblock
Role: `state` · Sem body

### PUT /users/:id/role
Role: `admin`

```json
{ "role": "specialist" }
```

---

## 5. Companies

### GET /companies
Roles: `state` · `staff` · Paginação

### GET /companies/:id
Roles: qualquer autenticado

**Response:**
```json
{
  "id": "uuid", "cd": "EMP-0001",
  "name": "Angola Construções SA",
  "country": "angola",
  "contactEmail": "geral@angola.ao",
  "licenseStatus": "active",
  "licenseNumber": "LIC-2026-001",
  "licenseExpiresAt": "2028-12-31T23:59:59.000Z",
  "validationNotes": "Documentação completa.",
  "createdAt": "2026-03-01T00:00:00.000Z"
}
```

### POST /companies
Roles: qualquer autenticado (requer JWT)

```json
{
  "name": "Nova Empresa Lda", "country": "angola",
  "contactEmail": "geral@empresa.ao",
  "contactPhone": "+244 923 000 001",
  "address": "Rua do Lobito, 42, Luanda"
}
```

### PUT /companies/:id ⭐ NOVO
Roles: qualquer autenticado

Actualiza apenas dados de contacto — não altera `licenseStatus`, `country` nem campos regulatórios.

```json
{
  "name":         "Nome Actualizado",
  "contactEmail": "novo@empresa.ao",
  "contactPhone": "+244 923 999 999",
  "address":      "Nova Morada, 100"
}
```

### POST /companies/:id/validate-documentation
Role: `staff`

```json
{ "valid": true, "notes": "Documentação completa e assinatura válida." }
```

→ `valid: true` passa para `under_review` · `valid: false` mantém `pending`

### POST /companies/:id/forward-to-state
Role: `staff` · Sem body · Apenas quando `under_review`

### POST /companies/:id/approve-license
Role: `state`

```json
{ "licenseNumber": "LIC-2026-010", "licenseExpiresAt": "2028-12-31T23:59:59.000Z" }
```

### POST /companies/:id/reject-license
Role: `state`

```json
{ "reason": "Documentação de origem incompleta." }
```

### POST /companies/:id/suspend
Role: `state`

```json
{ "reason": "Incumprimento fiscal detectado." }
```

### POST /companies/:id/revoke ⭐ NOVO
Role: `state` · Aplica-se a `active` ou `suspended`

```json
{ "reason": "Fraude documental confirmada pelo COMPLIANCE." }
```

### Estados de licença

```
pending → under_review → active → suspended → rejected (revoke)
                      ↘ rejected (reject-license)
```

---

## 6. Products

### Estados do produto (ACTUALIZADO)

```
draft
  ↓ request-publication
pending_review
  ↓ validate-technical (STAFF válida)
staff_validated                      ← NOVO
  ↓ approve-publication (STATE)     ↓ reject-publication
published_official                   rejected
  ↓ suspend (STATE)
suspended
```

### GET /products
Roles: qualquer autenticado · Paginação

### GET /products/my-products
Role: `producer`

### GET /products/:id
Roles: qualquer autenticado

**Response:**
```json
{
  "id": "uuid", "cd": "PRD-0001",
  "name": "Cimento Portland 50kg",
  "description": "Saco certificado",
  "category": "general",
  "status": "published_official",
  "publishedAt": "2026-03-01T00:00:00.000Z",
  "producer": { "id": "uuid", "fullName": "Product Producer" },
  "company":  { "id": "uuid", "name": "Angola Construções SA" }
}
```

### POST /products
Role: `producer` · Empresa deve ter `licenseStatus: active`

```json
{
  "name":        "Ferro de Construção 12mm",
  "description": "Varão nervurado ISO 12mm",
  "category":    "general",
  "companyId":   "uuid-da-empresa"
}
```

### PUT /products/:id
Role: `producer` · Apenas `status: draft`

```json
{ "name": "Nome Corrigido", "description": "...", "category": "materials" }
```

### POST /products/:id/request-publication
Role: `producer` · Apenas `draft`

→ `draft → pending_review`

### POST /products/:id/validate-technical ⭐ NOVO
Role: `staff` · Apenas `pending_review`

```json
{ "valid": true, "notes": "Especificações técnicas conformes." }
```

→ `valid: true` passa para `staff_validated` · `valid: false` mantém `pending_review`

### POST /products/:id/forward-product-to-state ⭐ NOVO
Role: `staff` · Apenas `staff_validated` · Sem body

Regista no audit log que o STAFF encaminhou ao STATE.

### POST /products/:id/approve-publication
Role: `state` · Aceita `pending_review` ou `staff_validated`

→ `published_official`

### POST /products/:id/reject-publication
Role: `state`

```json
{ "reason": "Especificações técnicas insuficientes." }
```

### POST /products/:id/suspend
Role: `state` · Apenas `published_official`

```json
{ "reason": "Produto suspenso por discrepância fiscal." }
```

---

## 7. Price Proposals

> **Nota para o frontend:** O BUYER **nunca** interage com price proposals. São internas ao governo. O sistema resolve o preço automaticamente ao criar pedidos.

### GET /price-proposals
Roles: `state` · `specialist`

### GET /price-proposals/my-proposals
Role: `specialist`

### GET /price-proposals/:id
Roles: qualquer autenticado

**Response (aprovada — snapshot imutável):**
```json
{
  "id": "uuid", "cd": "PP-0001",
  "productId": "uuid", "status": "approved",
  "proposedPrice": "150.0000", "currency": "USD",
  "snapshot": {
    "snapshotVersion": "1.0",
    "approvedPriceUsd": 150.00,
    "productName": "Cimento Portland 50kg",
    "validFrom": "2026-01-01T00:00:00.000Z",
    "validTo": "2026-12-31T23:59:59.000Z",
    "immutable": true
  }
}
```

### POST /price-proposals
Role: `specialist`

```json
{
  "productId":     "uuid",
  "proposedPrice": 150.00,
  "currency":      "USD",
  "justification": "Análise de mercado Q1 2026",
  "validFrom":     "2026-01-01T00:00:00.000Z",
  "validTo":       "2026-12-31T23:59:59.000Z"
}
```

### PUT /price-proposals/:id
Role: `specialist` · Apenas `draft` ou `rejected`

```json
{ "proposedPrice": 155.00, "justification": "Revisão após levantamento." }
```

**Erro 403:** tentar editar proposta `approved` (imutável)

### POST /price-proposals/:id/submit
Role: `specialist` · → `submitted`

### POST /price-proposals/:id/approve
Role: `state` · → `approved` + snapshot gerado

### POST /price-proposals/:id/reject
Role: `state`

```json
{ "reason": "Preço acima do referencial de mercado." }
```

---

## 8. Taxes

### GET /taxes
Roles: qualquer autenticado

### GET /taxes/country/:code
Roles: qualquer autenticado · Retorna apenas regras `isActive: true`

**Exemplo:** `GET /taxes/country/angola`

### GET /taxes/:id ⭐ NOVO
Roles: qualquer autenticado

### POST /taxes
Role: `state`

```json
{
  "name":          "IVA Angola 2027",
  "category":      "general",
  "country":       "angola",
  "rate":          0.14,
  "effectiveFrom": "2027-01-01T00:00:00.000Z",
  "effectiveTo":   null,
  "isActive":      true
}
```

> `country: "all"` cria regra global de fallback.  
> `rate` como decimal: `0.14` = 14%.

### PUT /taxes/:id ⭐ NOVO
Role: `state` · Todos os campos opcionais

---

## 9. Orders

> ⚠️ **FLUXO CORRIGIDO — só `productId + qty`**  
> O sistema resolve `companyId` (do JWT) e `priceProposalId` (automaticamente).

### Fluxo do BUYER

```
1. GET /products             → ver produtos published_official
2. POST /orders              → criar pedido { lines: [{productId, qty}] }
3. GET /orders/:id           → rever valores (unitPrice já calculado)
4. PUT /orders/:id           → ajustar antes de pagar (opcional)
5. POST /orders/:id/pay      → pagar (imposto calculado automaticamente)
6. GET /shipments/order/:id  → acompanhar embarque
```

### GET /orders
Roles: `state` · `staff` · `specialist` · Paginação

### GET /orders/my-orders
Role: `buyer` · Paginação

### GET /orders/:id
Roles: qualquer autenticado · BUYER restrito aos seus próprios pedidos

**Response:**
```json
{
  "id": "uuid", "cd": "ORD-0009",
  "status": "draft",
  "netAmount": null, "taxAmount": null, "totalAmount": null,
  "currency": "USD",
  "buyer":   { "id": "uuid", "fullName": "Buyer Corp" },
  "company": { "id": "uuid", "name": "Angola Construções SA", "country": "angola" },
  "lines": [
    {
      "id": "uuid", "cd": "OL-0011",
      "productId": "uuid",
      "priceProposalId": "uuid",
      "qty": 4,
      "unitPrice": "8.5",
      "taxRate": null, "taxAmount": null, "lineTotal": null,
      "product": { "id": "uuid", "name": "Tijolo Cerâmico Furado", "category": "general" }
    }
  ]
}
```

### POST /orders
Role: `buyer` · Empresa do buyer deve ter `licenseStatus: active`

```json
{
  "lines": [
    { "productId": "uuid-produto-A", "qty": 10 },
    { "productId": "uuid-produto-B", "qty": 5  }
  ]
}
```

**Erros possíveis:**
```
400 — "A sua conta não está associada a nenhuma empresa"
400 — "A empresa X não tem licença activa (estado: pending)"
404 — "Produto com ID X não encontrado"
400 — "O produto X não está disponível (estado: draft)"
400 — "O produto X não tem proposta de preço aprovada e vigente"
```

### PUT /orders/:id ⭐ NOVO
Role: `buyer` · Apenas `status: draft` · Pertence ao buyer autenticado

Substitui todas as linhas do pedido. Usa a mesma lógica do `POST` (resolve price proposal automaticamente).

```json
{
  "lines": [
    { "productId": "uuid-produto-A", "qty": 2 },
    { "productId": "uuid-produto-C", "qty": 8 }
  ]
}
```

### POST /orders/:id/pay
Role: `buyer` · Apenas `draft`

**Response 200:**
```json
{
  "id": "uuid", "cd": "ORD-0009",
  "status": "paid",
  "netAmount":   "34.00",
  "taxAmount":   "4.76",
  "totalAmount": "38.76",
  "paidAt": "2026-05-12T11:39:01.736Z"
}
```

> Transação criada automaticamente (`TRX-XXXX` com `status: completed`).

### POST /orders/:id/block
Role: `state`

```json
{ "reason": "Pedido bloqueado por suspeita de fraude." }
```

### POST /orders/:id/cancel
Role: `state` · Não cancela pedidos `paid`

### POST /orders/:id/escalate-to-state ⭐ NOVO
Role: `staff` · Sem body

Regista no audit log. Não muda o `status` do pedido — é um alerta ao STATE.

---

## 10. Transactions

> Criadas automaticamente ao pagar um pedido. O BUYER nunca cria transações directamente.

### GET /transactions
Roles: `state` · `staff` · `specialist` · `compliance` · Paginação

**Response (item):**
```json
{
  "id": "uuid", "cd": "TRX-0001",
  "orderId": "uuid",
  "amount": "38.76", "currency": "USD",
  "method": "bank_transfer",
  "status": "completed",
  "paidAt": "2026-05-12T11:39:01.736Z",
  "order": { "id": "uuid", "cd": "ORD-0009", "buyerId": "uuid" }
}
```

### GET /transactions/summary
Roles: `state` · `staff` · `specialist` · `compliance`

```json
{
  "counts":  { "completed": 4, "blocked": 1, "cancelled": 0 },
  "amounts": { "completed": "747.27", "blocked": "38.76" }
}
```

### GET /transactions/:id
Roles: `state` · `staff` · `specialist` · `compliance`

### POST /transactions/:id/block
Role: `state`

```json
{ "reason": "Valores inconsistentes com declaração fiscal." }
```

### POST /transactions/:id/cancel
Role: `state`

```json
{ "reason": "Cancelamento a pedido formal." }
```

---

## 11. Shipments

### Estados do embarque

```
created → in_transit → at_border → customs_approved → delivered
                                 → customs_rejected
                                 → held
```

### GET /shipments
Roles: `state` · `staff` · `customs` ⭐ · Paginação  
Query param opcional: `?status=at_border`

### GET /shipments/my-shipments ⭐ NOVO
Role: `operator` · Paginação

Lista apenas os embarques criados pelo operator autenticado.

### GET /shipments/order/:orderId ⭐ NOVO
Roles: `state` · `staff` · `buyer` · `operator` · `customs` · `compliance`

**Para o BUYER:** permite acompanhar o embarque do seu pedido.  
Erro 403 se o buyer tentar ver o embarque de um pedido que não é seu.

**Response:**
```json
{
  "id": "uuid", "cd": "SHP-0004",
  "orderId": "uuid",
  "status": "customs_approved",
  "origin": "Luanda, Angola",
  "destination": "Lusaka, Zambia",
  "eta": "2026-06-20T00:00:00.000Z",
  "lastLocation": "Fronteira Luau",
  "trackingEvents": [
    {
      "timestamp": "2026-05-12T09:00:00.000Z",
      "location":  "Porto de Luanda",
      "status":    "in_transit",
      "updatedBy": "uuid-operator",
      "notes":     "Carga embarcada"
    },
    {
      "timestamp": "2026-05-12T14:00:00.000Z",
      "location":  "Fronteira Luau",
      "status":    "at_border",
      "updatedBy": "uuid-operator",
      "notes":     "Aguarda inspecção aduaneira"
    }
  ],
  "customsDispatch": {
    "status": "approved",
    "notes":  "Documentação verificada",
    "validatedAt": "2026-05-12T16:00:00.000Z"
  },
  "operator": { "id": "uuid", "fullName": "Logistics Operator" }
}
```

### GET /shipments/:id
Roles: `state` · `staff` · `customs` ⭐ · `operator` ⭐ · `compliance` ⭐

### POST /shipments
Role: `operator` · Pedido deve ter `status: paid` · Um pedido = um embarque

```json
{
  "orderId":     "uuid-do-pedido",
  "origin":      "Luanda, Angola",
  "destination": "Lusaka, Zambia",
  "eta":         "2026-06-20T00:00:00.000Z"
}
```

### PUT /shipments/:id/tracking
Role: `operator` · Apenas o operador do embarque pode actualizar  
**Os eventos são acumulativos — nunca se apagam.**

```json
{
  "location": "Fronteira Luau",
  "status":   "at_border",
  "notes":    "Aguarda inspecção aduaneira"
}
```

### POST /shipments/:id/approve
Role: `customs`

```json
{ "notes": "Documentação verificada. Mercadoria conforme." }
```

### POST /shipments/:id/reject
Role: `customs`

```json
{ "reason": "Fatura não corresponde ao manifesto." }
```

### POST /shipments/:id/hold
Roles: `customs` · `state`

```json
{ "reason": "Suspeita de mercadoria não declarada." }
```

---

## 12. Reports

### Estados do relatório

```
draft → submitted → published
                  → draft (rejeitado, volta para edição)
```

### GET /reports
Roles: `state` · `staff` · `specialist` · `analyst` · `compliance` · Paginação

### GET /reports/my-reports
Roles: `analyst` · `specialist` · `compliance`

### GET /reports/:id
Roles: `state` · `staff` · `specialist` · `analyst` · `compliance`

### POST /reports
Roles: `analyst` · `specialist` · `compliance`

```json
{
  "title":          "Relatório Operacional Q2 2026",
  "type":           "operational",
  "period":         "Q2 2026",
  "targetAudience": "government",
  "content":        { "summary": "...", "findings": [], "kpis": {} }
}
```

> `type`: `operational` · `fiscal` · `strategic` · `compliance`  
> `targetAudience`: `public` · `government` · `internal`

### PUT /reports/:id
Roles: `analyst` · `specialist` · `compliance` · Apenas `draft`

### POST /reports/:id/submit
Roles: `analyst` · `specialist` · `compliance` · Apenas o autor

### POST /reports/:id/publish
Role: `state` · → `published`

### POST /reports/:id/reject
Role: `state` · → volta a `draft`

```json
{ "reason": "Dados do Q4 incorrectos. Rever secção 3." }
```

---

## 13. Audit Logs

> **Append-only. Sem POST/PUT/DELETE.**

### GET /logs
Roles: `state` · `compliance`  
Query params opcionais:

| Param | Exemplo | Descrição |
|-------|---------|-----------|
| `entity` | `order` | Filtrar por tipo de entidade |
| `entityId` | `uuid` | Filtrar por ID específico |
| `action` | `BLOCK_ORDER` | Filtrar por acção ⭐ NOVO |

**Response (item):**
```json
{
  "id": "uuid", "cd": "LOG-0001",
  "userId": "uuid", "role": "state",
  "action": "APPROVE_LICENSE",
  "entity": "company", "entityId": "uuid",
  "beforeJson": "{\"licenseStatus\":\"under_review\"}",
  "afterJson":  "{\"licenseStatus\":\"active\"}",
  "createdAt": "2026-05-12T10:00:00.000Z"
}
```

> Parse no frontend: `JSON.parse(log.beforeJson || 'null')`

**Acções auditadas:**
```
APPROVE_LICENSE · REJECT_LICENSE · SUSPEND_COMPANY · REVOKE_COMPANY
VALIDATE_DOCS_OK · VALIDATE_DOCS_FAIL · FORWARD_TO_STATE
STAFF_VALIDATE_PRODUCT_OK · STAFF_VALIDATE_PRODUCT_FAIL · STAFF_FORWARD_PRODUCT_TO_STATE
APPROVE_PUBLICATION · REJECT_PUBLICATION · SUSPEND_PRODUCT · REQUEST_PUBLICATION
APPROVE_PRICE_PROPOSAL · REJECT_PRICE_PROPOSAL
CREATE_ORDER · PAY_ORDER · BLOCK_ORDER · CANCEL_ORDER · ESCALATE_TO_STATE · UPDATE_ORDER
BLOCK_TRANSACTION · CANCEL_TRANSACTION
CREATE_SHIPMENT · CUSTOMS_APPROVE · CUSTOMS_REJECT · HOLD_SHIPMENT
CREATE_USER · UPDATE_USER · BLOCK_USER · UNBLOCK_USER · UPDATE_USER_ROLE
```

### GET /logs/suspicious-activities ⭐ NOVO
Roles: `state` · `compliance` · Sem params

Retorna automaticamente os últimos 200 eventos críticos:
`BLOCK_ORDER · CANCEL_ORDER · BLOCK_TRANSACTION · CANCEL_TRANSACTION · SUSPEND_COMPANY · REVOKE_COMPANY · REJECT_LICENSE · HOLD_SHIPMENT · CUSTOMS_REJECT · VALIDATE_DOCS_FAIL`

### GET /logs/:id
Roles: `state` · `compliance`

---

## 14. Dashboard & Analytics

> Dados em tempo real. Sem body, sem params.

### GET /dashboard
Roles: `state` · `staff` · `analyst` · `compliance`

```json
{
  "companies":    { "active": 8, "pending": 2 },
  "products":     { "published_official": 6, "staff_validated": 1 },
  "orders":       { "draft": 4, "paid": 8 },
  "transactions": { "completed": 4, "blocked": 1 },
  "shipments":    { "customs_approved": 4 },
  "auditLogs":    { "total": 74 },
  "revenue":      { "totalCompleted": 747.27, "completedCount": 4, "currency": "USD" }
}
```

### GET /dashboard/metrics
Roles: `state` · `staff` · `analyst` · `compliance`

KPIs detalhados com janelas de 7 e 30 dias.

### GET /analytics/revenue
Roles: `state` · `staff` · `specialist` · `analyst`

```json
{
  "currency": "USD",
  "allTime":    { "total": 747.27, "count": 4 },
  "byCountry":  [{ "country": "angola", "total": 747.27, "count": 4 }],
  "topProducts":[{ "name": "Tijolo Cerâmico Furado", "category": "general", "total": 300, "units": 40 }],
  "monthly":    [{ "month": "2026-05", "total": 747.27, "count": 4 }]
}
```

### GET /analytics/logistics-performance
Roles: `state` · `staff` · `analyst` · `compliance`

### GET /analytics/compliance-score
Roles: `state` · `compliance` · `analyst`

```json
{
  "overallScore": 95,
  "riskLevel":    "LOW",
  "scores": {
    "companies":    { "score": 100, "suspended": 0,  "total": 8 },
    "orders":       { "score": 95,  "blocked": 1,    "total": 10 },
    "transactions": { "score": 90,  "blocked": 1,    "total": 5 },
    "shipments":    { "score": 100, "held": 0,        "total": 4 }
  },
  "auditActivity": { "last30Days": 74, "blockedActions30d": 3, "alertRate": "4%" }
}
```

> `riskLevel`: `LOW` (≥90) · `MEDIUM` (75-89) · `HIGH` (60-74) · `CRITICAL` (<60)

---

## 15. Enums de Referência

```
Role:
  admin · state · staff · specialist · analyst
  compliance · customs · producer · buyer · operator · company

LicenseStatus:    pending · under_review · active · rejected · suspended

ProductStatus:    draft · pending_review · staff_validated · published_official · suspended · rejected

PriceProposalStatus: draft · submitted · approved · rejected

OrderStatus:      draft · confirmed · paid · blocked · cancelled

TransactionStatus: pending · completed · blocked · cancelled · refunded

ShipmentStatus:   created · in_transit · at_border · customs_approved · customs_rejected · held · delivered

ReportStatus:     draft · submitted · published

ReportType:       operational · fiscal · strategic · compliance

TargetAudience:   public · government · internal

CompanyCountry:   angola · zambia · drc · tanzania · zimbabwe · mozambique

PaymentMethod:    bank_transfer · cash · credit_card · letter_of_credit · other
```

---

## 16. Matriz de Acesso por Role

| Endpoint | admin | state | staff | spec | analyst | comp | producer | buyer | operator | customs |
|----------|:-----:|:-----:|:-----:|:----:|:-------:|:----:|:--------:|:-----:|:--------:|:-------:|
| POST /auth/register | — | — | — | — | — | — | — | — | — | — |
| POST /users | ✅ | — | — | — | — | — | — | — | — | — |
| PUT /users/:id/block | — | ✅ | — | — | — | — | — | — | — | — |
| GET /companies | — | ✅ | ✅ | — | — | — | — | — | — | — |
| POST /companies/:id/validate-documentation | — | — | ✅ | — | — | — | — | — | — | — |
| POST /products/:id/validate-technical | — | — | ✅ | — | — | — | — | — | — | — |
| POST /products/:id/approve-publication | — | ✅ | — | — | — | — | — | — | — | — |
| POST /price-proposals | — | — | — | ✅ | — | — | — | — | — | — |
| POST /price-proposals/:id/approve | — | ✅ | — | — | — | — | — | — | — | — |
| POST /taxes | — | ✅ | — | — | — | — | — | — | — | — |
| POST /orders | — | — | — | — | — | — | — | ✅ | — | — |
| PUT /orders/:id | — | — | — | — | — | — | — | ✅ | — | — |
| POST /orders/:id/pay | — | — | — | — | — | — | — | ✅ | — | — |
| POST /orders/:id/block | — | ✅ | — | — | — | — | — | — | — | — |
| POST /orders/:id/escalate-to-state | — | — | ✅ | — | — | — | — | — | — | — |
| POST /shipments | — | — | — | — | — | — | — | — | ✅ | — |
| GET /shipments | — | ✅ | ✅ | — | — | — | — | — | — | ✅ |
| GET /shipments/my-shipments | — | — | — | — | — | — | — | — | ✅ | — |
| GET /shipments/order/:id | — | ✅ | ✅ | — | — | — | — | ✅ | ✅ | ✅ |
| POST /shipments/:id/approve | — | — | — | — | — | — | — | — | — | ✅ |
| GET /logs | — | ✅ | — | — | — | — | — | — | — | — |
| GET /logs/suspicious-activities | — | ✅ | — | — | ✅ | — | — | — | — | — |
| POST /reports | — | — | — | ✅ | ✅ | — | — | — | — | — |
| POST /reports/:id/publish | — | ✅ | — | — | — | — | — | — | — | — |
| GET /dashboard | — | ✅ | ✅ | — | ✅ | ✅ | — | — | — | — |

---

## 17. Fluxo End-to-End Completo

### A — Registo externo e licenciamento

```
1.  POST /auth/register               → nova empresa + buyer (status: pending)
2.  POST /auth/login (staff)          → JWT do STAFF
3.  POST /companies/:id/validate-documentation (staff)  → under_review
4.  POST /companies/:id/forward-to-state (staff)        → notificar STATE
5.  POST /auth/login (state)          → JWT do STATE
6.  POST /companies/:id/approve-license (state)         → active
```

### B — Publicação de produto com STAFF

```
7.  POST /auth/login (producer)       → JWT do PRODUCER
8.  POST /products                    → status: draft
9.  POST /products/:id/request-publication   → pending_review
10. POST /auth/login (staff)          → JWT do STAFF
11. POST /products/:id/validate-technical (staff) → staff_validated
12. POST /products/:id/forward-product-to-state (staff) → audit log
13. POST /auth/login (state)          → JWT do STATE
14. POST /products/:id/approve-publication (state) → published_official
```

### C — Price proposal e snapshot

```
15. POST /auth/login (specialist)     → JWT do SPECIALIST
16. POST /price-proposals             → status: draft
17. POST /price-proposals/:id/submit  → submitted
18. POST /auth/login (state)          → JWT do STATE
19. POST /price-proposals/:id/approve → approved + snapshot imutável gerado
```

### D — Pedido, pagamento e embarque (BUYER)

```
20. POST /auth/login (buyer)          → JWT do BUYER
21. GET  /products                    → ver produtos published_official
22. POST /orders                      → { lines: [{productId, qty}] }
                                         sistema resolve companyId + priceProposalId
23. GET  /orders/:id                  → rever unitPrice já calculado
24. POST /orders/:id/pay              → paid | net + tax calculados | TRX criada
25. POST /auth/login (operator)       → JWT do OPERATOR
26. POST /shipments                   → embarque para o pedido pago
27. PUT  /shipments/:id/tracking      → eventos append-only
28. POST /auth/login (customs)        → JWT do CUSTOMS
29. GET  /shipments?status=at_border  → ver embarques para validar
30. POST /shipments/:id/approve       → customs_approved
31. POST /auth/login (buyer)          → JWT do BUYER
32. GET  /shipments/order/:orderId    → BUYER rastreia o seu embarque
```

### E — Auditoria

```
33. POST /auth/login (compliance)     → JWT do COMPLIANCE
34. GET  /logs/suspicious-activities  → actividades críticas
35. GET  /logs?entity=order           → todos os eventos de pedidos
36. POST /auth/login (state)          → JWT do STATE
37. GET  /analytics/compliance-score  → score=95 riskLevel=LOW
```

---

## Notas de Implementação

### Cliente HTTP (fetch nativo — sem Axios)

```typescript
// src/lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }

  const data = await response.json();
  if (!response.ok) {
    const msg = Array.isArray(data.message) ? data.message.join(' | ') : data.message;
    throw new Error(msg ?? 'Erro desconhecido');
  }
  return data as T;
}

export const api = {
  get:  <T>(path: string)                => request<T>('GET',  path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put:  <T>(path: string, body?: unknown) => request<T>('PUT',  path, body),
};
```

### Variáveis de ambiente

```env
# .env.local (Next.js)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Swagger interactivo

`http://localhost:3000/docs` — testar todos os endpoints no browser com JWT.

---

*Corredor do Lobito · Frontend API Integration Guide v3.0 · 2026-05-12*  
*Reflecte todas as implementações da sessão de 2026-05-12*
