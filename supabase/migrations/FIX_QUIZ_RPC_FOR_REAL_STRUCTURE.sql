-- ============================================================================
-- CORRIGIR RPC para usar estrutura REAL da tabela quizzes
-- A tabela quizzes tem coluna 'perguntas' (JSONB), não usa quiz_questions
-- ============================================================================

-- Função: Inserir Quiz com Perguntas (CORRIGIDA)
CREATE OR REPLACE FUNCTION insert_quiz_with_questions(
  p_bloco_id UUID,
  p_titulo VARCHAR,
  p_pergunta TEXT,
  p_opcoes JSONB,
  p_correct_index INTEGER,
  p_pontos INTEGER DEFAULT 10
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_quiz_id UUID;
  v_perguntas_array JSONB;
BEGIN
  -- Montar array de perguntas no formato esperado
  v_perguntas_array := jsonb_build_array(
    jsonb_build_object(
      'id', gen_random_uuid()::text,
      'prompt', p_pergunta,
      'choices', p_opcoes,
      'correctIndex', p_correct_index,
      'pontos', p_pontos
    )
  );

  -- 1. Criar quiz com perguntas JSONB
  INSERT INTO quizzes (
    bloco_id,
    titulo,
    tipo,
    perguntas
  ) VALUES (
    p_bloco_id,
    p_titulo,
    'mcq',
    v_perguntas_array
  )
  RETURNING id INTO v_quiz_id;

  RAISE NOTICE 'Quiz criado: % com perguntas: %', v_quiz_id, v_perguntas_array;

  -- 2. Atualizar blocos_templates com quiz_id
  UPDATE blocos_templates
  SET 
    quiz_id = v_quiz_id,
    status = CASE 
      WHEN tipo_midia IS NOT NULL THEN 'completo'
      ELSE 'com_quiz'
    END,
    updated_at = now()
  WHERE id = p_bloco_id;

  RAISE NOTICE 'Bloco template atualizado com quiz_id';

  RETURN v_quiz_id;
END;
$$;

-- Função: Inserir Quizzes em Batch (CORRIGIDA)
CREATE OR REPLACE FUNCTION insert_quizzes_batch(
  quizzes_data JSONB
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  quiz_item JSONB;
  v_quiz_id UUID;
  v_inserted_count INTEGER := 0;
  v_result JSONB := '[]'::JSONB;
  v_error_count INTEGER := 0;
BEGIN
  -- Iterar sobre cada quiz
  FOR quiz_item IN SELECT * FROM jsonb_array_elements(quizzes_data)
  LOOP
    BEGIN
      -- Chamar função individual
      SELECT insert_quiz_with_questions(
        (quiz_item->>'bloco_template_id')::UUID,
        quiz_item->>'titulo',
        quiz_item->>'pergunta',
        quiz_item->'opcoes',
        (quiz_item->>'correct_index')::INTEGER,
        COALESCE((quiz_item->>'pontos')::INTEGER, 10)
      ) INTO v_quiz_id;

      v_inserted_count := v_inserted_count + 1;
      v_result := v_result || jsonb_build_object('quiz_id', v_quiz_id);
      
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      RAISE NOTICE 'Erro ao inserir quiz: %. Item: %', SQLERRM, quiz_item;
    END;
  END LOOP;

  RAISE NOTICE 'Total de quizzes inseridos: %. Erros: %', v_inserted_count, v_error_count;

  RETURN jsonb_build_object(
    'success', true,
    'inserted_count', v_inserted_count,
    'error_count', v_error_count,
    'quizzes', v_result
  );
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION insert_quiz_with_questions TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION insert_quizzes_batch TO authenticated, anon, service_role;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================================';
  RAISE NOTICE '✅ FUNÇÕES RPC CORRIGIDAS!';
  RAISE NOTICE '======================================================';
  RAISE NOTICE '📋 Agora usando estrutura REAL da tabela quizzes';
  RAISE NOTICE '   - quizzes.perguntas é JSONB (não usa quiz_questions)';
  RAISE NOTICE '🎯 Funções atualizadas:';
  RAISE NOTICE '   - insert_quiz_with_questions()';
  RAISE NOTICE '   - insert_quizzes_batch()';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Pronto para criar quizzes!';
  RAISE NOTICE '======================================================';
END $$;

