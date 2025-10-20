-- ============================================================================
-- DIAGNÓSTICO - Tabela Alunos
-- Data: 2025-10-20
-- ============================================================================

-- 1. Verificar se tabela alunos existe
SELECT '=== TABELA ALUNOS EXISTE? ===' AS info;
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'alunos'
) AS existe;

-- 2. Estrutura atual da tabela alunos
SELECT '=== ESTRUTURA DA TABELA ALUNOS ===' AS info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'alunos'
ORDER BY ordinal_position;

-- 3. Dados existentes
SELECT '=== ALUNOS CADASTRADOS ===' AS info;
SELECT COUNT(*) AS total_alunos FROM alunos;

SELECT 
  id,
  tenant_id,
  turma_id,
  full_name,
  pin_code,
  icone_afinidade,
  active,
  created_at
FROM alunos
LIMIT 10;

-- 4. Verificar constraints e indexes
SELECT '=== CONSTRAINTS ===' AS info;
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  CASE con.contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
    ELSE con.contype::text
  END AS type_description
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'alunos';

-- 5. Verificar indexes
SELECT '=== INDEXES ===' AS info;
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'alunos';

-- 6. Verificar RLS
SELECT '=== ROW LEVEL SECURITY ===' AS info;
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'alunos';

RAISE NOTICE '✅ Diagnóstico da tabela alunos concluído!';

