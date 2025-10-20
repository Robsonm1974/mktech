-- =====================================================
-- ATUALIZAR RPC insert_planejamento_admin PARA USAR ANO_ESCOLAR_ID
-- =====================================================

CREATE OR REPLACE FUNCTION insert_planejamento_admin(
  p_disciplina_id UUID,
  p_ano_escolar_id VARCHAR,
  p_titulo VARCHAR,
  p_documento_md TEXT,
  p_num_blocos INTEGER,
  p_pontos_totais INTEGER,
  p_pontos_por_quiz INTEGER,
  p_codigo_base VARCHAR,
  p_status VARCHAR DEFAULT 'processado'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_planejamento_id UUID;
  v_result JSONB;
BEGIN
  -- Inserir planejamento
  INSERT INTO planejamentos (
    disciplina_id,
    ano_escolar_id,
    titulo,
    documento_md,
    num_blocos,
    pontos_totais,
    pontos_por_quiz,
    codigo_base,
    status,
    created_at,
    updated_at
  )
  VALUES (
    p_disciplina_id,
    p_ano_escolar_id,
    p_titulo,
    p_documento_md,
    p_num_blocos,
    p_pontos_totais,
    p_pontos_por_quiz,
    p_codigo_base,
    p_status,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_planejamento_id;

  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', TRUE,
    'planejamento_id', v_planejamento_id,
    'message', 'Planejamento inserido com sucesso'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION insert_planejamento_admin TO authenticated;

COMMENT ON FUNCTION insert_planejamento_admin IS 'Insere um planejamento com ano_escolar_id (versão atualizada)';

-- Verificar
SELECT 'RPC insert_planejamento_admin atualizado com sucesso!' AS status;


