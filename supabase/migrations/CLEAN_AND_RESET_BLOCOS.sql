-- ============================================================================
-- LIMPAR E RESETAR ESTRUTURA DE BLOCOS
-- ============================================================================

-- 1. Deletar todos os dados antigos (mantém estrutura)
TRUNCATE TABLE blocos_templates CASCADE;
TRUNCATE TABLE planejamentos CASCADE;
TRUNCATE TABLE quizzes CASCADE;
TRUNCATE TABLE quiz_questions CASCADE;

-- 2. Garantir que RLS está DESABILITADO para desenvolvimento
ALTER TABLE blocos_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE planejamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions DISABLE ROW LEVEL SECURITY;

-- 3. Garantir permissões completas
GRANT ALL ON TABLE blocos_templates TO authenticated, anon, service_role;
GRANT ALL ON TABLE planejamentos TO authenticated, anon, service_role;
GRANT ALL ON TABLE quizzes TO authenticated, anon, service_role;
GRANT ALL ON TABLE quiz_questions TO authenticated, anon, service_role;

-- 4. Verificar estrutura da tabela blocos_templates
DO $$
BEGIN
  RAISE NOTICE '✅ Dados limpos!';
  RAISE NOTICE '📊 Estrutura da tabela blocos_templates:';
END $$;

-- Mostrar colunas da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'blocos_templates'
ORDER BY ordinal_position;

