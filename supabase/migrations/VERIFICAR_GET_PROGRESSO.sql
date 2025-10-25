-- ============================================================================
-- VERIFICAR: RPC get_progresso_aluno_sessao
-- Data: 2025-10-20
-- ============================================================================

-- Ver definição do RPC
SELECT 
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_progresso_aluno_sessao';

-- Testar RPC com dados reais
SELECT get_progresso_aluno_sessao(
  '93d40cf9-78d8-43ab-b011-75e2fa29cbf0'::UUID,
  '5a3fab0b-d7cd-4db3-8324-f5aa04aecefb'::UUID
) AS resultado;

-- Ver estrutura da tabela progresso_blocos
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'progresso_blocos'
  AND column_name LIKE '%bloco%'
ORDER BY ordinal_position;





