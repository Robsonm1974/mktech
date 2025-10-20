# 🔧 Fix Erro ao Carregar Turmas

**Data:** 2025-10-18  
**Erro:** `Erro ao carregar turmas: {}`  
**Status:** 🔍 Diagnóstico necessário

---

## 🐛 PROBLEMA

Ao acessar `/dashboard/admin-escola/turmas`, o RPC `get_turmas_admin` está retornando erro vazio.

**Console:**
```
Erro ao carregar turmas: {}
at loadTurmas (src\app\dashboard\admin-escola\turmas\page.tsx:72:17)
```

---

## 🔍 DIAGNÓSTICO

### **PASSO 1: Executar Diagnóstico Completo**

```sql
-- Copie e cole no Supabase SQL Editor:
-- Arquivo: supabase/migrations/DIAGNOSTICO_TURMAS.sql
```

Este script vai mostrar:
1. ✅ Estrutura da tabela `turmas`
2. ✅ Dados existentes em `turmas`
3. ✅ Dados em `anos_escolares`
4. ✅ Professores disponíveis
5. ✅ Definição do RPC `get_turmas_admin`
6. ✅ Teste direto do RPC
7. ✅ Status RLS
8. ✅ Existência da tabela `alunos`

**Me envie o resultado completo deste diagnóstico!**

---

## 🚑 SOLUÇÃO RÁPIDA (Se o RPC não existir)

### **PASSO 2: Executar Fix do RPC**

```sql
-- Copie e cole no Supabase SQL Editor:
-- Arquivo: supabase/migrations/FIX_GET_TURMAS_RPC.sql
```

Este script:
1. ✅ Dropa versões antigas do RPC
2. ✅ Recria com estrutura correta
3. ✅ Adiciona tratamento de erro
4. ✅ Testa automaticamente

---

## 🧪 TESTE NO NAVEGADOR

### **PASSO 3: Testar com Logs Detalhados**

O frontend já foi atualizado com logs detalhados. Agora ao acessar `/dashboard/admin-escola/turmas`:

**Console vai mostrar:**
```javascript
Carregando turmas para tenant: [uuid]

// Se houver erro:
Erro ao carregar turmas: {...}
Detalhes do erro: {
  message: "...",
  details: "...",
  hint: "...",
  code: "..."
}
```

**Me envie a mensagem de erro completa!**

---

## 🔍 POSSÍVEIS CAUSAS

### **1. Tabela `alunos` não existe**
O RPC faz LEFT JOIN com a tabela `alunos`. Se ela não existir, pode causar erro.

**Verificar:**
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'alunos'
);
```

**Solução temporária:** Criar tabela básica
```sql
CREATE TABLE IF NOT EXISTS alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  turma_id UUID REFERENCES turmas(id),
  nome VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE alunos DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE alunos TO postgres, authenticated, anon, service_role;
```

### **2. Coluna `active` não existe em `alunos`**
O RPC filtra por `a.active = true`.

**Verificar:**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'alunos' AND column_name = 'active';
```

**Solução:** Adicionar coluna
```sql
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
```

### **3. RPC não existe ou tem assinatura diferente**
**Verificar:**
```sql
SELECT proname, pg_get_function_arguments(oid) 
FROM pg_proc 
WHERE proname = 'get_turmas_admin';
```

**Solução:** Executar `FIX_GET_TURMAS_RPC.sql`

### **4. Permissões insuficientes**
**Verificar:**
```sql
SELECT has_function_privilege('authenticated', 'get_turmas_admin(uuid)', 'EXECUTE');
```

**Solução:** Adicionar permissões
```sql
GRANT EXECUTE ON FUNCTION get_turmas_admin(UUID) TO authenticated, anon, service_role;
```

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Execute na ordem:

- [ ] **1. Executar `DIAGNOSTICO_TURMAS.sql`**
  - Copiar TODO o resultado
  - Enviar para análise

- [ ] **2. Verificar se tabela `alunos` existe**
  - Se não: Criar tabela básica

- [ ] **3. Executar `FIX_GET_TURMAS_RPC.sql`**
  - Deve mostrar: `✅ RPC get_turmas_admin testado: X turmas encontradas`

- [ ] **4. Recarregar página no navegador**
  - `Ctrl+Shift+R` (hard reload)
  - Abrir Console (F12)
  - Ver mensagem de erro detalhada

- [ ] **5. Enviar logs completos**
  - Resultado do diagnóstico SQL
  - Console do navegador
  - Screenshot se possível

---

## 🎯 AÇÃO IMEDIATA

**EXECUTE AGORA em ordem:**

1. ✅ `DIAGNOSTICO_TURMAS.sql` → **ME ENVIE O RESULTADO**
2. ✅ `FIX_GET_TURMAS_RPC.sql` → **ME DIGA SE DEU SUCESSO**
3. ✅ Recarregar página → **ME ENVIE O ERRO DO CONSOLE**

---

## 🔧 FIX COMPLETO (Se nada funcionar)

```sql
-- EXECUTAR TUDO DE UMA VEZ:

-- 1. Criar tabela alunos (se não existir)
CREATE TABLE IF NOT EXISTS alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  turma_id UUID REFERENCES turmas(id),
  nome VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE alunos DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE alunos TO postgres, authenticated, anon, service_role;

-- 2. Recriar RPC
DROP FUNCTION IF EXISTS get_turmas_admin(UUID);
DROP FUNCTION IF EXISTS get_turmas_admin();

CREATE OR REPLACE FUNCTION get_turmas_admin(p_tenant_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  name VARCHAR,
  ano_escolar_id VARCHAR,
  ano_nome VARCHAR,
  designacao VARCHAR,
  professor_id UUID,
  professor_nome VARCHAR,
  professor_email VARCHAR,
  sala VARCHAR,
  turno VARCHAR,
  descricao TEXT,
  total_alunos BIGINT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.tenant_id,
    t.name,
    t.ano_escolar_id,
    COALESCE(ae.nome, '') AS ano_nome,
    t.designacao,
    t.professor_id,
    COALESCE(u.full_name, '') AS professor_nome,
    COALESCE(u.email, '') AS professor_email,
    t.sala,
    t.turno,
    t.descricao,
    COALESCE(COUNT(a.id), 0) AS total_alunos,
    t.created_at,
    t.updated_at
  FROM turmas t
  LEFT JOIN anos_escolares ae ON t.ano_escolar_id = ae.id
  LEFT JOIN users u ON t.professor_id = u.id
  LEFT JOIN alunos a ON t.id = a.turma_id AND COALESCE(a.active, false) = true
  WHERE (p_tenant_id IS NULL OR t.tenant_id = p_tenant_id)
  GROUP BY t.id, t.tenant_id, t.name, t.ano_escolar_id, ae.nome, t.designacao, 
           t.professor_id, u.full_name, u.email, t.sala, t.turno, t.descricao,
           t.created_at, t.updated_at
  ORDER BY COALESCE(ae.ordem, 999), t.name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_turmas_admin(UUID) TO authenticated, anon, service_role;

-- 3. Testar
SELECT * FROM get_turmas_admin(NULL);

DO $$
BEGIN
  RAISE NOTICE '✅ Fix completo executado com sucesso!';
END $$;
```

---

**Status:** 🔍 **AGUARDANDO DIAGNÓSTICO**  
**Próxima ação:** Execute `DIAGNOSTICO_TURMAS.sql` e envie o resultado

