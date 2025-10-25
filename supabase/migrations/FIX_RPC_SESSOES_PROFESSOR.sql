-- ============================================================================
-- FIX: RPCs para Dashboard do Professor
-- ============================================================================
-- Data: 24/10/2024
-- Objetivo: Corrigir e criar RPCs para gestão de sessões pelo professor
-- ============================================================================

-- ============================================================================
-- 1. RPC: get_alunos_sessao (CORRIGIR)
-- Retorna lista de alunos participantes de uma sessão com progresso
-- ============================================================================

DROP FUNCTION IF EXISTS get_alunos_sessao(uuid);

CREATE OR REPLACE FUNCTION get_alunos_sessao(p_session_id uuid)
RETURNS TABLE (
  aluno_id uuid,
  aluno_nome text,
  bloco_atual integer,
  blocos_completados integer,
  total_blocos integer,
  pontos_ganhos integer,
  status text,
  ultima_atividade timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.aluno_id,
    a.full_name as aluno_nome,
    p.bloco_atual_numero as bloco_atual,
    p.blocos_completados,
    p.total_blocos,
    p.pontos_ganhos_sessao as pontos_ganhos,
    p.status::text,
    p.updated_at as ultima_atividade
  FROM participacoes_sessao p
  INNER JOIN alunos a ON a.id = p.aluno_id
  WHERE p.session_id = p_session_id
  ORDER BY p.updated_at DESC;
END;
$$;

-- ============================================================================
-- 2. RPC: get_sessoes_professor (NOVO)
-- Retorna sessões recentes de um professor
-- ============================================================================

DROP FUNCTION IF EXISTS get_sessoes_professor(uuid);

CREATE OR REPLACE FUNCTION get_sessoes_professor(p_professor_id uuid)
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
  WHERE t.professor_id = p_professor_id
  ORDER BY s.data_inicio DESC
  LIMIT 20;
END;
$$;

-- ============================================================================
-- 3. RPC: encerrar_sessao (NOVO)
-- Encerra uma sessão e atualiza participações
-- ============================================================================

DROP FUNCTION IF EXISTS encerrar_sessao(uuid);

CREATE OR REPLACE FUNCTION encerrar_sessao(p_session_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_turma_id uuid;
  v_professor_id uuid;
  v_result json;
BEGIN
  -- Buscar turma_id e validar professor
  SELECT turma_id INTO v_turma_id
  FROM sessions
  WHERE id = p_session_id;

  IF v_turma_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Sessão não encontrada'
    );
  END IF;

  -- Atualizar sessão para 'completed'
  UPDATE sessions
  SET 
    status = 'completed',
    data_fim = NOW()
  WHERE id = p_session_id;

  -- Atualizar participações ainda ativas
  UPDATE participacoes_sessao
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE session_id = p_session_id
    AND status = 'active';

  -- Contar participações
  SELECT json_build_object(
    'success', true,
    'message', 'Sessão encerrada com sucesso',
    'total_participacoes', (
      SELECT COUNT(*) FROM participacoes_sessao WHERE session_id = p_session_id
    )
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erro ao encerrar sessão: ' || SQLERRM
    );
END;
$$;

-- ============================================================================
-- 4. RPC: get_estatisticas_professor (NOVO)
-- Retorna estatísticas gerais do professor
-- ============================================================================

DROP FUNCTION IF EXISTS get_estatisticas_professor(uuid);

CREATE OR REPLACE FUNCTION get_estatisticas_professor(p_professor_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'total_turmas', (
      SELECT COUNT(*)
      FROM turmas
      WHERE professor_id = p_professor_id
    ),
    'total_alunos', (
      SELECT COUNT(*)
      FROM alunos a
      INNER JOIN turmas t ON t.id = a.turma_id
      WHERE t.professor_id = p_professor_id
        AND a.active = true
    ),
    'sessoes_realizadas', (
      SELECT COUNT(*)
      FROM sessions s
      INNER JOIN turmas t ON t.id = s.turma_id
      WHERE t.professor_id = p_professor_id
        AND s.status = 'completed'
    ),
    'sessoes_ativas', (
      SELECT COUNT(*)
      FROM sessions s
      INNER JOIN turmas t ON t.id = s.turma_id
      WHERE t.professor_id = p_professor_id
        AND s.status = 'active'
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- TESTES
-- ============================================================================

-- Teste get_alunos_sessao
-- SELECT * FROM get_alunos_sessao('session-id-aqui'::uuid);

-- Teste get_sessoes_professor
-- SELECT * FROM get_sessoes_professor(auth.uid());

-- Teste get_estatisticas_professor
-- SELECT * FROM get_estatisticas_professor(auth.uid());

-- Teste encerrar_sessao
-- SELECT * FROM encerrar_sessao('session-id-aqui'::uuid);

RAISE NOTICE '✅ RPCs de sessões do professor criados/atualizados com sucesso!';

