-- ============================================================================
-- RPC: get_student_profile
-- ============================================================================
-- Permite busca pública dos dados básicos de um aluno para exibir o perfil
-- Usado quando o aluno não está autenticado como usuário do sistema
-- ============================================================================

DROP FUNCTION IF EXISTS get_student_profile(uuid);

CREATE OR REPLACE FUNCTION get_student_profile(p_aluno_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  -- Buscar dados do aluno com turma e tenant
  SELECT json_build_object(
    'id', a.id,
    'full_name', a.full_name,
    'icone_afinidade', a.icone_afinidade,
    'turma_nome', t.name,
    'escola_nome', tn.name
  )
  INTO v_result
  FROM alunos a
  LEFT JOIN turmas t ON t.id = a.turma_id
  LEFT JOIN tenants tn ON tn.id = a.tenant_id
  WHERE a.id = p_aluno_id
    AND a.active = true
  LIMIT 1;

  RETURN v_result;
END;
$$;

-- Garantir que a função pode ser executada por qualquer usuário (incluindo anon)
GRANT EXECUTE ON FUNCTION get_student_profile(uuid) TO anon, authenticated, service_role;

