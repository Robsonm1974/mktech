-- ============================================================================
-- RPC: get_session_by_code_public
-- ============================================================================
-- Permite busca pública de sessões ativas pelo código
-- Necessário para a página /entrar onde alunos ainda não estão autenticados
-- Retorna também os alunos da turma e dados do tenant em um único JSON
-- ============================================================================

DROP FUNCTION IF EXISTS get_session_by_code_public(text);

CREATE OR REPLACE FUNCTION get_session_by_code_public(p_session_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_record RECORD;
  v_result json;
BEGIN
  -- Buscar sessão
  SELECT 
    s.id,
    s.status,
    s.aula_id,
    s.turma_id,
    s.tenant_id
  INTO v_session_record
  FROM sessions s
  WHERE s.session_code = UPPER(p_session_code)
    AND s.status = 'active'
  LIMIT 1;

  -- Se não encontrou sessão, retornar null
  IF v_session_record.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Montar resultado com sessão, alunos e tenant
  SELECT json_build_object(
    'session', json_build_object(
      'id', v_session_record.id,
      'status', v_session_record.status,
      'aula_id', v_session_record.aula_id,
      'turma_id', v_session_record.turma_id,
      'tenant_id', v_session_record.tenant_id
    ),
    'alunos', (
      SELECT json_agg(json_build_object(
        'id', a.id,
        'full_name', a.full_name,
        'icone_afinidade', a.icone_afinidade,
        'active', a.active
      ))
      FROM alunos a
      WHERE a.turma_id = v_session_record.turma_id
        AND a.active = true
    ),
    'tenant', (
      SELECT json_build_object(
        'id', t.id,
        'name', t.name,
        'slug', t.slug
      )
      FROM tenants t
      WHERE t.id = v_session_record.tenant_id
      LIMIT 1
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Garantir que a função pode ser executada por qualquer usuário (incluindo anon)
GRANT EXECUTE ON FUNCTION get_session_by_code_public(text) TO anon, authenticated, service_role;
