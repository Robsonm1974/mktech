-- =====================================================
-- ATUALIZAR RPC insert_blocos_templates_admin PARA USAR ANO_ESCOLAR_ID
-- Versão corrigida: Remove função antiga primeiro
-- =====================================================

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS insert_blocos_templates_admin(JSONB);

-- Criar nova função com suporte a ano_escolar_id
CREATE OR REPLACE FUNCTION insert_blocos_templates_admin(blocos_json JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted_count INTEGER := 0;
  v_bloco JSONB;
BEGIN
  -- Iterar sobre cada bloco no JSON
  FOR v_bloco IN SELECT * FROM jsonb_array_elements(blocos_json)
  LOOP
    INSERT INTO blocos_templates (
      planejamento_id,
      disciplina_id,
      ano_escolar_id,
      codigo_bloco,
      numero_sequencia,
      titulo,
      conteudo_texto,
      tipo_midia,
      midia_url,
      pontos_bloco,
      status,
      created_at,
      updated_at
    )
    VALUES (
      (v_bloco->>'planejamento_id')::UUID,
      (v_bloco->>'disciplina_id')::UUID,
      v_bloco->>'ano_escolar_id',
      v_bloco->>'codigo_bloco',
      (v_bloco->>'numero_sequencia')::INTEGER,
      v_bloco->>'titulo',
      v_bloco->>'conteudo_texto',
      v_bloco->>'tipo_midia',
      v_bloco->>'midia_url',
      COALESCE((v_bloco->>'pontos_bloco')::INTEGER, 10),
      COALESCE(v_bloco->>'status', 'incompleto'),
      NOW(),
      NOW()
    );
    
    v_inserted_count := v_inserted_count + 1;
  END LOOP;

  RETURN v_inserted_count;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao inserir blocos: %', SQLERRM;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION insert_blocos_templates_admin TO authenticated;

COMMENT ON FUNCTION insert_blocos_templates_admin IS 'Insere múltiplos blocos de template incluindo ano_escolar_id';

-- Verificar
SELECT 'RPC insert_blocos_templates_admin atualizado com sucesso!' AS status;


