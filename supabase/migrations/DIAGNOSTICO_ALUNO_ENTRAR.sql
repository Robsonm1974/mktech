-- ============================================================================
-- DIAGNÓSTICO: Verificar estado do RPC aluno_entrar_sessao
-- Data: 2025-10-20
-- ============================================================================

-- 1. Verificar se RPC existe
SELECT 
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'aluno_entrar_sessao';

-- 2. Verificar estrutura da tabela participacoes_sessao
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'participacoes_sessao'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela progresso_blocos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'progresso_blocos'
ORDER BY ordinal_position;

-- 4. Testar sessão ativa
SELECT 
  s.id,
  s.session_code,
  s.status,
  s.aula_id,
  COUNT(ab.bloco_id) AS total_blocos
FROM sessions s
LEFT JOIN aulas_blocos ab ON ab.aula_id = s.aula_id
WHERE s.status = 'active'
GROUP BY s.id, s.session_code, s.status, s.aula_id
LIMIT 5;

-- 5. Verificar se há blocos para uma aula específica
SELECT 
  ab.aula_id,
  ab.bloco_id,
  ab.ordem_na_aula,
  bt.titulo
FROM aulas_blocos ab
JOIN blocos_templates bt ON ab.bloco_id = bt.id
ORDER BY ab.aula_id, ab.ordem_na_aula
LIMIT 10;





