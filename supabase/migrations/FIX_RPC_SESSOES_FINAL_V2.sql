-- ============================================================================
-- FIX FINAL V2: RPCs de Sessões do Professor
-- ============================================================================
-- Usa os tipos exatos das tabelas para evitar erros de conversão
-- ============================================================================

DROP FUNCTION IF EXISTS get_sessoes_professor(uuid);
DROP FUNCTION IF EXISTS get_sessoes_professor(text);
DROP FUNCTION IF EXISTS get_estatisticas_professor(uuid);
DROP FUNCTION IF EXISTS get_estatisticas_professor(text);

-- ============================================================================
-- 1. RPC: get_sessoes_professor
-- ============================================================================

CREATE OR REPLACE FUNCTION get_sessoes_professor(p_professor_id text)
RETURNS TABLE (
  id uuid,
  session_code character varying,
  aula_titulo character varying,
  aula_id uuid,
  turma_nome character varying,
  turma_id uuid,
  status character varying,
  data_inicio timestamp without time zone,
  data_fim timestamp without time zone,
  total_alunos integer,
  bloco_ativo_numero integer
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    s.id,
    s.session_code,
    au.titulo,
    au.id,
    t.name,
    t.id,
    s.status,
    s.data_inicio,
    s.data_fim,
    COALESCE(
      (SELECT COUNT(*)::integer FROM participacoes_sessao WHERE session_id = s.id),
      0
    ),
    s.bloco_ativo_numero
  FROM sessions s
  INNER JOIN turmas t ON t.id = s.turma_id
  INNER JOIN aulas au ON au.id = s.aula_id
  WHERE s.professor_id::text = p_professor_id
  ORDER BY s.data_inicio DESC
  LIMIT 20;
$$;

-- ============================================================================
-- 2. RPC: get_estatisticas_professor
-- ============================================================================

CREATE OR REPLACE FUNCTION get_estatisticas_professor(p_professor_id text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
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
  );
$$;

-- ============================================================================
-- Pronto! Teste com:
-- SELECT * FROM get_sessoes_professor('29aa9293-5612-4af1-9829-7f328bdf4eb8');
-- ============================================================================

