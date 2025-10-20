-- ===================================================
-- FASE 1 COMPLETA: Adicionar Ano e Disciplina em Aulas
-- Executa todas as etapas em ordem
-- ===================================================

-- ===================================================
-- ETAPA 1.1: Adicionar colunas à tabela aulas
-- ===================================================

ALTER TABLE aulas
ADD COLUMN IF NOT EXISTS ano_escolar_id VARCHAR(20),
ADD COLUMN IF NOT EXISTS disciplina_id UUID REFERENCES disciplinas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_aulas_ano_escolar ON aulas(ano_escolar_id);
CREATE INDEX IF NOT EXISTS idx_aulas_disciplina ON aulas(disciplina_id);

DO $$
BEGIN
  RAISE NOTICE '✅ ETAPA 1.1: Colunas adicionadas à tabela aulas';
END $$;

-- ===================================================
-- ETAPA 1.2: Atualizar aulas existentes
-- ===================================================

DO $$
DECLARE
  v_total_atualizadas INTEGER := 0;
  v_aula RECORD;
  v_ano_escolar_id VARCHAR;
  v_disciplina_id UUID;
BEGIN
  RAISE NOTICE '--- ETAPA 1.2: Atualizando aulas existentes ---';

  FOR v_aula IN 
    SELECT a.id, a.titulo
    FROM aulas a
    WHERE a.ano_escolar_id IS NULL
  LOOP
    -- Detectar ano e disciplina do primeiro bloco da aula
    SELECT 
      bt.ano_escolar_id,
      bt.disciplina_id
    INTO 
      v_ano_escolar_id,
      v_disciplina_id
    FROM aulas_blocos ab
    JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
    WHERE ab.aula_id = v_aula.id
    ORDER BY ab.ordem_na_aula
    LIMIT 1;

    IF v_ano_escolar_id IS NOT NULL THEN
      UPDATE aulas
      SET 
        ano_escolar_id = v_ano_escolar_id,
        disciplina_id = v_disciplina_id
      WHERE id = v_aula.id;
      
      v_total_atualizadas := v_total_atualizadas + 1;
      RAISE NOTICE '  ✅ Aula "%" atualizada: Ano=%, Disciplina=%', 
        v_aula.titulo, v_ano_escolar_id, v_disciplina_id;
    ELSE
      RAISE NOTICE '  ⚠️ Aula "%" sem blocos associados', v_aula.titulo;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ ETAPA 1.2: % aulas atualizadas', v_total_atualizadas;
END $$;

-- ===================================================
-- ETAPA 1.3: Atualizar RPC get_aulas_with_relations_admin
-- ===================================================

DROP FUNCTION IF EXISTS get_aulas_with_relations_admin() CASCADE;

CREATE OR REPLACE FUNCTION get_aulas_with_relations_admin()
RETURNS TABLE (
  id UUID,
  trilha_id UUID,
  titulo VARCHAR,
  descricao TEXT,
  ordem INTEGER,
  created_at TIMESTAMP,
  total_blocos INTEGER,
  blocos_ids UUID[],
  ano_escolar_id VARCHAR,
  disciplina_id UUID,
  ano_nome VARCHAR,
  disciplina_codigo VARCHAR,
  disciplina_nome VARCHAR
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
    ARRAY_AGG(ab.bloco_template_id ORDER BY ab.ordem_na_aula) FILTER (WHERE ab.bloco_template_id IS NOT NULL) AS blocos_ids,
    a.ano_escolar_id,
    a.disciplina_id,
    ae.nome AS ano_nome,
    d.codigo AS disciplina_codigo,
    d.nome AS disciplina_nome
  FROM aulas a
  LEFT JOIN aulas_blocos ab ON ab.aula_id = a.id
  LEFT JOIN anos_escolares ae ON ae.id = a.ano_escolar_id
  LEFT JOIN disciplinas d ON d.id = a.disciplina_id
  GROUP BY 
    a.id, a.trilha_id, a.titulo, a.descricao, a.ordem, a.created_at, 
    a.ano_escolar_id, a.disciplina_id, ae.nome, d.codigo, d.nome
  ORDER BY a.created_at DESC;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ ETAPA 1.3: RPC get_aulas_with_relations_admin atualizado';
END $$;

-- ===================================================
-- ETAPA 1.4: Atualizar RPC insert_aula_with_blocos_admin
-- ===================================================

DROP FUNCTION IF EXISTS insert_aula_with_blocos_admin(UUID, VARCHAR, UUID, VARCHAR, TEXT, TEXT, INTEGER, BOOLEAN, UUID[]) CASCADE;
DROP FUNCTION IF EXISTS insert_aula_with_blocos_admin(UUID, VARCHAR, TEXT, UUID[]) CASCADE;

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
    1,
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
    'message', format('Aula criada com %s blocos', COALESCE(array_length(p_blocos_ids, 1), 0))
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar aula: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ ETAPA 1.4: RPC insert_aula_with_blocos_admin atualizado';
END $$;

-- ===================================================
-- VERIFICAÇÃO FINAL
-- ===================================================

DO $$
DECLARE
  v_colunas_ok BOOLEAN;
  v_rpcs_ok BOOLEAN;
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '📊 VERIFICAÇÃO FINAL - FASE 1';
  RAISE NOTICE '═══════════════════════════════════════════════════';

  -- Verificar colunas
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'aulas' 
      AND column_name IN ('ano_escolar_id', 'disciplina_id')
    HAVING COUNT(*) = 2
  ) INTO v_colunas_ok;

  -- Verificar RPCs
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname IN ('get_aulas_with_relations_admin', 'insert_aula_with_blocos_admin')
    HAVING COUNT(*) = 2
  ) INTO v_rpcs_ok;

  IF v_colunas_ok AND v_rpcs_ok THEN
    RAISE NOTICE '✅ Colunas adicionadas: OK';
    RAISE NOTICE '✅ RPCs atualizados: OK';
    RAISE NOTICE '🎉 FASE 1 CONCLUÍDA COM SUCESSO!';
  ELSE
    IF NOT v_colunas_ok THEN
      RAISE EXCEPTION '❌ Falha ao adicionar colunas';
    END IF;
    IF NOT v_rpcs_ok THEN
      RAISE EXCEPTION '❌ Falha ao atualizar RPCs';
    END IF;
  END IF;
END $$;

-- Teste rápido do RPC
SELECT 
  id, 
  titulo, 
  ano_escolar_id, 
  ano_nome,
  disciplina_codigo, 
  total_blocos
FROM get_aulas_with_relations_admin()
LIMIT 3;

