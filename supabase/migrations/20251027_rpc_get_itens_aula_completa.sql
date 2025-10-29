-- ============================================
-- FASE 8: RPC para buscar blocos + jogos da aula
-- Permite o player executar blocos E jogos na sequência
-- ============================================

CREATE OR REPLACE FUNCTION get_itens_aula_sessao(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aula_id UUID;
  v_blocos JSONB;
  v_jogos JSONB;
  v_itens JSONB;
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Buscando itens para session_id: %', p_session_id;
  
  -- 1. Buscar ID da aula da sessão
  SELECT aula_id INTO v_aula_id
  FROM sessions
  WHERE id = p_session_id;
  
  IF v_aula_id IS NULL THEN
    RAISE NOTICE '❌ Sessão não encontrada';
    RETURN jsonb_build_object('success', false, 'error', 'Sessão não encontrada');
  END IF;
  
  RAISE NOTICE '✅ Aula ID encontrado: %', v_aula_id;
  
  -- 2. Buscar BLOCOS
  SELECT jsonb_agg(
    jsonb_build_object(
      'tipo', 'bloco',
      'id', bt.id,
      'ordem_na_aula', ab.ordem_na_aula,
      'titulo', bt.titulo,
      'conteudo_texto', bt.conteudo_texto,
      'tipo_midia', bt.tipo_midia,
      'midia_url', bt.midia_url,
      'midia_metadata', bt.midia_metadata,
      'pontos_bloco', bt.pontos_bloco,
      'quiz_id', bt.quiz_id,
      'quiz', (
        SELECT jsonb_build_object(
          'id', q.id,
          'titulo', q.titulo,
          'tipo', q.tipo,
          'perguntas', q.perguntas
        )
        FROM quizzes q
        WHERE q.bloco_id = bt.id
        LIMIT 1
      )
    )
    ORDER BY ab.ordem_na_aula
  )
  INTO v_blocos
  FROM aulas_blocos ab
  JOIN blocos_templates bt ON ab.bloco_template_id = bt.id
  WHERE ab.aula_id = v_aula_id;
  
  RAISE NOTICE '📄 Blocos encontrados: %', jsonb_array_length(COALESCE(v_blocos, '[]'::jsonb));
  
  -- 3. Buscar JOGOS
  SELECT jsonb_agg(
    jsonb_build_object(
      'tipo', 'jogo',
      'id', g.id,
      'ordem_na_aula', aj.ordem_na_aula,
      'titulo', g.titulo,
      'descricao', g.descricao,
      'duracao_segundos', g.duracao_segundos,
      'codigo', g.codigo,
      'configuracao', g.configuracao
    )
    ORDER BY aj.ordem_na_aula
  )
  INTO v_jogos
  FROM aulas_jogos aj
  JOIN games g ON aj.game_id = g.id
  WHERE aj.aula_id = v_aula_id;
  
  RAISE NOTICE '🎮 Jogos encontrados: %', jsonb_array_length(COALESCE(v_jogos, '[]'::jsonb));
  
  -- 4. Combinar blocos + jogos
  v_itens := COALESCE(v_blocos, '[]'::jsonb) || COALESCE(v_jogos, '[]'::jsonb);
  
  -- 5. Ordenar por ordem_na_aula
  IF jsonb_array_length(v_itens) > 0 THEN
    v_itens := (
      SELECT jsonb_agg(item ORDER BY (item->>'ordem_na_aula')::int)
      FROM jsonb_array_elements(v_itens) item
    );
  END IF;
  
  RAISE NOTICE '✅ Total de itens combinados: %', jsonb_array_length(COALESCE(v_itens, '[]'::jsonb));
  RAISE NOTICE '==========================================';
  
  -- 6. Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'itens', COALESCE(v_itens, '[]'::jsonb),
    'total_blocos', jsonb_array_length(COALESCE(v_blocos, '[]'::jsonb)),
    'total_jogos', jsonb_array_length(COALESCE(v_jogos, '[]'::jsonb)),
    'aula_id', v_aula_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ ERRO: %', SQLERRM;
  RAISE NOTICE '==========================================';
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Comentário
COMMENT ON FUNCTION get_itens_aula_sessao IS 
'Busca blocos e jogos de uma aula, ordenados por ordem_na_aula.
Retorna: {success: boolean, itens: array, total_blocos: int, total_jogos: int}';

-- ============================================
-- FIM DA MIGRATION
-- ============================================



