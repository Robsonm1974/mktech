-- ============================================================================
-- FIX: RPC get_alunos_sessao
-- ============================================================================
-- Data: 24/10/2024
-- Correção: Buscar alunos de uma sessão específica
-- ============================================================================

DROP FUNCTION IF EXISTS get_alunos_sessao(uuid);

CREATE OR REPLACE FUNCTION get_alunos_sessao(p_session_id uuid)
RETURNS TABLE (
  aluno_id uuid,
  aluno_nome character varying,
  bloco_atual integer,
  blocos_completados integer,
  total_blocos integer,
  pontos_ganhos integer,
  status character varying,
  ultima_atividade timestamp without time zone
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.aluno_id,
    a.full_name,
    p.bloco_atual_numero,
    p.blocos_completados,
    p.total_blocos,
    p.pontos_ganhos_sessao,
    p.status,
    p.updated_at
  FROM participacoes_sessao p
  INNER JOIN alunos a ON a.id = p.aluno_id
  WHERE p.session_id = p_session_id
  ORDER BY p.updated_at DESC;
$$;

-- Teste:
-- SELECT * FROM get_alunos_sessao('b544bf53-23a8-4c96-a3af-27b93738e34b');

