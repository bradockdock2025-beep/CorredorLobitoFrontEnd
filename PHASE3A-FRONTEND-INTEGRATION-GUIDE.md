# Corredor do Lobito — API Integration Guide
## Fase 3A · Dashboard & Analytics
> **Versão:** 3.0 · **Data:** 2026-05-11  
> **Base URL (dev):** `http://localhost:3000`  
> **Base URL (prod):** `https://api.corredor-lobito.gov`  
> **Autenticação:** Bearer JWT em todos os endpoints

---

## Índice

1. [Autenticação](#1-autenticação)
2. [Visão Geral dos Endpoints](#2-visão-geral-dos-endpoints)
3. [GET /dashboard](#3-get-dashboard)
4. [GET /dashboard/metrics](#4-get-dashboardmetrics)
5. [GET /analytics/revenue](#5-get-analyticsrevenue)
6. [GET /analytics/logistics-performance](#6-get-analyticslogistics-performance)
7. [GET /analytics/compliance-score](#7-get-analyticscompliance-score)
8. [Controlo de Acesso](#8-controlo-de-acesso)
9. [Erros](#9-erros)
10. [Tipos e Enums de Referência](#10-tipos-e-enums-de-referência)

---

## 1. Autenticação

Todos os endpoints da Fase 3A requerem JWT no header HTTP:

```
Authorization: Bearer <access_token>
```

O token é obtido via `POST /auth/login`:

**Request:**
```json
{
  "email":    "state@lobito.gov",
  "password": "Lobito@Dev2024!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id":       "41bafc86-f90b-4fad-a8c3-3bc6cda15ded",
    "email":    "state@lobito.gov",
    "role":     "state",
    "fullName": "State Authority"
  }
}
```

**Contas de desenvolvimento:**

| Email | Role | Password |
|-------|------|----------|
| `state@lobito.gov` | state | `Lobito@Dev2024!` |
| `staff@lobito.gov` | staff | `Lobito@Dev2024!` |
| `specialist@lobito.gov` | specialist | `Lobito@Dev2024!` |
| `analyst@lobito.gov` | analyst | `Lobito@Dev2024!` |
| `compliance@lobito.gov` | compliance | `Lobito@Dev2024!` |

---

## 2. Visão Geral dos Endpoints

| Método | Endpoint | Roles com Acesso | Descrição |
|--------|----------|-----------------|-----------|
| `GET` | `/dashboard` | state, staff, analyst, compliance | Overview de todas as entidades |
| `GET` | `/dashboard/metrics` | state, staff, analyst, compliance | KPIs detalhados com janelas 7d / 30d |
| `GET` | `/analytics/revenue` | state, staff, specialist, analyst | Receita por país, produto e mês |
| `GET` | `/analytics/logistics-performance` | state, staff, analyst, compliance | Embarques, alfândega e rotas |
| `GET` | `/analytics/compliance-score` | state, compliance, analyst | Score de risco 0–100 |

- Nenhum endpoint aceita **query params** nem **request body**
- Todos retornam `Content-Type: application/json`
- Dados calculados em **tempo real** — sem cache no servidor

---

## 3. GET /dashboard

**Propósito:** Vista panorâmica instantânea do estado de todas as entidades do ecossistema.

**Roles:** `state` · `staff` · `analyst` · `compliance`

**Request:** sem body, sem params.

**Response:**

```json
{
  "companies": {
    "active":       6,
    "pending":      0,
    "under_review": 0,
    "rejected":     0,
    "suspended":    0
  },
  "products": {
    "published_official": 5,
    "draft":              0,
    "pending_review":     0,
    "suspended":          0,
    "rejected":           0
  },
  "orders": {
    "paid":      4,
    "draft":     1,
    "confirmed": 0,
    "blocked":   0,
    "cancelled": 0
  },
  "transactions": {
    "completed": 1,
    "pending":   0,
    "blocked":   0,
    "cancelled": 0,
    "refunded":  0
  },
  "shipments": {
    "customs_approved":  3,
    "created":           0,
    "in_transit":        0,
    "at_border":         0,
    "customs_rejected":  0,
    "held":              0,
    "delivered":         0
  },
  "reports": {
    "draft":     0,
    "submitted": 0,
    "published": 0
  },
  "auditLogs": {
    "total": 42
  },
  "revenue": {
    "totalCompleted": 513,
    "completedCount": 1,
    "currency":       "USD"
  }
}
```

**Estrutura dos campos:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `companies` | `Record<LicenseStatus, number>` | Contagem de empresas por estado de licença |
| `products` | `Record<ProductStatus, number>` | Contagem de produtos por estado |
| `orders` | `Record<OrderStatus, number>` | Contagem de pedidos por estado |
| `transactions` | `Record<TransactionStatus, number>` | Contagem de transacções por estado |
| `shipments` | `Record<ShipmentStatus, number>` | Contagem de embarques por estado |
| `reports` | `Record<ReportStatus, number>` | Contagem de relatórios por estado |
| `auditLogs.total` | `number` | Total de registos no audit log |
| `revenue.totalCompleted` | `number` | Soma de `amount` das transacções `completed` |
| `revenue.completedCount` | `number` | Número de transacções `completed` |
| `revenue.currency` | `string` | Sempre `"USD"` |

> **Atenção:** Estados sem registos podem não aparecer na resposta. Tratar ausência como `0`.

---

## 4. GET /dashboard/metrics

**Propósito:** KPIs operacionais detalhados com taxas de performance e volume dos últimos 7 e 30 dias.

**Roles:** `state` · `staff` · `analyst` · `compliance`

**Request:** sem body, sem params.

**Response:**

```json
{
  "generatedAt": "2026-05-10T23:03:52.376Z",
  "periods": {
    "last7Days":  "2026-05-03T23:03:52.376Z",
    "last30Days": "2026-04-10T23:03:52.376Z"
  },
  "companies": {
    "total":        6,
    "active":       6,
    "pending":      0,
    "approvalRate": "100%"
  },
  "products": {
    "total":       5,
    "published":   5,
    "publishRate": "100%"
  },
  "orders": {
    "total":      5,
    "paid":       4,
    "blocked":    0,
    "last30Days": 5
  },
  "transactions": {
    "total":      1,
    "blocked":    0,
    "last30Days": 1
  },
  "shipments": {
    "total":        3,
    "approved":     3,
    "held":         0,
    "approvalRate": "100%"
  },
  "revenue": {
    "allTime": {
      "total":   513,
      "average": 513,
      "max":     513,
      "min":     513,
      "count":   1
    },
    "last30Days": {
      "total": 513,
      "count": 1
    },
    "currency": "USD"
  },
  "auditActivity": {
    "last7Days": 42
  }
}
```

**Estrutura dos campos:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `generatedAt` | `string` ISO 8601 | Timestamp do momento do cálculo |
| `periods.last7Days` | `string` ISO 8601 | Data de início da janela de 7 dias |
| `periods.last30Days` | `string` ISO 8601 | Data de início da janela de 30 dias |
| `companies.approvalRate` | `string` ex: `"100%"` | `active / total × 100` |
| `products.publishRate` | `string` ex: `"80%"` | `published / total × 100` |
| `orders.last30Days` | `number` | Pedidos criados nos últimos 30 dias |
| `transactions.last30Days` | `number` | Transacções criadas nos últimos 30 dias |
| `shipments.approvalRate` | `string` | `customs_approved / total × 100` |
| `revenue.allTime.total` | `number` | Soma histórica de todas as transacções `completed` |
| `revenue.allTime.average` | `number` | Média por transacção |
| `revenue.allTime.max` | `number` | Transacção de maior valor |
| `revenue.allTime.min` | `number` | Transacção de menor valor |
| `revenue.last30Days.total` | `number` | Receita dos últimos 30 dias |
| `auditActivity.last7Days` | `number` | Entradas no audit log nos últimos 7 dias |

> **Atenção:** As taxas (`approvalRate`, `publishRate`) são strings com `%`. Para cálculos numéricos, fazer `parseInt("100%", 10)`.

---

## 5. GET /analytics/revenue

**Propósito:** Análise financeira — receita total, distribuída por país de origem das empresas, top 5 produtos por valor e evolução mensal dos últimos 90 dias.

**Roles:** `state` · `staff` · `specialist` · `analyst`

**Request:** sem body, sem params.

**Response:**

```json
{
  "currency": "USD",
  "allTime": {
    "total": 513,
    "count": 1
  },
  "byCountry": [
    { "country": "angola",     "total": 513, "count": 1 },
    { "country": "zambia",     "total": 0,   "count": 0 },
    { "country": "drc",        "total": 0,   "count": 0 },
    { "country": "tanzania",   "total": 0,   "count": 0 },
    { "country": "zimbabwe",   "total": 0,   "count": 0 },
    { "country": "mozambique", "total": 0,   "count": 0 }
  ],
  "topProducts": [
    { "name": "Tijolo Cerâmico Furado", "category": "general", "total": 969, "units": 100 },
    { "name": "Ferro Corrugado 12mm",   "category": "general", "total": 684, "units": 5   },
    { "name": "Cimento Portland 50kg",  "category": "general", "total": 513, "units": 10  }
  ],
  "monthly": [
    { "month": "2026-03", "total": 0,   "count": 0 },
    { "month": "2026-04", "total": 0,   "count": 0 },
    { "month": "2026-05", "total": 513, "count": 1 }
  ]
}
```

**Estrutura dos campos:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `currency` | `string` | Sempre `"USD"` |
| `allTime.total` | `number` | Soma total de todas as transacções `completed` |
| `allTime.count` | `number` | Número total de transacções `completed` |
| `byCountry[].country` | `string` | País da empresa compradora (`angola`, `zambia`, etc.) |
| `byCountry[].total` | `number` | Receita total desse país |
| `byCountry[].count` | `number` | Número de transacções desse país |
| `topProducts[].name` | `string` | Nome do produto |
| `topProducts[].category` | `string` | Categoria do produto |
| `topProducts[].total` | `number` | Valor total das linhas de pedido desse produto (em pedidos `paid`) |
| `topProducts[].units` | `number` | Total de unidades vendidas |
| `monthly[].month` | `string` | Formato `"YYYY-MM"` ex: `"2026-05"` |
| `monthly[].total` | `number` | Receita do mês |
| `monthly[].count` | `number` | Número de transacções do mês |

> **Atenção:**
> - `byCountry` retorna apenas países com transacções. Países com `total: 0` podem não aparecer.
> - `topProducts` retorna no máximo **5 produtos**, ordenados por `total` decrescente.
> - `monthly` cobre os **últimos 90 dias**, agrupado por mês. Meses sem actividade não aparecem.
> - Os valores são `number`, não string — não necessitam de parsing.

---

## 6. GET /analytics/logistics-performance

**Propósito:** Performance da cadeia logística — distribuição de embarques por estado, eficiência da alfândega e top 5 rotas por volume.

**Roles:** `state` · `staff` · `analyst` · `compliance`

**Request:** sem body, sem params.

**Response:**

```json
{
  "shipments": {
    "total": 3,
    "byStatus": {
      "created":          0,
      "in_transit":       0,
      "at_border":        0,
      "customs_approved": 3,
      "customs_rejected": 0,
      "held":             0,
      "delivered":        0
    },
    "approvalRate": "100%"
  },
  "customs": {
    "total":        3,
    "approved":     3,
    "rejected":     0,
    "held":         0,
    "pending":      0,
    "approvalRate": "100%"
  },
  "topRoutes": [
    { "route": "Porto do Lobito, Angola → Lusaka, Zambia",  "count": 2 },
    { "route": "Porto do Lobito, Angola → Lusaka, Zâmbia",  "count": 1 }
  ]
}
```

**Estrutura dos campos:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `shipments.total` | `number` | Total de embarques no sistema |
| `shipments.byStatus` | `Record<ShipmentStatus, number>` | Contagem por cada estado do ciclo logístico |
| `shipments.approvalRate` | `string` | `customs_approved / total × 100` |
| `customs.total` | `number` | Total de despachos aduaneiros registados |
| `customs.approved` | `number` | Despachos com status `approved` |
| `customs.rejected` | `number` | Despachos com status `rejected` |
| `customs.held` | `number` | Despachos com status `held` (retidos) |
| `customs.pending` | `number` | Despachos com status `pending` (aguardam validação) |
| `customs.approvalRate` | `string` | `approved / total × 100` sobre `customs_dispatches` |
| `topRoutes[].route` | `string` | Texto livre: `"<origin> → <destination>"` |
| `topRoutes[].count` | `number` | Número de embarques nessa rota |

> **Atenção:**
> - `shipments.byStatus` retorna apenas estados com embarques. Estados com `0` podem não aparecer — tratar ausência como `0`.
> - `shipments.approvalRate` é calculado sobre a tabela `shipments`. `customs.approvalRate` é calculado sobre a tabela `customs_dispatches` — podem diferir.
> - `topRoutes` retorna no máximo **5 rotas**. O campo `route` é concatenação directa dos campos `origin` e `destination` da BD — pode ter variações de texto para a mesma rota geográfica.

---

## 7. GET /analytics/compliance-score

**Propósito:** Score de conformidade do ecossistema (0–100) com classificação de risco e detalhe por domínio operacional.

**Roles:** `state` · `compliance` · `analyst`

**Request:** sem body, sem params.

**Response:**

```json
{
  "generatedAt":  "2026-05-10T23:04:03.625Z",
  "overallScore": 100,
  "riskLevel":    "LOW",
  "scores": {
    "companies": {
      "score":     100,
      "suspended": 0,
      "total":     6
    },
    "orders": {
      "score":     100,
      "blocked":   0,
      "cancelled": 0,
      "total":     5
    },
    "transactions": {
      "score":   100,
      "blocked": 0,
      "total":   1
    },
    "shipments": {
      "score":    100,
      "held":     0,
      "rejected": 0,
      "total":    3
    }
  },
  "auditActivity": {
    "last30Days":        42,
    "blockedActions30d": 0,
    "alertRate":         "0%"
  }
}
```

**Estrutura dos campos:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `generatedAt` | `string` ISO 8601 | Timestamp do cálculo |
| `overallScore` | `number` 0–100 | Média dos 4 scores de domínio |
| `riskLevel` | `"LOW"` \| `"MEDIUM"` \| `"HIGH"` \| `"CRITICAL"` | Classificação do risco |
| `scores.companies.score` | `number` | `active / total × 100` |
| `scores.companies.suspended` | `number` | Empresas com `licenseStatus: suspended` |
| `scores.orders.score` | `number` | `(total - blocked - cancelled) / total × 100` |
| `scores.orders.blocked` | `number` | Pedidos com `status: blocked` |
| `scores.orders.cancelled` | `number` | Pedidos com `status: cancelled` |
| `scores.transactions.score` | `number` | `(total - blocked) / total × 100` |
| `scores.transactions.blocked` | `number` | Transacções com `status: blocked` |
| `scores.shipments.score` | `number` | `(total - held - rejected) / total × 100` |
| `scores.shipments.held` | `number` | Embarques com `status: held` |
| `scores.shipments.rejected` | `number` | Embarques com `status: customs_rejected` |
| `auditActivity.last30Days` | `number` | Total de eventos no audit log nos últimos 30 dias |
| `auditActivity.blockedActions30d` | `number` | Eventos de bloqueio nos últimos 30 dias |
| `auditActivity.alertRate` | `string` | `blockedActions30d / last30Days × 100` |

**Tabela de classificação de risco:**

| `overallScore` | `riskLevel` |
|:--------------:|:-----------:|
| 90 – 100 | `LOW` |
| 75 – 89 | `MEDIUM` |
| 60 – 74 | `HIGH` |
| 0 – 59 | `CRITICAL` |

> **Atenção:**
> - Se o sistema não tiver registos (total = 0), o score é `100` por omissão.
> - `alertRate` é string com `%`. `blockedActions30d` contabiliza: `BLOCK_ORDER`, `BLOCK_TRANSACTION`, `SUSPEND_COMPANY`, `HOLD_SHIPMENT`, `CUSTOMS_REJECT`.

---

## 8. Controlo de Acesso

**Resposta quando o role não tem acesso (HTTP 403):**

```json
{
  "statusCode": 403,
  "message":    "Acesso negado. Roles permitidos: state, compliance, analyst",
  "error":      "Forbidden"
}
```

**Matriz de acesso:**

| Endpoint | state | staff | specialist | analyst | compliance |
|----------|:-----:|:-----:|:----------:|:-------:|:----------:|
| `GET /dashboard` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `GET /dashboard/metrics` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `GET /analytics/revenue` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `GET /analytics/logistics-performance` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `GET /analytics/compliance-score` | ✅ | ❌ | ❌ | ✅ | ✅ |

---

## 9. Erros

| HTTP | Causa | Response Body |
|------|-------|---------------|
| `401` | Token ausente, inválido ou expirado | `{ "statusCode": 401, "message": "Token inválido ou expirado", "error": "Unauthorized" }` |
| `403` | Role sem permissão para o endpoint | `{ "statusCode": 403, "message": "Acesso negado. Roles permitidos: ...", "error": "Forbidden" }` |
| `500` | Erro interno do servidor | `{ "statusCode": 500, "message": "Internal server error" }` |

---

## 10. Tipos e Enums de Referência

Valores possíveis para os campos de status usados nas respostas:

```
LicenseStatus:     pending · under_review · active · rejected · suspended
ProductStatus:     draft · pending_review · published_official · suspended · rejected
OrderStatus:       draft · confirmed · paid · blocked · cancelled
TransactionStatus: pending · completed · blocked · cancelled · refunded
ShipmentStatus:    created · in_transit · at_border · customs_approved · customs_rejected · held · delivered
ReportStatus:      draft · submitted · published
RiskLevel:         LOW · MEDIUM · HIGH · CRITICAL
CompanyCountry:    angola · zambia · drc · tanzania · zimbabwe · mozambique
```

---

*Corredor do Lobito — API Integration Guide · Fase 3A · v3.0 · 2026-05-11*
