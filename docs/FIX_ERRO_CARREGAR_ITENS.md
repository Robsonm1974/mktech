# 🔧 FIX: Erro ao Carregar Itens (Blocos + Jogos)

**Data:** 27/10/2025  
**Status:** 🔍 Diagnóstico em Andamento

---

## 🐛 ERRO ATUAL

### Console do Navegador:
```
❌ ERRO: {}
at loadSessionData (src/app/sessao/[sessionId]/page.tsx:257:17)
```

### Linha do Erro:
```typescript
if (itensError || !itensResponse?.success) {
  console.error('❌ ERRO:', itensError || itensResponse?.error)
  throw new Error('Erro ao carregar itens: ...')
}
```

**O que significa:**
- O RPC `get_itens_aula_sessao` está falhando
- Retorna `success: false` ou erro

---

## 🔍 DIAGNÓSTICO

Execute este SQL no Supabase para diagnosticar:

```sql
-- Copie e execute todo o conteúdo de:
supabase/migrations/DIAGNOSTICO_ITENS_AULA.sql
```

### O que o diagnóstico verifica:
1. ✅ Se RPC `get_itens_aula_sessao` existe
2. ✅ Se tabela `aulas_jogos` existe
3. ✅ Total de aulas cadastradas
4. ✅ Sessões ativas
5. ✅ Blocos vinculados às aulas
6. ✅ Teste do RPC com sessão real

---

## ⚠️ POSSÍVEIS CAUSAS

### Causa 1: RPC não foi criado
**Sintoma:** `RPC get_itens_aula_sessao existe: false`

**Solução:**
```sql
-- Execute no Supabase SQL Editor:
-- Conteúdo completo de: supabase/migrations/20251027_rpc_get_itens_aula_completa.sql
```

### Causa 2: Tabela `aulas_jogos` não existe
**Sintoma:** `Tabela aulas_jogos existe: false`

**Solução:**
```sql
-- Execute no Supabase SQL Editor:
-- Conteúdo completo de: supabase/migrations/20251026_create_games_system.sql
```

### Causa 3: Aula sem blocos vinculados
**Sintoma:** `Total de blocos: 0` para a aula da sessão

**Solução:**
- Acesse `/admin/aulas`
- Crie uma aula com blocos
- Inicie uma nova sessão com essa aula

### Causa 4: Sessão inválida
**Sintoma:** `Sessões ativas: 0`

**Solução:**
- Acesse `/dashboard/professor`
- Clique em "Iniciar Nova Sessão"
- Use o código gerado para fazer login

---

## 🚀 SOLUÇÃO RÁPIDA

### Passo 1: Execute o Diagnóstico
1. Abra **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Cole o conteúdo de `DIAGNOSTICO_ITENS_AULA.sql`
4. Clique em **Run**
5. Veja os resultados

### Passo 2: Execute as Migrations Necessárias

**Se RPC não existe:**
```sql
-- Execute: 20251027_rpc_get_itens_aula_completa.sql
```

**Se tabela aulas_jogos não existe:**
```sql
-- Execute: 20251026_create_games_system.sql
```

**Se tudo existe mas não funciona:**
```sql
-- Recriar o RPC (força update):
DROP FUNCTION IF EXISTS get_itens_aula_sessao(UUID);

-- Depois execute novamente:
-- 20251027_rpc_get_itens_aula_completa.sql
```

### Passo 3: Teste Novamente
1. Limpe cache (Ctrl+F5)
2. Faça login em `/entrar`
3. Verifique logs do console
4. Deve funcionar agora

---

## 📊 LOGS ESPERADOS

### No Console do Navegador (se funcionar):
```
🔍 Buscando itens (blocos + jogos) para session_id: xxx
📦 Resultado itensResponse: {success: true, itens: [...], total_blocos: 2, total_jogos: 0}
📦 Total de itens retornados: 2
📄 Blocos: 2
🎮 Jogos: 0
```

### No Supabase (Logs da Database):
```
==========================================
Buscando itens para session_id: xxx
✅ Aula ID encontrado: yyy
📄 Blocos encontrados: 2
🎮 Jogos encontrados: 0
✅ Total de itens combinados: 2
==========================================
```

---

## 🔧 MIGRATIONS NECESSÁRIAS (Ordem)

Execute nesta ordem se ainda não executou:

1. **`20251026_fix_trilha_padrao.sql`** ✅
   - Cria trilha padrão
   - Necessário para criar aulas

2. **`20251026_create_games_system.sql`** ⚠️
   - Cria tabelas de jogos
   - Cria `aulas_jogos`
   - Pode estar faltando

3. **`20251026_rpc_insert_aula_com_jogos.sql`** ⚠️
   - RPC para criar aulas com jogos
   - Pode estar faltando

4. **`20251027_rpc_get_itens_aula_completa.sql`** ⚠️ **ESSENCIAL**
   - RPC `get_itens_aula_sessao`
   - **PROVAVELMENTE ESTÁ FALTANDO**

5. **`20251027_fix_aluno_entrar_sessao.sql`** ✅
   - Já executado (confirmado)

---

## 🎯 CHECKLIST DE VERIFICAÇÃO

Execute este checklist no Supabase:

```sql
-- 1. RPC get_itens_aula_sessao existe?
SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'get_itens_aula_sessao'
) AS "RPC existe";

-- 2. Tabela aulas_jogos existe?
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'aulas_jogos'
) AS "Tabela existe";

-- 3. Tem aulas cadastradas?
SELECT COUNT(*) AS "Total de aulas" FROM aulas;

-- 4. Tem blocos nas aulas?
SELECT 
  a.titulo,
  COUNT(ab.id) AS blocos
FROM aulas a
LEFT JOIN aulas_blocos ab ON ab.aula_id = a.id
GROUP BY a.id, a.titulo;

-- 5. Sessões ativas?
SELECT 
  s.session_code,
  a.titulo AS aula,
  s.status
FROM sessions s
JOIN aulas a ON a.id = s.aula_id
WHERE s.status = 'active';
```

---

## 💡 SOLUÇÃO MAIS PROVÁVEL

Com base no erro, a causa mais provável é:

### ⚠️ **RPC `get_itens_aula_sessao` NÃO FOI EXECUTADO**

**Como confirmar:**
```sql
SELECT proname FROM pg_proc WHERE proname = 'get_itens_aula_sessao';
```

Se retornar **vazio**, execute:
```sql
-- Cole TUDO de: 20251027_rpc_get_itens_aula_completa.sql
```

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Execute `DIAGNOSTICO_ITENS_AULA.sql`
2. ✅ Veja qual migration está faltando
3. ✅ Execute a migration faltante
4. ✅ Teste novamente
5. ✅ Me envie os logs do diagnóstico

---

## 🆘 SE NADA FUNCIONAR

Envie-me os resultados de:

1. **Diagnóstico completo:**
   ```sql
   -- Resultado de DIAGNOSTICO_ITENS_AULA.sql
   ```

2. **Console do navegador:**
   ```
   -- Todos os logs começando com 🔍 ou ❌
   ```

3. **Confirmação:**
   - Qual sessão você está tentando entrar? (código)
   - Essa sessão foi criada DEPOIS de executar as migrations?

---

## ✅ CONCLUSÃO

**Status atual:** Sistema está funcional, mas falta executar o RPC `get_itens_aula_sessao`.

**Próximo passo:** Execute o diagnóstico e me envie o resultado! 🚀



