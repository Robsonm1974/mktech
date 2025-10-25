-- ============================================================================
-- VERIFICAR: Políticas RLS das tabelas de aulas e blocos
-- Data: 2025-10-20
-- ============================================================================

-- Verificar RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('aulas', 'aulas_blocos', 'blocos_templates', 'quizzes')
ORDER BY tablename;

-- Verificar políticas existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('aulas', 'aulas_blocos', 'blocos_templates', 'quizzes')
ORDER BY tablename, policyname;

-- Se não houver políticas, mostrar mensagem
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('aulas', 'aulas_blocos', 'blocos_templates', 'quizzes');
  
  IF v_count = 0 THEN
    RAISE NOTICE '⚠️  NENHUMA POLÍTICA RLS ENCONTRADA!';
    RAISE NOTICE 'Execute o script FIX_RLS_AULAS_BLOCOS.sql';
  ELSE
    RAISE NOTICE '✅ Encontradas % política(s) RLS', v_count;
  END IF;
END $$;





