# 🔧 FIX: Colunas faltando na tabela `sessions`

## ❌ **Erro:**
```
Could not find the 'bloco_ativo_numero' column of 'sessions' in the schema cache
```

## ✅ **Solução:**

A tabela `sessions` foi criada antes da nossa migração completa e está faltando algumas colunas.

### **Passo 1: Abrir Supabase SQL Editor**
1. Acesse: https://kcvlauuzwnrfdgwlxcnw.supabase.co
2. Vá em: **SQL Editor** (menu lateral esquerdo)
3. Clique em: **New Query**

### **Passo 2: Executar o script de correção**

Cole e execute este SQL:

```sql
-- ============================================================================
-- FIX: Adicionar colunas faltantes na tabela sessions
-- ============================================================================

-- 1. Verificar estrutura atual
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY ordinal_position;

-- 2. Adicionar coluna bloco_ativo_numero se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        AND column_name = 'bloco_ativo_numero'
    ) THEN
        ALTER TABLE sessions ADD COLUMN bloco_ativo_numero INTEGER DEFAULT 1;
        RAISE NOTICE '✅ Coluna bloco_ativo_numero adicionada';
    ELSE
        RAISE NOTICE '✅ Coluna bloco_ativo_numero já existe';
    END IF;
END $$;

-- 3. Adicionar outras colunas que podem estar faltando
DO $$ 
BEGIN
    -- session_qr_data
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'session_qr_data'
    ) THEN
        ALTER TABLE sessions ADD COLUMN session_qr_data JSONB;
        RAISE NOTICE '✅ Coluna session_qr_data adicionada';
    END IF;

    -- alunos_participantes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'alunos_participantes'
    ) THEN
        ALTER TABLE sessions ADD COLUMN alunos_participantes INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Coluna alunos_participantes adicionada';
    END IF;

    -- data_inicio
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'data_inicio'
    ) THEN
        ALTER TABLE sessions ADD COLUMN data_inicio TIMESTAMP DEFAULT now();
        RAISE NOTICE '✅ Coluna data_inicio adicionada';
    END IF;

    -- data_fim
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'data_fim'
    ) THEN
        ALTER TABLE sessions ADD COLUMN data_fim TIMESTAMP;
        RAISE NOTICE '✅ Coluna data_fim adicionada';
    END IF;
END $$;

-- 4. Verificar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY ordinal_position;
```

### **Passo 3: Verificar resultado**

Você deve ver:
- ✅ Mensagens de sucesso para cada coluna adicionada
- ✅ Lista completa das colunas da tabela `sessions`

A tabela deve ter pelo menos estas colunas:
- `id`
- `tenant_id`
- `aula_id`
- `turma_id`
- `professor_id`
- `session_code`
- `session_qr_data` ← **IMPORTANTE**
- `bloco_ativo_numero` ← **IMPORTANTE**
- `status`
- `data_inicio`
- `data_fim`
- `alunos_participantes`
- `created_at`

---

## 🎯 **Depois de executar:**

1. Volte para o navegador
2. Recarregue a página (F5)
3. Tente criar a sessão novamente
4. Deve funcionar! 🚀

---

## 🔍 **Se ainda der erro:**

Execute este SQL para ver exatamente quais colunas existem:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions'
ORDER BY ordinal_position;
```

E me envie o resultado para eu ajustar o código.




