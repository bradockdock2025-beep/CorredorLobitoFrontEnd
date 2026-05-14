# Corredor do Lobito — Fluxo de Pedido para Frontend
> **Versão:** 2.0 · **Data:** 2026-05-12  
> **Role:** `buyer`  
> **Fluxo corrigido:** o BUYER passa apenas `productId` + `qty`. Tudo o resto é resolvido automaticamente pelo backend.

---

## O que mudou (resumo para o frontend)

| Campo | Antes (errado) | Agora (correcto) |
|-------|---------------|-----------------|
| `companyId` no body | BUYER tinha de enviar | ❌ Removido — vem do JWT |
| `priceProposalId` no body | BUYER tinha de saber | ❌ Removido — backend resolve |
| Validação de produto | Só no pagamento | ✅ Logo na criação do pedido |
| Preço visível no draft | Não | ✅ `unitPrice` disponível imediatamente |

**Impacto no stepper:** o Step 2 do frontend é agora apenas **produto + quantidade**. Sem IDs internos, sem selecção de preços.

---

## Visão Geral do Fluxo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STEPPER DO BUYER                             │
├──────────┬──────────────┬──────────────────┬───────────────────────┤
│  Step 1  │    Step 2    │     Step 3       │       Step 4          │
│          │              │                  │                        │
│ Escolher │  Produto +   │  Revisão do      │  Confirmação do       │
│ produtos │  Quantidade  │  pedido e preço  │  pagamento            │
│          │              │  calculado       │                        │
└──────────┴──────────────┴──────────────────┴───────────────────────┘
     ↓             ↓               ↓                    ↓
GET /products  POST /orders   GET /orders/:id    POST /orders/:id/pay
```

---

## Tipos TypeScript

```typescript
// ─── Produto ────────────────────────────────────────────────────────────────
interface Product {
  id:          string;
  cd:          string;
  name:        string;
  description: string | null;
  category:    string;
  status:      'draft' | 'pending_review' | 'published_official' | 'suspended' | 'rejected';
  publishedAt: string | null;
  producer:    { id: string; fullName: string };
  company:     { id: string; name: string };
}

// ─── Linha de pedido ─────────────────────────────────────────────────────────
interface OrderLine {
  id:              string;
  cd:              string;
  productId:       string;
  priceProposalId: string;   // resolvido pelo backend — não enviar no POST
  qty:             number;
  unitPrice:       string;   // Decimal como string — usar Number()
  taxRate:         string | null;
  taxAmount:       string | null;
  lineTotal:       string | null;
  snapshotRef:     PriceSnapshot | null;
  product:         Product;
}

// ─── Pedido ──────────────────────────────────────────────────────────────────
interface Order {
  id:           string;
  cd:           string;
  status:       'draft' | 'paid' | 'blocked' | 'cancelled';
  buyerId:      string;
  companyId:    string;
  netAmount:    string | null;   // null enquanto draft
  taxAmount:    string | null;   // null enquanto draft
  totalAmount:  string | null;   // null enquanto draft
  currency:     string;
  paidAt:       string | null;
  blockedAt:    string | null;
  blockedReason: string | null;
  createdAt:    string;
  buyer:        { id: string; fullName: string };
  company:      { id: string; name: string; country: string };
  lines:        OrderLine[];
}

// ─── Snapshot de preço (dentro do OrderLine após pagar) ──────────────────────
interface PriceSnapshot {
  snapshotVersion:  string;
  generatedAt:      string;
  proposalId:       string;
  productId:        string;
  productName:      string;
  productCategory:  string;
  approvedPriceUsd: number;
  currency:         string;
  validFrom:        string | null;
  validTo:          string | null;
  immutable:        true;
}

// ─── DTO de criação — o único que o frontend envia ───────────────────────────
interface CreateOrderLine {
  productId: string;   // único campo obrigatório por linha
  qty:       number;   // mínimo: 1
}

interface CreateOrderDto {
  lines: CreateOrderLine[];   // mínimo: 1 linha
}
// NÃO enviar companyId — NÃO enviar priceProposalId
```

---

## Step 1 — Listar produtos disponíveis

### Endpoint

```
GET /products
Authorization: Bearer <buyer_token>
```

### Query params (paginação)

```
GET /products?page=1&limit=20
```

### Response real

```json
{
  "data": [
    {
      "id":          "ddfbb2c1-6b11-4b84-98a1-9cb3c121e6d4",
      "cd":          "PRD-0005",
      "name":        "Tijolo Cerâmico Furado",
      "description": "Tijolo furado para alvenaria de vedação",
      "category":    "general",
      "status":      "published_official",
      "publishedAt": "2026-01-15T00:00:00.000Z",
      "producer":    { "id": "uuid", "fullName": "Product Producer" },
      "company":     { "id": "uuid", "name": "Lobito Trade Lda" }
    },
    {
      "id":          "c998adf1-31c6-49d4-b5a9-fcf1b01fdb12",
      "cd":          "PRD-0004",
      "name":        "Ferro Corrugado 12mm",
      "description": "Varão de ferro corrugado para betão armado",
      "category":    "general",
      "status":      "published_official",
      "publishedAt": "2026-01-15T00:00:00.000Z",
      "producer":    { "id": "uuid", "fullName": "Product Producer" },
      "company":     { "id": "uuid", "name": "Lobito Trade Lda" }
    }
  ],
  "meta": {
    "total":      5,
    "page":       1,
    "limit":      20,
    "totalPages": 1,
    "hasNext":    false,
    "hasPrev":    false
  }
}
```

### O que o frontend deve fazer

- Mostrar **apenas** os produtos com `status === 'published_official'`
- Não mostrar `priceProposalId` nem preços nesta lista — o preço será exibido após criar o pedido
- Permitir selecção de múltiplos produtos e definição de quantidade para cada um

### Código

```typescript
async function listarProdutos(page = 1) {
  const data = await api.get<{ data: Product[]; meta: any }>(
    `/products?page=${page}&limit=20`
  );
  // Filtrar apenas os publicados (o backend já filtra, mas por segurança)
  return data.data.filter(p => p.status === 'published_official');
}
```

---

## Step 2 — Seleccionar produto e quantidade

**UI:** o utilizador escolhe produto(s) e define a quantidade de cada um.

Não existe chamada à API neste step — é apenas estado local do formulário.

### Estado local do formulário

```typescript
interface CartItem {
  productId:   string;
  productName: string;   // para exibição
  qty:         number;
}

// Exemplo do estado após o utilizador seleccionar
const cart: CartItem[] = [
  { productId: 'ddfbb2c1-6b11-4b84-98a1-9cb3c121e6d4', productName: 'Tijolo Cerâmico Furado', qty: 10 },
  { productId: 'c998adf1-31c6-49d4-b5a9-fcf1b01fdb12', productName: 'Ferro Corrugado 12mm',   qty: 5  },
];
```

### Validações no frontend (antes de submeter)

```typescript
function validarCarrinho(cart: CartItem[]): string | null {
  if (cart.length === 0)
    return 'Adicione pelo menos um produto ao pedido.';

  for (const item of cart) {
    if (!Number.isInteger(item.qty) || item.qty < 1)
      return `Quantidade inválida para "${item.productName}". Mínimo: 1.`;
  }

  return null; // sem erros
}
```

---

## Step 3 — Criar o pedido (POST /orders)

Este é o passo onde o frontend submete ao backend. O backend valida tudo e cria o pedido em `draft` com o `unitPrice` já calculado.

### Endpoint

```
POST /orders
Authorization: Bearer <buyer_token>
Content-Type: application/json
```

### Request — o que o frontend envia

```json
{
  "lines": [
    { "productId": "ddfbb2c1-6b11-4b84-98a1-9cb3c121e6d4", "qty": 10 },
    { "productId": "c998adf1-31c6-49d4-b5a9-fcf1b01fdb12", "qty": 5  }
  ]
}
```

> ❌ Não enviar `companyId`  
> ❌ Não enviar `priceProposalId`  
> ❌ Não enviar `unitPrice`  
> ✅ Apenas `productId` + `qty` por linha

### O que o backend faz automaticamente

```
1. Lê companyId do JWT do buyer autenticado
2. Verifica que a empresa tem licença activa
3. Para cada linha:
   a. Verifica que o produto existe e está published_official
   b. Encontra a price proposal approved + vigente mais recente
   c. Extrai unitPrice do snapshot aprovado
4. Cria o pedido em DRAFT com unitPrice já preenchido
```

### Response 201 — pedido criado

```json
{
  "id":          "2b2c7185-c25b-4334-854f-019b6c61109d",
  "cd":          "ORD-0010",
  "status":      "draft",
  "buyerId":     "6bbea384-7d77-4863-b6e0-c2015eab5964",
  "companyId":   "62e2d8cc-def8-4da6-b717-323081e96542",
  "netAmount":   null,
  "taxAmount":   null,
  "totalAmount": null,
  "currency":    "USD",
  "paidAt":      null,
  "createdAt":   "2026-05-12T11:51:29.200Z",
  "lines": [
    {
      "id":              "b73675b4-0297-4b0f-9411-2b5ad20b8587",
      "cd":              "OL-0012",
      "productId":       "ddfbb2c1-6b11-4b84-98a1-9cb3c121e6d4",
      "priceProposalId": "497be304-a32e-4dea-94dc-85a3d79b5567",
      "qty":             10,
      "unitPrice":       "8.5",
      "taxRate":         null,
      "taxAmount":       null,
      "lineTotal":       null,
      "product": {
        "id":       "ddfbb2c1-6b11-4b84-98a1-9cb3c121e6d4",
        "name":     "Tijolo Cerâmico Furado",
        "category": "general"
      }
    }
  ]
}
```

> **Nota:** `netAmount`, `taxAmount`, `totalAmount` são `null` no `draft` — são calculados no pagamento.  
> `unitPrice` já está preenchido — usar para calcular o subtotal estimado no ecrã de revisão.

### Calcular subtotal estimado para exibição no Step 3

```typescript
// O imposto exacto só é calculado no pay() — este é o subtotal SEM imposto
function calcularSubtotal(lines: OrderLine[]): number {
  return lines.reduce((sum, line) => {
    return sum + Number(line.unitPrice) * line.qty;
  }, 0);
}

// Exibir ao utilizador como "Subtotal (s/ imposto)"
const subtotal = calcularSubtotal(pedido.lines); // ex: 85.00 USD
```

### Erros possíveis neste step

| Código | Mensagem | O que fazer no UI |
|--------|----------|------------------|
| `400` | `"A sua conta não está associada a nenhuma empresa"` | Mostrar aviso — conta não configurada |
| `400` | `"A empresa X não tem licença activa (estado: suspended)"` | Mostrar aviso — empresa sem licença |
| `404` | `"Produto com ID X não encontrado"` | Produto foi removido — recarregar lista |
| `400` | `"O produto X não está disponível para pedidos (estado: draft)"` | Produto indisponível — recarregar lista |
| `400` | `"O produto X não tem proposta de preço aprovada e vigente"` | Produto sem preço — contactar suporte |

### Código

```typescript
async function criarPedido(cart: CartItem[]): Promise<Order> {
  return api.post<Order>('/orders', {
    lines: cart.map(item => ({
      productId: item.productId,
      qty:       item.qty,
    })),
  });
}
```

---

## Step 3B — Revisão do pedido (GET /orders/:id)

Após criar o pedido, buscar os detalhes completos para exibir no ecrã de revisão.

### Endpoint

```
GET /orders/:id
Authorization: Bearer <buyer_token>
```

### Response real (pedido em draft)

```json
{
  "id":          "2b2c7185-c25b-4334-854f-019b6c61109d",
  "cd":          "ORD-0010",
  "status":      "draft",
  "currency":    "USD",
  "netAmount":   null,
  "taxAmount":   null,
  "totalAmount": null,
  "buyer":   { "id": "uuid", "fullName": "Buyer Corp" },
  "company": { "id": "uuid", "name": "Lobito Trade Lda", "country": "angola" },
  "lines": [
    {
      "id":        "b73675b4-0297-4b0f-9411-2b5ad20b8587",
      "cd":        "OL-0012",
      "qty":       2,
      "unitPrice": "8.5",
      "taxRate":   null,
      "taxAmount": null,
      "lineTotal": null,
      "product": {
        "id":          "ddfbb2c1-6b11-4b84-98a1-9cb3c121e6d4",
        "name":        "Tijolo Cerâmico Furado",
        "description": "Tijolo furado para alvenaria de vedação",
        "category":    "general",
        "status":      "published_official"
      }
    }
  ]
}
```

### O que mostrar no ecrã de revisão

```typescript
function calcularResumoParaExibicao(pedido: Order) {
  const linhas = pedido.lines.map(line => ({
    produto:   line.product.name,
    qty:       line.qty,
    unitPrice: Number(line.unitPrice),
    subtotal:  Number(line.unitPrice) * line.qty,
  }));

  const subtotalSemImposto = linhas.reduce((s, l) => s + l.subtotal, 0);

  return {
    linhas,
    subtotalSemImposto,
    empresa:  pedido.company.name,
    pais:     pedido.company.country,
    moeda:    pedido.currency,
    // Imposto exacto apenas disponível após pay()
    aviso:    'O imposto será calculado e exibido após confirmação do pagamento.',
  };
}
```

**Sugestão de UI para o ecrã de revisão:**

```
┌────────────────────────────────────────────────────────────┐
│  Revisão do Pedido ORD-0010                                │
│                                                            │
│  Empresa: Lobito Trade Lda · Angola                        │
├─────────────────────────────┬──────┬───────────┬──────────┤
│  Produto                    │  Qty │  Preço Un │ Subtotal │
├─────────────────────────────┼──────┼───────────┼──────────┤
│  Tijolo Cerâmico Furado     │   2  │  8.50 USD │ 17.00 USD│
├─────────────────────────────┴──────┴───────────┼──────────┤
│                              Subtotal s/ imposto│ 17.00 USD│
│                      Imposto calculado no pago →│   + IVA  │
└─────────────────────────────────────────────────┴──────────┘
         [ Cancelar ]                [ Confirmar Pagamento ]
```

---

## Step 4 — Confirmar pagamento (POST /orders/:id/pay)

### Endpoint

```
POST /orders/:id/pay
Authorization: Bearer <buyer_token>
```

Sem body.

### O que o backend faz automaticamente

```
1. Verifica que o pedido pertence ao buyer autenticado
2. Verifica que status = 'draft'
3. Para cada linha:
   a. Usa o unitPrice já armazenado no draft
   b. Calcula taxRate com base no país da empresa + categoria do produto
   c. Calcula taxAmount = unitPrice × qty × taxRate
   d. Calcula lineTotal = (unitPrice × qty) + taxAmount
4. Calcula totais do pedido:
   netAmount    = soma de (unitPrice × qty) de todas as linhas
   taxAmount    = soma de taxAmount de todas as linhas
   totalAmount  = netAmount + taxAmount
5. status → paid
6. paidAt registado
7. Transaction criada automaticamente (TRX-XXXX)
8. Audit log registado (PAY_ORDER)
```

### Response 200 — pedido pago

```json
{
  "id":          "2e1a0e71-ed37-4c8d-bfd4-39993ef69062",
  "cd":          "ORD-0009",
  "status":      "paid",
  "netAmount":   "25.5",
  "taxAmount":   "3.57",
  "totalAmount": "29.07",
  "currency":    "USD",
  "paidAt":      "2026-05-12T11:39:01.736Z",
  "buyer":   { "id": "uuid", "fullName": "Buyer Corp" },
  "company": { "id": "uuid", "name": "Lobito Trade Lda", "country": "angola" }
}
```

> **Nota:** o `pay` retorna o `Order` sem as `lines`. Para exibir o recibo completo, fazer `GET /orders/:id` após o pagamento.

### GET /orders/:id após pagamento — resposta completa

```json
{
  "id":          "2e1a0e71-ed37-4c8d-bfd4-39993ef69062",
  "cd":          "ORD-0009",
  "status":      "paid",
  "netAmount":   "25.5",
  "taxAmount":   "3.57",
  "totalAmount": "29.07",
  "currency":    "USD",
  "paidAt":      "2026-05-12T11:39:01.736Z",
  "buyer":   { "id": "uuid", "fullName": "Buyer Corp" },
  "company": { "id": "uuid", "name": "Lobito Trade Lda", "country": "angola" },
  "lines": [
    {
      "id":        "208d02c3-ca65-4b94-a82e-0a48ab2dfde6",
      "cd":        "OL-0011",
      "qty":       3,
      "unitPrice": "8.5",
      "taxRate":   "0.14",
      "taxAmount": "3.57",
      "lineTotal": "29.07",
      "snapshotRef": {
        "snapshotVersion":  "1.0",
        "approvedPriceUsd": 8.5,
        "currency":         "USD",
        "productName":      "Tijolo Cerâmico Furado",
        "productCategory":  "general",
        "validFrom":        "2026-01-01T00:00:00.000Z",
        "validTo":          "2026-12-31T23:59:59.000Z",
        "immutable":        true
      },
      "product": {
        "name":     "Tijolo Cerâmico Furado",
        "category": "general",
        "status":   "published_official"
      }
    }
  ]
}
```

### Cálculo do recibo

```typescript
function gerarRecibo(pedido: Order) {
  const linhas = pedido.lines.map(line => ({
    produto:   line.product.name,
    qty:       line.qty,
    unitPrice: Number(line.unitPrice),
    taxRate:   Number(line.taxRate ?? 0) * 100,   // ex: 0.14 → "14%"
    taxAmount: Number(line.taxAmount ?? 0),
    lineTotal: Number(line.lineTotal ?? 0),
  }));

  return {
    cd:         pedido.cd,
    paidAt:     new Date(pedido.paidAt!).toLocaleString('pt-AO'),
    empresa:    pedido.company.name,
    pais:       pedido.company.country,
    moeda:      pedido.currency,
    linhas,
    netAmount:   Number(pedido.netAmount),
    taxAmount:   Number(pedido.taxAmount),
    totalAmount: Number(pedido.totalAmount),
  };
}
```

### Erros possíveis neste step

| Código | Mensagem | O que fazer no UI |
|--------|----------|------------------|
| `400` | `"Pedido não está em draft"` | Pedido já foi pago — recarregar |
| `403` | `"Acesso negado"` | Este pedido pertence a outro buyer |
| `400` | `"Linha do produto X não tem snapshot de preço"` | Erro interno — contactar suporte |

### Código

```typescript
async function pagarPedido(orderId: string): Promise<Order> {
  // 1. Pagar
  await api.post<Order>(`/orders/${orderId}/pay`);

  // 2. Buscar detalhes completos com lines para o recibo
  return api.get<Order>(`/orders/${orderId}`);
}
```

---

## Fluxo completo — função de orquestração

```typescript
async function fluxoCompletoPedido(cart: CartItem[]) {
  // Step 1 já foi feito — produtos estão no carrinho

  // Step 2 — validar carrinho antes de submeter
  const erroValidacao = validarCarrinho(cart);
  if (erroValidacao) throw new Error(erroValidacao);

  // Step 3 — criar pedido
  const pedidoDraft = await criarPedido(cart);
  const detalhes    = await api.get<Order>(`/orders/${pedidoDraft.id}`);

  // Mostrar Step 3B (revisão) ao utilizador
  // ... aguardar confirmação do utilizador ...

  // Step 4 — pagar
  const pedidoPago = await pagarPedido(pedidoDraft.id);

  return pedidoPago;
}
```

---

## Estados possíveis de um pedido

```
                    ┌──────────────────────────────────────────┐
                    │              BUYER cria                  │
                    ▼                                          │
               [ draft ]                                       │
                    │                                          │
                    │  BUYER paga (pay)                        │
                    ▼                                          │
               [ paid ]                                        │
                    │                                          │
          ┌─────────┴─────────┐                               │
          │                   │                               │
          ▼ STATE bloqueia    ▼ STATE cancela                 │
      [ blocked ]         [ cancelled ]                       │
                                                              │
──────────────────────────────────────────────────────────────┘
```

| Status | O que significa | BUYER pode pagar? | BUYER pode ver? |
|--------|----------------|:-----------------:|:---------------:|
| `draft` | Pedido criado, aguarda pagamento | ✅ Sim | ✅ Sim |
| `paid` | Pago, imposto calculado | ❌ Já pago | ✅ Sim |
| `blocked` | Bloqueado pelo STATE | ❌ Não | ✅ Sim |
| `cancelled` | Cancelado pelo STATE | ❌ Não | ✅ Sim |

---

## Listar pedidos do buyer

### GET /orders/my-orders

```
GET /orders/my-orders?page=1&limit=20
Authorization: Bearer <buyer_token>
```

```typescript
async function listarMeusPedidos(page = 1) {
  const { data, meta } = await api.get<{ data: Order[]; meta: any }>(
    `/orders/my-orders?page=${page}&limit=20`
  );
  return { pedidos: data, meta };
}
```

**Sugestão de UI para a listagem:**

```
┌────────────────────────────────────────────────────────────┐
│  Os Meus Pedidos                                           │
├───────────┬────────────────────────┬──────────┬───────────┤
│  Código   │  Data                  │  Total   │  Estado   │
├───────────┼────────────────────────┼──────────┼───────────┤
│  ORD-0009 │  12 Mai 2026, 11:39   │  29.07 $ │  ✅ pago  │
│  ORD-0010 │  12 Mai 2026, 11:51   │    —     │  ⏳ draft │
└───────────┴────────────────────────┴──────────┴───────────┘
```

---

## Exibir estado com cores

```typescript
const STATUS_CONFIG = {
  draft:     { label: 'Rascunho',   color: '#F59E0B', icon: '⏳' },
  paid:      { label: 'Pago',       color: '#10B981', icon: '✅' },
  blocked:   { label: 'Bloqueado',  color: '#EF4444', icon: '🚫' },
  cancelled: { label: 'Cancelado',  color: '#6B7280', icon: '❌' },
};

function exibirEstado(status: string) {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
      ?? { label: status, color: '#6B7280', icon: '•' };
}
```

---

## Converter e formatar valores monetários

```typescript
// Os campos Decimal chegam como strings — SEMPRE converter com Number()
const total  = Number(pedido.totalAmount);  // "29.07" → 29.07
const tax    = Number(pedido.taxAmount);    // "3.57"  → 3.57
const net    = Number(pedido.netAmount);    // "25.5"  → 25.5
const price  = Number(line.unitPrice);      // "8.5"   → 8.5
const rate   = Number(line.taxRate) * 100;  // "0.14"  → 14 (percentagem)

// Formatar para exibição
const fmtUSD = new Intl.NumberFormat('pt-AO', {
  style:    'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

fmtUSD.format(total);  // "29,07 US$"
fmtUSD.format(net);    // "25,50 US$"
fmtUSD.format(tax);    // "3,57 US$"

// Percentagem de imposto
`${rate.toFixed(0)}%`  // "14%"
```

---

## Recibo final — template de exibição

```typescript
function ReciboPedido({ pedido }: { pedido: Order }) {
  const linhas = pedido.lines;
  const net    = Number(pedido.netAmount);
  const tax    = Number(pedido.taxAmount);
  const total  = Number(pedido.totalAmount);

  return `
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CORREDOR DO LOBITO — RECIBO DE PEDIDO
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Pedido:  ${pedido.cd}
  Data:    ${new Date(pedido.paidAt!).toLocaleString('pt-AO')}
  Empresa: ${pedido.company.name}
  País:    ${pedido.company.country.toUpperCase()}
  ──────────────────────────────────────
  ${linhas.map(l => `
  ${l.product.name}
  ${l.qty}x @ ${Number(l.unitPrice).toFixed(2)} USD
  IVA (${(Number(l.taxRate) * 100).toFixed(0)}%): ${Number(l.taxAmount).toFixed(2)} USD
  Linha: ${Number(l.lineTotal).toFixed(2)} USD
  `).join('──────────────────────────────────────')}
  ──────────────────────────────────────
  Subtotal (s/ imposto):   ${net.toFixed(2)} USD
  Imposto total:           ${tax.toFixed(2)} USD
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TOTAL PAGO:              ${total.toFixed(2)} USD
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;
}
```

---

## Resumo de todos os endpoints usados pelo BUYER

| Step | Método | Endpoint | Body |
|------|--------|----------|------|
| Listar produtos | `GET` | `/products` | — |
| Criar pedido | `POST` | `/orders` | `{ lines: [{ productId, qty }] }` |
| Ver pedido | `GET` | `/orders/:id` | — |
| Pagar pedido | `POST` | `/orders/:id/pay` | — |
| Listar meus pedidos | `GET` | `/orders/my-orders` | — |

**Apenas 5 endpoints. Nenhum expõe price proposals, snapshots ou companyId.**

---

*Corredor do Lobito · Fluxo de Pedido para Frontend v2.0 · 2026-05-12*
