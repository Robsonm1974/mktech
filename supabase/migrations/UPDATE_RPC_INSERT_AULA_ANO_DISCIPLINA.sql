-- ===================================================
-- FASE 1.4: Atualizar RPC insert_aula_with_blocos_admin
-- Adiciona detecção automática de ano_escolar_id e disciplina_id
-- ===================================================

-- 1. Dropar todas as versões antigas
DROP FUNCTION IF EXISTS insert_aula_with_blocos_admin(UUID, VARCHAR, UUID, VARCHAR, TEXT, TEXT, INTEGER, BOOLEAN, UUID[]) CASCADE;
DROP FUNCTION IF EXISTS insert_aula_with_blocos_admin(UUID, VARCHAR, TEXT, UUID[]) CASCADE;

-- 2. Recriar com detecção automática
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
  v_ano_escolar_id VARCHAR;
  v_disciplina_id UUID;
  v_result JSONB;
BEGIN
  -- 1. Detectar ano_escolar_id e disciplina_id do primeiro bloco
  IF array_length(p_blocos_ids, 1) > 0 THEN
    SELECT 
      bt.ano_escolar_id,
      bt.disciplina_id
    INTO 
      v_ano_escolar_id,
      v_disciplina_id
    FROM blocos_templates bt
    WHERE bt.id = p_blocos_ids[1];
    
    -- Calcular pontos totais
    SELECT COALESCE(SUM(pontos_bloco), 0) INTO v_pontos_totais
    FROM blocos_templates
    WHERE id = ANY(p_blocos_ids);
    
    RAISE NOTICE 'Detectado: Ano=%, Disciplina=%', v_ano_escolar_id, v_disciplina_id;
  END IF;

  -- 2. Inserir aula com ano e disciplina detectados
  INSERT INTO aulas (
    trilha_id,
    titulo,
    descricao,
    ordem,
    ano_escolar_id,
    disciplina_id,
    created_at
  ) VALUES (
    p_trilha_id,
    p_titulo,
    p_descricao,
    1, -- ordem padrão
    v_ano_escolar_id,
    v_disciplina_id,
    NOW()
  )
  RETURNING id INTO v_aula_id;

  RAISE NOTICE 'Aula criada: %', v_aula_id;

  -- 3. Vincular blocos à aula
  IF array_length(p_blocos_ids, 1) > 0 THEN
    FOREACH v_bloco_id IN ARRAY p_blocos_ids
    LOOP
      INSERT INTO aulas_blocos (aula_id, bloco_template_id, ordem_na_aula)
      VALUES (v_aula_id, v_bloco_id, v_ordem);
      v_ordem := v_ordem + 1;
    END LOOP;
    
    RAISE NOTICE 'Blocos vinculados: %', array_length(p_blocos_ids, 1);
  END IF;

  -- 4. Retornar resultado
  v_result := jsonb_build_object(
    'success', TRUE,
    'aula_id', v_aula_id,
    'ano_escolar_id', v_ano_escolar_id,
    'disciplina_id', v_disciplina_id,
    'total_blocos', array_length(p_blocos_ids, 1),
    'pontos_totais', v_pontos_totais,
    'message', format('Aula criada com %s blocos para %s', array_length(p_blocos_ids, 1), v_ano_escolar_id)
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar aula: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- 3. Verificar criação
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'insert_aula_with_blocos_admin'
  ) THEN
    RAISE NOTICE '✅ RPC insert_aula_with_blocos_admin atualizado com sucesso!';
  ELSE
    RAISE EXCEPTION '❌ Falha ao criar RPC insert_aula_with_blocos_admin';
  END IF;
END $$;

-- 4. Teste simulado (sem executar inserção real)
DO $$
DECLARE
  test_bloco_id UUID;
  test_result JSONB;
BEGIN
  RAISE NOTICE '--- Teste de Detecção Automática ---';
  
  -- Pegar um bloco qualquer para testar a lógica
  SELECT id INTO test_bloco_id FROM blocos_templates LIMIT 1;
  
  IF test_bloco_id IS NULL THEN
    RAISE NOTICE '⚠️ Nenhum bloco disponível para teste';
    RETURN;
  END IF;
  
  -- Verificar se o bloco tem ano_escolar_id
  SELECT 
    CASE 
      WHEN ano_escolar_id IS NOT NULL THEN '✅ Bloco tem ano_escolar_id: ' || ano_escolar_id
      ELSE '⚠️ Bloco sem ano_escolar_id'
    END
  FROM blocos_templates 
  WHERE id = test_bloco_id;
  
  RAISE NOTICE '✅ RPC pronto para uso!';
END $$;

