-- ============================================================================
-- RPCs PARA SISTEMA DE SESSÕES E PONTUAÇÃO
-- Data: 2025-10-20
-- ============================================================================

-- ============================================================================
-- 1. RPC: Aluno entra na sessão
-- ============================================================================
CREATE OR REPLACE FUNCTION aluno_entrar_sessao(
  p_session_id UUID,
  p_aluno_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_participacao_id UUID;
  v_total_blocos INTEGER;
BEGIN
  -- Contar total de blocos da aula
  SELECT COUNT(*) INTO v_total_blocos
  FROM aulas_blocos ab
  JOIN sessions s ON s.aula_id = ab.aula_id
  WHERE s.id = p_session_id;

  -- Criar ou atualizar participação
  INSERT INTO participacoes_sessao (
    session_id,
    aluno_id,
    total_blocos,
    bloco_atual_numero,
    status
  ) VALUES (
    p_session_id,
    p_aluno_id,
    v_total_blocos,
    1,
    'active'
  )
  ON CONFLICT (session_id, aluno_id)
  DO UPDATE SET
    entrou_em = NOW(),
    ultima_atividade = NOW(),
    status = 'active'
  RETURNING id INTO v_participacao_id;

  -- Criar progresso para todos os blocos
  INSERT INTO progresso_blocos (
    participacao_id,
    bloco_template_id,
    numero_sequencia,
    status
  )
  SELECT
    v_participacao_id,
    ab.bloco_template_id,
    ab.ordem,
    CASE WHEN ab.ordem = 1 THEN 'active' ELSE 'locked' END
  FROM aulas_blocos ab
  JOIN sessions s ON s.aula_id = ab.aula_id
  WHERE s.id = p_session_id
  ORDER BY ab.ordem
  ON CONFLICT (participacao_id, bloco_template_id) DO NOTHING;

  -- Atualizar contador de participantes na sessão
  UPDATE sessions
  SET alunos_participantes = (
    SELECT COUNT(DISTINCT aluno_id)
    FROM participacoes_sessao
    WHERE session_id = p_session_id AND status = 'active'
  )
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'participacao_id', v_participacao_id,
    'total_blocos', v_total_blocos
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Erro: ' || SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION aluno_entrar_sessao(UUID, UUID) TO authenticated, anon, service_role;

-- ============================================================================
-- 2. RPC: Aluno completa um bloco
-- ============================================================================
CREATE OR REPLACE FUNCTION aluno_completar_bloco(
  p_participacao_id UUID,
  p_bloco_template_id UUID,
  p_pontos_conteudo INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_proximo_numero INTEGER;
  v_proximo_bloco_id UUID;
BEGIN
  -- Marcar bloco como completado
  UPDATE progresso_blocos
  SET
    status = 'completed',
    completado_em = NOW(),
    pontos_conteudo = p_pontos_conteudo,
    pontos_total = pontos_total + p_pontos_conteudo
  WHERE participacao_id = p_participacao_id
    AND bloco_template_id = p_bloco_template_id;

  -- Buscar próximo bloco
  SELECT numero_sequencia, bloco_template_id
  INTO v_proximo_numero, v_proximo_bloco_id
  FROM progresso_blocos
  WHERE participacao_id = p_participacao_id
    AND status = 'locked'
  ORDER BY numero_sequencia
  LIMIT 1;

  -- Desbloquear próximo bloco
  IF v_proximo_bloco_id IS NOT NULL THEN
    UPDATE progresso_blocos
    SET status = 'active', iniciado_em = NOW()
    WHERE participacao_id = p_participacao_id
      AND bloco_template_id = v_proximo_bloco_id;
  END IF;

  -- Atualizar participação
  UPDATE participacoes_sessao
  SET
    bloco_atual_numero = COALESCE(v_proximo_numero, bloco_atual_numero),
    blocos_completados = blocos_completados + 1,
    pontos_ganhos_sessao = pontos_ganhos_sessao + p_pontos_conteudo,
    ultima_atividade = NOW(),
    status = CASE
      WHEN v_proximo_bloco_id IS NULL THEN 'completed'
      ELSE 'active'
    END
  WHERE id = p_participacao_id;

  RETURN jsonb_build_object(
    'success', true,
    'proximo_bloco_numero', v_proximo_numero,
    'sessao_completa', v_proximo_bloco_id IS NULL
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Erro: ' || SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION aluno_completar_bloco(UUID, UUID, INTEGER) TO authenticated, anon, service_role;

-- ============================================================================
-- 3. RPC: Registrar resposta de quiz
-- ============================================================================
CREATE OR REPLACE FUNCTION registrar_resposta_quiz(
  p_quiz_id UUID,
  p_aluno_id UUID,
  p_session_id UUID,
  p_participacao_id UUID,
  p_pergunta_index INTEGER,
  p_resposta_escolhida INTEGER,
  p_correto BOOLEAN,
  p_pontos_ganhos INTEGER,
  p_tentativa_numero INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir resposta
  INSERT INTO respostas_quizzes (
    quiz_id,
    aluno_id,
    session_id,
    participacao_id,
    pergunta_index,
    resposta_escolhida,
    correto,
    pontos_possiveis, pontos_ganhos,
    tentativa_numero
  ) VALUES (
    p_quiz_id,
    p_aluno_id,
    p_session_id,
    p_participacao_id,
    p_pergunta_index,
    p_resposta_escolhida,
    p_correto,
    p_pontos_ganhos * 2,  -- pontos_possiveis (antes do multiplicador)
    p_pontos_ganhos,
    p_tentativa_numero
  );

  -- Se correto, atualizar pontos do bloco
  IF p_correto THEN
    UPDATE progresso_blocos pb
    SET
      pontos_quiz = pontos_quiz + p_pontos_ganhos,
      pontos_total = pontos_total + p_pontos_ganhos
    FROM quizzes q
    WHERE pb.participacao_id = p_participacao_id
      AND q.id = p_quiz_id
      AND pb.bloco_template_id IN (
        SELECT id FROM blocos_templates WHERE quiz_id = p_quiz_id
      );

    -- Atualizar pontos totais do aluno
    UPDATE alunos
    SET pontos_totais = pontos_totais + p_pontos_ganhos
    WHERE id = p_aluno_id;

    -- Atualizar pontos da participação
    UPDATE participacoes_sessao
    SET pontos_ganhos_sessao = pontos_ganhos_sessao + p_pontos_ganhos
    WHERE id = p_participacao_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'correto', p_correto,
    'pontos_ganhos', p_pontos_ganhos
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Erro: ' || SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION registrar_resposta_quiz(UUID, UUID, UUID, UUID, INTEGER, INTEGER, BOOLEAN, INTEGER, INTEGER) TO authenticated, anon, service_role;

-- ============================================================================
-- 4. RPC: Buscar progresso do aluno na sessão
-- ============================================================================
CREATE OR REPLACE FUNCTION get_progresso_aluno_sessao(
  p_session_id UUID,
  p_aluno_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'participacao', row_to_json(ps.*),
    'blocos', (
      SELECT json_agg(
        json_build_object(
          'numero_sequencia', pb.numero_sequencia,
          'bloco_id', pb.bloco_template_id,
          'status', pb.status,
          'pontos_total', pb.pontos_total,
          'iniciado_em', pb.iniciado_em,
          'completado_em', pb.completado_em
        ) ORDER BY pb.numero_sequencia
      )
      FROM progresso_blocos pb
      WHERE pb.participacao_id = ps.id
    )
  ) INTO v_result
  FROM participacoes_sessao ps
  WHERE ps.session_id = p_session_id
    AND ps.aluno_id = p_aluno_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_progresso_aluno_sessao(UUID, UUID) TO authenticated, anon, service_role;

-- ============================================================================
-- 5. RPC: Professor vê todos os alunos da sessão
-- ============================================================================
CREATE OR REPLACE FUNCTION get_alunos_sessao(
  p_session_id UUID
)
RETURNS TABLE (
  aluno_id UUID,
  aluno_nome VARCHAR,
  bloco_atual INTEGER,
  blocos_completados INTEGER,
  total_blocos INTEGER,
  pontos_ganhos INTEGER,
  status VARCHAR,
  ultima_atividade TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.aluno_id,
    a.full_name AS aluno_nome,
    ps.bloco_atual_numero AS bloco_atual,
    ps.blocos_completados,
    ps.total_blocos,
    ps.pontos_ganhos_sessao AS pontos_ganhos,
    ps.status,
    ps.ultima_atividade
  FROM participacoes_sessao ps
  JOIN alunos a ON a.id = ps.aluno_id
  WHERE ps.session_id = p_session_id
  ORDER BY a.full_name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_alunos_sessao(UUID) TO authenticated, anon, service_role;

-- ============================================================================
-- 6. VERIFICAÇÃO FINAL
-- ============================================================================
DO $$
DECLARE
  v_count_rpcs INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count_rpcs 
  FROM pg_proc 
  WHERE proname IN (
    'aluno_entrar_sessao',
    'aluno_completar_bloco',
    'registrar_resposta_quiz',
    'get_progresso_aluno_sessao',
    'get_alunos_sessao'
  );
  
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ RPCs DE SESSÕES CRIADOS COM SUCESSO!';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 RPCs DISPONÍVEIS (%):',v_count_rpcs;
  RAISE NOTICE '   1. aluno_entrar_sessao()           - Aluno entra';
  RAISE NOTICE '   2. aluno_completar_bloco()         - Completa bloco';
  RAISE NOTICE '   3. registrar_resposta_quiz()       - Salva resposta';
  RAISE NOTICE '   4. get_progresso_aluno_sessao()    - Busca progresso';
  RAISE NOTICE '   5. get_alunos_sessao()             - Lista alunos';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Pronto para frontend!';
  RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;






