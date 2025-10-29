-- ============================================
-- FIX: Desabilitar RLS para tabelas de composição de aulas
-- As tabelas aulas_blocos e aulas_jogos são apenas de relacionamento
-- e devem estar acessíveis para admins sem RLS
-- ============================================

-- Desabilitar RLS para aulas_blocos
ALTER TABLE aulas_blocos DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS para aulas_jogos  
ALTER TABLE aulas_jogos DISABLE ROW LEVEL SECURITY;

-- Garantir grants para todas as roles
GRANT ALL ON aulas_blocos TO anon, authenticated, service_role;
GRANT ALL ON aulas_jogos TO anon, authenticated, service_role;

-- Verificar status final
DO $$
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✅ RLS DESABILITADO PARA TABELAS DE AULAS';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tabelas atualizadas:';
  RAISE NOTICE '  - aulas_blocos: RLS OFF';
  RAISE NOTICE '  - aulas_jogos: RLS OFF';
  RAISE NOTICE '';
  RAISE NOTICE 'Agora o admin pode:';
  RAISE NOTICE '  ✅ DELETE de blocos antigos';
  RAISE NOTICE '  ✅ INSERT de novos blocos';
  RAISE NOTICE '  ✅ DELETE de jogos antigos';
  RAISE NOTICE '  ✅ INSERT de novos jogos';
  RAISE NOTICE '';
  RAISE NOTICE 'Execute novamente a edição da aula!';
  RAISE NOTICE '==========================================';
END $$;

-- Verificar configuração atual
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS ATIVADO'
    ELSE '✅ RLS DESATIVADO'
  END as status
FROM pg_tables 
WHERE tablename IN ('aulas_blocos', 'aulas_jogos')
ORDER BY tablename;



