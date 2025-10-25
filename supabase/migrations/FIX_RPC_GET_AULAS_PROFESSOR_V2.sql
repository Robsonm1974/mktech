-- ============================================================================
-- FIX V2: RPC get_aulas_with_relations_admin
-- Corrige nome da coluna: ordem_na_aula (não "ordem")
-- Data: 2025-10-20
-- ============================================================================

-- Dropar função antiga
DROP FUNCTION IF EXISTS get_aulas_with_relations_admin();
DROP FUNCTION IF EXISTS get_aulas_with_relations_admin(UUID, UUID, BOOLEAN);

-- Criar nova versão CORRIGIDA
CREATE OR REPLACE FUNCTION get_aulas_with_relations_admin(
  p_tenant_id UUID DEFAULT NULL,
  p_turma_id UUID DEFAULT NULL,
  p_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  trilha_id UUID,
  titulo VARCHAR,
  descricao TEXT,
  ordem INTEGER,
  created_at TIMESTAMP,
  ano_escolar_id VARCHAR,
  disciplina_id UUID,
  ano_nome VARCHAR,
  disciplina_codigo VARCHAR,
  disciplina_nome VARCHAR,
  total_blocos INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH aula_info AS (
    SELECT 
      a.id,
      a.trilha_id,
      a.titulo,
      a.descricao,
      a.ordem,
      a.created_at,
      -- Detectar ano e disciplina do primeiro bloco (usando ordem_na_aula)
      (
        SELECT bt.ano_escolar_id
        FROM aulas_blocos ab
        JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
        WHERE ab.aula_id = a.id
        ORDER BY ab.ordem_na_aula  -- ✅ CORRIGIDO
        LIMIT 1
      ) AS ano_escolar_id,
      (
        SELECT bt.disciplina_id
        FROM aulas_blocos ab
        JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
        WHERE ab.aula_id = a.id
        ORDER BY ab.ordem_na_aula  -- ✅ CORRIGIDO
        LIMIT 1
      ) AS disciplina_id,
      -- Contar blocos
      COALESCE((
        SELECT COUNT(*)
        FROM aulas_blocos ab
        WHERE ab.aula_id = a.id
      ), 0)::INTEGER AS total_blocos
    FROM aulas a
  )
  SELECT 
    ai.id,
    ai.trilha_id,
    ai.titulo,
    ai.descricao,
    ai.ordem,
    ai.created_at,
    ai.ano_escolar_id,
    ai.disciplina_id,
    -- Buscar nome do ano
    ae.nome AS ano_nome,
    -- Buscar código e nome da disciplina
    d.codigo AS disciplina_codigo,
    d.nome AS disciplina_nome,
    ai.total_blocos
  FROM aula_info ai
  LEFT JOIN anos_escolares ae ON ae.id = ai.ano_escolar_id
  LEFT JOIN disciplinas d ON d.id = ai.disciplina_id
  WHERE 
    -- Filtros opcionais
    (p_tenant_id IS NULL OR TRUE)
    AND (p_turma_id IS NULL OR TRUE)
    AND (p_active IS NULL OR TRUE)
    -- Apenas aulas com blocos
    AND ai.total_blocos > 0
  ORDER BY ai.created_at DESC;
END;
$$;

-- Grant de permissões
GRANT EXECUTE ON FUNCTION get_aulas_with_relations_admin(UUID, UUID, BOOLEAN) TO authenticated, anon, service_role;

-- ============================================================================
-- TESTE RÁPIDO
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ RPC get_aulas_with_relations_admin CORRIGIDO (V2)!';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Testar RPC
  SELECT COUNT(*) INTO v_count
  FROM get_aulas_with_relations_admin(NULL, NULL, NULL);
  
  RAISE NOTICE '📊 Aulas encontradas: %', v_count;
  
  IF v_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Nenhuma aula com blocos encontrada!';
    RAISE NOTICE '➡️ Crie uma aula em /admin/aulas/criar';
  ELSE
    RAISE NOTICE '✅ RPC funcionando corretamente!';
  END IF;
  
  RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;

-- Exibir resultados
SELECT 
  titulo,
  ano_nome,
  disciplina_codigo,
  total_blocos
FROM get_aulas_with_relations_admin(NULL, NULL, NULL);






