# Corredor do Lobito — Correcção de Formato de Resposta
> **Data:** 2026-05-14  
> **URL Produção:** `https://corredordolobitobackend-production.up.railway.app`  
> **Impacto:** Todos os endpoints de listagem agora retornam `{data, meta}` — uniformidade total  
> **Acção frontend:** Actualizar chamadas que acediam directamente ao array

---

## O que mudou

Antes, estes endpoints retornavam **array directo**. O frontend que fazia `response.data` recebia `undefined`. Agora **todos** os endpoints de listagem retornam o mesmo envelope `{data, meta}`.

### Endpoints corrigidos

| Endpoint | Antes | Depois |
|----------|-------|--------|
| `GET /taxes` | `Tax[]` (array) | `{ data: Tax[], meta }` ✅ |
| `GET /taxes/country/:code` | `Tax[]` (array) | `{ data: Tax[], meta }` ✅ |
| `GET /price-proposals` | `PriceProposal[]` (array) | `{ data: PriceProposal[], meta }` ✅ |
| `GET /price-proposals/my-proposals` | `PriceProposal[]` (array) | `{ data: PriceProposal[], meta }` ✅ |
| `GET /products/my-products` | `Product[]` (array) | `{ data: Product[], meta }` ✅ |
| `GET /logs` | `AuditLog[]` (array fixo de 100) | `{ data: AuditLog[], meta }` paginado ✅ |
| `GET /logs?entity=...` | `AuditLog[]` (array) ou `400` | `{ data: AuditLog[], meta }` ✅ |
| `GET /logs?action=...` | `400` (campo rejeitado) | `{ data: AuditLog[], meta }` ✅ |
| `GET /logs/suspicious-activities` | `AuditLog[]` (array) | `{ data: AuditLog[], meta }` ✅ |

---

## Padrão único para TODOS os endpoints de listagem

### Regra simples

```typescript
// ✅ CORRECTO — funciona para TODOS os endpoints de lista
const response = await api.get('/taxes');
const items = response.data;        // array com os registos
const total = response.meta.total;  // total de registos na BD

// ❌ ERRADO — taxes, price-proposals, logs retornavam array directo antes
const impostos = response;          // era array, agora é {data, meta}
```

### Envelope de resposta

```json
{
  "data": [ ... ],
  "meta": {
    "total":      7,
    "page":       1,
    "limit":      20,
    "totalPages": 1,
    "hasNext":    false,
    "hasPrev":    false
  }
}
```

---

## Lista completa — formato de todos os endpoints GET

### PAGINADOS — `{ data: T[], meta }`
*Aceder sempre com `response.data` e `response.meta`*

| Endpoint | Token necessário | Exemplo de dados |
|----------|-----------------|-----------------|
| `GET /taxes` | qualquer autenticado | `data[7], total:7` |
| `GET /taxes/country/:code` | qualquer autenticado | `data[1], total:1` |
| `GET /taxes/:id` | qualquer autenticado | objecto único (sem data/meta) |
| `GET /price-proposals` | `state` · `specialist` | `data[6], total:6` |
| `GET /price-proposals/my-proposals` | `specialist` | `data[6], total:6` |
| `GET /price-proposals/:id` | qualquer autenticado | objecto único |
| `GET /users` | `admin` · `state` · `staff` | `data[18], total:18` |
| `GET /users/:id` | `admin` · `state` · `staff` | objecto único |
| `GET /companies` | `state` · `staff` | `data[12], total:12` |
| `GET /companies/:id` | qualquer autenticado | objecto único |
| `GET /products` | qualquer autenticado | `data[10], total:10` |
| `GET /products/my-products` | `producer` | `data[10], total:10` |
| `GET /products/:id` | qualquer autenticado | objecto único |
| `GET /orders` | `state` · `staff` · `specialist` | `data[16], total:16` |
| `GET /orders/my-orders` | `buyer` | `data[16], total:16` |
| `GET /orders/:id` | autenticado | objecto único |
| `GET /transactions` | `state` · `staff` · `specialist` · `compliance` | `data[9], total:9` |
| `GET /transactions/:id` | mesmos roles | objecto único |
| `GET /shipments` | `state` · `staff` · `customs` | `data[6], total:6` |
| `GET /shipments/my-shipments` | `operator` | `data[6], total:6` |
| `GET /shipments/order/:orderId` | `state` · `staff` · `buyer` · `operator` · `customs` · `compliance` | objecto único |
| `GET /shipments/:id` | `state` · `staff` · `customs` · `operator` · `compliance` | objecto único |
| `GET /reports` | `state` · `staff` · `specialist` · `analyst` · `compliance` | `data[4], total:4` |
| `GET /reports/my-reports` | `analyst` · `specialist` · `compliance` | `data[2], total:2` |
| `GET /reports/:id` | mesmos roles | objecto único |
| `GET /logs` | `state` · `compliance` | `data[20], total:112` |
| `GET /logs?entity=order` | `state` · `compliance` | `data[20], total:35` |
| `GET /logs?action=PAY_ORDER` | `state` · `compliance` | `data[12], total:12` |
| `GET /logs?entity=company&action=APPROVE_LICENSE` | `state` · `compliance` | `data[7], total:7` |
| `GET /logs/suspicious-activities` | `state` · `compliance` | `data[1], total:1` |
| `GET /logs/:id` | `state` · `compliance` | objecto único |

### OBJECTO SIMPLES — sem paginação
*Aceder directamente às chaves — sem `.data`*

| Endpoint | Chaves retornadas |
|----------|------------------|
| `GET /transactions/summary` | `counts`, `amounts` |
| `GET /dashboard` | `companies`, `products`, `orders`, `transactions`, `shipments`, `auditLogs`, `revenue` |
| `GET /dashboard/metrics` | `generatedAt`, `periods`, `companies`, `products`, `orders`, `transactions`, `shipments`, `revenue`, `auditActivity` |
| `GET /analytics/revenue` | `currency`, `allTime`, `byCountry`, `topProducts`, `monthly` |
| `GET /analytics/logistics-performance` | `shipments`, `customs`, `topRoutes` |
| `GET /analytics/compliance-score` | `generatedAt`, `overallScore`, `riskLevel`, `scores`, `auditActivity` |

---

## Paginação — query params

Todos os endpoints paginados aceitam:

```
GET /taxes?page=1&limit=20
GET /logs?entity=order&page=1&limit=50
GET /price-proposals?page=2&limit=10
```

| Param | Default | Máximo |
|-------|:-------:|:------:|
| `page` | 1 | — |
| `limit` | 20 | 100 |

### Filtros do `/logs` (agora funcionam)

```
GET /logs?entity=order
GET /logs?entity=company
GET /logs?entity=shipment
GET /logs?action=PAY_ORDER
GET /logs?action=APPROVE_LICENSE
GET /logs?action=BLOCK_ORDER
GET /logs?entity=order&entityId=uuid-do-pedido
GET /logs?entity=company&action=APPROVE_LICENSE&page=1&limit=50
```

---

## Exemplos de código actualizados

### Taxes — página de impostos do STATE

```typescript
// ✅ CORRECTO
async function carregarImpostos() {
  const response = await api.get('/taxes?page=1&limit=50');
  const impostos = response.data;        // Tax[]
  const total    = response.meta.total;  // number
  return { impostos, total };
}

// Impostos por país (ex: Angola)
async function impostosAngola() {
  const response = await api.get('/taxes/country/angola');
  return response.data; // Tax[]
}
```

### Price Proposals — lista do SPECIALIST

```typescript
// ✅ CORRECTO
async function minhasPropostas() {
  const response = await api.get('/price-proposals/my-proposals');
  const propostas = response.data;  // PriceProposal[]
  return propostas.filter(p => p.status === 'submitted');
}

// Lista completa para STATE
async function todasPropostas() {
  const response = await api.get('/price-proposals');
  return response.data; // PriceProposal[]
}
```

### Products — catálogo do PRODUCER

```typescript
// ✅ CORRECTO
async function meusProdutos() {
  const response = await api.get('/products/my-products');
  const produtos = response.data;  // Product[]
  return {
    total:     response.meta.total,
    emDraft:   produtos.filter(p => p.status === 'draft'),
    publicados: produtos.filter(p => p.status === 'published_official'),
  };
}
```

### Audit Logs — filtros (agora com paginação)

```typescript
// ✅ CORRECTO — filtros funcionam e retornam {data, meta}
async function logsDePedidos(orderId: string) {
  const response = await api.get(`/logs?entity=order&entityId=${orderId}`);
  return response.data; // AuditLog[]
}

async function pagamentosFeit() {
  const response = await api.get('/logs?action=PAY_ORDER&limit=50');
  return {
    logs:  response.data,
    total: response.meta.total,
  };
}

async function actividades() {
  const response = await api.get('/logs/suspicious-activities');
  return response.data; // AuditLog[]
}

// Parse dos campos JSON dos logs
function parseLogs(logs: any[]) {
  return logs.map(log => ({
    ...log,
    before: log.beforeJson ? JSON.parse(log.beforeJson) : null,
    after:  log.afterJson  ? JSON.parse(log.afterJson)  : null,
  }));
}
```

### Dashboard e Analytics — acesso directo (sem .data)

```typescript
// ✅ CORRECTO — objectos simples, sem .data
async function overview() {
  const dash = await api.get('/dashboard');
  return {
    empresasActivas:   dash.companies.active ?? 0,
    pedidosPagos:      dash.orders.paid ?? 0,
    receitaTotal:      Number(dash.revenue.totalCompleted),
    totalAuditLogs:    dash.auditLogs.total,
  };
}

async function metricas() {
  const m = await api.get('/dashboard/metrics');
  return {
    taxaAprovacao: m.companies.approvalRate,   // "58%"
    receitaMes:    Number(m.revenue.last30Days.total),
    ordensUltimos30d: m.orders.last30Days,
  };
}

async function scoreCompliance() {
  const s = await api.get('/analytics/compliance-score');
  return {
    score:     s.overallScore,   // 87
    riskLevel: s.riskLevel,      // "MEDIUM"
    alertRate: s.auditActivity.alertRate, // "4%"
  };
}
```

---

## Helper universal para listas

```typescript
// Usar este helper para qualquer endpoint paginado
async function fetchList<T>(
  endpoint: string,
  page  = 1,
  limit = 20,
): Promise<{ items: T[]; total: number; totalPages: number }> {
  const res = await api.get(`${endpoint}?page=${page}&limit=${limit}`);
  return {
    items:      res.data,
    total:      res.meta.total,
    totalPages: res.meta.totalPages,
  };
}

// Exemplos de uso
const taxes       = await fetchList('/taxes');
const logs        = await fetchList('/logs?entity=order', 1, 50);
const proposals   = await fetchList('/price-proposals/my-proposals');
const myProducts  = await fetchList('/products/my-products');
```

---

## Verificação rápida — resposta real de produção

```bash
# Confirmar que /taxes retorna {data, meta}
curl -s "https://corredordolobitobackend-production.up.railway.app/taxes" \
  -H "Authorization: Bearer <token>" | python3 -m json.tool | head -20

# Output esperado:
# {
#   "data": [ { "id": "...", "cd": "TAX-0001", "name": "IVA Angola", ... } ],
#   "meta": { "total": 7, "page": 1, "limit": 100, ... }
# }
```

---

*Corredor do Lobito · Correcção de Formato Frontend · 2026-05-14*  
*Aplicar deploy no Railway para activar em produção*
