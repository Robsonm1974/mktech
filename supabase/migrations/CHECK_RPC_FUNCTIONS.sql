-- ============================================================================
-- Verificar se as funções RPC existem
-- ============================================================================

-- 1. Listar todas as funções RPC relacionadas a quizzes
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname LIKE '%quiz%'
ORDER BY proname;

-- 2. Verificar especificamente as funções que precisamos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'insert_quiz_with_questions') THEN
    RAISE NOTICE '✅ Função insert_quiz_with_questions existe';
  ELSE
    RAISE NOTICE '❌ Função insert_quiz_with_questions NÃO existe';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'insert_quizzes_batch') THEN
    RAISE NOTICE '✅ Função insert_quizzes_batch existe';
  ELSE
    RAISE NOTICE '❌ Função insert_quizzes_batch NÃO existe';
  END IF;
END $$;

-- 3. Verificar estrutura da tabela quizzes
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'quizzes'
ORDER BY ordinal_position;

