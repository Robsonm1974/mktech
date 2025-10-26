-- ============================================================================
-- 🔍 DIAGNÓSTICO COMPLETO: Estrutura de Quizzes e Blocos
-- ============================================================================
-- Data: 25 Outubro 2025
-- Objetivo: Verificar estrutura atual antes de integrar QuizAnimado
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR ESTRUTURA DA TABELA QUIZZES
-- ============================================================================
SELECT 
  '1️⃣ ESTRUTURA TABELA QUIZZES' as secao,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'quizzes'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. VERIFICAR FOREIGN KEYS DA TABELA QUIZZES
-- ============================================================================
SELECT 
  '2️⃣ FOREIGN KEYS QUIZZES' as secao,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'quizzes'
  AND tc.constraint_type = 'FOREIGN KEY';

-- ============================================================================
-- 3. VERIFICAR ESTRUTURA DA TABELA BLOCOS_TEMPLATES
-- ============================================================================
SELECT 
  '3️⃣ ESTRUTURA BLOCOS_TEMPLATES' as secao,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'blocos_templates'
  AND column_name IN ('id', 'codigo_bloco', 'quiz_id', 'ano_escolar_id', 'disciplina_id', 'planejamento_id')
ORDER BY ordinal_position;

-- ============================================================================
-- 4. VERIFICAR RELAÇÃO ENTRE BLOCOS_TEMPLATES E QUIZZES
-- ============================================================================
SELECT 
  '4️⃣ RELAÇÃO BLOCOS ↔️ QUIZZES' as secao,
  COUNT(*) FILTER (WHERE bt.quiz_id IS NOT NULL) as blocos_com_quiz,
  COUNT(*) FILTER (WHERE bt.quiz_id IS NULL) as blocos_sem_quiz,
  COUNT(*) as total_blocos
FROM blocos_templates bt;

-- ============================================================================
-- 5. VERIFICAR DADOS DE EXEMPLO (Quizzes)
-- ============================================================================
SELECT 
  '5️⃣ EXEMPLO DE QUIZ' as secao,
  q.id,
  q.titulo,
  q.tipo,
  CASE 
    WHEN column_name = 'bloco_id' THEN 'USAR BLOCO_ID'
    WHEN column_name = 'bloco_template_id' THEN 'USAR BLOCO_TEMPLATE_ID'
    ELSE 'COLUNA DESCONHECIDA'
  END as tipo_relacao,
  jsonb_array_length(q.perguntas) as num_perguntas,
  q.tentativas_permitidas,
  q.tempo_limite_seg,
  q.pontos_max
FROM quizzes q
CROSS JOIN (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'quizzes'
    AND column_name IN ('bloco_id', 'bloco_template_id')
  LIMIT 1
) cols
LIMIT 3;

-- ============================================================================
-- 6. VERIFICAR ESTRUTURA DO JSONB PERGUNTAS
-- ============================================================================
SELECT 
  '6️⃣ ESTRUTURA PERGUNTAS (JSONB)' as secao,
  q.id as quiz_id,
  q.titulo,
  jsonb_array_length(q.perguntas) as num_perguntas,
  q.perguntas->0 as exemplo_pergunta_1,
  jsonb_typeof(q.perguntas->0->'choices') as tipo_choices,
  jsonb_array_length(q.perguntas->0->'choices') as num_opcoes
FROM quizzes q
WHERE q.perguntas IS NOT NULL
LIMIT 2;

-- ============================================================================
-- 7. VERIFICAR RPC get_blocos_sessao
-- ============================================================================
SELECT 
  '7️⃣ RPC GET_BLOCOS_SESSAO' as secao,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_blocos_sessao';

-- ============================================================================
-- 8. VERIFICAR SE EXISTE TABELA "blocos" (legacy)
-- ============================================================================
SELECT 
  '8️⃣ TABELA BLOCOS (LEGACY)' as secao,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'blocos'
    ) THEN '⚠️ TABELA "blocos" EXISTE (LEGACY)'
    ELSE '✅ TABELA "blocos" NÃO EXISTE (OK)'
  END as status;

-- ============================================================================
-- 9. VERIFICAR SESSÕES E AULAS (Sample)
-- ============================================================================
SELECT 
  '9️⃣ EXEMPLO SESSÃO → AULA → BLOCOS' as secao,
  s.id as session_id,
  s.session_code,
  a.titulo as aula_titulo,
  COUNT(ab.id) as num_blocos_na_aula,
  COUNT(bt.quiz_id) FILTER (WHERE bt.quiz_id IS NOT NULL) as blocos_com_quiz
FROM sessions s
INNER JOIN aulas a ON a.id = s.aula_id
LEFT JOIN aulas_blocos ab ON ab.aula_id = a.id
LEFT JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
GROUP BY s.id, s.session_code, a.titulo
LIMIT 3;

-- ============================================================================
-- 10. VERIFICAR RESPOSTAS DE QUIZZES (Sample)
-- ============================================================================
SELECT 
  '🔟 EXEMPLO RESPOSTAS QUIZZES' as secao,
  rq.id,
  rq.quiz_id,
  rq.aluno_id,
  rq.pergunta_index,
  rq.correto,
  rq.pontos_ganhos,
  rq.tentativa_numero,
  rq.created_at
FROM respostas_quizzes rq
ORDER BY rq.created_at DESC
LIMIT 5;

-- ============================================================================
-- ✅ RESUMO E RECOMENDAÇÕES
-- ============================================================================
DO $$
DECLARE
  v_has_bloco_id boolean;
  v_has_bloco_template_id boolean;
  v_blocos_com_quiz integer;
  v_total_quizzes integer;
BEGIN
  -- Verificar colunas
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'bloco_id'
  ) INTO v_has_bloco_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'bloco_template_id'
  ) INTO v_has_bloco_template_id;

  -- Contar blocos com quiz
  SELECT COUNT(*) INTO v_blocos_com_quiz
  FROM blocos_templates WHERE quiz_id IS NOT NULL;

  -- Contar quizzes
  SELECT COUNT(*) INTO v_total_quizzes
  FROM quizzes;

  RAISE NOTICE '============================================================================';
  RAISE NOTICE '📊 RESUMO DO DIAGNÓSTICO';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ ESTRUTURA DA TABELA QUIZZES:';
  RAISE NOTICE '   - Tem coluna bloco_id? %', CASE WHEN v_has_bloco_id THEN '✅ SIM (LEGACY)' ELSE '❌ NÃO' END;
  RAISE NOTICE '   - Tem coluna bloco_template_id? %', CASE WHEN v_has_bloco_template_id THEN '✅ SIM (CORRETO)' ELSE '❌ NÃO' END;
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ DADOS:';
  RAISE NOTICE '   - Total de quizzes: %', v_total_quizzes;
  RAISE NOTICE '   - Blocos com quiz: %', v_blocos_com_quiz;
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣ RECOMENDAÇÃO:';
  IF v_has_bloco_id AND NOT v_has_bloco_template_id THEN
    RAISE NOTICE '   ⚠️ AÇÃO NECESSÁRIA: Migrar bloco_id → bloco_template_id';
    RAISE NOTICE '   📝 Execute: supabase/migrations/FIX_QUIZZES_COLUMN_NAME.sql';
  ELSIF v_has_bloco_template_id THEN
    RAISE NOTICE '   ✅ ESTRUTURA CORRETA! Pode integrar QuizAnimado.';
  ELSE
    RAISE NOTICE '   ❌ ERRO: Nenhuma coluna de relação encontrada!';
  END IF;
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
END $$;

