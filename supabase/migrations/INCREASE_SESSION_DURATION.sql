-- ============================================================================
-- AUMENTAR DURAÇÃO DA SESSÃO JWT
-- ============================================================================

-- Verificar configurações atuais de sessão
SELECT 
  '📊 Configurações atuais de Auth:' as info;

-- Nota: A duração do JWT é configurada nas settings do Supabase Dashboard
-- Você deve ir em: Authentication > Configuration > JWT Settings

-- Recomendações:
-- 1. JWT Expiry Time: 3600 (1 hora) -> aumentar para 86400 (24 horas)
-- 2. Refresh Token Expiry: Padrão é 30 dias (OK)

-- Verificar políticas RLS que podem estar causando lentidão
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('blocos_templates', 'quizzes', 'planejamentos', 'disciplinas')
ORDER BY tablename, policyname;

-- Recomendação: Desabilitar RLS temporariamente em desenvolvimento
-- (Já fizemos isso, mas vamos verificar)
SELECT 
  '🔒 Status RLS das tabelas principais:' as info;

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '❌ RLS ATIVADO (pode causar lentidão)'
    ELSE '✅ RLS DESATIVADO (rápido)'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('blocos_templates', 'quizzes', 'planejamentos', 'disciplinas', 'users')
ORDER BY tablename;

-- Mensagem informativa
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================================';
  RAISE NOTICE '⚙️  CONFIGURAÇÕES DE SESSÃO';
  RAISE NOTICE '======================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Para aumentar duração da sessão:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Acesse Supabase Dashboard';
  RAISE NOTICE '2. Vá em: Authentication > Configuration';
  RAISE NOTICE '3. JWT Settings:';
  RAISE NOTICE '   - JWT Expiry Time: 86400 (24 horas)';
  RAISE NOTICE '   - Refresh Token Expiry: 2592000 (30 dias) ';
  RAISE NOTICE '';
  RAISE NOTICE '4. Salve as alterações';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Com isso + refresh automático no código:';
  RAISE NOTICE '   - Sessão dura 24h';
  RAISE NOTICE '   - Refresh automático a cada navegação';
  RAISE NOTICE '   - Sem logout inesperado';
  RAISE NOTICE '';
  RAISE NOTICE '======================================================';
END $$;

-- Verificar índices para otimizar queries
SELECT 
  '📊 Índices nas tabelas principais:' as info;

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('blocos_templates', 'quizzes', 'users')
ORDER BY tablename, indexname;

