# 🔧 Correção: Problema de Sessão Expirando Rapidamente

## 🐛 **Problema Identificado:**

- Usuário precisa fazer login novamente após alguns minutos
- Navegação entre páginas fica travada em "Carregando..."
- Sessão expira muito rápido

## 🎯 **Causas Identificadas:**

### 1️⃣ **JWT Token com Duração Curta (Padrão: 1 hora)**
O Supabase por padrão configura o JWT para expirar em 1 hora (3600 segundos).

### 2️⃣ **Sem Refresh Automático**
O código não estava fazendo refresh automático da sessão ao navegar entre páginas.

### 3️⃣ **Middleware Fazendo Queries Desnecessárias**
A cada navegação, o middleware fazia uma query no banco para verificar a role do usuário, causando:
- Lentidão na navegação
- Possível timeout
- Expiração prematura da sessão

---

## ✅ **Correções Aplicadas:**

### 1️⃣ **Middleware Otimizado (`src/middleware.ts`)**

**ANTES:**
```typescript
// Sempre fazia query no banco
const { data: user } = await supabase
  .from('users')
  .select('role')
  .eq('auth_id', session.user.id)
  .single()
```

**DEPOIS:**
```typescript
// 1. Refresh automático da sessão
if (session) {
  await supabase.auth.refreshSession()
}

// 2. Cache da role (usa metadata quando disponível)
const userRole = session.user.user_metadata?.role || session.user.app_metadata?.role

// 3. Só faz query se necessário
if (userRole === 'superadmin') {
  return supabaseResponse // ✅ Rápido, sem query
}
```

**Benefícios:**
- ✅ Refresh automático a cada navegação
- ✅ Menos queries no banco (mais rápido)
- ✅ Sessão se mantém viva

---

### 2️⃣ **Client Browser Configurado (`src/lib/supabase/client-browser.ts`)**

**Adicionado:**
```typescript
createBrowserClient(url, key, {
  auth: {
    autoRefreshToken: true,        // ✅ Refresh automático antes de expirar
    persistSession: true,           // ✅ Mantém sessão entre abas
    detectSessionInUrl: true,       // ✅ Detecta sessão na URL
    storage: window.localStorage,   // ✅ Usa localStorage
    flowType: 'pkce'               // ✅ Fluxo de autenticação seguro
  }
})
```

**Benefícios:**
- ✅ Token é renovado automaticamente antes de expirar
- ✅ Sessão persiste entre abas do navegador
- ✅ Sessão persiste após reload da página
- ✅ Mais seguro (PKCE flow)

---

### 3️⃣ **Aumentar Duração do JWT no Supabase Dashboard**

#### **Passos:**

1. **Acesse o Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/[SEU_PROJECT_ID]
   ```

2. **Vá em: Authentication > Configuration**

3. **JWT Settings:**
   ```
   JWT Expiry Time: 86400    (24 horas em vez de 1 hora)
   ```

4. **Refresh Token Settings:**
   ```
   Refresh Token Expiry: 2592000  (30 dias - padrão, OK)
   ```

5. **Clique em "Save"**

#### **Resultado:**
- ✅ Token JWT válido por 24 horas
- ✅ Refresh token válido por 30 dias
- ✅ Usuário não precisa fazer login frequentemente

---

## 📊 **Como Funciona Agora:**

### **Fluxo de Navegação:**

```
Usuário navega para outra página
         ↓
Middleware intercepta requisição
         ↓
Verifica se tem sessão
         ↓
┌────────┴────────┐
│ TEM SESSÃO?     │
└────────┬────────┘
         │
    ┌────┴────┐
    │   SIM   │
    └────┬────┘
         │
    Refresh automático da sessão
         ↓
    Verifica role (usa cache/metadata)
         ↓
    ✅ Permite acesso (RÁPIDO!)
         ↓
    Página carrega normalmente
```

### **Refresh Automático:**

```
A cada navegação:
  1. Middleware faz refresh da sessão
  2. Token é renovado (se necessário)
  3. Cookies são atualizados
  4. Sessão continua viva

Quando token está perto de expirar:
  1. autoRefreshToken detecta
  2. Faz refresh automático
  3. Novo token é obtido
  4. Usuário nem percebe!
```

---

## 🧪 **Como Testar:**

### **Teste 1: Verificar Configuração Atual**

Execute no Supabase SQL Editor:
```sql
supabase/migrations/INCREASE_SESSION_DURATION.sql
```

Verifique:
- ✅ Status RLS (deve estar desabilitado)
- ✅ Índices existentes
- ✅ Políticas ativas

### **Teste 2: Navegação Entre Páginas**

1. Faça login em `/admin/login`
2. Navegue para `/admin/blocos`
3. Navegue para `/admin/blocos/importar`
4. Navegue para `/admin/quizzes/criar?bloco=xxx`
5. Volte para `/admin/blocos`

**Resultado esperado:**
- ✅ Navegação rápida e fluida
- ✅ Sem tela de "Carregando..." travada
- ✅ Sem redirecionamento para login

### **Teste 3: Sessão Longa**

1. Faça login
2. Deixe o navegador aberto (mas sem usar o sistema)
3. Aguarde 15-20 minutos
4. Volte e navegue entre páginas

**Resultado esperado (ANTES das mudanças no Dashboard):**
- ⚠️ Pode precisar fazer login novamente após 1 hora

**Resultado esperado (DEPOIS das mudanças no Dashboard):**
- ✅ Sessão continua ativa por até 24 horas
- ✅ Refresh automático mantém sessão viva

### **Teste 4: Múltiplas Abas**

1. Faça login em uma aba
2. Abra outra aba do mesmo site
3. Navegue nas duas abas

**Resultado esperado:**
- ✅ Sessão compartilhada entre abas
- ✅ Login em uma aba funciona na outra
- ✅ Logout em uma aba desloga da outra

---

## 🔍 **Logs para Debugar:**

### **Console do Navegador (F12):**

Você verá logs como:
```
🔧 Supabase Client Config:
URL: https://kcv1auuzwnrfdpw1xcnu.supabase.co
Key (primeiros 20 chars): eyJhbGciOiJIUzI1NiIs...

✅ Sessão ativa detectada
✅ Token renovado automaticamente
```

### **Middleware (Server):**

Se adicionar logs:
```typescript
console.log('🔒 Middleware:', {
  path: request.nextUrl.pathname,
  hasSession: !!session,
  userRole: session?.user.user_metadata?.role
})
```

---

## ⚙️ **Configurações Recomendadas:**

### **Desenvolvimento:**
```
JWT Expiry: 86400 (24 horas)
Refresh Token: 2592000 (30 dias)
autoRefreshToken: true
persistSession: true
```

### **Produção:**
```
JWT Expiry: 3600 (1 hora) - mais seguro
Refresh Token: 604800 (7 dias)
autoRefreshToken: true
persistSession: true
```

---

## 📝 **Checklist de Correções:**

- [x] Middleware otimizado com refresh automático
- [x] Client browser configurado com autoRefreshToken
- [x] Cache de role usando metadata
- [x] persistSession habilitado
- [x] Documentação criada
- [ ] JWT Expiry aumentado no Supabase Dashboard (manual)
- [ ] Testar navegação fluida
- [ ] Testar sessão longa (24h)
- [ ] Testar múltiplas abas

---

## 🚨 **Se Ainda Tiver Problemas:**

### **1. Limpar Cache e Cookies:**
```javascript
// No Console do Navegador (F12)
localStorage.clear()
location.reload()
```

### **2. Verificar Network Tab:**
```
F12 > Network > Auth requests
Procure por: /auth/v1/token?grant_type=refresh_token
Status: 200 OK ✅
```

### **3. Verificar Supabase Dashboard:**
```
Authentication > Users
Veja se seu usuário está ativo
Veja "Last Sign In" timestamp
```

---

## 📚 **Referências:**

- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [JWT Token Settings](https://supabase.com/docs/guides/auth/sessions/jwt-tokens)
- [Auto Refresh Tokens](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)

---

**Última atualização:** 2025-01-17  
**Status:** ✅ Código atualizado | ⚠️ Aguardando configuração no Dashboard

