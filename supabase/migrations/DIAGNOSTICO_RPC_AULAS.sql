-- ============================================================================
-- DIAGNÓSTICO: Verificar RPC get_aulas_with_relations_admin
-- Data: 2025-10-20
-- ============================================================================

-- 1. Verificar se RPC existe
DO $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '🔍 DIAGNÓSTICO: RPC get_aulas_with_relations_admin';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Verificar existência
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'get_aulas_with_relations_admin'
  ) INTO v_exists;
  
  IF v_exists THEN
    RAISE NOTICE '✅ RPC encontrado!';
  ELSE
    RAISE NOTICE '❌ RPC NÃO ENCONTRADO!';
    RAISE NOTICE '';
    RAISE NOTICE '➡️ Execute o script: FIX_RPC_GET_AULAS_PROFESSOR.sql';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- 2. Listar todas as versões do RPC
SELECT 
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'get_aulas_with_relations_admin';

-- 3. Verificar tabelas necessárias
SELECT 
  'aulas' AS tabela,
  COUNT(*) AS registros
FROM aulas
UNION ALL
SELECT 
  'aulas_blocos' AS tabela,
  COUNT(*) AS registros
FROM aulas_blocos
UNION ALL
SELECT 
  'blocos_templates' AS tabela,
  COUNT(*) AS registros
FROM blocos_templates
UNION ALL
SELECT 
  'anos_escolares' AS tabela,
  COUNT(*) AS registros
FROM anos_escolares
UNION ALL
SELECT 
  'disciplinas' AS tabela,
  COUNT(*) AS registros
FROM disciplinas;

-- 4. Verificar aulas com blocos
SELECT 
  a.id,
  a.titulo,
  COUNT(ab.bloco_template_id) AS total_blocos,
  (
    SELECT bt.ano_escolar_id
    FROM aulas_blocos ab2
    JOIN blocos_templates bt ON bt.id = ab2.bloco_template_id
    WHERE ab2.aula_id = a.id
    ORDER BY ab2.ordem_na_aula
    LIMIT 1
  ) AS ano_detectado,
  (
    SELECT d.codigo
    FROM aulas_blocos ab2
    JOIN blocos_templates bt ON bt.id = ab2.bloco_template_id
    JOIN disciplinas d ON d.id = bt.disciplina_id
    WHERE ab2.aula_id = a.id
    ORDER BY ab2.ordem_na_aula
    LIMIT 1
  ) AS disciplina_detectada
FROM aulas a
LEFT JOIN aulas_blocos ab ON ab.aula_id = a.id
GROUP BY a.id, a.titulo
ORDER BY a.created_at DESC;

-- 5. Testar RPC (se existir)
DO $$
DECLARE
  v_result RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '🧪 TESTANDO RPC';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  
  BEGIN
    FOR v_result IN 
      SELECT * FROM get_aulas_with_relations_admin(NULL, NULL, NULL)
    LOOP
      v_count := v_count + 1;
      RAISE NOTICE '';
      RAISE NOTICE '📚 Aula %:', v_count;
      RAISE NOTICE '   ID: %', v_result.id;
      RAISE NOTICE '   Título: %', v_result.titulo;
      RAISE NOTICE '   Ano: % (%)', v_result.ano_escolar_id, v_result.ano_nome;
      RAISE NOTICE '   Disciplina: % (%)', v_result.disciplina_codigo, v_result.disciplina_nome;
      RAISE NOTICE '   Total de blocos: %', v_result.total_blocos;
    END LOOP;
    
    IF v_count = 0 THEN
      RAISE NOTICE '';
      RAISE NOTICE '⚠️  Nenhuma aula encontrada!';
      RAISE NOTICE '';
      RAISE NOTICE 'Possíveis causas:';
      RAISE NOTICE '   1. Nenhuma aula foi criada ainda';
      RAISE NOTICE '   2. Aulas existem mas não têm blocos vinculados';
      RAISE NOTICE '';
      RAISE NOTICE '➡️ Acesse /admin/aulas/criar para criar uma aula';
    ELSE
      RAISE NOTICE '';
      RAISE NOTICE '✅ Total de aulas retornadas: %', v_count;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '';
      RAISE NOTICE '❌ ERRO ao executar RPC!';
      RAISE NOTICE 'Mensagem: %', SQLERRM;
      RAISE NOTICE '';
      RAISE NOTICE '➡️ Execute o script: FIX_RPC_GET_AULAS_PROFESSOR.sql';
  END;
  
  RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;

