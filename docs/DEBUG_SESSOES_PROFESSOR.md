# 🐛 Debug: Erro ao Carregar Sessões do Professor

**Data:** 24/10/2024  
**Erro:** `Erro ao carregar sessões: {}`  
**Status:** 🔴 EM INVESTIGAÇÃO  

---

## 📋 Problema

Ao acessar `/dashboard/professor`, aparece o erro:
```
Erro ao carregar sessões: {}
```

**Possíveis Causas:**
1. RPC `get_sessoes_professor` não existe ou tem erro
2. Tipo do parâmetro `professor_id` incompatível (UUID vs TEXT)
3. RLS bloqueando acesso
4. Tabelas sem dados

---

## ✅ Solução: Execute o SQL V2

### **Passo 1: Execute o Script V2**

1. **Abra o Supabase SQL Editor:**
   - https://supabase.com → Seu Projeto → SQL Editor

2. **Copie e Execute:**
   - Arquivo: `supabase/migrations/FIX_RPC_SESSOES_PROFESSOR_V2.sql`
   - Cole todo o conteúdo no SQL Editor
   - Clique em **RUN**

3. **Verifique os Logs:**
   - Deve aparecer várias mensagens como:
     ```
     NOTICE: 👤 User ID atual: xxxxx-xxxx-xxxx
     NOTICE: 🏫 Total de turmas no sistema: X
     NOTICE: 🎯 Total de sessões no sistema: X
     NOTICE: ✅ RPCs V2 criados com sucesso!
     ```

---

### **Passo 2: Teste os RPCs Diretamente**

No SQL Editor, execute estes comandos para testar:

#### **A. Ver seu User ID:**
```sql
SELECT auth.uid()::text AS meu_user_id;
```
**Anote o resultado!** Exemplo: `12345678-1234-1234-1234-123456789012`

#### **B. Ver turmas do seu usuário:**
```sql
SELECT 
  id,
  name,
  professor_id::text
FROM turmas
WHERE professor_id::text = (SELECT auth.uid()::text);
```
**Se retornar vazio:** Você não tem turmas associadas ao seu usuário!

#### **C. Testar RPC de Sessões:**
```sql
SELECT * FROM get_sessoes_professor((SELECT auth.uid()::text));
```
**Deve retornar:** Lista de sessões ou vazio (se não tiver sessões)

#### **D. Testar RPC de Estatísticas:**
```sql
SELECT * FROM get_estatisticas_professor((SELECT auth.uid()::text));
```
**Deve retornar:** JSON com estatísticas

---

### **Passo 3: Verificar Console do Navegador**

1. **Abra o DevTools** (F12)
2. **Vá para a aba "Console"**
3. **Recarregue a página** (F5)
4. **Procure por estes logs:**
   ```
   👤 Usuário logado: { id: '...', email: '...', full_name: '...' }
   🔍 Buscando sessões para professor_id: ...
   📦 Resultado sessões: { data: [...], error: ... }
   ✅ Sessões carregadas: 0
   📊 Buscando estatísticas...
   📊 Resultado estatísticas: { data: {...}, error: ... }
   ✅ Estatísticas carregadas: {...}
   ```

5. **Se aparecer erro detalhado:**
   - Copie a mensagem completa
   - Procure por:
     - `message`: Mensagem de erro
     - `code`: Código do erro
     - `hint`: Dica do PostgreSQL
     - `details`: Detalhes técnicos

---

## 🔍 Cenários e Soluções

### **Cenário 1: "function get_sessoes_professor does not exist"**

**Problema:** RPC não foi criado

**Solução:**
1. Execute `FIX_RPC_SESSOES_PROFESSOR_V2.sql` novamente
2. Verifique se apareceu `✅ RPCs V2 criados com sucesso!`

---

### **Cenário 2: "permission denied for table turmas"**

**Problema:** RLS bloqueando acesso

**Solução:** Execute este SQL para dar permissão temporária:
```sql
-- Permitir que o RPC acesse turmas
ALTER FUNCTION get_sessoes_professor(text) SECURITY DEFINER;
ALTER FUNCTION get_estatisticas_professor(text) SECURITY DEFINER;

-- Verificar se os RPCs estão como SECURITY DEFINER
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname LIKE '%sessoes_professor%';
```

---

### **Cenário 3: "No rows returned"**

**Problema:** Professor não tem turmas ou sessões

**Solução:** 
1. Crie uma turma associada ao seu usuário
2. Inicie uma sessão
3. Recarregue o dashboard

**Para criar turma manualmente (TESTE):**
```sql
-- Inserir turma de teste para o professor atual
INSERT INTO turmas (name, grade_level, professor_id, tenant_id, active)
VALUES (
  'Turma Teste',
  '7º Ano',
  (SELECT auth.uid()),
  (SELECT id FROM tenants LIMIT 1),
  true
)
RETURNING *;
```

---

### **Cenário 4: Erro de tipo UUID vs TEXT**

**Problema:** Incompatibilidade de tipos

**Solução:** O script V2 já corrige isso! Ele aceita `text` e converte internamente.

---

## 🧪 Teste Manual Completo

### **1. Criar Estrutura de Teste**

Execute este SQL no Supabase:

```sql
-- 1. Ver seu user_id
DO $$
DECLARE
  v_user_id uuid;
  v_tenant_id uuid;
  v_turma_id uuid;
  v_aula_id uuid;
  v_session_id uuid;
BEGIN
  -- Pegar user atual
  v_user_id := auth.uid();
  RAISE NOTICE '👤 User ID: %', v_user_id;
  
  -- Pegar primeiro tenant
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  RAISE NOTICE '🏢 Tenant ID: %', v_tenant_id;
  
  -- Criar turma se não existir
  INSERT INTO turmas (name, grade_level, professor_id, tenant_id, active)
  VALUES ('Turma Teste SQL', '7º Ano', v_user_id, v_tenant_id, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_turma_id;
  
  IF v_turma_id IS NULL THEN
    SELECT id INTO v_turma_id FROM turmas WHERE professor_id = v_user_id LIMIT 1;
  END IF;
  
  RAISE NOTICE '🏫 Turma ID: %', v_turma_id;
  
  -- Criar aula se não existir
  SELECT id INTO v_aula_id FROM aulas LIMIT 1;
  RAISE NOTICE '📚 Aula ID: %', v_aula_id;
  
  -- Criar sessão de teste se não existir
  IF v_aula_id IS NOT NULL AND v_turma_id IS NOT NULL THEN
    INSERT INTO sessions (
      session_code, 
      aula_id, 
      turma_id, 
      status, 
      data_inicio,
      bloco_ativo_numero,
      alunos_participantes
    )
    VALUES (
      'TEST-' || substring(md5(random()::text) from 1 for 4),
      v_aula_id,
      v_turma_id,
      'active',
      NOW(),
      1,
      '{}'::uuid[]
    )
    RETURNING id INTO v_session_id;
    
    RAISE NOTICE '🎯 Sessão criada: %', v_session_id;
  END IF;
  
  -- Testar RPCs
  RAISE NOTICE '========== TESTANDO RPCs ==========';
  
  -- Teste 1
  RAISE NOTICE 'Teste 1: get_sessoes_professor';
  PERFORM * FROM get_sessoes_professor(v_user_id::text);
  
  -- Teste 2
  RAISE NOTICE 'Teste 2: get_estatisticas_professor';
  PERFORM * FROM get_estatisticas_professor(v_user_id::text);
  
  RAISE NOTICE '========== TESTES CONCLUÍDOS ==========';
END $$;
```

### **2. Verificar Resultados**

```sql
-- Ver suas turmas
SELECT * FROM turmas WHERE professor_id = auth.uid();

-- Ver suas sessões
SELECT 
  s.*,
  t.name as turma_nome,
  a.titulo as aula_titulo
FROM sessions s
INNER JOIN turmas t ON t.id = s.turma_id
INNER JOIN aulas a ON a.id = s.aula_id
WHERE t.professor_id = auth.uid();
```

---

## 📝 Checklist de Debug

- [ ] Executei `FIX_RPC_SESSOES_PROFESSOR_V2.sql`
- [ ] Vi mensagem `✅ RPCs V2 criados com sucesso!`
- [ ] Testei `SELECT * FROM get_sessoes_professor(auth.uid()::text)`
- [ ] Testei `SELECT * FROM get_estatisticas_professor(auth.uid()::text)`
- [ ] Verifiquei console do navegador
- [ ] Copiei logs detalhados do console
- [ ] Tenho pelo menos 1 turma associada ao meu usuário
- [ ] RPCs estão como `SECURITY DEFINER`

---

## 🆘 Se Nada Funcionar

**Me envie:**
1. ✅ Prints dos logs do SQL Editor (mensagens NOTICE)
2. ✅ Prints dos logs do Console do navegador
3. ✅ Resultado de: `SELECT * FROM turmas WHERE professor_id = auth.uid();`
4. ✅ Resultado de: `SELECT * FROM sessions LIMIT 5;`
5. ✅ Seu `user_id`: `SELECT auth.uid()::text;`

---

**Agora execute o Passo 1!** 🚀

