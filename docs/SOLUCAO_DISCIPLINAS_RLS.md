# ✅ Solução: Disciplinas Não Carregam no Browser

## 📊 Diagnóstico SQL: PERFEITO ✅

Você executou o diagnóstico e TUDO está OK:
- ✅ 5 disciplinas cadastradas (ALG, ING, LOG, MAT, PRG)
- ✅ RLS habilitado
- ✅ 2 políticas RLS ativas
- ✅ Usuário mk-admin@mktech.com autenticado
- ✅ Role superadmin correto

## 🔍 Problema Identificado

O problema é que **o browser não está enviando o token de autenticação** nas requisições para o Supabase.

### Por Que Isso Acontece?

1. **Sessão expirou** - Cookies de sessão expiraram
2. **Cookies não estão sendo enviados** - Problema de domínio/CORS
3. **Cliente Supabase não tem acesso à sessão** - Problema de storage

## 🚀 Solução em 3 Passos

### Passo 1: Fazer Logout e Login Novamente

1. Vá para `/admin/login`
2. Se já estiver logado, clique em "Sair" no canto superior direito
3. Faça login novamente:
   - **Email:** `mk-admin@mktech.com`
   - **Senha:** `#1Salo4#2025`

### Passo 2: Abrir o Console do Navegador

Após fazer login, vá para `/admin/blocos/importar` e abra o **DevTools (F12)** → **Console**.

Você verá logs detalhados:

```
🔐 Verificação de sessão: {
  hasSession: true/false,
  userId: "...",
  userEmail: "mk-admin@mktech.com"
}

🔧 Cliente Supabase: {
  url: "https://kcvlauuzwnrfdgwlxcnw.supabase.co",
  hasClient: true
}

📊 Primeira tentativa: {
  hasData: true/false,
  dataLength: 5,
  status: 200,
  errorCode: ...,
  errorMessage: ...,
  fullError: "...",
  rawData: [...]
}
```

### Passo 3: Analisar os Logs

**Cenário 1: hasSession = false**
```
🔐 Verificação de sessão: { hasSession: false }
❌ Nenhuma sessão ativa!
```
**Solução:** Faça login novamente em `/admin/login`

---

**Cenário 2: hasSession = true, mas data vazio**
```
🔐 Verificação de sessão: { hasSession: true, userEmail: "mk-admin@mktech.com" }
📊 Primeira tentativa: { hasData: false, errorCode: "PGRST..." }
```
**Solução:** Copie o `errorCode`, `errorMessage` e `fullError` completos e me envie!

---

**Cenário 3: Sucesso!**
```
🔐 Verificação de sessão: { hasSession: true }
📊 Primeira tentativa: { hasData: true, dataLength: 5 }
✅ Disciplinas carregadas: 5
```
**Resultado:** O select deve aparecer preenchido com as 5 disciplinas!

---

## 🔧 Debug Adicional (Se Ainda Não Funcionar)

### Verificar Cookies no Browser

1. Abra DevTools (F12) → **Application** → **Cookies**
2. Procure por cookies do domínio `localhost:3000` ou seu ngrok
3. Deve ter cookies como:
   - `sb-<project-ref>-auth-token`
   - `sb-<project-ref>-auth-token-code-verifier`

Se não tiver esses cookies, a sessão não está sendo salva.

### Verificar Local Storage

1. DevTools (F12) → **Application** → **Local Storage**
2. Deve ter chaves como:
   - `sb-<project-ref>-auth-token`

### Verificar Configuração CORS (Se usar ngrok)

Se você está usando ngrok, adicione no `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://seu-dominio.ngrok-free.app
```

E adicione no `next.config.ts`:

```ts
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
        { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_SITE_URL || '*' },
      ],
    },
  ]
}
```

---

## 📝 Próximos Passos

1. ✅ **Faça logout e login novamente** em `/admin/login`
2. ✅ **Vá para** `/admin/blocos/importar`
3. ✅ **Abra o Console (F12)** e copie TODOS os logs que aparecerem
4. ✅ **Me envie os logs** para eu analisar

---

## 🆘 Atalho: Query Direta de Teste

Se quiser testar rapidamente, adicione este botão temporário na página:

```tsx
<Button onClick={async () => {
  const { data, error } = await supabase.from('disciplinas').select('*')
  console.log('Teste direto:', { data, error })
  alert(data ? `Sucesso: ${data.length} disciplinas` : `Erro: ${error?.message}`)
}}>
  Testar Query Direta
</Button>
```

---

**Aguardo os logs do console!** 🚀














