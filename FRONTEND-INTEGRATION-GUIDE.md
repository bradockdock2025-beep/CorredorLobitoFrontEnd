# Corredor do Lobito — Frontend Integration Guide
> **Versão:** 2.0 · **Data:** 2026-05-12  
> **Base URL (dev):** `http://localhost:3000`  
> **Base URL (prod):** `https://api.corredor-lobito.gov`  
> **Total de endpoints activos:** 56  
> **Autenticação:** Bearer JWT em todos os endpoints (excepto `POST /auth/login`)

---

## Índice

1. [Autenticação](#1-autenticação)
2. [Padrão de Paginação](#2-padrão-de-paginação)
3. [Padrão de Erros](#3-padrão-de-erros)
4. [Enums de Referência](#4-enums-de-referência)
5. [Contas de Desenvolvimento](#5-contas-de-desenvolvimento)
6. [Matriz de Acesso por Role](#6-matriz-de-acesso-por-role)
7. [Users](#7-users)
8. [Companies](#8-companies)
9. [Products](#9-products)
10. [Price Proposals](#10-price-proposals)
11. [Taxes](#11-taxes)
12. [Orders ⚠ fluxo corrigido](#12-orders)
13. [Transactions](#13-transactions)
14. [Shipments](#14-shipments)
15. [Reports](#15-reports)
16. [Audit Logs](#16-audit-logs)
17. [Dashboard & Analytics](#17-dashboard--analytics)
18. [Fluxo End-to-End](#18-fluxo-end-to-end)

---

## 1. Autenticação

### POST /auth/login

Único endpoint público. Retorna o token JWT a usar em todos os outros pedidos.

**Request:**
```json
{
  "email":    "buyer@lobito.biz",
  "password": "Lobito@Dev2024!"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id":       "6bbea384-7d77-4863-b6e0-c2015eab5964",
    "email":    "buyer@lobito.biz",
    "role":     "buyer",
    "fullName": "Buyer Corp"
  }
}
```

**Erros:**
- `401` — credenciais inválidas
- `403` — utilizador bloqueado

**Uso do token em todos os outros endpoints:**
```
Authorization: Bearer <access_token>
```

O token expira em **8 horas**. Quando expirar, fazer novo login.

---

## 2. Padrão de Paginação

Todos os endpoints de listagem (`GET /companies`, `GET /orders`, etc.) aceitam os mesmos query params:

| Param | Tipo | Default | Máximo |
|-------|------|---------|--------|
| `page` | number | 1 | — |
| `limit` | number | 20 | 100 |

**Exemplo:**
```
GET /orders?page=2&limit=10
```

**Response envelope:**
```json
{
  "data": [ ... ],
  "meta": {
    "total":      45,
    "page":       2,
    "limit":      10,
    "totalPages": 5,
    "hasNext":    true,
    "hasPrev":    true
  }
}
```

---

## 3. Padrão de Erros

Todos os erros seguem o mesmo formato:

```json
{
  "statusCode": 400,
  "error":      "Bad Request",
  "message":    "Descrição do erro"
}
```

Para erros de validação, `message` é um array:
```json
{
  "statusCode": 400,
  "error":      "Bad Request",
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ]
}
```

| Código | Significado |
|--------|-------------|
| `400` | Dados inválidos ou regra de negócio violada |
| `401` | Token ausente, inválido ou expirado |
| `403` | Role sem permissão para esta acção |
| `404` | Recurso não encontrado |
| `409` | Conflito — ex: email já registado |

---

## 4. Enums de Referência

### Role (utilizadores)
```
admin · state · staff · specialist · analyst
producer · buyer · operator · customs · compliance · company
```

### LicenseStatus (empresas)
```
pending → under_review → active
                       → rejected
                       → suspended
                       → rejected  (via revoke)
```

### ProductStatus
```
draft → pending_review → published_official
                       → rejected
published_official → suspended
```

### PriceProposalStatus
```
draft → submitted → approved
                  → rejected → draft (editável)
```

### OrderStatus
```
draft → paid → blocked
             → cancelled
```

### TransactionStatus
```
completed · blocked · cancelled · refunded · pending
```

### ShipmentStatus
```
created → in_transit → at_border → customs_approved → delivered
                                 → customs_rejected
                                 → held
```

### ReportStatus
```
draft → submitted → published
                  → draft (rejeitado, volta ao início)
```

### CompanyCountry
```
angola · zambia · drc · tanzania · zimbabwe · mozambique
```

### PaymentMethod
```
bank_transfer · cash · credit_card · letter_of_credit · other
```

### ReportType
```
operational · fiscal · strategic · compliance
```

### TargetAudience
```
public · government · internal
```

---

## 5. Contas de Desenvolvimento

Password padrão de todas as contas: **`Lobito@Dev2024!`**

| Email | Role | Acesso Principal |
|-------|------|-----------------|
| `state@lobito.gov` | state | Aprovações, bloqueios, publicação |
| `staff@lobito.gov` | staff | Validação de documentação |
| `specialist@lobito.gov` | specialist | Price proposals |
| `analyst@lobito.gov` | analyst | Relatórios de dados |
| `compliance@lobito.gov` | compliance | Auditoria e audit logs |
| `producer@lobito.biz` | producer | Criação de produtos |
| `buyer@lobito.biz` | buyer | Pedidos e pagamentos |
| `operator@lobito.biz` | operator | Embarques e tracking |
| `customs@lobito.gov` | customs | Validação aduaneira |

> **Nota:** Não existe ainda conta `admin` no seed. Criar via `POST /users` com token state — aguarda implementação futura.

---

## 6. Matriz de Acesso por Role

| Endpoint | state | staff | specialist | analyst | compliance | producer | buyer | operator | customs |
|----------|:-----:|:-----:|:----------:|:-------:|:----------:|:--------:|:-----:|:--------:|:-------:|
| GET /users | ✅ | ✅ | — | — | — | — | — | — | — |
| POST /users | — | — | — | — | — | — | — | — | — |
| PUT /users/:id/block | ✅ | — | — | — | — | — | — | — | — |
| POST /companies | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /companies | ✅ | ✅ | — | — | — | — | — | — | — |
| POST /companies/:id/validate-documentation | — | ✅ | — | — | — | — | — | — | — |
| POST /companies/:id/approve-license | ✅ | — | — | — | — | — | — | — | — |
| POST /products | — | — | — | — | — | ✅ | — | — | — |
| POST /products/:id/approve-publication | ✅ | — | — | — | — | — | — | — | — |
| POST /price-proposals | — | — | ✅ | — | — | — | — | — | — |
| POST /price-proposals/:id/approve | ✅ | — | — | — | — | — | — | — | — |
| GET /taxes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /taxes | ✅ | — | — | — | — | — | — | — | — |
| POST /orders | — | — | — | — | — | — | ✅ | — | — |
| POST /orders/:id/pay | — | — | — | — | — | — | ✅ | — | — |
| POST /orders/:id/block | ✅ | — | — | — | — | — | — | — | — |
| POST /orders/:id/escalate-to-state | — | ✅ | — | — | — | — | — | — | — |
| GET /transactions | ✅ | ✅ | ✅ | — | ✅ | — | — | — | — |
| POST /transactions/:id/block | ✅ | — | — | — | — | — | — | — | — |
| POST /shipments | — | — | — | — | — | — | — | ✅ | — |
| POST /shipments/:id/approve | — | — | — | — | — | — | — | — | ✅ |
| POST /shipments/:id/hold | ✅ | — | — | — | — | — | — | — | ✅ |
| POST /reports | — | — | ✅ | ✅ | ✅ | — | — | — | — |
| POST /reports/:id/publish | ✅ | — | — | — | — | — | — | — | — |
| GET /logs | ✅ | — | — | — | ✅ | — | — | — | — |
| GET /dashboard | ✅ | ✅ | — | ✅ | ✅ | — | — | — | — |

> `(admin)` tem acesso total ao módulo de utilizadores — role ainda sem conta seed.

---

## 7. Users

> **Módulo de gestão de utilizadores. ADMIN cria/edita, STATE bloqueia.**

### GET /users
Roles: `admin` · `state` · `staff`

**Response:**
```json
{
  "data": [
    {
      "id":          "uuid",
      "cd":          "USR-0001",
      "email":       "staff@lobito.gov",
      "fullName":    "Staff Officer",
      "role":        "staff",
      "status":      "active",
      "companyId":   null,
      "lastLoginAt": "2026-05-12T10:00:00.000Z",
      "createdAt":   "2026-05-09T15:40:00.000Z",
      "updatedAt":   "2026-05-12T10:00:00.000Z"
    }
  ],
  "meta": { "total": 9, "page": 1, "limit": 20, "totalPages": 1, "hasNext": false, "hasPrev": false }
}
```

---

### GET /users/:id
Roles: `admin` · `state` · `staff`

---

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

**Response 201:** objeto do utilizador criado (sem `passwordHash`).

**Erro 409:** email já registado.

---

### PUT /users/:id
Role: `admin`

**Request (todos os campos opcionais):**
```json
{
  "fullName":  "Nome Actualizado",
  "companyId": "uuid-da-empresa"
}
```

---

### PUT /users/:id/block
Role: `state`

**Request:**
```json
{ "reason": "Utilizador envolvido em actividade suspeita" }
```

**Regra:** não é possível bloquear a própria conta.

---

### PUT /users/:id/unblock
Role: `state`

Sem body.

---

### PUT /users/:id/role
Role: `admin`

**Request:**
```json
{ "role": "specialist" }
```

**Regra:** não é possível alterar o próprio role.

---

## 8. Companies

> **Fluxo de licenciamento: `pending → under_review → active`**

### POST /companies
Roles: qualquer utilizador autenticado

**Request:**
```json
{
  "name":         "Empresa Exemplo Lda",
  "country":      "angola",
  "contactEmail": "geral@empresa.co.ao",
  "contactPhone": "+244 923 000 001",
  "address":      "Rua do Lobito, 42, Luanda"
}
```

**Response 201:**
```json
{
  "id":            "uuid",
  "cd":            "EMP-0010",
  "name":          "Empresa Exemplo Lda",
  "country":       "angola",
  "contactEmail":  "geral@empresa.co.ao",
  "licenseStatus": "pending",
  "createdAt":     "2026-05-12T12:00:00.000Z"
}
```

---

### GET /companies
Roles: `state` · `staff`  
Suporta paginação.

---

### GET /companies/:id
Roles: qualquer utilizador autenticado

---

### POST /companies/:id/validate-documentation
Role: `staff`

**Request:**
```json
{
  "valid": true,
  "notes": "Documentação válida. Todos os campos preenchidos."
}
```

**Efeito:** `licenseStatus` passa para `under_review` (se `valid: true`) ou mantém `pending` (se `valid: false`).

---

### POST /companies/:id/forward-to-state
Role: `staff`

Sem body. Apenas possível quando `licenseStatus = under_review`.

---

### POST /companies/:id/approve-license
Role: `state`

**Request:**
```json
{
  "licenseNumber":  "LIC-2026-010",
  "licenseExpiresAt": "2028-12-31T23:59:59.000Z"
}
```

**Efeito:** `licenseStatus → active`.

---

### POST /companies/:id/reject-license
Role: `state`

**Request:**
```json
{ "reason": "Documentação de origem incompleta e assinatura em falta." }
```

**Efeito:** `licenseStatus → rejected`.

---

### POST /companies/:id/suspend
Role: `state`

**Request:**
```json
{ "reason": "Empresa suspensa por incumprimento fiscal detectado em auditoria." }
```

**Efeito:** `licenseStatus → suspended`. Apenas activas podem ser suspensas.

---

### POST /companies/:id/revoke
Role: `state`

**Request:**
```json
{ "reason": "Licença revogada por fraude documental confirmada pelo COMPLIANCE." }
```

**Efeito:** `licenseStatus → rejected`. Aplicável a `active` ou `suspended`.

---

## 9. Products

> **Fluxo: `draft → pending_review → published_official`**

### GET /products
Roles: qualquer utilizador autenticado  
Suporta paginação.

**Response (item):**
```json
{
  "id":          "uuid",
  "cd":          "PRD-0001",
  "name":        "Cimento Portland 50kg",
  "description": "Saco de cimento de 50kg certificado",
  "category":    "general",
  "status":      "published_official",
  "publishedAt": "2026-03-01T00:00:00.000Z",
  "producer":    { "id": "uuid", "fullName": "Product Producer" },
  "company":     { "id": "uuid", "name": "Angola Construções SA" }
}
```

---

### GET /products/my-products
Role: `producer`

Lista apenas os produtos do producer autenticado.

---

### GET /products/:id
Roles: qualquer utilizador autenticado

---

### POST /products
Role: `producer`

**Pré-condição:** a empresa associada ao producer deve ter `licenseStatus = active`.

**Request:**
```json
{
  "name":        "Ferro de Construção 12mm",
  "description": "Varão de ferro nervurado 12mm conforme norma ISO",
  "category":    "general",
  "companyId":   "uuid-da-empresa"
}
```

**Response 201:** produto criado com `status: draft`.

---

### PUT /products/:id
Role: `producer`

Apenas editável quando `status = draft`.

**Request (todos opcionais):**
```json
{
  "name":        "Nome Corrigido",
  "description": "Descrição actualizada",
  "category":    "materials"
}
```

---

### POST /products/:id/request-publication
Role: `producer`

Sem body. Apenas possível quando `status = draft`.  
**Efeito:** `status → pending_review`.

---

### POST /products/:id/approve-publication
Role: `state`

Sem body.  
**Efeito:** `status → published_official`, `publishedAt` registado.

---

### POST /products/:id/reject-publication
Role: `state`

**Request:**
```json
{ "reason": "Descrição técnica insuficiente. Faltam especificações de origem." }
```

**Efeito:** `status → rejected`.

---

### POST /products/:id/suspend
Role: `state`

**Request:**
```json
{ "reason": "Produto suspenso por discrepância fiscal detectada." }
```

**Efeito:** `status → suspended`. Apenas `published_official` pode ser suspenso.

---

## 10. Price Proposals

> **Fluxo: `draft → submitted → approved` — snapshot gerado na aprovação.**  
> **Uso: o BUYER nunca interage com price proposals. São internas ao governo.**

### GET /price-proposals
Roles: `state` · `specialist`

---

### GET /price-proposals/my-proposals
Role: `specialist`

Lista apenas as propostas criadas pelo specialist autenticado.

---

### GET /price-proposals/:id
Roles: qualquer utilizador autenticado

---

### POST /price-proposals
Role: `specialist`

**Request:**
```json
{
  "productId":     "uuid-do-produto",
  "proposedPrice": 150.00,
  "currency":      "USD",
  "justification": "Análise de mercado Q1 2026 indica margem de 12%",
  "validFrom":     "2026-06-01T00:00:00.000Z",
  "validTo":       "2026-12-31T23:59:59.000Z"
}
```

> `currency`, `justification`, `validFrom`, `validTo` são opcionais.  
> Se `validFrom`/`validTo` omitidos, a proposta é válida indefinidamente quando aprovada.

**Response 201:** proposta criada com `status: draft`.

---

### PUT /price-proposals/:id
Role: `specialist`

Apenas editável quando `status = draft` ou `status = rejected`.

**Campos editáveis (todos opcionais):**
```json
{
  "proposedPrice": 155.00,
  "justification": "Revisão após novo levantamento de custos",
  "validFrom":     "2026-07-01T00:00:00.000Z",
  "validTo":       null
}
```

**Erro 403:** tentativa de editar proposta `approved` — é imutável.

---

### POST /price-proposals/:id/submit
Role: `specialist`

Sem body.  
**Efeito:** `status → submitted`.

---

### POST /price-proposals/:id/approve
Role: `state`

Sem body.  
**Efeito:** `status → approved` + snapshot imutável gerado e gravado.

**O snapshot contém:**
```json
{
  "snapshotVersion":  "1.0",
  "generatedAt":      "2026-05-12T12:30:00.000Z",
  "proposalId":       "uuid",
  "productId":        "uuid",
  "productName":      "Cimento Portland 50kg",
  "productCategory":  "general",
  "approvedPriceUsd": 150.00,
  "currency":         "USD",
  "validFrom":        "2026-06-01T00:00:00.000Z",
  "validTo":          "2026-12-31T23:59:59.000Z",
  "immutable":        true
}
```

---

### POST /price-proposals/:id/reject
Role: `state`

**Request:**
```json
{ "reason": "Preço acima do referencial de mercado para o período." }
```

**Efeito:** `status → rejected`. O specialist pode editar e re-submeter.

---

## 11. Taxes

> **Regras fiscais aplicadas automaticamente ao pagar um pedido.**

### GET /taxes
Roles: qualquer utilizador autenticado

**Response (item):**
```json
{
  "id":            "uuid",
  "cd":            "TAX-0001",
  "name":          "IVA Angola",
  "category":      "general",
  "country":       "angola",
  "rate":          "0.14",
  "effectiveFrom": "2024-01-01T00:00:00.000Z",
  "effectiveTo":   null,
  "isActive":      true
}
```

> `rate` é uma string decimal. `0.14` = 14%. Converter com `Number(rate)` no frontend.

---

### GET /taxes/country/:code
Roles: qualquer utilizador autenticado

Retorna apenas as regras **activas** para o país indicado.

**Exemplo:** `GET /taxes/country/angola`

---

### GET /taxes/:id
Roles: qualquer utilizador autenticado

---

### POST /taxes
Role: `state`

**Request:**
```json
{
  "name":          "IVA Tanzânia 2027",
  "category":      "general",
  "country":       "tanzania",
  "rate":          0.18,
  "effectiveFrom": "2027-01-01T00:00:00.000Z",
  "effectiveTo":   null,
  "isActive":      true
}
```

> `country: "all"` cria uma regra global de fallback para todos os países.

---

### PUT /taxes/:id
Role: `state`

Todos os campos são opcionais.

---

## 12. Orders

> **⚠ FLUXO CORRIGIDO EM 2026-05-12**  
> O BUYER passa apenas `productId` + `qty`.  
> O `companyId` é lido do JWT automaticamente.  
> A price proposal é resolvida pelo sistema — o BUYER nunca a vê.

### Fluxo completo de um pedido (perspectiva BUYER)

```
1. GET /products              → escolher produto (published_official)
2. POST /orders               → criar pedido com productId + qty
3. GET /orders/:id            → rever os valores calculados
4. POST /orders/:id/pay       → confirmar pagamento
```

---

### GET /orders
Roles: `state` · `staff` · `specialist`  
Suporta paginação.

---

### GET /orders/my-orders
Role: `buyer`

Lista apenas os pedidos do buyer autenticado. Suporta paginação.

---

### GET /orders/:id
Roles: qualquer utilizador autenticado

> **Restrição:** um BUYER apenas consegue ver os seus próprios pedidos. Tentativa de aceder a um pedido de outro buyer retorna `403`.

**Response:**
```json
{
  "id":           "uuid",
  "cd":           "ORD-0009",
  "status":       "draft",
  "buyerId":      "uuid",
  "companyId":    "uuid",
  "netAmount":    null,
  "taxAmount":    null,
  "totalAmount":  null,
  "currency":     "USD",
  "paidAt":       null,
  "buyer":        { "id": "uuid", "fullName": "Buyer Corp" },
  "company":      { "id": "uuid", "name": "Angola Construções SA", "country": "angola" },
  "lines": [
    {
      "id":              "uuid",
      "cd":              "OL-0011",
      "productId":       "uuid",
      "priceProposalId": "uuid",
      "qty":             3,
      "unitPrice":       "8.5",
      "taxRate":         null,
      "taxAmount":       null,
      "lineTotal":       null,
      "product": {
        "id": "uuid", "name": "Tijolo Cerâmico Furado", "category": "general"
      }
    }
  ]
}
```

> **Nota:** `unitPrice` já está preenchido no `draft` (do snapshot aprovado). `taxRate`, `taxAmount` e `lineTotal` são preenchidos no `pay`.

---

### POST /orders
Role: `buyer`

**Pré-condições verificadas automaticamente:**
- A empresa do buyer (do JWT) tem `licenseStatus = active`
- Cada produto existe e tem `status = published_official`
- Cada produto tem uma price proposal `approved` e vigente

**Request:**
```json
{
  "lines": [
    { "productId": "uuid-produto-A", "qty": 10 },
    { "productId": "uuid-produto-B", "qty": 5  }
  ]
}
```

**Response 201:** pedido criado em `draft` com `unitPrice` já calculado por linha.

**Erros possíveis:**
```
400 — "A sua conta não está associada a nenhuma empresa"
400 — "A empresa X não tem licença activa (estado: suspended)"
404 — "Produto com ID X não encontrado"
400 — "O produto X não está disponível para pedidos (estado: draft)"
400 — "O produto X não tem proposta de preço aprovada e vigente"
```

---

### POST /orders/:id/pay
Role: `buyer`

Sem body. Apenas possível quando `status = draft` e o pedido pertence ao buyer autenticado.

**Efeito:**
- Calcula `taxRate` por país da empresa + categoria do produto
- Preenche `taxAmount` e `lineTotal` em cada linha
- Actualiza `netAmount`, `taxAmount`, `totalAmount` no pedido
- `status → paid`
- Cria uma `Transaction` automaticamente

**Response 200:**
```json
{
  "id":          "uuid",
  "cd":          "ORD-0009",
  "status":      "paid",
  "netAmount":   "25.5",
  "taxAmount":   "3.57",
  "totalAmount": "29.07",
  "currency":    "USD",
  "paidAt":      "2026-05-12T11:39:01.736Z"
}
```

---

### POST /orders/:id/block
Role: `state`

**Request:**
```json
{ "reason": "Pedido bloqueado por suspeita de fraude. Aguarda decisão do COMPLIANCE." }
```

**Efeito:** `status → blocked`.

---

### POST /orders/:id/cancel
Role: `state`

Sem body.  
**Regra:** pedidos `paid` não podem ser cancelados directamente (requer processo de reembolso).  
**Efeito:** `status → cancelled`.

---

### POST /orders/:id/escalate-to-state
Role: `staff`

Sem body. Regista no audit log que o STAFF escalou o pedido ao STATE para decisão.  
Não altera o `status` — é um evento de auditoria.

---

## 13. Transactions

> **Criadas automaticamente ao pagar um pedido. O BUYER nunca cria transações directamente.**

### GET /transactions
Roles: `state` · `staff` · `specialist` · `compliance`  
Suporta paginação.

**Response (item):**
```json
{
  "id":           "uuid",
  "cd":           "TRX-0001",
  "orderId":      "uuid",
  "amount":       "29.07",
  "currency":     "USD",
  "method":       "bank_transfer",
  "status":       "completed",
  "paidAt":       "2026-05-12T11:39:01.736Z",
  "blockedAt":    null,
  "blockedById":  null,
  "blockedReason": null,
  "cancelledAt":  null,
  "order": { "id": "uuid", "cd": "ORD-0009", "buyerId": "uuid" }
}
```

---

### GET /transactions/summary
Roles: `state` · `staff` · `specialist` · `compliance`

**Response:**
```json
{
  "counts": {
    "completed":  12,
    "blocked":    1,
    "cancelled":  0,
    "pending":    0,
    "refunded":   0
  },
  "amounts": {
    "completed": "15420.50",
    "blocked":   "890.00"
  }
}
```

---

### GET /transactions/:id
Roles: `state` · `staff` · `specialist` · `compliance`

---

### POST /transactions/:id/block
Role: `state`

**Request:**
```json
{ "reason": "Transação bloqueada — valores inconsistentes com declaração fiscal." }
```

**Efeito:** `status → blocked`.

---

### POST /transactions/:id/cancel
Role: `state`

**Request:**
```json
{ "reason": "Transação cancelada a pedido formal do comprador." }
```

**Efeito:** `status → cancelled`.

---

## 14. Shipments

> **Fluxo: `created → in_transit → at_border → customs_approved → delivered`**

### GET /shipments
Roles: `state` · `staff`  
Suporta paginação.

**Response (item):**
```json
{
  "id":            "uuid",
  "cd":            "SHP-0001",
  "orderId":       "uuid",
  "operatorId":    "uuid",
  "status":        "customs_approved",
  "origin":        "Luanda, Angola",
  "destination":   "Lusaka, Zambia",
  "eta":           "2026-06-15T00:00:00.000Z",
  "lastLocation":  "Fronteira Luau",
  "trackingEvents": [
    {
      "timestamp": "2026-05-12T09:00:00.000Z",
      "location":  "Porto de Luanda",
      "status":    "in_transit",
      "updatedBy": "uuid-operator",
      "notes":     "Carga embarcada"
    }
  ],
  "holdReason":     null,
  "operator":       { "id": "uuid", "fullName": "Logistics Operator" },
  "customsDispatch": {
    "status":      "approved",
    "notes":       "Documentos verificados",
    "validatedAt": "2026-05-12T14:00:00.000Z"
  }
}
```

---

### GET /shipments/:id
Roles: qualquer utilizador autenticado

---

### POST /shipments
Role: `operator`

**Pré-condição:** a order deve ter `status = paid`.

**Request:**
```json
{
  "orderId":     "uuid-do-pedido",
  "origin":      "Luanda, Angola",
  "destination": "Lusaka, Zambia",
  "eta":         "2026-06-15T00:00:00.000Z"
}
```

> `eta` é opcional.

**Response 201:** embarque criado com `status: created` e `trackingEvents: []`.

---

### PUT /shipments/:id/tracking
Role: `operator`

**Regra:** apenas o operador que criou o embarque pode actualizar o tracking.  
**Os eventos são acumulativos — nunca apagados.**

**Request:**
```json
{
  "location": "Fronteira Luau",
  "status":   "at_border",
  "notes":    "Aguarda inspecção aduaneira"
}
```

Os valores de `status` válidos neste endpoint são os do enum `ShipmentStatus`.

---

### POST /shipments/:id/approve
Role: `customs`

**Request:**
```json
{ "notes": "Toda a documentação verificada. Mercadoria conforme." }
```

**Efeito:** `status → customs_approved`. Cria/actualiza `CustomsDispatch` com `status: approved`.

---

### POST /shipments/:id/reject
Role: `customs`

**Request:**
```json
{ "reason": "Fatura de origem não corresponde à manifesto de carga." }
```

**Efeito:** `status → customs_rejected`.

---

### POST /shipments/:id/hold
Roles: `customs` · `state`

**Request:**
```json
{ "reason": "Retido para inspecção especial — suspeita de mercadoria não declarada." }
```

**Efeito:** `status → held`.

---

## 15. Reports

> **Fluxo: `draft → submitted → published` (STATE publica)**

### GET /reports
Roles: `state` · `staff` · `specialist` · `analyst` · `compliance`  
Suporta paginação.

**Response (item):**
```json
{
  "id":             "uuid",
  "cd":             "RPT-0001",
  "title":          "Relatório Operacional Q1 2026",
  "type":           "operational",
  "status":         "published",
  "targetAudience": "government",
  "period":         "Q1 2026",
  "publishedAt":    "2026-04-05T00:00:00.000Z",
  "author": { "id": "uuid", "fullName": "Data Analyst" }
}
```

---

### GET /reports/my-reports
Roles: `analyst` · `specialist` · `compliance`

Lista apenas os relatórios do autor autenticado.

---

### GET /reports/:id
Roles: `state` · `staff` · `specialist` · `analyst` · `compliance`

---

### POST /reports
Roles: `analyst` · `specialist` · `compliance`

**Request:**
```json
{
  "title":          "Relatório de Compliance Maio 2026",
  "type":           "compliance",
  "period":         "Maio 2026",
  "targetAudience": "government",
  "content":        { "summary": "...", "findings": [], "recommendations": [] }
}
```

> `period`, `content`, `targetAudience` são opcionais. Default de `targetAudience`: `internal`.

**Response 201:** relatório criado com `status: draft`.

---

### PUT /reports/:id
Roles: `analyst` · `specialist` · `compliance`

Apenas editável quando `status = draft`. Campos opcionais iguais ao `POST`.

---

### POST /reports/:id/submit
Roles: `analyst` · `specialist` · `compliance`

Sem body. Apenas o autor pode submeter o seu próprio relatório.  
**Efeito:** `status → submitted`.

---

### POST /reports/:id/publish
Role: `state`

Sem body.  
**Efeito:** `status → published`, `publishedAt` registado.

---

### POST /reports/:id/reject
Role: `state`

**Request:**
```json
{ "reason": "Dados do Q4 incorrectos. Rever secção 3 antes de re-submeter." }
```

**Efeito:** `status → draft` (volta ao início, editável).

---

## 16. Audit Logs

> **Append-only. Sem POST/PUT/DELETE. Apenas leitura.**

### GET /logs
Roles: `state` · `compliance`

**Query params opcionais:**
| Param | Exemplo | Descrição |
|-------|---------|-----------|
| `entity` | `order` | Filtrar por tipo de entidade |
| `entityId` | `uuid` | Filtrar por ID de entidade |
| `action` | `BLOCK_ORDER` | Filtrar por tipo de acção |

**Exemplo:** `GET /logs?entity=order&action=BLOCK_ORDER`

**Response (item):**
```json
{
  "id":         "uuid",
  "cd":         "LOG-0001",
  "userId":     "uuid",
  "role":       "state",
  "action":     "APPROVE_LICENSE",
  "entity":     "company",
  "entityId":   "uuid",
  "beforeJson": "{\"licenseStatus\":\"under_review\"}",
  "afterJson":  "{\"licenseStatus\":\"active\"}",
  "meta":       null,
  "ipAddress":  null,
  "createdAt":  "2026-05-09T15:40:23.638Z"
}
```

> `beforeJson` e `afterJson` são strings JSON — fazer `JSON.parse()` no frontend para visualizar.

**Acções auditadas:**
```
APPROVE_LICENSE · REJECT_LICENSE · SUSPEND_COMPANY · REVOKE_COMPANY
VALIDATE_DOCS_OK · VALIDATE_DOCS_FAIL · FORWARD_TO_STATE
APPROVE_PRICE_PROPOSAL · REJECT_PRICE_PROPOSAL
CREATE_ORDER · PAY_ORDER · BLOCK_ORDER · CANCEL_ORDER · ESCALATE_TO_STATE
BLOCK_TRANSACTION · CANCEL_TRANSACTION
CREATE_SHIPMENT · CUSTOMS_APPROVE · CUSTOMS_REJECT · HOLD_SHIPMENT
CREATE_USER · UPDATE_USER · BLOCK_USER · UNBLOCK_USER · UPDATE_USER_ROLE
```

---

### GET /logs/suspicious-activities
Roles: `state` · `compliance`

Retorna automaticamente os últimos 200 eventos de acções críticas:
`BLOCK_ORDER` · `CANCEL_ORDER` · `BLOCK_TRANSACTION` · `SUSPEND_COMPANY` · `REVOKE_COMPANY` · `HOLD_SHIPMENT` · `CUSTOMS_REJECT` · `VALIDATE_DOCS_FAIL` · `REJECT_LICENSE` · `CANCEL_TRANSACTION`

Sem query params.

---

### GET /logs/:id
Roles: `state` · `compliance`

---

## 17. Dashboard & Analytics

> **Dados calculados em tempo real. Sem body, sem query params.**

### GET /dashboard
Roles: `state` · `staff` · `analyst` · `compliance`

Vista panorâmica de contagens por status de todas as entidades.

**Response:**
```json
{
  "companies":    { "active": 6 },
  "products":     { "published_official": 5 },
  "orders":       { "draft": 1, "paid": 4 },
  "transactions": { "completed": 1 },
  "shipments":    { "customs_approved": 3 },
  "reports":      {},
  "auditLogs":    { "total": 42 },
  "revenue":      { "totalCompleted": 513, "completedCount": 1, "currency": "USD" }
}
```

---

### GET /dashboard/metrics
Roles: `state` · `staff` · `analyst` · `compliance`

KPIs detalhados com janelas temporais de 7 e 30 dias.

**Response:**
```json
{
  "generatedAt": "2026-05-12T12:00:00.000Z",
  "periods":     { "last7Days": "...", "last30Days": "..." },
  "companies": {
    "total": 6, "active": 6, "pending": 0, "approvalRate": "100%"
  },
  "products": {
    "total": 5, "published": 5, "publishRate": "100%"
  },
  "orders": {
    "total": 5, "paid": 4, "blocked": 0, "last30Days": 5
  },
  "transactions": {
    "total": 1, "blocked": 0, "last30Days": 1
  },
  "shipments": {
    "total": 3, "approved": 3, "held": 0, "approvalRate": "100%"
  },
  "revenue": {
    "allTime":   { "total": 513, "average": 513, "max": 513, "min": 513, "count": 1 },
    "last30Days": { "total": 0, "count": 0 },
    "currency":  "USD"
  },
  "auditActivity": { "last7Days": 5 }
}
```

---

### GET /analytics/revenue
Roles: `state` · `staff` · `specialist` · `analyst`

Análise financeira: receita total, por país, por produto e evolução mensal.

**Response:**
```json
{
  "currency": "USD",
  "allTime":  { "total": 513, "count": 1 },
  "byCountry": [
    { "country": "angola", "total": 513, "count": 1 }
  ],
  "topProducts": [
    { "name": "Cimento Portland 50kg", "category": "general", "total": 300, "units": 2 }
  ],
  "monthly": [
    { "month": "2026-03", "total": 513, "count": 1 }
  ]
}
```

---

### GET /analytics/logistics-performance
Roles: `state` · `staff` · `analyst` · `compliance`

Performance logística: embarques por estado, taxas de aprovação e rotas principais.

**Response:**
```json
{
  "shipments": {
    "total": 3,
    "byStatus": { "customs_approved": 3 },
    "approvalRate": "100%"
  },
  "customs": {
    "total": 3, "approved": 3, "rejected": 0, "held": 0, "pending": 0,
    "approvalRate": "100%"
  },
  "topRoutes": [
    { "route": "Luanda, Angola → Lusaka, Zambia", "count": 2 }
  ]
}
```

---

### GET /analytics/compliance-score
Roles: `state` · `compliance` · `analyst`

Score de risco do ecossistema (0–100) com decomposição por domínio.

**Response:**
```json
{
  "generatedAt":  "2026-05-12T12:00:00.000Z",
  "overallScore": 95,
  "riskLevel":    "LOW",
  "scores": {
    "companies":    { "score": 100, "suspended": 0,  "total": 6 },
    "orders":       { "score": 100, "blocked": 0,    "cancelled": 0, "total": 5 },
    "transactions": { "score": 100, "blocked": 0,    "total": 1 },
    "shipments":    { "score": 100, "held": 0,       "rejected": 0,  "total": 3 }
  },
  "auditActivity": {
    "last30Days":        42,
    "blockedActions30d": 0,
    "alertRate":         "0%"
  }
}
```

> `riskLevel`: `LOW` (≥ 90) · `MEDIUM` (75–89) · `HIGH` (60–74) · `CRITICAL` (< 60)

---

## 18. Fluxo End-to-End

Sequência completa do ecossistema, do registo de empresa ao embarque aprovado.

```
1.  POST /auth/login (qualquer)         → obter JWT
2.  POST /companies                     → registar empresa (status: pending)
3.  POST /auth/login (staff)            → JWT do STAFF
4.  POST /companies/:id/validate-documentation (staff) → status: under_review
5.  POST /companies/:id/forward-to-state (staff)       → notificar STATE
6.  POST /auth/login (state)            → JWT do STATE
7.  POST /companies/:id/approve-license (state)        → status: active
8.  POST /auth/login (producer)         → JWT do PRODUCER
9.  POST /products                      → criar produto (status: draft)
10. POST /products/:id/request-publication → status: pending_review
11. POST /auth/login (specialist)       → JWT do SPECIALIST
12. POST /price-proposals               → criar proposta (status: draft)
13. POST /price-proposals/:id/submit    → status: submitted
14. POST /auth/login (state)            → JWT do STATE
15. POST /products/:id/approve-publication → status: published_official
16. POST /price-proposals/:id/approve   → status: approved + snapshot gerado
17. POST /auth/login (buyer)            → JWT do BUYER
18. POST /orders                        → { lines: [{ productId, qty }] }
                                           sistema resolve price proposal automaticamente
                                           status: draft, unitPrice já calculado
19. POST /orders/:id/pay               → status: paid, imposto calculado, transaction criada
20. POST /auth/login (operator)         → JWT do OPERATOR
21. POST /shipments                     → embarque para o pedido pago
22. PUT  /shipments/:id/tracking        → actualizar localização (append-only)
23. POST /auth/login (customs)          → JWT do CUSTOMS
24. POST /shipments/:id/approve         → status: customs_approved
25. POST /auth/login (state)            → JWT do STATE
26. GET  /logs?entity=order&entityId=:id → audit trail completo do pedido
```

---

## Notas de Implementação Frontend

### Armazenar o token
```javascript
localStorage.setItem('access_token', response.access_token);
localStorage.setItem('user', JSON.stringify(response.user));
```

### Header automático (Axios)
```javascript
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Tratar expiração de token (401)
```javascript
axios.interceptors.response.use(null, (error) => {
  if (error.response?.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
  }
  return Promise.reject(error);
});
```

### Converter `Decimal` para número
Os campos monetários (`amount`, `rate`, `unitPrice`, `totalAmount`, etc.) chegam como **strings** do PostgreSQL/Prisma. Sempre converter:
```javascript
const total = Number(order.totalAmount);  // "29.07" → 29.07
const rate  = Number(tax.rate) * 100;     // "0.14" → 14 (para exibir como %)
```

### Fazer parse dos campos de audit log
```javascript
const before = JSON.parse(log.beforeJson || 'null');
const after  = JSON.parse(log.afterJson  || 'null');
```

### Swagger interactivo
Disponível em desenvolvimento: `http://localhost:3000/docs`  
Permite testar todos os endpoints directamente no browser com autenticação JWT.

---

*Corredor do Lobito · Frontend Integration Guide v2.0 · 2026-05-12*  
*NestJS 11 · TypeScript · PostgreSQL · Prisma ORM · JWT*
