-- ============================================================================
-- TESTE COMPLETO DE TODAS AS FUNÇÕES RPC
-- ============================================================================

-- PASSO 1: Verificar se as funções existem
DO $$
BEGIN
  RAISE NOTICE '🔍 VERIFICANDO FUNÇÕES RPC...';
  RAISE NOTICE '';
END $$;

SELECT 
  proname AS function_name,
  pg_get_functiondef(oid) AS definition
FROM pg_proc
WHERE proname IN (
  'get_disciplinas_admin',
  'get_planejamentos_admin',
  'get_blocos_templates_admin',
  'insert_planejamento_admin',
  'insert_blocos_templates_admin',
  'get_blocos_with_relations_admin'
)
ORDER BY proname;

-- PASSO 2: Verificar dados nas tabelas
DO $$
DECLARE
  disciplinas_count INTEGER;
  planejamentos_count INTEGER;
  blocos_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO disciplinas_count FROM disciplinas;
  SELECT COUNT(*) INTO planejamentos_count FROM planejamentos;
  SELECT COUNT(*) INTO blocos_count FROM blocos_templates;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 CONTAGEM DE DADOS:';
  RAISE NOTICE '  - Disciplinas: %', disciplinas_count;
  RAISE NOTICE '  - Planejamentos: %', planejamentos_count;
  RAISE NOTICE '  - Blocos Templates: %', blocos_count;
  RAISE NOTICE '';
END $$;

-- PASSO 3: Testar função get_disciplinas_admin
DO $$
DECLARE
  result_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO result_count FROM get_disciplinas_admin();
  RAISE NOTICE '✅ get_disciplinas_admin() retornou % registros', result_count;
END $$;

-- PASSO 4: Testar função get_blocos_with_relations_admin
DO $$
DECLARE
  result JSONB;
BEGIN
  SELECT get_blocos_with_relations_admin() INTO result;
  
  IF result IS NULL THEN
    RAISE NOTICE '⚠️ get_blocos_with_relations_admin() retornou NULL';
  ELSIF jsonb_array_length(result) = 0 THEN
    RAISE NOTICE '⚠️ get_blocos_with_relations_admin() retornou array vazio []';
  ELSE
    RAISE NOTICE '✅ get_blocos_with_relations_admin() retornou % blocos', jsonb_array_length(result);
    RAISE NOTICE 'Primeiro bloco: %', result->0;
  END IF;
END $$;

-- PASSO 5: Teste manual direto (equivalente ao que a função faz)
SELECT 
  jsonb_agg(
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
  ) AS resultado_manual
FROM public.blocos_templates bt
LEFT JOIN public.disciplinas d ON bt.disciplina_id = d.id
LEFT JOIN public.planejamentos p ON bt.planejamento_id = p.id;

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🏁 TESTE COMPLETO FINALIZADO!';
  RAISE NOTICE 'Se alguma função não apareceu acima, execute o SQL correspondente novamente.';
END $$;














