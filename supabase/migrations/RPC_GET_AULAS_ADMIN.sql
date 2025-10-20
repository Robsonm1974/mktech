-- ===================================================
-- RPC: get_aulas_with_relations_admin
-- Retorna aulas com informações de blocos, disciplina e ano
-- ===================================================

DROP FUNCTION IF EXISTS get_aulas_with_relations_admin();

CREATE OR REPLACE FUNCTION get_aulas_with_relations_admin()
RETURNS TABLE (
  id UUID,
  trilha_id UUID,
  titulo VARCHAR,
  descricao TEXT,
  ordem INTEGER,
  created_at TIMESTAMP,
  total_blocos INTEGER,
  blocos_ids UUID[]
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.trilha_id,
    a.titulo,
    a.descricao,
    a.ordem,
    a.created_at,
    COALESCE(COUNT(ab.bloco_template_id), 0)::INTEGER AS total_blocos,
    ARRAY_AGG(ab.bloco_template_id ORDER BY ab.ordem_na_aula) FILTER (WHERE ab.bloco_template_id IS NOT NULL) AS blocos_ids
  FROM aulas a
  LEFT JOIN aulas_blocos ab ON ab.aula_id = a.id
  GROUP BY 
    a.id, a.trilha_id, a.titulo, a.descricao, a.ordem, a.created_at
  ORDER BY a.created_at DESC;
END;
$$;

-- ===================================================
-- RPC: insert_aula_with_blocos_admin
-- Cria uma aula e vincula blocos templates
-- ===================================================

-- Dropar todas as versões antigas
DROP FUNCTION IF EXISTS insert_aula_with_blocos_admin(UUID, VARCHAR, UUID, VARCHAR, TEXT, TEXT, INTEGER, BOOLEAN, UUID[]);
DROP FUNCTION IF EXISTS insert_aula_with_blocos_admin(UUID, VARCHAR, TEXT, UUID[]);

-- Nova versão simplificada
CREATE OR REPLACE FUNCTION insert_aula_with_blocos_admin(
  p_trilha_id UUID,
  p_titulo VARCHAR,
  p_descricao TEXT DEFAULT NULL,
  p_blocos_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_aula_id UUID;
  v_bloco_id UUID;
  v_ordem INTEGER := 1;
  v_pontos_totais INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Calcular pontos totais dos blocos
  IF array_length(p_blocos_ids, 1) > 0 THEN
    SELECT COALESCE(SUM(pontos_bloco), 0) INTO v_pontos_totais
    FROM blocos_templates
    WHERE id = ANY(p_blocos_ids);
  END IF;

  -- Inserir aula (apenas colunas que existem na tabela atual)
  INSERT INTO aulas (
    trilha_id,
    titulo,
    descricao,
    ordem,
    created_at
  ) VALUES (
    p_trilha_id,
    p_titulo,
    p_descricao,
    1, -- ordem padrão
    NOW()
  )
  RETURNING id INTO v_aula_id;

  -- Vincular blocos à aula
  IF array_length(p_blocos_ids, 1) > 0 THEN
    FOREACH v_bloco_id IN ARRAY p_blocos_ids
    LOOP
      INSERT INTO aulas_blocos (aula_id, bloco_template_id, ordem_na_aula)
      VALUES (v_aula_id, v_bloco_id, v_ordem);
      v_ordem := v_ordem + 1;
    END LOOP;
  END IF;

  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', TRUE,
    'aula_id', v_aula_id,
    'message', 'Aula criada com sucesso',
    'total_blocos', COALESCE(array_length(p_blocos_ids, 1), 0)
  );

  RETURN v_result;
END;
$$;

-- ===================================================
-- RPC: update_aula_blocos_admin
-- Atualiza os blocos vinculados a uma aula
-- ===================================================

DROP FUNCTION IF EXISTS update_aula_blocos_admin(UUID, UUID[]);

CREATE OR REPLACE FUNCTION update_aula_blocos_admin(
  p_aula_id UUID,
  p_blocos_ids UUID[]
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_bloco_id UUID;
  v_ordem INTEGER := 1;
  v_pontos_totais INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Remover blocos existentes
  DELETE FROM aulas_blocos WHERE aula_id = p_aula_id;

  -- Calcular novos pontos totais
  IF array_length(p_blocos_ids, 1) > 0 THEN
    SELECT COALESCE(SUM(pontos_bloco), 0) INTO v_pontos_totais
    FROM blocos_templates
    WHERE id = ANY(p_blocos_ids);
  END IF;

  -- Adicionar novos blocos
  IF array_length(p_blocos_ids, 1) > 0 THEN
    FOREACH v_bloco_id IN ARRAY p_blocos_ids
    LOOP
      INSERT INTO aulas_blocos (aula_id, bloco_template_id, ordem_na_aula)
      VALUES (p_aula_id, v_bloco_id, v_ordem);
      v_ordem := v_ordem + 1;
    END LOOP;
  END IF;

  -- Atualizar pontos totais da aula
  UPDATE aulas 
  SET pontos_totais = v_pontos_totais, updated_at = NOW()
  WHERE id = p_aula_id;

  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', TRUE,
    'aula_id', p_aula_id,
    'message', 'Blocos atualizados com sucesso',
    'total_blocos', COALESCE(array_length(p_blocos_ids, 1), 0)
  );

  RETURN v_result;
END;
$$;

-- ===================================================
-- RPC: delete_aula_admin
-- Deleta uma aula e seus vínculos
-- ===================================================

DROP FUNCTION IF EXISTS delete_aula_admin(UUID);

CREATE OR REPLACE FUNCTION delete_aula_admin(
  p_aula_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Deletar vínculos (CASCADE já faz isso, mas explícito é melhor)
  DELETE FROM aulas_blocos WHERE aula_id = p_aula_id;
  
  -- Deletar aula
  DELETE FROM aulas WHERE id = p_aula_id;

  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', TRUE,
    'message', 'Aula deletada com sucesso'
  );

  RETURN v_result;
END;
$$;

-- ===================================================
-- SUCCESS
-- ===================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RPCs de gestão de aulas criados com sucesso!';
  RAISE NOTICE '📋 Funções: get_aulas_with_relations_admin, insert_aula_with_blocos_admin, update_aula_blocos_admin, delete_aula_admin';
END $$;

