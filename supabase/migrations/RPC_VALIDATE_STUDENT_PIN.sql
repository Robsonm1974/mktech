-- ============================================================================
-- RPC: validate_student_pin
-- ============================================================================
-- Valida o PIN de um aluno sem expor dados sensíveis
-- Retorna apenas se o PIN está correto e o ícone do aluno
-- ============================================================================

DROP FUNCTION IF EXISTS validate_student_pin(uuid, text);

CREATE OR REPLACE FUNCTION validate_student_pin(p_aluno_id uuid, p_pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_aluno RECORD;
  v_result json;
BEGIN
  -- Buscar aluno
  SELECT 
    id,
    pin_code,
    icone_afinidade
  INTO v_aluno
  FROM alunos
  WHERE id = p_aluno_id
    AND active = true
  LIMIT 1;

  -- Se não encontrou aluno
  IF v_aluno.id IS NULL THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Aluno não encontrado'
    );
  END IF;

  -- Validar PIN
  IF v_aluno.pin_code = p_pin THEN
    RETURN json_build_object(
      'valid', true,
      'icone_afinidade', v_aluno.icone_afinidade
    );
  ELSE
    RETURN json_build_object(
      'valid', false,
      'error', 'PIN incorreto'
    );
  END IF;
END;
$$;

-- Garantir que a função pode ser executada por qualquer usuário (incluindo anon)
GRANT EXECUTE ON FUNCTION validate_student_pin(uuid, text) TO anon, authenticated, service_role;

