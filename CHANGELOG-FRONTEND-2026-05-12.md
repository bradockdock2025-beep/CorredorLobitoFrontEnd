# Corredor do Lobito — Changelog Frontend
> **Data:** 2026-05-12  
> **Tipo:** Breaking changes · Novos endpoints · Correcções de segurança  
> **Acção necessária:** Actualizar integrações marcadas com ⚠️ BREAKING

---

## Resumo

| Tipo | Total |
|------|:-----:|
| ⚠️ Breaking changes | 3 |
| ⭐ Novos endpoints | 19 |
| 🔒 Correcções de segurança | 3 |
| 🔄 Regras de negócio alteradas | 4 |
| 🆕 Novo enum value | 1 |
| 🔑 Nova conta de dev | 1 |

---

## ⚠️ BREAKING CHANGES

### 1. POST /orders — body completamente diferente

**Antes (dá erro 400):**
```json
{
  "companyId": "uuid",
  "lines": [
    {
      "productId":       "uuid-do-produto",
      "priceProposalId": "uuid-da-proposta",
      "qty": 10
    }
  ]
}
```

**Agora (correcto):**
```json
{
  "lines": [
    { "productId": "uuid-do-produto", "qty": 10 }
  ]
}
```

`companyId` vem do JWT automaticamente. `priceProposalId` é resolvido pelo sistema.  
Enviar os campos antigos retorna:
```json
{
  "statusCode": 400,
  "message": [
    "property companyId should not exist",
    "lines.0.property priceProposalId should not exist"
  ],
  "error": "Bad Request"
}
```

**Response 201 — o que muda:**
```json
{
  "id": "2e1a0e71-ed37-4c8d-bfd4-39993ef69062",
  "cd": "ORD-0009",
  "status": "draft",
  "buyerId":   "6bbea384-7d77-4863-b6e0-c2015eab5964",
  "companyId": "62e2d8cc-def8-4da6-b717-323081e96542",
  "totalAmount": null,
  "taxAmount":   null,
  "netAmount":   null,
  "currency": "USD",
  "lines": [
    {
      "id": "208d02c3-ca65-4b94-a82e-0a48ab2dfde6",
      "cd": "OL-0011",
      "productId":       "ddfbb2c1-6b11-4b84-98a1-9cb3c121e6d4",
      "priceProposalId": "497be304-a32e-4dea-94dc-85a3d79b5567",
      "qty": 4,
      "unitPrice": "8.5",
      "taxRate":   null,
      "taxAmount": null,
      "lineTotal": null,
      "product": {
        "id": "ddfbb2c1-6b11-4b84-98a1-9cb3c121e6d4",
        "name": "Tijolo Cerâmico Furado",
        "category": "general"
      }
    }
  ],
  "createdAt": "2026-05-12T11:38:19.438Z",
  "updatedAt": "2026-05-12T11:38:19.438Z"
}
```

> `unitPrice` já está preenchido no `draft` — o frontend pode mostrar o preço antes do pagamento.  
> `taxRate`, `taxAmount` e `lineTotal` são preenchidos apenas no `pay()`.

---

### 2. POST /companies — agora requer JWT

**Antes:** endpoint público, sem token.  
**Agora:** requer `Authorization: Bearer <token>`.

Sem token retorna:
```json
{
  "statusCode": 401,
  "message": "Token inválido ou expirado",
  "error": "Unauthorized"
}
```

---

### 3. GET /orders/:id — BUYER restrito aos seus pedidos

**Antes:** qualquer BUYER autenticado podia aceder a qualquer pedido.  
**Agora:** BUYER só vê os seus próprios pedidos.

Tentar aceder a um pedido alheio retorna:
```json
{
  "statusCode": 403,
  "message": "Acesso negado — este pedido não lhe pertence",
  "error": "Forbidden"
}
```

---

## ⭐ Novos Endpoints

---

### POST /auth/register
**Público — sem token necessário**

Auto-registo para empresas e utilizadores externos.  
`role` aceita apenas: `buyer` · `producer` · `operator`

**Request — nova empresa + utilizador:**
```json
{
  "email":          "comprador@empresa.ao",
  "password":       "Senha@Segura123!",
  "fullName":       "Maria Conceição",
  "role":           "buyer",
  "companyName":    "Nova Empresa Angola Lda",
  "companyCountry": "angola",
  "companyEmail":   "geral@novaempresa.ao",
  "companyPhone":   "+244 923 111 222",
  "companyAddress": "Rua da Independência, 50, Luanda"
}
```

**Request — utilizador em empresa já existente:**
```json
{
  "email":     "outro.buyer@empresa.ao",
  "password":  "Senha@Segura123!",
  "fullName":  "João Silva",
  "role":      "buyer",
  "companyId": "62e2d8cc-def8-4da6-b717-323081e96542"
}
```

**Response 201:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id":        "48c94c27-2abf-4f9d-8670-0fb1c1b9817f",
    "email":     "comprador@empresa.ao",
    "role":      "buyer",
    "fullName":  "Maria Conceição",
    "companyId": "c9494d2a-e860-4bf5-85c7-88228908a8ea"
  },
  "company": {
    "id":            "c9494d2a-e860-4bf5-85c7-88228908a8ea",
    "cd":            "EMP-0012",
    "name":          "Nova Empresa Angola Lda",
    "country":       "angola",
    "licenseStatus": "pending",
    "message":       "Empresa registada. Aguarda validação do STAFF e aprovação do STATE para operar."
  }
}
```

**Erros:**
```json
{ "statusCode": 409, "message": "Email já registado" }
{ "statusCode": 409, "message": "Já existe uma empresa registada com esse email." }
{ "statusCode": 400, "message": "Para registar numa nova empresa é obrigatório fornecer: companyName, companyCountry e companyEmail." }
{ "statusCode": 404, "message": "Empresa não encontrada. Verifique o companyId." }
```

> ⚠️ Empresa começa como `pending`. Utilizador recebe JWT mas ao tentar criar pedido/produto recebe:  
> `400 — "A empresa Nova Empresa Angola Lda não tem licença activa (estado: pending)"`

---

### GET /users
**Roles:** `admin` · `state` · `staff` · Paginação

**Response 200:**
```json
{
  "data": [
    {
      "id":          "f0d4b450-a9b9-4b7b-af1c-a817c00f2341",
      "cd":          "USR-0014",
      "email":       "producer2@empresa.ao",
      "fullName":    "Segundo Producer",
      "role":        "producer",
      "status":      "active",
      "companyId":   "8dfca0be-5b78-437b-b5a2-12d2d948c741",
      "lastLoginAt": null,
      "createdAt":   "2026-05-12T17:14:39.594Z",
      "updatedAt":   "2026-05-12T17:14:39.594Z"
    }
  ],
  "meta": {
    "total": 14,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### GET /users/:id
**Roles:** `admin` · `state` · `staff`

**Response 200:**
```json
{
  "id":          "f0d4b450-a9b9-4b7b-af1c-a817c00f2341",
  "cd":          "USR-0014",
  "email":       "producer2@empresa.ao",
  "fullName":    "Segundo Producer",
  "role":        "producer",
  "status":      "active",
  "companyId":   "8dfca0be-5b78-437b-b5a2-12d2d948c741",
  "lastLoginAt": null,
  "createdAt":   "2026-05-12T17:14:39.594Z",
  "updatedAt":   "2026-05-12T17:14:39.594Z"
}
```

---

### POST /users
**Role:** `admin`

**Request:**
```json
{
  "email":     "novo.staff@lobito.gov",
  "password":  "Senha@Segura123!",
  "fullName":  "Novo Staff Officer",
  "role":      "staff",
  "companyId": null
}
```

**Response 201:**
```json
{
  "id":          "7483a01e-8b8d-4b38-94cd-4ac8a6c877f3",
  "cd":          "USR-0015",
  "email":       "novo.staff@lobito.gov",
  "fullName":    "Novo Staff Officer",
  "role":        "staff",
  "status":      "active",
  "companyId":   null,
  "lastLoginAt": null,
  "createdAt":   "2026-05-12T21:29:17.228Z",
  "updatedAt":   "2026-05-12T21:29:17.228Z"
}
```

**Erro:**
```json
{ "statusCode": 409, "message": "Email já registado" }
```

---

### PUT /users/:id
**Role:** `admin`

**Request (todos os campos opcionais):**
```json
{
  "fullName":  "Nome Actualizado",
  "companyId": "uuid-da-empresa"
}
```

**Response 200:**
```json
{
  "id":          "7483a01e-8b8d-4b38-94cd-4ac8a6c877f3",
  "cd":          "USR-0015",
  "email":       "novo.staff@lobito.gov",
  "fullName":    "Nome Actualizado",
  "role":        "staff",
  "status":      "active",
  "companyId":   null,
  "lastLoginAt": null,
  "createdAt":   "2026-05-12T21:29:17.228Z",
  "updatedAt":   "2026-05-12T21:30:38.040Z"
}
```

---

### PUT /users/:id/block
**Role:** `state`

**Request:**
```json
{ "reason": "Utilizador envolvido em actividade suspeita reportada pelo COMPLIANCE." }
```

**Response 200:**
```json
{
  "id":        "7483a01e-8b8d-4b38-94cd-4ac8a6c877f3",
  "cd":        "USR-0015",
  "email":     "novo.staff@lobito.gov",
  "fullName":  "Nome Actualizado",
  "role":      "staff",
  "status":    "blocked",
  "companyId": null,
  "updatedAt": "2026-05-12T21:30:45.320Z"
}
```

**Erros:**
```json
{ "statusCode": 400, "message": "Utilizador já está bloqueado" }
{ "statusCode": 403, "message": "Não pode bloquear a sua própria conta" }
```

---

### PUT /users/:id/unblock
**Role:** `state` · Sem body

**Response 200:**
```json
{
  "id":        "7483a01e-8b8d-4b38-94cd-4ac8a6c877f3",
  "cd":        "USR-0015",
  "email":     "novo.staff@lobito.gov",
  "fullName":  "Nome Actualizado",
  "role":      "staff",
  "status":    "active",
  "companyId": null,
  "updatedAt": "2026-05-12T21:30:53.320Z"
}
```

**Erro:**
```json
{ "statusCode": 400, "message": "Utilizador já está activo" }
```

---

### PUT /users/:id/role
**Role:** `admin`

**Request:**
```json
{ "role": "analyst" }
```

**Response 200:**
```json
{
  "id":        "7483a01e-8b8d-4b38-94cd-4ac8a6c877f3",
  "cd":        "USR-0015",
  "email":     "novo.staff@lobito.gov",
  "fullName":  "Nome Actualizado",
  "role":      "analyst",
  "status":    "active",
  "companyId": null,
  "updatedAt": "2026-05-12T21:31:00.367Z"
}
```

**Erro:**
```json
{ "statusCode": 403, "message": "Não pode alterar o seu próprio role" }
```

---

### PUT /companies/:id
**Roles:** qualquer autenticado

Campos permitidos: `name`, `contactEmail`, `contactPhone`, `address`.  
Campos bloqueados: `licenseStatus`, `country`, `licenseNumber` (não aceites).

**Request (todos opcionais):**
```json
{
  "name":         "Nome da Empresa Actualizado",
  "contactEmail": "novo@empresa.ao",
  "contactPhone": "+244 923 999 999",
  "address":      "Av. Principal, 200, Luanda"
}
```

**Response 200:**
```json
{
  "id":                "c9494d2a-e860-4bf5-85c7-88228908a8ea",
  "cd":                "EMP-0009",
  "name":              "Nome da Empresa Actualizado",
  "country":           "zambia",
  "contactEmail":      "info@fabrica.zm",
  "contactPhone":      "+244 923 999 999",
  "address":           "Av. Principal, 200, Luanda",
  "licenseStatus":     "pending",
  "licenseNumber":     null,
  "licenseExpiresAt":  null,
  "rejectionReason":   null,
  "suspensionReason":  null,
  "validationNotes":   null,
  "approvedByStateId": null,
  "createdAt":         "2026-05-12T17:12:42.592Z",
  "updatedAt":         "2026-05-12T21:31:48.801Z"
}
```

---

### POST /companies/:id/revoke
**Role:** `state` · Aceita `active` ou `suspended`

Diferença de `suspend`: revoke define `licenseStatus: rejected` permanentemente.

**Request:**
```json
{ "reason": "Fraude documental confirmada pelo COMPLIANCE. Licença revogada definitivamente." }
```

**Response 200:**
```json
{
  "id":              "uuid",
  "cd":              "EMP-0005",
  "name":            "Empresa Revogada Lda",
  "licenseStatus":   "rejected",
  "rejectionReason": "Fraude documental confirmada pelo COMPLIANCE. Licença revogada definitivamente.",
  "updatedAt":       "2026-05-12T14:00:00.000Z"
}
```

**Erro:**
```json
{ "statusCode": 400, "message": "Apenas empresas activas ou suspensas podem ter a licença revogada (estado actual: pending)" }
```

---

### POST /products/:id/validate-technical
**Role:** `staff` · Apenas `status: pending_review`

**Request:**
```json
{ "valid": true, "notes": "Especificações técnicas completas e conformes com os padrões aplicáveis." }
```

**Response 200 — aprovado:**
```json
{
  "id":          "9b721584-9b9c-47a4-81a6-d7a4c97a8de6",
  "cd":          "PRD-0006",
  "name":        "Produto WF2 Teste",
  "description": "Teste completo workflow 2",
  "category":    "general",
  "status":      "staff_validated",
  "producerId":  "uuid",
  "companyId":   "uuid",
  "createdAt":   "2026-05-12T12:00:00.000Z",
  "updatedAt":   "2026-05-12T12:05:00.000Z"
}
```

**Request — devolve ao PRODUCER:**
```json
{ "valid": false, "notes": "Faltam: certificado de origem, dimensões do produto e norma ISO aplicável." }
```

**Response 200 — devolvido:**
```json
{
  "id":     "uuid",
  "status": "pending_review",
  "updatedAt": "2026-05-12T12:05:00.000Z"
}
```

**Erro:**
```json
{ "statusCode": 400, "message": "Apenas produtos em pending_review podem ser validados pelo STAFF (estado actual: draft)" }
```

---

### POST /products/:id/forward-product-to-state
**Role:** `staff` · Apenas `status: staff_validated` · Sem body

**Response 200:**
```json
{
  "id":          "9b721584-9b9c-47a4-81a6-d7a4c97a8de6",
  "cd":          "PRD-0006",
  "name":        "Produto WF2 Teste",
  "status":      "staff_validated",
  "companyId":   "uuid",
  "producerId":  "uuid",
  "updatedAt":   "2026-05-12T12:05:00.000Z",
  "message":     "Produto encaminhado ao STATE para aprovação de publicação."
}
```

**Erro:**
```json
{ "statusCode": 400, "message": "O produto deve estar em staff_validated para ser encaminhado ao STATE. Execute validate-technical primeiro." }
```

---

### PUT /orders/:id
**Role:** `buyer` · Apenas `status: draft` · Pertence ao buyer autenticado

Substitui todas as linhas. Resolve `priceProposalId` automaticamente (mesma lógica do POST).

**Request:**
```json
{
  "lines": [
    { "productId": "ddfbb2c1-6b11-4b84-98a1-9cb3c121e6d4", "qty": 2 },
    { "productId": "outro-produto-uuid",                    "qty": 8 }
  ]
}
```

**Response 200:**
```json
{
  "id":        "2e1a0e71-ed37-4c8d-bfd4-39993ef69062",
  "cd":        "ORD-0009",
  "status":    "draft",
  "companyId": "62e2d8cc-def8-4da6-b717-323081e96542",
  "lines": [
    {
      "id":              "novo-uuid",
      "cd":              "OL-0015",
      "productId":       "ddfbb2c1-6b11-4b84-98a1-9cb3c121e6d4",
      "priceProposalId": "497be304-a32e-4dea-94dc-85a3d79b5567",
      "qty":             2,
      "unitPrice":       "8.5",
      "taxRate":         null,
      "taxAmount":       null,
      "lineTotal":       null,
      "product": {
        "id": "ddfbb2c1-6b11-4b84-98a1-9cb3c121e6d4",
        "name": "Tijolo Cerâmico Furado",
        "category": "general"
      }
    }
  ],
  "updatedAt": "2026-05-12T12:10:00.000Z"
}
```

**Erros:**
```json
{ "statusCode": 400, "message": "Apenas pedidos em draft podem ser editados" }
{ "statusCode": 403, "message": "Acesso negado — este pedido não lhe pertence" }
{ "statusCode": 400, "message": "O produto \"Ferro\" não está disponível (estado: suspended)" }
```

---

### POST /orders/:id/escalate-to-state
**Role:** `staff` · Sem body

Não altera `status` do pedido. Regista evento no audit log para o STATE.

**Response 200:**
```json
{
  "id":          "371840ce-a1da-4dff-a7b9-7bd3104fd93b",
  "cd":          "ORD-0015",
  "status":      "draft",
  "buyerId":     "6bbea384-7d77-4863-b6e0-c2015eab5964",
  "companyId":   "62e2d8cc-def8-4da6-b717-323081e96542",
  "totalAmount": null,
  "currency":    "USD",
  "createdAt":   "2026-05-12T16:39:36.441Z",
  "updatedAt":   "2026-05-12T16:39:36.441Z",
  "message":     "Pedido escalado ao STATE para decisão. Audit log registado."
}
```

**Erro:**
```json
{ "statusCode": 400, "message": "Pedido em estado \"paid\" não pode ser escalado ao STATE" }
```

---

### GET /taxes/:id
**Roles:** qualquer autenticado

**Response 200:**
```json
{
  "id":            "c23be1fa-1ab5-4617-a619-e530fc30aa0b",
  "cd":            "TAX-0001",
  "name":          "IVA Angola",
  "category":      "general",
  "country":       "angola",
  "rate":          "0.14",
  "effectiveFrom": "2024-01-01T00:00:00.000Z",
  "effectiveTo":   null,
  "isActive":      true,
  "createdById":   "41bafc86-f90b-4fad-a8c3-3bc6cda15ded",
  "createdAt":     "2026-05-07T19:37:15.344Z"
}
```

> `rate` é string — converter com `Number(tax.rate) * 100` para exibir como `14%`.

---

### PUT /taxes/:id
**Role:** `state` · Todos os campos opcionais

**Request:**
```json
{
  "name":          "IVA Angola 2027",
  "rate":          0.15,
  "effectiveFrom": "2027-01-01T00:00:00.000Z",
  "effectiveTo":   "2027-12-31T23:59:59.000Z",
  "isActive":      true
}
```

**Response 200:**
```json
{
  "id":            "c23be1fa-1ab5-4617-a619-e530fc30aa0b",
  "cd":            "TAX-0001",
  "name":          "IVA Angola 2027",
  "category":      "general",
  "country":       "angola",
  "rate":          "0.15",
  "effectiveFrom": "2027-01-01T00:00:00.000Z",
  "effectiveTo":   "2027-12-31T23:59:59.000Z",
  "isActive":      true,
  "createdById":   "41bafc86-f90b-4fad-a8c3-3bc6cda15ded",
  "createdAt":     "2026-05-07T19:37:15.344Z"
}
```

**Erro:**
```json
{ "statusCode": 404, "message": "Regra fiscal não encontrada" }
```

---

### GET /shipments/my-shipments
**Role:** `operator` · Paginação

**Response 200:**
```json
{
  "data": [
    {
      "id":        "9e42efa3-7ce8-40be-9d0d-c33ecf7acd4f",
      "cd":        "SHP-0004",
      "orderId":   "21a26d82-8597-4fdf-a2b7-5314a7af7538",
      "operatorId":"05057304-ad29-4858-aa9e-08dfd552bdce",
      "status":    "customs_approved",
      "origin":    "Luanda, Angola",
      "destination":"Lusaka, Zambia",
      "eta":       "2026-06-20T00:00:00.000Z",
      "lastLocation":"Fronteira Luau",
      "trackingEvents": [
        {
          "timestamp": "2026-05-12T16:40:03.998Z",
          "location":  "Porto de Luanda",
          "status":    "in_transit",
          "updatedBy": "05057304-ad29-4858-aa9e-08dfd552bdce",
          "notes":     "Carga embarcada no navio MV Lobito."
        },
        {
          "timestamp": "2026-05-12T16:40:08.735Z",
          "location":  "Fronteira Luau",
          "status":    "at_border",
          "updatedBy": "05057304-ad29-4858-aa9e-08dfd552bdce",
          "notes":     "Aguarda inspecção aduaneira."
        }
      ],
      "holdReason": null,
      "customsDispatch": {
        "id":            "f77e717e-b15e-4fab-918e-1c17d9f4dcb6",
        "cd":            "DSP-0004",
        "shipmentId":    "9e42efa3-7ce8-40be-9d0d-c33ecf7acd4f",
        "dispatcherId":  "021391be-f4ef-43c3-8f2d-d3b7de016de8",
        "status":        "approved",
        "notes":         "Documentação verificada. Manifesto conforme. Mercadoria liberada.",
        "rejectionReason": null,
        "validatedAt":   "2026-05-12T16:40:14.000Z"
      },
      "order": {
        "id":     "21a26d82-8597-4fdf-a2b7-5314a7af7538",
        "cd":     "ORD-0012",
        "status": "paid"
      },
      "createdAt": "2026-05-12T16:39:56.729Z",
      "updatedAt": "2026-05-12T16:40:14.749Z"
    }
  ],
  "meta": {
    "total": 4,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### GET /shipments/order/:orderId
**Roles:** `state` · `staff` · `buyer` · `operator` · `customs` · `compliance`

**Principal uso:** BUYER acompanha o seu embarque via `orderId`.

```
GET /shipments/order/21a26d82-8597-4fdf-a2b7-5314a7af7538
Authorization: Bearer <buyer_token>
```

**Response 200:**
```json
{
  "id":          "9e42efa3-7ce8-40be-9d0d-c33ecf7acd4f",
  "cd":          "SHP-0004",
  "orderId":     "21a26d82-8597-4fdf-a2b7-5314a7af7538",
  "status":      "customs_approved",
  "origin":      "Luanda, Angola",
  "destination": "Lusaka, Zambia",
  "eta":         "2026-06-20T00:00:00.000Z",
  "lastLocation":"Fronteira Luau",
  "trackingEvents": [
    {
      "timestamp": "2026-05-12T16:40:03.998Z",
      "location":  "Porto de Luanda",
      "status":    "in_transit",
      "updatedBy": "05057304-ad29-4858-aa9e-08dfd552bdce",
      "notes":     "Carga embarcada no navio MV Lobito."
    },
    {
      "timestamp": "2026-05-12T16:40:08.735Z",
      "location":  "Fronteira Luau",
      "status":    "at_border",
      "updatedBy": "05057304-ad29-4858-aa9e-08dfd552bdce",
      "notes":     "Aguarda inspecção aduaneira."
    }
  ],
  "holdReason": null,
  "operator": {
    "id":       "05057304-ad29-4858-aa9e-08dfd552bdce",
    "fullName": "Logistics Operator"
  },
  "customsDispatch": {
    "id":            "f77e717e-b15e-4fab-918e-1c17d9f4dcb6",
    "cd":            "DSP-0004",
    "status":        "approved",
    "notes":         "Documentação verificada. Manifesto conforme. Mercadoria liberada.",
    "validatedAt":   "2026-05-12T16:40:14.000Z"
  },
  "createdAt": "2026-05-12T16:39:56.729Z",
  "updatedAt": "2026-05-12T16:40:14.749Z"
}
```

**Erros:**
```json
{ "statusCode": 403, "message": "Acesso negado — este pedido não lhe pertence" }
{ "statusCode": 404, "message": "Este pedido ainda não tem embarque associado" }
{ "statusCode": 404, "message": "Pedido não encontrado" }
```

---

### GET /logs/suspicious-activities
**Roles:** `state` · `compliance` · Sem params

Retorna últimos 200 eventos de acções críticas automáticas.

**Response 200:**
```json
[
  {
    "id":         "f274c8db-87ea-4259-980e-d1ab115154ce",
    "cd":         "LOG-0070",
    "userId":     "41bafc86-f90b-4fad-a8c3-3bc6cda15ded",
    "role":       "state",
    "action":     "BLOCK_TRANSACTION",
    "entity":     "transaction",
    "entityId":   "0f32b793-1b6a-4b77-9ede-03175cc19c9d",
    "beforeJson": "{\"status\":\"completed\"}",
    "afterJson":  "{\"status\":\"blocked\",\"reason\":\"Transação sinalizada pelo COMPLIANCE.\"}",
    "meta":       null,
    "ipAddress":  null,
    "createdAt":  "2026-05-12T16:39:26.667Z"
  }
]
```

> `beforeJson` e `afterJson` são strings JSON — fazer parse no frontend:
> ```javascript
> const before = log.beforeJson ? JSON.parse(log.beforeJson) : null;
> const after  = log.afterJson  ? JSON.parse(log.afterJson)  : null;
> ```

**Acções incluídas automaticamente:**
```
BLOCK_ORDER · CANCEL_ORDER · BLOCK_TRANSACTION · CANCEL_TRANSACTION
SUSPEND_COMPANY · REVOKE_COMPANY · REJECT_LICENSE
HOLD_SHIPMENT · CUSTOMS_REJECT · VALIDATE_DOCS_FAIL
```

---

### GET /logs — novo filtro por `action`

Campo `action` adicionado aos query params existentes.

```
GET /logs?action=BLOCK_ORDER
GET /logs?entity=order&action=PAY_ORDER
GET /logs?entity=company&entityId=uuid&action=APPROVE_LICENSE
```

---

## 🔒 Correcções de Segurança

| # | Problema resolvido | Como fica agora |
|---|-------------------|-----------------|
| 1 | `POST /companies` sem autenticação — qualquer pessoa criava empresas | Requer JWT |
| 2 | `GET /orders/:id` — BUYER via qualquer pedido | BUYER restrito aos seus pedidos → 403 |
| 3 | `compliance` não acedia a audit logs | `compliance` adicionado ao `GET /logs` e `GET /logs/:id` |

---

## 🔄 Alterações de Regras de Negócio

### 1. Validações do pedido movidas para o create()

| Validação | Antes | Agora |
|-----------|-------|-------|
| Produto `published_official` | Só verificado no `pay()` | Verificado no `create()` |
| Price proposal vigente existe | Só verificado no `pay()` | Verificado no `create()` |
| Empresa com licença activa | Só verificado no `pay()` | Verificado no `create()` |

Resultado: um pedido em `draft` é sempre válido. Erros são detectados na criação, não no pagamento.

### 2. `unitPrice` preenchido no draft

Antes, todas as linhas tinham `unitPrice: 0` no `draft`. Agora têm o valor real do snapshot.

### 3. CUSTOMS pode listar embarques

`GET /shipments` e `GET /shipments/:id` agora acessíveis ao `customs`.  
Suporta filtro: `GET /shipments?status=at_border`

### 4. `approve-publication` aceita `staff_validated` e `pending_review`

Para manter compatibilidade retroactiva com produtos anteriores à migração.

---

## 🆕 Novo Enum Value: `staff_validated`

Adicionado ao enum `ProductStatus`.

```
draft → pending_review → staff_validated → published_official
```

Frontend deve adicionar tratamento para este estado:

```javascript
const PRODUCT_STATUS = {
  draft:              { label: 'Rascunho',               color: 'gray'   },
  pending_review:     { label: 'Aguarda STAFF',          color: 'yellow' },
  staff_validated:    { label: 'Validado pelo STAFF',    color: 'blue'   }, // NOVO
  published_official: { label: 'Publicado',              color: 'green'  },
  rejected:           { label: 'Rejeitado',              color: 'red'    },
  suspended:          { label: 'Suspenso',               color: 'orange' },
};
```

---

## 🔑 Nova Conta de Desenvolvimento

| Email | Password | Role |
|-------|----------|------|
| `admin@lobito.gov` | `Lobito@Dev2024!` | `admin` |

---

## Novos Audit Actions

```
STAFF_VALIDATE_PRODUCT_OK      — STAFF validou produto (staff_validated)
STAFF_VALIDATE_PRODUCT_FAIL    — STAFF devolveu ao PRODUCER (pending_review)
STAFF_FORWARD_PRODUCT_TO_STATE — STAFF encaminhou produto ao STATE
REVOKE_COMPANY                 — STATE revogou licença permanentemente
ESCALATE_TO_STATE              — STAFF escalou pedido ao STATE
UPDATE_ORDER                   — BUYER editou linhas do pedido em draft
CREATE_USER                    — ADMIN criou utilizador
UPDATE_USER                    — ADMIN actualizou utilizador
BLOCK_USER                     — STATE bloqueou utilizador
UNBLOCK_USER                   — STATE desbloqueou utilizador
UPDATE_USER_ROLE               — ADMIN alterou role de utilizador
```

---

*Corredor do Lobito · Changelog Frontend · 2026-05-12*
