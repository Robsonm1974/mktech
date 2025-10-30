-- ============================================================================
-- RPC: get_session_data_for_student
-- ============================================================================
-- Permite busca pública dos dados de uma sessão específica para alunos
-- Retorna sessão + aula em um único JSON
-- ============================================================================

DROP FUNCTION IF EXISTS get_session_data_for_student(uuid);

CREATE OR REPLACE FUNCTION get_session_data_for_student(p_session_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session RECORD;
  v_aula RECORD;
  v_result json;
BEGIN
  -- Buscar sessão
  SELECT 
    id,
    aula_id,
    status,
    bloco_ativo_numero
  INTO v_session
  FROM sessions
  WHERE id = p_session_id
  LIMIT 1;

  -- Se não encontrou sessão
  IF v_session.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Buscar aula
  SELECT 
    id,
    titulo,
    descricao
  INTO v_aula
  FROM aulas
  WHERE id = v_session.aula_id
  LIMIT 1;

  -- Montar resultado
  SELECT json_build_object(
    'session', json_build_object(
      'id', v_session.id,
      'aula_id', v_session.aula_id,
      'status', v_session.status,
      'bloco_ativo_numero', v_session.bloco_ativo_numero
    ),
    'aula', json_build_object(
      'id', v_aula.id,
      'titulo', v_aula.titulo,
      'descricao', v_aula.descricao
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Garantir que a função pode ser executada por qualquer usuário (incluindo anon)
GRANT EXECUTE ON FUNCTION get_session_data_for_student(uuid) TO anon, authenticated, service_role;

