-- ============================================================================
-- DEBUG: Verificar estrutura completa de blocos
-- ============================================================================

-- 1. Verificar se as tabelas existem
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'blocos_templates') THEN
    RAISE NOTICE '✅ Tabela blocos_templates existe';
  ELSE
    RAISE NOTICE '❌ Tabela blocos_templates NÃO existe';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'planejamentos') THEN
    RAISE NOTICE '✅ Tabela planejamentos existe';
  ELSE
    RAISE NOTICE '❌ Tabela planejamentos NÃO existe';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'quizzes') THEN
    RAISE NOTICE '✅ Tabela quizzes existe';
  ELSE
    RAISE NOTICE '❌ Tabela quizzes NÃO existe';
  END IF;
END $$;

-- 2. Mostrar estrutura de blocos_templates
SELECT 
  'blocos_templates' as tabela,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'blocos_templates'
ORDER BY ordinal_position;

-- 3. Verificar RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('blocos_templates', 'planejamentos', 'quizzes', 'quiz_questions');

-- 4. Contar registros
SELECT 
  'blocos_templates' as tabela,
  COUNT(*) as total
FROM blocos_templates
UNION ALL
SELECT 
  'planejamentos' as tabela,
  COUNT(*) as total
FROM planejamentos
UNION ALL
SELECT 
  'quizzes' as tabela,
  COUNT(*) as total
FROM quizzes;

-- 5. Mostrar 3 blocos de exemplo (se houver)
SELECT 
  id,
  codigo_bloco,
  titulo,
  disciplina_id,
  planejamento_id,
  status
FROM blocos_templates
LIMIT 3;

