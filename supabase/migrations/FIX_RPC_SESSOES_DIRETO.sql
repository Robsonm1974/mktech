-- ============================================================================
-- FIX V3: RPC get_sessoes_professor (CORRIGIDO - busca direto em sessions)
-- ============================================================================
-- Data: 24/10/2024
-- Problema: RPC estava buscando professor_id em turmas, mas deve buscar em sessions
-- ============================================================================

-- Dropar funções antigas
DROP FUNCTION IF EXISTS get_sessoes_professor(uuid);
DROP FUNCTION IF EXISTS get_sessoes_professor(text);

-- ============================================================================
-- RPC CORRIGIDO: Buscar sessões direto pelo professor_id da tabela sessions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_sessoes_professor(p_professor_id text)
RETURNS TABLE (
  id uuid,
  session_code text,
  aula_titulo text,
  aula_id uuid,
  turma_nome text,
  turma_id uuid,
  status text,
  data_inicio timestamptz,
  data_fim timestamptz,
  total_alunos integer,
  bloco_ativo_numero integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE NOTICE '🔍 Buscando sessões para professor_id: %', p_professor_id;
  
  RETURN QUERY
  SELECT 
    s.id,
    s.session_code,
    au.titulo as aula_titulo,
    au.id as aula_id,
    t.name as turma_nome,
    t.id as turma_id,
    s.status::text,
    s.data_inicio,
    s.data_fim,
    COALESCE(
      (SELECT COUNT(*)::integer FROM participacoes_sessao WHERE session_id = s.id),
      0
    ) as total_alunos,
    s.bloco_ativo_numero
  FROM sessions s
  INNER JOIN turmas t ON t.id = s.turma_id
  INNER JOIN aulas au ON au.id = s.aula_id
  WHERE s.professor_id::text = p_professor_id  -- <<<< MUDANÇA: buscar direto em sessions!
  ORDER BY s.data_inicio DESC
  LIMIT 20;
  
  RAISE NOTICE '✅ Query executada com sucesso!';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro: %', SQLERRM;
    RETURN;
END;
$$;

-- ============================================================================
-- RPC CORRIGIDO: Estatísticas também buscar direto em sessions
-- ============================================================================

DROP FUNCTION IF EXISTS get_estatisticas_professor(uuid);
DROP FUNCTION IF EXISTS get_estatisticas_professor(text);

CREATE OR REPLACE FUNCTION get_estatisticas_professor(p_professor_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  RAISE NOTICE '📊 Calculando estatísticas para professor: %', p_professor_id;
  
  SELECT json_build_object(
    'total_turmas', (
      SELECT COUNT(DISTINCT turma_id)
      FROM sessions
      WHERE professor_id::text = p_professor_id
    ),
    'total_alunos', (
      SELECT COUNT(DISTINCT aluno_id)
      FROM participacoes_sessao ps
      INNER JOIN sessions s ON s.id = ps.session_id
      WHERE s.professor_id::text = p_professor_id
    ),
    'sessoes_realizadas', (
      SELECT COUNT(*)
      FROM sessions
      WHERE professor_id::text = p_professor_id
        AND status = 'completed'
    ),
    'sessoes_ativas', (
      SELECT COUNT(*)
      FROM sessions
      WHERE professor_id::text = p_professor_id
        AND status = 'active'
    )
  ) INTO v_result;
  
  RAISE NOTICE '✅ Estatísticas: %', v_result;

  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro: %', SQLERRM;
    RETURN json_build_object(
      'total_turmas', 0,
      'total_alunos', 0,
      'sessoes_realizadas', 0,
      'sessoes_ativas', 0,
      'error', SQLERRM
    );
END;
$$;

-- ============================================================================
-- TESTES
-- ============================================================================

-- Teste com o professor_id correto
DO $$
DECLARE
  v_professor_id text := '29aa9293-5612-4af1-9829-7f328bdf4eb8';
  v_count integer;
  v_stats json;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🧪 TESTANDO RPCs CORRIGIDOS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Professor ID: %', v_professor_id;
  RAISE NOTICE '';
  
  -- Contar sessões direto na tabela
  SELECT COUNT(*) INTO v_count
  FROM sessions
  WHERE professor_id::text = v_professor_id;
  
  RAISE NOTICE '📊 Sessões na tabela: %', v_count;
  RAISE NOTICE '';
  
  -- Testar RPC
  RAISE NOTICE '🔍 Testando get_sessoes_professor...';
  SELECT COUNT(*) INTO v_count
  FROM get_sessoes_professor(v_professor_id);
  
  RAISE NOTICE '✅ Sessões retornadas pelo RPC: %', v_count;
  RAISE NOTICE '';
  
  -- Mostrar algumas sessões
  IF v_count > 0 THEN
    RAISE NOTICE '📋 Primeiras 5 sessões:';
    FOR v_count IN
      SELECT 
        session_code,
        aula_titulo,
        status
      FROM get_sessoes_professor(v_professor_id)
      LIMIT 5
    LOOP
      RAISE NOTICE '   - % | % (%)', 
        v_count.session_code,
        v_count.aula_titulo,
        v_count.status;
    END LOOP;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Testando get_estatisticas_professor...';
  
  -- Testar estatísticas
  SELECT get_estatisticas_professor(v_professor_id) INTO v_stats;
  RAISE NOTICE '✅ Total de turmas: %', v_stats->>'total_turmas';
  RAISE NOTICE '✅ Total de alunos únicos: %', v_stats->>'total_alunos';
  RAISE NOTICE '✅ Sessões realizadas: %', v_stats->>'sessoes_realizadas';
  RAISE NOTICE '✅ Sessões ativas: %', v_stats->>'sessoes_ativas';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TESTES CONCLUÍDOS!';
  RAISE NOTICE '========================================';
  
END $$;

RAISE NOTICE '';
RAISE NOTICE '🎯 PRÓXIMO PASSO:';
RAISE NOTICE 'Recarregue o dashboard do professor!';
RAISE NOTICE '';

