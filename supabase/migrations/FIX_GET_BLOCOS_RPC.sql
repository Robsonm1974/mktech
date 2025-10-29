-- ============================================================================
-- CORRIGIR FUNÇÃO get_blocos_with_relations_admin
-- Retornar array vazio [] ao invés de NULL quando não há blocos
-- ============================================================================

-- Recriar a função com melhor tratamento de casos vazios
CREATE OR REPLACE FUNCTION get_blocos_with_relations_admin()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Buscar e agregar blocos com suas relações
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', bt.id,
      'codigo_bloco', bt.codigo_bloco,
      'titulo', bt.titulo,
      'status', bt.status,
      'pontos_bloco', bt.pontos_bloco,
      'tipo_midia', bt.tipo_midia,
      'quiz_id', bt.quiz_id,
      'disciplinas', jsonb_build_object(
        'codigo', d.codigo,
        'nome', d.nome,
        'cor_hex', d.cor_hex,
        'icone', d.icone
      ),
      'planejamentos', jsonb_build_object(
        'turma', p.turma,
        'codigo_base', p.codigo_base
      )
    )
    ORDER BY bt.codigo_bloco ASC
  ) INTO result
  FROM public.blocos_templates bt
  LEFT JOIN public.disciplinas d ON bt.disciplina_id = d.id
  LEFT JOIN public.planejamentos p ON bt.planejamento_id = p.id;
  
  -- Se não houver blocos, retornar array vazio ao invés de NULL
  IF result IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;
  
  RETURN result;
END;
$$;

-- Testar a função
DO $$
DECLARE
  test_result JSONB;
  blocos_count INTEGER;
BEGIN
  -- Contar blocos na tabela
  SELECT COUNT(*) INTO blocos_count FROM blocos_templates;
  
  -- Chamar a função
  SELECT get_blocos_with_relations_admin() INTO test_result;
  
  RAISE NOTICE '🧪 TESTE DA FUNÇÃO CORRIGIDA:';
  RAISE NOTICE '  - Blocos na tabela: %', blocos_count;
  RAISE NOTICE '  - Resultado é NULL: %', (test_result IS NULL);
  RAISE NOTICE '  - Tipo do resultado: %', jsonb_typeof(test_result);
  
  IF jsonb_typeof(test_result) = 'array' THEN
    RAISE NOTICE '  - Blocos retornados: %', jsonb_array_length(test_result);
  END IF;
  
  IF blocos_count = 0 AND jsonb_typeof(test_result) = 'array' AND jsonb_array_length(test_result) = 0 THEN
    RAISE NOTICE '✅ Função funciona corretamente quando não há blocos!';
  ELSIF blocos_count > 0 AND jsonb_array_length(test_result) = blocos_count THEN
    RAISE NOTICE '✅ Função retornou todos os blocos corretamente!';
  ELSE
    RAISE WARNING '⚠️ Possível inconsistência nos resultados';
  END IF;
END $$;

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Função get_blocos_with_relations_admin corrigida com sucesso!';
  RAISE NOTICE '📌 Agora ela sempre retorna um array JSON, mesmo vazio.';
END $$;











