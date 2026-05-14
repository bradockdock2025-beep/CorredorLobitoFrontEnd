# Corredor do Lobito — Frontend Integration Guide (Produção)
> **Versão:** 1.0 · **Data:** 2026-05-13  
> **Base URL:** `https://corredordolobitobackend-production.up.railway.app`  
> **Swagger:** `https://corredordolobitobackend-production.up.railway.app/docs`  
> **Total de endpoints:** 82 · **Testados em produção:** 82/82 ✅  
> **Autenticação:** Bearer JWT — excepto `POST /auth/login` e `POST /auth/register`

---

## Índice

1. [Configuração Base](#1-configuração-base)
2. [Autenticação](#2-autenticação)
3. [Contas de Desenvolvimento](#3-contas-de-desenvolvimento)
4. [Padrões Globais](#4-padrões-globais)
5. [Users](#5-users)
6. [Companies](#6-companies)
7. [Products](#7-products)
8. [Price Proposals](#8-price-proposals)
9. [Taxes](#9-taxes)
10. [Orders](#10-orders)
11. [Transactions](#11-transactions)
12. [Shipments](#12-shipments)
13. [Reports](#13-reports)
14. [Audit Logs](#14-audit-logs)
15. [Dashboard & Analytics](#15-dashboard--analytics)
16. [Enums](#16-enums)
17. [Matriz RBAC](#17-matriz-rbac)
18. [Fluxo End-to-End](#18-fluxo-end-to-end)

---

## 1. Configuração Base

### Variável de ambiente

```env
NEXT_PUBLIC_API_URL=https://corredordolobitobackend-production.up.railway.app
```

### Cliente HTTP (fetch nativo — sem Axios)

```typescript
// src/lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_URL
          ?? 'https://corredordolobitobackend-production.up.railway.app';

function getToken(): string | null {
  return typeof window !== 'undefined'
    ? localStorage.getItem('access_token')
    : null;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Token expirado → redirecionar para login
  if (res.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }

  const data = await res.json();

  if (!res.ok) {
    const msg = Array.isArray(data.message)
      ? data.message.join(' | ')
      : (data.message ?? 'Erro desconhecido');
    throw new Error(msg);
  }

  return data as T;
}

export const api = {
  get:    <T>(path: string)                => request<T>('GET',    path),
  post:   <T>(path: string, body?: unknown) => request<T>('POST',   path, body),
  put:    <T>(path: string, body?: unknown) => request<T>('PUT',    path, body),
  delete: <T>(path: string)                => request<T>('DELETE', path),
};
```

---

## 2. Autenticação

### POST /auth/login
**Público — sem token**

```typescript
const data = await api.post<{ access_token: string; user: User }>('/auth/login', {
  email:    'buyer@lobito.biz',
  password: 'Lobito@Dev2024!',
});

localStorage.setItem('access_token', data.access_token);
localStorage.setItem('user', JSON.stringify(data.user));
```

**Response 201:**
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
```json
{ "statusCode": 401, "message": "Credenciais inválidas" }
{ "statusCode": 403, "message": "Utilizador bloqueado" }
```

---

### POST /auth/register
**Público — sem token**  
Auto-registo para empresas externas e utilizadores.  
`role` aceita: `buyer` · `producer` · `operator`

**Request — nova empresa:**
```json
{
  "email":          "comprador@empresa.ao",
  "password":       "Senha@Segura123!",
  "fullName":       "Maria Conceição",
  "role":           "buyer",
  "companyName":    "Nova Empresa Angola Lda",
  "companyCountry": "angola",
  "companyEmail":   "geral@empresa.ao",
  "companyPhone":   "+244 923 111 222",
  "companyAddress": "Rua da Independência, 50, Luanda"
}
```

**Request — utilizador em empresa existente:**
```json
{
  "email":     "outro@empresa.ao",
  "password":  "Senha@Segura123!",
  "fullName":  "João Silva",
  "role":      "buyer",
  "companyId": "uuid-da-empresa-existente"
}
```

**Response 201:**
```json
{
  "access_token": "eyJhbGci...",
  "user": {
    "id":        "uuid",
    "email":     "comprador@empresa.ao",
    "role":      "buyer",
    "fullName":  "Maria Conceição",
    "companyId": "uuid"
  },
  "company": {
    "id":            "uuid",
    "cd":            "EMP-0012",
    "name":          "Nova Empresa Angola Lda",
    "country":       "angola",
    "licenseStatus": "pending",
    "message":       "Empresa registada. Aguarda validação do STAFF e aprovação do STATE para operar."
  }
}
```

> ⚠️ Empresa começa como `pending`. Utilizador recebe JWT mas não consegue criar pedidos ou produtos até a empresa ser aprovada. Ao tentar, recebe: `400 — "A empresa X não tem licença activa (estado: pending)"`

**Erros:**
```json
{ "statusCode": 409, "message": "Email já registado" }
{ "statusCode": 400, "message": "Para registar numa nova empresa é obrigatório fornecer: companyName, companyCountry e companyEmail." }
{ "statusCode": 404, "message": "Empresa não encontrada. Verifique o companyId." }
```

---

## 3. Contas de Desenvolvimento

Password: **`Lobito@Dev2024!`** em todas as contas.

| Email | Role | Função |
|-------|------|--------|
| `admin@lobito.gov` | admin | Gestão de utilizadores |
| `state@lobito.gov` | state | Aprovações e decisões regulatórias |
| `staff@lobito.gov` | staff | Validação operacional |
| `specialist@lobito.gov` | specialist | Price proposals |
| `analyst@lobito.gov` | analyst | Relatórios e KPIs |
| `compliance@lobito.gov` | compliance | Auditoria e fiscalização |
| `producer@lobito.biz` | producer | Catálogo de produtos |
| `buyer@lobito.biz` | buyer | Pedidos e pagamentos |
| `operator@lobito.biz` | operator | Embarques e tracking |
| `customs@lobito.gov` | customs | Validação aduaneira |

---

## 4. Padrões Globais

### Paginação

Endpoints de listagem aceitam:

| Param | Default | Máximo |
|-------|:-------:|:------:|
| `page` | 1 | — |
| `limit` | 20 | 100 |

**Exemplo:** `GET /orders?page=2&limit=10`

**Envelope de resposta:**
```json
{
  "data": [ ... ],
  "meta": {
    "total": 45,
    "page": 2,
    "limit": 10,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": true
  }
}
```

### Códigos de erro

| Código | Significado |
|--------|------------|
| `400` | Dados inválidos ou regra de negócio violada |
| `401` | Token ausente, inválido ou expirado |
| `403` | Role sem permissão para esta acção |
| `404` | Recurso não encontrado |
| `409` | Conflito — email duplicado, etc. |

### Campos Decimal → Number

```typescript
// Campos monetários chegam como string — converter sempre
const total = Number(order.totalAmount);   // "49.30" → 49.30
const tax   = Number(order.taxAmount);     // "6.80"  → 6.80
const rate  = Number(tax.rate) * 100;      // "0.16"  → 16 (%)
```

---

## 5. Users

### GET /users
**Roles:** `admin` · `state` · `staff` · Paginação

```typescript
const { data, meta } = await api.get<Paginated<User>>('/users?page=1&limit=20');
```

**Response:**
```json
{
  "data": [{
    "id": "f0d4b450-a9b9-4b7b-af1c-a817c00f2341",
    "cd": "USR-0014",
    "email": "producer2@empresa.ao",
    "fullName": "Segundo Producer",
    "role": "producer",
    "status": "active",
    "companyId": "8dfca0be-5b78-437b-b5a2-12d2d948c741",
    "lastLoginAt": "2026-05-12T10:00:00.000Z",
    "createdAt": "2026-05-12T17:14:39.594Z",
    "updatedAt": "2026-05-12T17:14:39.594Z"
  }],
  "meta": { "total": 14, "page": 1, "limit": 20, "totalPages": 1, "hasNext": false, "hasPrev": false }
}
```

### GET /users/:id
**Roles:** `admin` · `state` · `staff`

### POST /users
**Role:** `admin`

```typescript
await api.post('/users', {
  email:     'novo.staff@lobito.gov',
  password:  'Senha@Segura123!',
  fullName:  'Nome Completo',
  role:      'staff',
  companyId: null,   // null para roles governamentais
});
```

**Response 201:**
```json
{
  "id": "uuid", "cd": "USR-0015",
  "email": "novo.staff@lobito.gov",
  "fullName": "Nome Completo",
  "role": "staff", "status": "active",
  "companyId": null,
  "createdAt": "2026-05-13T10:00:00.000Z"
}
```

**Erro:** `409 — "Email já registado"`

### PUT /users/:id
**Role:** `admin`

```typescript
await api.put(`/users/${id}`, { fullName: 'Nome Actualizado', companyId: 'uuid' });
```

### PUT /users/:id/block
**Role:** `state`

```typescript
await api.put(`/users/${id}/block`, {
  reason: 'Conta bloqueada por actividade suspeita reportada pelo COMPLIANCE.',
});
```

**Response:** objecto do utilizador com `status: "blocked"`  
**Erros:** `400 — "Utilizador já está bloqueado"` · `403 — "Não pode bloquear a sua própria conta"`

### PUT /users/:id/unblock
**Role:** `state` · Sem body

```typescript
await api.put(`/users/${id}/unblock`);
```

### PUT /users/:id/role
**Role:** `admin`

```typescript
await api.put(`/users/${id}/role`, { role: 'specialist' });
```

**Erro:** `403 — "Não pode alterar o seu próprio role"`

---

## 6. Companies

### Estados da licença

```
pending → under_review → active
                       ↘ rejected
active  → suspended → rejected (revoke)
```

### GET /companies
**Roles:** `state` · `staff` · Paginação

### GET /companies/:id
**Roles:** qualquer autenticado

**Response:**
```json
{
  "id": "62e2d8cc-def8-4da6-b717-323081e96542",
  "cd": "EMP-0001",
  "name": "Lobito Trade Lda",
  "country": "angola",
  "contactEmail": "geral@lobito.ao",
  "contactPhone": "+244 923 000 001",
  "address": "Rua do Porto, 1, Lobito",
  "licenseStatus": "active",
  "licenseNumber": "LIC-2026-001",
  "licenseExpiresAt": "2028-12-31T23:59:59.000Z",
  "validationNotes": "Documentação completa.",
  "createdAt": "2026-05-07T19:37:12.000Z",
  "updatedAt": "2026-05-12T10:00:00.000Z"
}
```

### POST /companies
**Roles:** qualquer autenticado (requer JWT)

```typescript
await api.post('/companies', {
  name:         'Nova Empresa Lda',
  country:      'angola',
  contactEmail: 'geral@empresa.ao',
  contactPhone: '+244 923 000 001',
  address:      'Rua do Lobito, 42, Luanda',
});
```

**Response 201:** empresa com `licenseStatus: "pending"`

### PUT /companies/:id
**Roles:** qualquer autenticado  
Apenas campos de contacto — não altera `licenseStatus`, `country` nem campos regulatórios.

```typescript
await api.put(`/companies/${id}`, {
  name:         'Nome Actualizado',
  contactEmail: 'novo@empresa.ao',
  contactPhone: '+244 923 999 999',
  address:      'Nova Morada, 100',
});
```

### POST /companies/:id/validate-documentation
**Role:** `staff` · Apenas `pending`

```typescript
await api.post(`/companies/${id}/validate-documentation`, {
  valid: true,
  notes: 'Documentação completa e assinaturas válidas.',
});
// valid: false → mantém "pending" com notas de correcção
```

**Efeito:** `valid: true` → `under_review` · `valid: false` → mantém `pending`

### POST /companies/:id/forward-to-state
**Role:** `staff` · Apenas `under_review` · Sem body

```typescript
await api.post(`/companies/${id}/forward-to-state`);
```

### POST /companies/:id/approve-license
**Role:** `state`

```typescript
await api.post(`/companies/${id}/approve-license`, {
  licenseNumber:    'LIC-2026-010',
  licenseExpiresAt: '2028-12-31T23:59:59.000Z',
});
```

**Efeito:** `licenseStatus → active`

### POST /companies/:id/reject-license
**Role:** `state`

```typescript
await api.post(`/companies/${id}/reject-license`, {
  reason: 'Documentação de origem incompleta.',
});
```

### POST /companies/:id/suspend
**Role:** `state` · Apenas `active`

```typescript
await api.post(`/companies/${id}/suspend`, {
  reason: 'Incumprimento fiscal detectado em auditoria.',
});
```

### POST /companies/:id/revoke
**Role:** `state` · Aceita `active` ou `suspended`

```typescript
await api.post(`/companies/${id}/revoke`, {
  reason: 'Fraude documental confirmada. Licença revogada definitivamente.',
});
```

**Efeito:** `licenseStatus → rejected` (permanente)

---

## 7. Products

### Estados do produto

```
draft
  ↓ request-publication  (producer)
pending_review
  ↓ validate-technical   (staff) → staff_validated
  ↓ approve-publication  (state)
published_official
  ↓ suspend              (state)
suspended
```

### GET /products
**Roles:** qualquer autenticado · Paginação

```typescript
const { data } = await api.get<Paginated<Product>>('/products');
// Filtrar publicados para o BUYER:
const disponiveis = data.filter(p => p.status === 'published_official');
```

**Response (item):**
```json
{
  "id": "ddfbb2c1-6b11-4b84-98a1-9cb3c121e6d4",
  "cd": "PRD-0005",
  "name": "Tijolo Cerâmico Furado",
  "description": "Tijolo furado para construção civil",
  "category": "general",
  "status": "published_official",
  "publishedAt": "2026-05-07T19:37:15.000Z",
  "producer": { "id": "uuid", "fullName": "Product Producer" },
  "company":  { "id": "uuid", "name": "Lobito Trade Lda" }
}
```

### GET /products/my-products
**Role:** `producer`

```typescript
const produtos = await api.get<Product[]>('/products/my-products');
```

### GET /products/:id
**Roles:** qualquer autenticado

### POST /products
**Role:** `producer` · Empresa deve ter `licenseStatus: active`

```typescript
await api.post('/products', {
  name:        'Cimento Portland 50kg',
  description: 'Saco de cimento certificado',
  category:    'general',
  companyId:   'uuid-da-empresa',
});
```

**Response 201:** produto com `status: "draft"`  
**Erro:** `400 — "A empresa X não tem licença activa (estado: pending)"`

### PUT /products/:id
**Role:** `producer` · Apenas `status: draft`

```typescript
await api.put(`/products/${id}`, {
  name:        'Nome Corrigido',
  description: 'Descrição actualizada',
  category:    'materials',
});
```

### POST /products/:id/request-publication
**Role:** `producer` · Apenas `draft` · Sem body

```typescript
await api.post(`/products/${id}/request-publication`);
// draft → pending_review
```

### POST /products/:id/validate-technical
**Role:** `staff` · Apenas `pending_review`

```typescript
await api.post(`/products/${id}/validate-technical`, {
  valid: true,
  notes: 'Especificações técnicas completas e conformes.',
});
// valid: true  → staff_validated
// valid: false → mantém pending_review
```

### POST /products/:id/forward-product-to-state
**Role:** `staff` · Apenas `staff_validated` · Sem body

```typescript
await api.post(`/products/${id}/forward-product-to-state`);
// Regista audit log. Produto mantém staff_validated.
```

### POST /products/:id/approve-publication
**Role:** `state` · Aceita `pending_review` ou `staff_validated`

```typescript
await api.post(`/products/${id}/approve-publication`);
// → published_official
```

### POST /products/:id/reject-publication
**Role:** `state`

```typescript
await api.post(`/products/${id}/reject-publication`, {
  reason: 'Especificações técnicas insuficientes. Faltam normas ISO.',
});
```

### POST /products/:id/suspend
**Role:** `state` · Apenas `published_official`

```typescript
await api.post(`/products/${id}/suspend`, {
  reason: 'Produto suspenso por discrepância fiscal.',
});
```

### Labels do status para o frontend

```typescript
const PRODUCT_STATUS_LABEL: Record<string, string> = {
  draft:              'Rascunho',
  pending_review:     'Aguarda STAFF',
  staff_validated:    'Validado pelo STAFF',
  published_official: 'Publicado',
  rejected:           'Rejeitado',
  suspended:          'Suspenso',
};

const PRODUCT_STATUS_COLOR: Record<string, string> = {
  draft:              'gray',
  pending_review:     'yellow',
  staff_validated:    'blue',
  published_official: 'green',
  rejected:           'red',
  suspended:          'orange',
};
```

---

## 8. Price Proposals

> **Nota:** O BUYER nunca interage com Price Proposals. O sistema resolve o preço automaticamente ao criar pedidos.

### Estados

```
draft → submitted → approved  (snapshot imutável gerado)
                  → rejected  → draft (editável)
```

### GET /price-proposals
**Roles:** `state` · `specialist`

### GET /price-proposals/my-proposals
**Role:** `specialist`

### GET /price-proposals/:id
**Roles:** qualquer autenticado

**Response (aprovada):**
```json
{
  "id": "uuid", "cd": "PP-0005",
  "productId": "ddfbb2c1-6b11-4b84-98a1-9cb3c121e6d4",
  "status": "approved",
  "proposedPrice": "8.5000",
  "currency": "USD",
  "snapshot": {
    "snapshotVersion":  "1.0",
    "approvedPriceUsd": 8.5,
    "productName":      "Tijolo Cerâmico Furado",
    "productCategory":  "general",
    "validFrom":        "2026-01-01T00:00:00.000Z",
    "validTo":          "2026-12-31T23:59:59.000Z",
    "immutable":        true
  }
}
```

### POST /price-proposals
**Role:** `specialist`

```typescript
await api.post('/price-proposals', {
  productId:     'uuid-do-produto',
  proposedPrice: 150.00,
  currency:      'USD',
  justification: 'Análise de mercado Q2 2026',
  validFrom:     '2026-06-01T00:00:00.000Z',
  validTo:       '2026-12-31T23:59:59.000Z',
});
```

### PUT /price-proposals/:id
**Role:** `specialist` · Apenas `draft` ou `rejected`

```typescript
await api.put(`/price-proposals/${id}`, {
  proposedPrice: 155.00,
  justification: 'Revisão após levantamento de custos.',
});
```

**Erro:** `403 — "Price proposal aprovada é imutável"` ao tentar editar `approved`

### POST /price-proposals/:id/submit
**Role:** `specialist` · Sem body → `submitted`

### POST /price-proposals/:id/approve
**Role:** `state` · Sem body → `approved` + snapshot gerado

### POST /price-proposals/:id/reject
**Role:** `state`

```typescript
await api.post(`/price-proposals/${id}/reject`, {
  reason: 'Preço acima do referencial de mercado.',
});
```

---

## 9. Taxes

### GET /taxes
**Roles:** qualquer autenticado

**Response (item):**
```json
{
  "id": "c23be1fa-1ab5-4617-a619-e530fc30aa0b",
  "cd": "TAX-0001",
  "name": "IVA Angola",
  "category": "general",
  "country": "angola",
  "rate": "0.14",
  "effectiveFrom": "2024-01-01T00:00:00.000Z",
  "effectiveTo": null,
  "isActive": true
}
```

> `rate` é string — converter: `Number("0.14") * 100 = 14` para exibir como `"14%"`

### GET /taxes/:id
**Roles:** qualquer autenticado

### GET /taxes/country/:code
**Roles:** qualquer autenticado · Retorna apenas `isActive: true`

```typescript
const taxas = await api.get<Tax[]>('/taxes/country/angola');
```

### POST /taxes
**Role:** `state`

```typescript
await api.post('/taxes', {
  name:          'IVA Moçambique',
  category:      'general',
  country:       'mozambique',
  rate:          0.17,
  effectiveFrom: '2026-01-01T00:00:00.000Z',
  effectiveTo:   null,
  isActive:      true,
});
// country: "all" cria regra global de fallback
```

### PUT /taxes/:id
**Role:** `state` · Todos os campos opcionais

```typescript
await api.put(`/taxes/${id}`, { rate: 0.15, isActive: true });
```

---

## 10. Orders

> ⚠️ **`companyId` e `priceProposalId` NÃO vão no body.**  
> `companyId` vem do JWT automaticamente.  
> `priceProposalId` é resolvido pelo sistema (price proposal aprovada + vigente).

### Fluxo do BUYER

```typescript
// 1. Ver produtos disponíveis
const { data: produtos } = await api.get('/products');
const disponiveis = produtos.filter(p => p.status === 'published_official');

// 2. Criar pedido — só productId + qty
const pedido = await api.post('/orders', {
  lines: [
    { productId: 'uuid-produto-A', qty: 4 },
    { productId: 'uuid-produto-B', qty: 2 },
  ],
});
// pedido.lines[0].unitPrice já está preenchido do snapshot

// 3. (Opcional) Editar antes de pagar
await api.put(`/orders/${pedido.id}`, {
  lines: [{ productId: 'uuid-produto-A', qty: 6 }],
});

// 4. Pagar
const pago = await api.post(`/orders/${pedido.id}/pay`);
// pago.netAmount, pago.taxAmount, pago.totalAmount

// 5. Rastrear embarque
const embarque = await api.get(`/shipments/order/${pedido.id}`);
```

### GET /orders
**Roles:** `state` · `staff` · `specialist` · Paginação

### GET /orders/my-orders
**Role:** `buyer` · Paginação

### GET /orders/:id
**Roles:** qualquer autenticado  
BUYER restrito aos seus próprios pedidos → `403` se tentar ver pedido alheio

**Response:**
```json
{
  "id": "2e1a0e71-ed37-4c8d-bfd4-39993ef69062",
  "cd": "ORD-0017",
  "status": "draft",
  "buyerId":    "6bbea384-7d77-4863-b6e0-c2015eab5964",
  "companyId":  "8dfca0be-5b78-437b-b5a2-12d2d948c741",
  "netAmount":  null,
  "taxAmount":  null,
  "totalAmount": null,
  "currency": "USD",
  "paidAt": null,
  "buyer":   { "id": "uuid", "fullName": "Buyer Corp" },
  "company": { "id": "uuid", "name": "Nova Empresa Teste WF1", "country": "zambia" },
  "lines": [{
    "id": "uuid", "cd": "OL-0011",
    "productId":       "ddfbb2c1-6b11-4b84-98a1-9cb3c121e6d4",
    "priceProposalId": "497be304-a32e-4dea-94dc-85a3d79b5567",
    "qty": 4,
    "unitPrice": "8.5",
    "taxRate":   null,
    "taxAmount": null,
    "lineTotal": null,
    "product": { "id": "uuid", "name": "Tijolo Cerâmico Furado", "category": "general" }
  }]
}
```

> `unitPrice` já está preenchido no `draft`. `taxRate`, `taxAmount`, `lineTotal` só são preenchidos no `pay()`.

### POST /orders
**Role:** `buyer` · Empresa deve ter `licenseStatus: active`

```typescript
const pedido = await api.post('/orders', {
  lines: [
    { productId: 'ddfbb2c1-6b11-4b84-98a1-9cb3c121e6d4', qty: 4 },
  ],
});
```

**Erros:**
```json
{ "statusCode": 400, "message": "A sua conta não está associada a nenhuma empresa" }
{ "statusCode": 400, "message": "A empresa X não tem licença activa (estado: pending)" }
{ "statusCode": 404, "message": "Produto com ID X não encontrado" }
{ "statusCode": 400, "message": "O produto X não está disponível (estado: draft)" }
{ "statusCode": 400, "message": "O produto X não tem proposta de preço aprovada e vigente" }
```

### PUT /orders/:id
**Role:** `buyer` · Apenas `draft` · Pertence ao buyer autenticado

```typescript
await api.put(`/orders/${id}`, {
  lines: [{ productId: 'uuid', qty: 2 }],
});
```

### POST /orders/:id/pay
**Role:** `buyer` · Apenas `draft`

```typescript
const pago = await api.post(`/orders/${id}/pay`);
```

**Response 200:**
```json
{
  "id": "uuid", "cd": "ORD-0018",
  "status":      "paid",
  "netAmount":   "42.5",
  "taxAmount":   "6.8",
  "totalAmount": "49.3",
  "currency":    "USD",
  "paidAt":      "2026-05-13T10:00:00.000Z"
}
```

> Transação criada automaticamente ao pagar.  
> Taxa calculada pelo país da empresa: Angola=14%, Zâmbia=16%, RDC=16%

### POST /orders/:id/block
**Role:** `state`

```typescript
await api.post(`/orders/${id}/block`, {
  reason: 'Pedido bloqueado por suspeita de fraude.',
});
```

### POST /orders/:id/cancel
**Role:** `state` · Não cancela pedidos `paid`

### POST /orders/:id/escalate-to-state
**Role:** `staff` · Sem body  
Regista audit log — não muda o status do pedido.

```typescript
await api.post(`/orders/${id}/escalate-to-state`);
// Response inclui "message": "Pedido escalado ao STATE..."
```

---

## 11. Transactions

> Criadas automaticamente ao pagar um pedido. O BUYER não interage directamente.

### GET /transactions
**Roles:** `state` · `staff` · `specialist` · `compliance` · Paginação

**Response (item):**
```json
{
  "id":           "uuid",
  "cd":           "TRX-0008",
  "orderId":      "uuid",
  "amount":       "49.3",
  "currency":     "USD",
  "method":       "bank_transfer",
  "status":       "completed",
  "paidAt":       "2026-05-13T10:00:00.000Z",
  "blockedAt":    null,
  "blockedReason": null,
  "cancelledAt":  null,
  "order": { "id": "uuid", "cd": "ORD-0018", "buyerId": "uuid" }
}
```

### GET /transactions/summary
**Roles:** `state` · `staff` · `specialist` · `compliance`

```typescript
const resumo = await api.get('/transactions/summary');
```

**Response:**
```json
{
  "counts":  { "completed": 8, "blocked": 0, "cancelled": 0, "pending": 0 },
  "amounts": { "completed": "877.45" }
}
```

### GET /transactions/:id
**Roles:** `state` · `staff` · `specialist` · `compliance`

### POST /transactions/:id/block
**Role:** `state`

```typescript
await api.post(`/transactions/${id}/block`, {
  reason: 'Valores inconsistentes com declaração fiscal.',
});
```

### POST /transactions/:id/cancel
**Role:** `state`

```typescript
await api.post(`/transactions/${id}/cancel`, {
  reason: 'Cancelamento a pedido formal.',
});
```

---

## 12. Shipments

### Estados

```
created → in_transit → at_border → customs_approved → delivered
                                 → customs_rejected
                                 → held
```

### GET /shipments
**Roles:** `state` · `staff` · `customs` · Paginação  
Query opcional: `?status=at_border`

```typescript
// CUSTOMS ver embarques pendentes de validação
const { data } = await api.get('/shipments?status=at_border');
```

### GET /shipments/my-shipments
**Role:** `operator` · Paginação

```typescript
const { data } = await api.get('/shipments/my-shipments');
```

**Response (item):**
```json
{
  "id": "9e42efa3-7ce8-40be-9d0d-c33ecf7acd4f",
  "cd": "SHP-0004",
  "orderId": "uuid",
  "operatorId": "uuid",
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
      "notes":     "Carga embarcada."
    },
    {
      "timestamp": "2026-05-12T14:00:00.000Z",
      "location":  "Fronteira Luau",
      "status":    "at_border",
      "updatedBy": "uuid-operator",
      "notes":     "Aguarda inspecção aduaneira."
    }
  ],
  "customsDispatch": {
    "status":      "approved",
    "notes":       "Documentação verificada.",
    "validatedAt": "2026-05-12T16:00:00.000Z"
  },
  "order": { "id": "uuid", "cd": "ORD-0012", "status": "paid" }
}
```

### GET /shipments/order/:orderId
**Roles:** `state` · `staff` · `buyer` · `operator` · `customs` · `compliance`

**Caso de uso principal — BUYER rastreia o seu embarque:**

```typescript
const embarque = await api.get(`/shipments/order/${pedido.id}`);
console.log(embarque.status);         // "customs_approved"
console.log(embarque.lastLocation);   // "Fronteira Luau"
console.log(embarque.trackingEvents); // array de eventos
```

**Erros:**
```json
{ "statusCode": 403, "message": "Acesso negado — este pedido não lhe pertence" }
{ "statusCode": 404, "message": "Este pedido ainda não tem embarque associado" }
```

### GET /shipments/:id
**Roles:** `state` · `staff` · `customs` · `operator` · `compliance`

### POST /shipments
**Role:** `operator` · Pedido deve ter `status: paid` · Um pedido = um embarque

```typescript
await api.post('/shipments', {
  orderId:     'uuid-do-pedido',
  origin:      'Luanda, Angola',
  destination: 'Lusaka, Zambia',
  eta:         '2026-07-01T00:00:00.000Z',
});
```

**Erros:**
```json
{ "statusCode": 400, "message": "Apenas pedidos pagos podem ter embarques criados (estado actual: draft)" }
{ "statusCode": 400, "message": "Este pedido já tem um embarque associado" }
```

### PUT /shipments/:id/tracking
**Role:** `operator` · Apenas o operador do embarque · **Eventos acumulam — nunca se apagam**

```typescript
await api.put(`/shipments/${id}/tracking`, {
  location: 'Fronteira Luau',
  status:   'at_border',
  notes:    'Aguarda inspecção aduaneira.',
});
```

### POST /shipments/:id/approve
**Role:** `customs`

```typescript
await api.post(`/shipments/${id}/approve`, {
  notes: 'Documentação verificada. Mercadoria conforme.',
});
// customsDispatch.status → "approved"
// shipment.status → "customs_approved"
```

### POST /shipments/:id/reject
**Role:** `customs`

```typescript
await api.post(`/shipments/${id}/reject`, {
  reason: 'Fatura de origem não corresponde ao manifesto.',
});
```

### POST /shipments/:id/hold
**Roles:** `customs` · `state`

```typescript
await api.post(`/shipments/${id}/hold`, {
  reason: 'Retido para inspecção especial — mercadoria suspeita.',
});
```

---

## 13. Reports

### Estados

```
draft → submitted → published
                  → draft (rejeitado, volta para edição)
```

### GET /reports
**Roles:** `state` · `staff` · `specialist` · `analyst` · `compliance` · Paginação

### GET /reports/my-reports
**Roles:** `analyst` · `specialist` · `compliance`

### GET /reports/:id
**Roles:** `state` · `staff` · `specialist` · `analyst` · `compliance`

### POST /reports
**Roles:** `analyst` · `specialist` · `compliance`

```typescript
await api.post('/reports', {
  title:          'Relatório Operacional Q2 2026',
  type:           'operational',
  period:         'Q2 2026',
  targetAudience: 'government',
  content:        { summary: '...', findings: [], kpis: {} },
});
```

### PUT /reports/:id
**Roles:** `analyst` · `specialist` · `compliance` · Apenas `draft`

### POST /reports/:id/submit
**Roles:** `analyst` · `specialist` · `compliance` · Apenas o autor

### POST /reports/:id/publish
**Role:** `state` → `published`

### POST /reports/:id/reject
**Role:** `state` → `draft`

```typescript
await api.post(`/reports/${id}/reject`, {
  reason: 'Dados do Q1 incorrectos. Rever secção 2.',
});
```

---

## 14. Audit Logs

> Append-only. Sem POST/PUT/DELETE.

### GET /logs
**Roles:** `state` · `compliance`  
Query params opcionais: `entity`, `entityId`, `action`

```typescript
// Todos os logs de pedidos
const logs = await api.get('/logs?entity=order');

// Filtrar por acção
const pagamentos = await api.get('/logs?action=PAY_ORDER');

// Pedido específico
const trail = await api.get(`/logs?entity=order&entityId=${orderId}`);
```

**Response (item):**
```json
{
  "id":         "uuid",
  "cd":         "LOG-0042",
  "userId":     "uuid",
  "role":       "state",
  "action":     "APPROVE_LICENSE",
  "entity":     "company",
  "entityId":   "uuid",
  "beforeJson": "{\"licenseStatus\":\"under_review\"}",
  "afterJson":  "{\"licenseStatus\":\"active\"}",
  "meta":       null,
  "createdAt":  "2026-05-13T10:00:00.000Z"
}
```

```typescript
// Parse no frontend
const before = log.beforeJson ? JSON.parse(log.beforeJson) : null;
const after  = log.afterJson  ? JSON.parse(log.afterJson)  : null;
```

### GET /logs/suspicious-activities
**Roles:** `state` · `compliance` · Sem params

```typescript
const suspeitas = await api.get('/logs/suspicious-activities');
```

Retorna últimos 200 eventos de: `BLOCK_ORDER · CANCEL_ORDER · BLOCK_TRANSACTION · SUSPEND_COMPANY · REVOKE_COMPANY · REJECT_LICENSE · HOLD_SHIPMENT · CUSTOMS_REJECT · VALIDATE_DOCS_FAIL`

### GET /logs/:id
**Roles:** `state` · `compliance`

---

## 15. Dashboard & Analytics

> Dados em tempo real. Sem body, sem params.

### GET /dashboard
**Roles:** `state` · `staff` · `analyst` · `compliance`

```typescript
const overview = await api.get('/dashboard');
```

**Response:**
```json
{
  "companies":    { "active": 7, "pending": 2 },
  "products":     { "published_official": 6, "staff_validated": 1 },
  "orders":       { "draft": 3, "paid": 8 },
  "transactions": { "completed": 8 },
  "shipments":    { "customs_approved": 5 },
  "auditLogs":    { "total": 100 },
  "revenue":      { "totalCompleted": 877.45, "completedCount": 8, "currency": "USD" }
}
```

### GET /dashboard/metrics
**Roles:** `state` · `staff` · `analyst` · `compliance`

KPIs com janelas de 7 e 30 dias.

### GET /analytics/revenue
**Roles:** `state` · `staff` · `specialist` · `analyst`

```typescript
const receita = await api.get('/analytics/revenue');
// receita.allTime.total, receita.byCountry, receita.topProducts, receita.monthly
```

### GET /analytics/logistics-performance
**Roles:** `state` · `staff` · `analyst` · `compliance`

### GET /analytics/compliance-score
**Roles:** `state` · `compliance` · `analyst`

```typescript
const score = await api.get('/analytics/compliance-score');
```

**Response:**
```json
{
  "overallScore": 88,
  "riskLevel":    "MEDIUM",
  "scores": {
    "companies":    { "score": 100, "suspended": 0, "total": 9 },
    "orders":       { "score": 85,  "blocked": 2, "total": 11 },
    "transactions": { "score": 100, "blocked": 0, "total": 8 },
    "shipments":    { "score": 100, "held": 0, "total": 6 }
  },
  "auditActivity": { "last30Days": 100, "blockedActions30d": 4, "alertRate": "4%" }
}
```

> `riskLevel`: `LOW` (≥90) · `MEDIUM` (75–89) · `HIGH` (60–74) · `CRITICAL` (<60)

---

## 16. Enums

```typescript
type Role = 'admin' | 'state' | 'staff' | 'specialist' | 'analyst'
          | 'compliance' | 'customs' | 'producer' | 'buyer' | 'operator' | 'company';

type LicenseStatus = 'pending' | 'under_review' | 'active' | 'rejected' | 'suspended';

type ProductStatus = 'draft' | 'pending_review' | 'staff_validated'
                   | 'published_official' | 'suspended' | 'rejected';

type PriceProposalStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

type OrderStatus = 'draft' | 'confirmed' | 'paid' | 'blocked' | 'cancelled';

type TransactionStatus = 'pending' | 'completed' | 'blocked' | 'cancelled' | 'refunded';

type ShipmentStatus = 'created' | 'in_transit' | 'at_border'
                    | 'customs_approved' | 'customs_rejected' | 'held' | 'delivered';

type ReportStatus = 'draft' | 'submitted' | 'published';

type ReportType = 'operational' | 'fiscal' | 'strategic' | 'compliance';

type TargetAudience = 'public' | 'government' | 'internal';

type CompanyCountry = 'angola' | 'zambia' | 'drc' | 'tanzania' | 'zimbabwe' | 'mozambique';

type PaymentMethod = 'bank_transfer' | 'cash' | 'credit_card' | 'letter_of_credit' | 'other';
```

---

## 17. Matriz RBAC

| Endpoint | admin | state | staff | spec | analyst | comp | producer | buyer | operator | customs |
|----------|:-----:|:-----:|:-----:|:----:|:-------:|:----:|:--------:|:-----:|:--------:|:-------:|
| POST /auth/register | — | — | — | — | — | — | — | — | — | — |
| GET/POST /users | ✅ | ✅ | ✅ | — | — | — | — | — | — | — |
| PUT /users/:id | ✅ | — | — | — | — | — | — | — | — | — |
| PUT /users/:id/block | — | ✅ | — | — | — | — | — | — | — | — |
| PUT /users/:id/role | ✅ | — | — | — | — | — | — | — | — | — |
| POST /companies | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /companies | — | ✅ | ✅ | — | — | — | — | — | — | — |
| POST /companies/:id/validate-documentation | — | — | ✅ | — | — | — | — | — | — | — |
| POST /companies/:id/approve-license | — | ✅ | — | — | — | — | — | — | — | — |
| POST /companies/:id/revoke | — | ✅ | — | — | — | — | — | — | — | — |
| POST /products | — | — | — | — | — | — | ✅ | — | — | — |
| POST /products/:id/validate-technical | — | — | ✅ | — | — | — | — | — | — | — |
| POST /products/:id/approve-publication | — | ✅ | — | — | — | — | — | — | — | — |
| POST /price-proposals | — | — | — | ✅ | — | — | — | — | — | — |
| POST /price-proposals/:id/approve | — | ✅ | — | — | — | — | — | — | — | — |
| POST /taxes | — | ✅ | — | — | — | — | — | — | — | — |
| PUT /taxes/:id | — | ✅ | — | — | — | — | — | — | — | — |
| POST /orders | — | — | — | — | — | — | — | ✅ | — | — |
| PUT /orders/:id | — | — | — | — | — | — | — | ✅ | — | — |
| POST /orders/:id/pay | — | — | — | — | — | — | — | ✅ | — | — |
| POST /orders/:id/block | — | ✅ | — | — | — | — | — | — | — | — |
| POST /orders/:id/escalate-to-state | — | — | ✅ | — | — | — | — | — | — | — |
| GET /transactions | — | ✅ | ✅ | ✅ | — | — | — | — | — | ✅ |
| GET /transactions/summary | — | ✅ | ✅ | ✅ | — | — | — | — | — | ✅ |
| POST /transactions/:id/block | — | ✅ | — | — | — | — | — | — | — | — |
| POST /shipments | — | — | — | — | — | — | — | — | ✅ | — |
| GET /shipments | — | ✅ | ✅ | — | — | — | — | — | — | ✅ |
| GET /shipments/my-shipments | — | — | — | — | — | — | — | — | ✅ | — |
| GET /shipments/order/:id | — | ✅ | ✅ | — | — | — | — | ✅ | ✅ | ✅ |
| POST /shipments/:id/approve | — | — | — | — | — | — | — | — | — | ✅ |
| POST /shipments/:id/hold | — | ✅ | — | — | — | — | — | — | — | ✅ |
| GET /logs | — | ✅ | — | — | — | ✅ | — | — | — | — |
| GET /logs/suspicious-activities | — | ✅ | — | — | — | ✅ | — | — | — | — |
| POST /reports | — | — | — | ✅ | ✅ | ✅ | — | — | — | — |
| POST /reports/:id/publish | — | ✅ | — | — | — | — | — | — | — | — |
| GET /dashboard | — | ✅ | ✅ | — | ✅ | ✅ | — | — | — | — |

---

## 18. Fluxo End-to-End

### A — Registo externo + licenciamento

```typescript
// 1. Empresa regista-se
const reg = await api.post('/auth/register', { email, password, fullName, role: 'buyer', companyName, companyCountry, companyEmail });
// empresa em "pending"

// 2. STAFF valida documentação
await api.post(`/companies/${reg.company.id}/validate-documentation`, { valid: true, notes: '...' });

// 3. STATE aprova licença
await api.post(`/companies/${reg.company.id}/approve-license`, { licenseNumber: 'LIC-2026-001', licenseExpiresAt: '2028-12-31T23:59:59.000Z' });
// empresa em "active" — utilizador pode agora criar pedidos
```

### B — Produto com STAFF

```typescript
// 4. PRODUCER cria produto
const prod = await api.post('/products', { name, description, category, companyId });

// 5. PRODUCER solicita publicação
await api.post(`/products/${prod.id}/request-publication`);

// 6. STAFF valida tecnicamente
await api.post(`/products/${prod.id}/validate-technical`, { valid: true, notes: '...' });

// 7. STATE publica
await api.post(`/products/${prod.id}/approve-publication`);
// status: published_official
```

### C — Price proposal

```typescript
// 8. SPECIALIST cria e submete
const pp = await api.post('/price-proposals', { productId: prod.id, proposedPrice: 150, currency: 'USD', validFrom: '2026-01-01T00:00:00.000Z' });
await api.post(`/price-proposals/${pp.id}/submit`);

// 9. STATE aprova — snapshot imutável gerado
await api.post(`/price-proposals/${pp.id}/approve`);
```

### D — Pedido, pagamento e embarque (perspectiva BUYER)

```typescript
// 10. BUYER cria pedido
const pedido = await api.post('/orders', {
  lines: [{ productId: prod.id, qty: 5 }],
});
// pedido.lines[0].unitPrice = 150 (do snapshot)

// 11. BUYER paga
const pago = await api.post(`/orders/${pedido.id}/pay`);
// net=750 tax=120 total=870 (IVA 16% Zâmbia)
// TRX criada automaticamente

// 12. OPERATOR cria embarque
const ship = await api.post('/shipments', { orderId: pedido.id, origin: 'Luanda, Angola', destination: 'Lusaka, Zambia' });

// 13. OPERATOR actualiza tracking
await api.put(`/shipments/${ship.id}/tracking`, { location: 'Fronteira Luau', status: 'at_border', notes: '...' });

// 14. BUYER rastreia
const estado = await api.get(`/shipments/order/${pedido.id}`);
console.log(estado.status); // "at_border"

// 15. CUSTOMS aprova
await api.post(`/shipments/${ship.id}/approve`, { notes: 'Documentação validada.' });

// 16. BUYER confirma entrega
const final = await api.get(`/shipments/order/${pedido.id}`);
console.log(final.status); // "customs_approved"
```

---

*Corredor do Lobito · Frontend Production Guide v1.0 · 2026-05-13*  
*Testado em produção: 82/82 endpoints ✅*  
*Railway: `https://corredordolobitobackend-production.up.railway.app`*
