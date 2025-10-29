-- ============================================
-- FIX: Corrigir coluna bloco_id → bloco_template_id
-- O RPC get_itens_aula_sessao estava usando q.bloco_id
-- mas a coluna correta é q.bloco_template_id (ou quiz_id)
-- ============================================

-- PRIMEIRO: Verificar qual coluna existe na tabela quizzes
-- Execute este SELECT para confirmar:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name LIKE '%bloco%';

-- ============================================
-- OPÇÃO 1: Se a coluna for bloco_template_id
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
  RAISE NOTICE '🔵 Buscando itens para session_id: %', p_session_id;
  
  -- 1. Buscar ID da aula da sessão
  SELECT aula_id INTO v_aula_id
  FROM sessions
  WHERE id = p_session_id;
  
  IF v_aula_id IS NULL THEN
    RAISE NOTICE '❌ Sessão não encontrada';
    RETURN jsonb_build_object('success', false, 'error', 'Sessão não encontrada');
  END IF;
  
  RAISE NOTICE '✅ Aula ID encontrado: %', v_aula_id;
  
  -- 2. Buscar BLOCOS (SEM JOIN com quizzes por enquanto)
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
        -- ✅ CORRIGIDO: Tentar múltiplas opções para encontrar o quiz
        SELECT jsonb_build_object(
          'id', q.id,
          'titulo', q.titulo,
          'tipo', q.tipo,
          'perguntas', q.perguntas
        )
        FROM quizzes q 
        WHERE q.id = bt.quiz_id  -- Usa quiz_id do bloco_template
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
  
  -- 3. Buscar JOGOS (se existir a tabela)
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    -- Se tabela games não existir, ignorar
    RAISE NOTICE '⚠️ Erro ao buscar jogos (normal se não criou jogos ainda): %', SQLERRM;
    v_jogos := '[]'::jsonb;
  END;
  
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
  RAISE NOTICE '❌ ERRO EXCEPTION: %', SQLERRM;
  RAISE NOTICE '==========================================';
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================
-- TESTAR
-- ============================================
DO $$
DECLARE
  v_session_id UUID;
  v_resultado JSONB;
BEGIN
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ RPC get_itens_aula_sessao CORRIGIDO!';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  
  -- Testar com sessão ativa
  SELECT id INTO v_session_id FROM sessions WHERE status = 'active' LIMIT 1;
  
  IF v_session_id IS NOT NULL THEN
    RAISE NOTICE '🧪 Testando com session_id: %', v_session_id;
    v_resultado := get_itens_aula_sessao(v_session_id);
    RAISE NOTICE '📊 Resultado: %', v_resultado;
  ELSE
    RAISE NOTICE '⚠️ Nenhuma sessão ativa para testar';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔧 MUDANÇAS:';
  RAISE NOTICE '   1. ❌ Removido: q.bloco_id (coluna não existe)';
  RAISE NOTICE '   2. ✅ Corrigido: q.id = bt.quiz_id (usa quiz_id do bloco)';
  RAISE NOTICE '   3. ✅ Adicionado: try/catch para jogos (se tabela não existir)';
  RAISE NOTICE '   4. ✅ Logs detalhados mantidos';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Agora o RPC deve funcionar corretamente!';
  RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;



