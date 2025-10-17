-- ============================================================================
-- VERIFICAR SETUP DE QUIZZES
-- ============================================================================

-- 1. Verificar se as funções RPC existem
SELECT 
  '🔍 Verificando funções RPC...' as status;

SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname IN ('insert_quiz_with_questions', 'insert_quizzes_batch')
ORDER BY proname;

-- 2. Verificar estrutura da tabela quizzes
SELECT 
  '📋 Estrutura da tabela quizzes:' as status;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'quizzes'
ORDER BY ordinal_position;

-- 3. Verificar status RLS
SELECT 
  '🔒 Status RLS:' as status;

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('quizzes', 'blocos_templates');

-- 4. Contar registros
SELECT 
  '📊 Contagem de registros:' as status;

SELECT 'quizzes' as tabela, COUNT(*) as total FROM quizzes
UNION ALL
SELECT 'blocos_templates' as tabela, COUNT(*) as total FROM blocos_templates;

-- 5. Verificar blocos sem quiz
SELECT 
  '⚠️  Blocos sem quiz:' as status;

SELECT 
  codigo_bloco,
  titulo,
  status,
  quiz_id
FROM blocos_templates
WHERE quiz_id IS NULL
ORDER BY codigo_bloco
LIMIT 5;

-- 6. Testar função RPC (exemplo)
SELECT 
  '🧪 Para testar manualmente, use:' as status;

-- Exemplo de como testar:
-- SELECT insert_quiz_with_questions(
--   'UUID_DO_BLOCO'::UUID,
--   'Teste Quiz',
--   'Qual é a resposta?',
--   '["A", "B", "C", "D"]'::JSONB,
--   1,
--   10
-- );

