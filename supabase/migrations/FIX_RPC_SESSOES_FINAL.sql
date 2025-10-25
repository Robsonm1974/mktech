-- ============================================================================
-- FIX FINAL: RPCs de Sessões do Professor (SEM TESTES)
-- ============================================================================
-- Data: 24/10/2024
-- Correção: Buscar sessões direto pelo professor_id na tabela sessions
-- ============================================================================

-- Dropar funções antigas
DROP FUNCTION IF EXISTS get_sessoes_professor(uuid);
DROP FUNCTION IF EXISTS get_sessoes_professor(text);
DROP FUNCTION IF EXISTS get_estatisticas_professor(uuid);
DROP FUNCTION IF EXISTS get_estatisticas_professor(text);

-- ============================================================================
-- 1. RPC: get_sessoes_professor
-- Busca sessões diretamente pelo professor_id da tabela sessions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_sessoes_professor(p_professor_id text)
RETURNS TABLE (
  id uuid,
  session_code varchar,
  aula_titulo varchar,
  aula_id uuid,
  turma_nome varchar,
  turma_id uuid,
  status varchar,
  data_inicio timestamp,
  data_fim timestamp,
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
    s.session_code::varchar,
    au.titulo::varchar as aula_titulo,
    au.id as aula_id,
    t.name::varchar as turma_nome,
    t.id as turma_id,
    s.status::varchar,
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
  WHERE s.professor_id::text = p_professor_id
  ORDER BY s.data_inicio DESC
  LIMIT 20;
END;
$$;

-- ============================================================================
-- 2. RPC: get_estatisticas_professor
-- Calcula estatísticas do professor baseado em sessions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_estatisticas_professor(p_professor_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
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

  RETURN v_result;
END;
$$;

-- ============================================================================
-- Pronto! Agora teste:
-- SELECT * FROM get_sessoes_professor('29aa9293-5612-4af1-9829-7f328bdf4eb8');
-- SELECT * FROM get_estatisticas_professor('29aa9293-5612-4af1-9829-7f328bdf4eb8');
-- ============================================================================

