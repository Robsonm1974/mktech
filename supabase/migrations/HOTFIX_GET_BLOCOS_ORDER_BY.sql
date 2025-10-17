-- ============================================================================
-- HOTFIX: Corrigir erro de ORDER BY na função get_blocos_with_relations_admin
-- ERROR: 42803: column must appear in the GROUP BY clause
-- ============================================================================

-- Recriar a função com sintaxe correta de ORDER BY dentro do jsonb_agg
CREATE OR REPLACE FUNCTION get_blocos_with_relations_admin()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Buscar e agregar blocos com suas relações
  -- Sintaxe correta: jsonb_agg(expression ORDER BY sort_key)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', bloco_data.id,
      'codigo_bloco', bloco_data.codigo_bloco,
      'titulo', bloco_data.titulo,
      'status', bloco_data.status,
      'pontos_bloco', bloco_data.pontos_bloco,
      'tipo_midia', bloco_data.tipo_midia,
      'quiz_id', bloco_data.quiz_id,
      'disciplinas', bloco_data.disciplina_obj,
      'planejamentos', bloco_data.planejamento_obj
    ) ORDER BY bloco_data.codigo_bloco ASC
  ) INTO result
  FROM (
    SELECT 
      bt.id,
      bt.codigo_bloco,
      bt.titulo,
      bt.status,
      bt.pontos_bloco,
      bt.tipo_midia,
      bt.quiz_id,
      CASE 
        WHEN d.id IS NOT NULL THEN 
          jsonb_build_object(
            'codigo', d.codigo,
            'nome', d.nome,
            'cor_hex', d.cor_hex,
            'icone', d.icone
          )
        ELSE NULL
      END as disciplina_obj,
      CASE
        WHEN p.id IS NOT NULL THEN
          jsonb_build_object(
            'turma', p.turma,
            'codigo_base', p.codigo_base
          )
        ELSE NULL
      END as planejamento_obj
    FROM public.blocos_templates bt
    LEFT JOIN public.disciplinas d ON bt.disciplina_id = d.id
    LEFT JOIN public.planejamentos p ON bt.planejamento_id = p.id
  ) AS bloco_data;
  
  -- Se não houver blocos, retornar array vazio ao invés de NULL
  IF result IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;
  
  RETURN result;
END;
$$;

-- ============================================================================
-- TESTE DA FUNÇÃO CORRIGIDA
-- ============================================================================

DO $$
DECLARE
  test_result JSONB;
  blocos_count INTEGER;
  result_count INTEGER;
BEGIN
  -- Contar blocos na tabela
  SELECT COUNT(*) INTO blocos_count FROM blocos_templates;
  
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TESTE DA FUNÇÃO CORRIGIDA:';
  RAISE NOTICE '  📊 Blocos na tabela: %', blocos_count;
  
  -- Chamar a função
  BEGIN
    SELECT get_blocos_with_relations_admin() INTO test_result;
    
    RAISE NOTICE '  ✅ Função executou sem erros!';
    RAISE NOTICE '  📦 Resultado é NULL: %', (test_result IS NULL);
    RAISE NOTICE '  📦 Tipo do resultado: %', jsonb_typeof(test_result);
    
    IF jsonb_typeof(test_result) = 'array' THEN
      result_count := jsonb_array_length(test_result);
      RAISE NOTICE '  📦 Blocos retornados: %', result_count;
      
      IF blocos_count = 0 AND result_count = 0 THEN
        RAISE NOTICE '  ✅ Funciona corretamente quando não há blocos!';
      ELSIF blocos_count > 0 AND result_count = blocos_count THEN
        RAISE NOTICE '  ✅ Retornou todos os blocos corretamente!';
        
        -- Mostrar o primeiro bloco como exemplo
        IF result_count > 0 THEN
          RAISE NOTICE '';
          RAISE NOTICE '  📄 Exemplo do primeiro bloco:';
          RAISE NOTICE '     %', test_result->0;
        END IF;
      ELSE
        RAISE WARNING '  ⚠️ Possível inconsistência: % blocos na tabela, % retornados', blocos_count, result_count;
      END IF;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '  ❌ Erro ao executar função: % - %', SQLSTATE, SQLERRM;
  END;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- TESTE MANUAL DIRETO (SEM FUNÇÃO)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🔍 TESTE MANUAL DA QUERY:';
  RAISE NOTICE '';
END $$;

SELECT 
  bt.id,
  bt.codigo_bloco,
  bt.titulo,
  bt.status,
  d.nome as disciplina_nome,
  p.turma as planejamento_turma
FROM public.blocos_templates bt
LEFT JOIN public.disciplinas d ON bt.disciplina_id = d.id
LEFT JOIN public.planejamentos p ON bt.planejamento_id = p.id
ORDER BY bt.codigo_bloco ASC
LIMIT 5;

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 HOTFIX APLICADO COM SUCESSO!';
  RAISE NOTICE '✅ Função get_blocos_with_relations_admin corrigida';
  RAISE NOTICE '🔄 Recarregue a página /admin/blocos no navegador';
END $$;


