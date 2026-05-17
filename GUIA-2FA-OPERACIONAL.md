# Corredor do Lobito — Guia Operacional 2FA
> **Audiência:** Frontend · Integradores · Operadores governamentais  
> **Tecnologia:** TOTP (RFC 6238) — compatível com Google Authenticator, Authy, Microsoft Authenticator  
> **Roles obrigados:** `state` · `staff` · `specialist` · `compliance`  
> **Roles isentos:** `buyer` · `producer` · `operator` · `analyst` · `customs` · `admin`

---

## Conceito

O 2FA é um segundo factor de autenticação baseado em tempo (TOTP). Funciona assim:

1. O servidor gera um **segredo único** para o utilizador
2. O utilizador regista esse segredo numa **app autenticadora** (Google Authenticator, Authy, etc.)
3. A cada 30 segundos, a app gera um **código de 6 dígitos** diferente
4. No login, o utilizador introduz esse código — o servidor verifica se é válido para aquele momento

O código expira ao fim de 30 segundos. O servidor aceita uma janela de ±30 segundos para compensar diferenças de relógio.

---

## Os 4 Endpoints e Quando Usar Cada Um

```
POST /auth/2fa/setup     → Usar UMA VEZ — quando o utilizador nunca configurou 2FA
POST /auth/2fa/verify    → Usar UMA VEZ — para confirmar que o setup foi feito correctamente
POST /auth/2fa/validate  → Usar EM CADA LOGIN — quando o 2FA já está activo
POST /auth/2fa/disable   → Usar quando o utilizador quer desactivar o 2FA
```

---

## CENÁRIO 1 — Primeiro login após criar conta governamental

O utilizador governamental (STATE, STAFF, SPECIALIST, COMPLIANCE) faz login pela primeira vez. O 2FA ainda não está configurado.

### PASSO 1 — Login normal

```
POST /auth/login
Content-Type: application/json

{
  "email": "staff@lobito.gov",
  "password": "StaffPass123!"
}
```

**Resposta — note o `twoFactorSetup: true`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "requires2fa": true,
  "twoFactorSetup": true,
  "user": {
    "id": "uuid-do-staff",
    "email": "staff@lobito.gov",
    "role": "staff",
    "fullName": "Nome STAFF"
  }
}
```

> O `access_token` é devolvido mas o frontend **deve obrigar** o utilizador a configurar o 2FA antes de aceder ao sistema. `twoFactorSetup: true` é o sinal para redireccionar para o ecrã de configuração.

---

### PASSO 2 — Gerar QR Code (`POST /auth/2fa/setup`)

```
POST /auth/2fa/setup
Authorization: Bearer <access_token do passo 1>
```

**Sem body.** O servidor gera o segredo e devolve o QR code.

**Resposta:**
```json
{
  "secret": "IBWDOJL5ORBTOVDIMRUES2C5HNFTSSJV",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "message": "Escaneia o QR code com o Google Authenticator ou Authy. Depois chama POST /auth/2fa/verify com o código gerado."
}
```

**O que fazer no frontend:**

```html
<!-- Mostrar o QR code como imagem -->
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." alt="QR Code 2FA" />

<!-- Mostrar o segredo em texto para quem não consegue escanear -->
<p>Código manual: IBWDOJL5ORBTOVDIMRUES2C5HNFTSSJV</p>
```

O utilizador abre o Google Authenticator → toca em "+" → "Digitalizar código QR" → aponta para o ecrã.

---

### PASSO 3 — Confirmar setup (`POST /auth/2fa/verify`)

Após escanear o QR, a app mostra um código de 6 dígitos. O utilizador introduz esse código para confirmar que o setup funcionou.

```
POST /auth/2fa/verify
Authorization: Bearer <access_token do passo 1>
Content-Type: application/json

{
  "code": "482951"
}
```

**Resposta (200):**
```json
{
  "message": "2FA activado com sucesso. Todos os logins futuros exigirão o código do autenticador."
}
```

**Erros possíveis:**
```json
{ "statusCode": 401, "message": "Código inválido. Verifique o relógio do dispositivo e tente novamente." }
{ "statusCode": 400, "message": "Segredo 2FA não encontrado. Chame POST /auth/2fa/setup primeiro." }
{ "statusCode": 400, "message": "O 2FA já está activado." }
```

> A partir deste momento, todos os logins futuros desta conta exigirão o código do autenticador.

---

## CENÁRIO 2 — Login com 2FA activo (uso diário)

Este é o fluxo normal de cada dia para utilizadores governamentais com 2FA configurado.

### PASSO 1 — Login normal

```
POST /auth/login
Content-Type: application/json

{
  "email": "state@lobito.gov",
  "password": "StatePass123!"
}
```

**Resposta — `tempToken` em vez de `access_token`:**
```json
{
  "requires2fa": true,
  "twoFactorSetup": false,
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1dWlkIiwidHdvRmFjdG9yUGVuZGluZyI6dHJ1ZX0...",
  "message": "Introduza o código do autenticador para concluir o login."
}
```

> **Atenção:** Não há `access_token` nesta resposta. O `tempToken` só serve para chamar `/auth/2fa/validate`. Expira em **5 minutos**.

**Lógica no frontend:**
```javascript
const response = await login(email, password);

if (response.requires2fa && !response.twoFactorSetup) {
  // 2FA activo → pedir código ao utilizador
  mostrarEcra2FA(response.tempToken);
} else if (response.requires2fa && response.twoFactorSetup) {
  // 2FA não configurado → redireccionar para setup
  redireccionar('/auth/2fa/setup');
} else {
  // Role sem 2FA → login completo
  guardarToken(response.access_token);
}
```

---

### PASSO 2 — Validar código (`POST /auth/2fa/validate`)

O utilizador abre o Google Authenticator, lê o código de 6 dígitos e submete.

```
POST /auth/2fa/validate
Content-Type: application/json

{
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "code": "739204"
}
```

> **Sem Authorization header** — este endpoint é público. A identidade é provada pelo `tempToken`.

**Resposta (200) — login completo:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-do-state",
    "email": "state@lobito.gov",
    "role": "state",
    "fullName": "STATE Admin",
    "phone": null,
    "companyId": null
  }
}
```

**Erros possíveis:**
```json
{ "statusCode": 401, "message": "Código inválido." }
{ "statusCode": 401, "message": "Token temporário inválido ou expirado." }
```

> Se o `tempToken` expirou (passou mais de 5 minutos), o utilizador tem de fazer login de novo desde o início.

---

## CENÁRIO 3 — Desactivar 2FA

O utilizador quer desactivar o 2FA (ex: mudança de dispositivo, perda do telemóvel após recuperação de conta pelo admin).

> **Atenção:** Para desactivar, é necessário ter sessão activa (`access_token`) E o código do autenticador. Isto garante que ninguém desactiva o 2FA com a conta comprometida.

```
POST /auth/2fa/disable
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "code": "591847"
}
```

**Resposta (200):**
```json
{
  "message": "2FA desactivado. O login voltará a exigir apenas email e password."
}
```

**Erros possíveis:**
```json
{ "statusCode": 401, "message": "Código inválido. Confirme com o autenticador antes de desactivar." }
{ "statusCode": 400, "message": "O 2FA não está activado nesta conta." }
```

> Após desactivar, o próximo login devolverá `access_token` + `twoFactorSetup: true` — o utilizador pode configurar 2FA novamente.

---

## Tabela de decisão — o que fazer com cada resposta do login

| `requires2fa` | `twoFactorSetup` | `access_token` | `tempToken` | Acção |
|:---:|:---:|:---:|:---:|---|
| `false` | `false` | ✅ presente | ❌ | Login completo. Guardar `access_token`. |
| `true` | `true` | ✅ presente | ❌ | 2FA obrigatório mas não configurado. Ir para `/auth/2fa/setup`. |
| `true` | `false` | ❌ | ✅ presente | 2FA activo. Pedir código ao utilizador. Chamar `/auth/2fa/validate`. |

---

## Erros comuns e como resolver

| Erro | Causa | Solução |
|---|---|---|
| `"Código inválido"` | Código errado ou já expirou (30s) | Aguardar o próximo código na app e tentar novamente |
| `"Token temporário inválido ou expirado"` | Passaram mais de 5 minutos desde o login | Fazer login novamente desde o início |
| `"Segredo 2FA não encontrado. Chame /auth/2fa/setup primeiro"` | Tentou `/verify` sem ter feito `/setup` antes | Chamar `/auth/2fa/setup` primeiro |
| `"O 2FA já está activado"` | Tentou fazer setup quando já estava activo | Não é necessário fazer setup novamente |
| `"O role X não requer 2FA"` | Role `buyer`, `producer`, etc. tentou fazer setup | Estes roles não usam 2FA |
| `"Verifique o relógio do dispositivo"` | Relógio do telemóvel desincronizado | Activar "Hora automática" nas definições do telemóvel |

---

## Fluxo visual completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    POST /auth/login                             │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
      role sem 2FA                    role com 2FA
   (buyer, producer...)          (state, staff, specialist,
              │                      compliance)
              │                               │
       access_token                           │
       (login completo)         ┌─────────────┴──────────────┐
                                │                            │
                         2FA não activo               2FA activo
                         twoFactorSetup: true         tempToken (5min)
                                │                            │
                                ▼                            ▼
                      POST /auth/2fa/setup       Utilizador abre app
                      (sem body)                 e lê código de 6 dig.
                                │                            │
                       qrCode + secret                       ▼
                                │              POST /auth/2fa/validate
                       Escanear QR na app      { tempToken, code }
                                │                            │
                                ▼                            ▼
                      POST /auth/2fa/verify          access_token
                      { code: "123456" }          (login completo)
                                │
                      "2FA activado com sucesso"
                      (próximos logins: cenário 2)
```

---

## Recuperação de conta (perda de acesso ao autenticador)

Se o utilizador perder o telemóvel ou a app autenticadora, **não consegue gerar o código** e fica bloqueado.

**Procedimento:**
1. O utilizador contacta o ADMIN
2. O ADMIN usa `PUT /users/:id` e define `twoFactorEnabled: false` directamente na BD, ou um endpoint de reset reservado ao ADMIN
3. O utilizador faz login normal → `twoFactorSetup: true` → configura 2FA novamente com novo dispositivo

> **Nota para o frontend:** Mostrar sempre uma mensagem clara no ecrã de 2FA: *"Perdeu o acesso ao autenticador? Contacte o administrador do sistema."*

---

## Apps autenticadoras recomendadas

| App | Plataforma | Download |
|---|---|---|
| **Google Authenticator** | iOS / Android | App Store / Google Play |
| **Authy** | iOS / Android / Desktop | authy.com |
| **Microsoft Authenticator** | iOS / Android | App Store / Google Play |

Qualquer app compatível com **TOTP (RFC 6238)** funciona.

---

*Corredor do Lobito · Guia Operacional 2FA · 2026-05-16*
