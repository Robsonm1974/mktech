-- ============================================================================
-- DIAGNÓSTICO COMPLETO: Sistema de Sessões e Login de Alunos
-- Data: 2025-10-20
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. VERIFICAR ESTRUTURA DAS TABELAS
-- ═══════════════════════════════════════════════════════════════════════════

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📋 1. ESTRUTURA DA TABELA SESSIONS'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'sessions'
ORDER BY ordinal_position;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📋 2. ESTRUTURA DA TABELA ALUNOS'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'alunos'
ORDER BY ordinal_position;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📋 3. ESTRUTURA DA TABELA PARTICIPACOES_SESSAO'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'participacoes_sessao'
ORDER BY ordinal_position;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📋 4. ESTRUTURA DA TABELA PROGRESSO_BLOCOS'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'progresso_blocos'
ORDER BY ordinal_position;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. VERIFICAR DADOS EXISTENTES
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📊 5. SESSÕES ATIVAS'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  id,
  session_code,
  status,
  aula_id,
  turma_id,
  tenant_id,
  professor_id,
  iniciada_em
FROM sessions
WHERE status = 'active'
ORDER BY iniciada_em DESC
LIMIT 5;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📊 6. CONTAGEM DE REGISTROS'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  'sessions (ativas)' AS tabela,
  COUNT(*) AS total
FROM sessions
WHERE status = 'active'
UNION ALL
SELECT 
  'alunos (ativos)' AS tabela,
  COUNT(*) AS total
FROM alunos
WHERE active = true
UNION ALL
SELECT 
  'aulas' AS tabela,
  COUNT(*) AS total
FROM aulas
UNION ALL
SELECT 
  'aulas_blocos' AS tabela,
  COUNT(*) AS total
FROM aulas_blocos
UNION ALL
SELECT 
  'blocos_templates' AS tabela,
  COUNT(*) AS total
FROM blocos_templates
UNION ALL
SELECT 
  'participacoes_sessao' AS tabela,
  COUNT(*) AS total
FROM participacoes_sessao
UNION ALL
SELECT 
  'progresso_blocos' AS tabela,
  COUNT(*) AS total
FROM progresso_blocos;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. VERIFICAR RELACIONAMENTOS
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🔗 7. VERIFICAR AULA DA SESSÃO ATIVA (com blocos)'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  s.session_code,
  s.aula_id,
  a.titulo AS aula_titulo,
  COUNT(ab.id) AS total_blocos
FROM sessions s
LEFT JOIN aulas a ON a.id = s.aula_id
LEFT JOIN aulas_blocos ab ON ab.aula_id = s.aula_id
WHERE s.status = 'active'
GROUP BY s.session_code, s.aula_id, a.titulo
ORDER BY s.iniciada_em DESC
LIMIT 5;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🔗 8. VERIFICAR ALUNOS DA TURMA DA SESSÃO ATIVA'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  s.session_code,
  s.turma_id,
  t.nome AS turma_nome,
  COUNT(al.id) AS total_alunos_ativos
FROM sessions s
LEFT JOIN turmas t ON t.id = s.turma_id
LEFT JOIN alunos al ON al.turma_id = s.turma_id AND al.active = true
WHERE s.status = 'active'
GROUP BY s.session_code, s.turma_id, t.nome
ORDER BY s.iniciada_em DESC
LIMIT 5;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🔗 9. DETALHES DOS BLOCOS DA PRIMEIRA AULA ATIVA'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  ab.ordem_na_aula,
  ab.bloco_template_id,
  bt.titulo AS bloco_titulo,
  bt.tipo_midia,
  bt.quiz_id
FROM sessions s
JOIN aulas_blocos ab ON ab.aula_id = s.aula_id
JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
WHERE s.status = 'active'
ORDER BY s.iniciada_em DESC, ab.ordem_na_aula
LIMIT 10;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. VERIFICAR RPCs
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '⚙️  10. RPCS RELACIONADOS A SESSÕES'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'aluno_entrar_sessao',
    'get_progresso_aluno_sessao',
    'aluno_completar_bloco',
    'registrar_resposta_quiz'
  )
ORDER BY p.proname;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. VERIFICAR ÍNDICES
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🗂️  11. ÍNDICES DAS TABELAS PRINCIPAIS'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('sessions', 'alunos', 'aulas_blocos', 'participacoes_sessao', 'progresso_blocos')
ORDER BY tablename, indexname;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '✅ DIAGNÓSTICO COMPLETO FINALIZADO'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'





