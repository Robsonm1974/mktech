-- ============================================================================
-- RPC Function: Inserir Quizzes em Batch (CORRIGIDO)
-- Descrição: Insere quizzes e perguntas usando estrutura EXISTENTE no Supabase
-- ============================================================================

-- Verificar estrutura das tabelas existentes
-- quizzes: id, bloco_id, titulo, tipo, perguntas (jsonb), created_at
-- quiz_questions: id, quiz_id, prompt, choices, correct_index, pontos, ordem, created_at

-- NOTA: A tabela 'quizzes' usa 'bloco_id' (não 'bloco_template_id')

-- ============================================================================
-- FUNCTION: Inserir Quiz com Perguntas
-- ============================================================================
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
  v_question_id UUID;
BEGIN
  -- 1. Criar quiz (usando bloco_id conforme estrutura existente)
  INSERT INTO quizzes (
    bloco_id,
    titulo,
    tipo
  ) VALUES (
    p_bloco_id,
    p_titulo,
    'mcq'
  )
  RETURNING id INTO v_quiz_id;

  RAISE NOTICE 'Quiz criado: %', v_quiz_id;

  -- 2. Criar pergunta
  INSERT INTO quiz_questions (
    quiz_id,
    prompt,
    choices,
    correct_index,
    pontos,
    ordem
  ) VALUES (
    v_quiz_id,
    p_pergunta,
    p_opcoes,
    p_correct_index,
    p_pontos,
    1
  )
  RETURNING id INTO v_question_id;

  RAISE NOTICE 'Pergunta criada: %', v_question_id;

  -- 3. Atualizar blocos_templates com quiz_id
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

-- ============================================================================
-- FUNCTION: Inserir Quizzes em Batch (para importação em massa)
-- ============================================================================
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
BEGIN
  -- Iterar sobre cada quiz
  FOR quiz_item IN SELECT * FROM jsonb_array_elements(quizzes_data)
  LOOP
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
  END LOOP;

  RAISE NOTICE 'Total de quizzes inseridos: %', v_inserted_count;

  RETURN jsonb_build_object(
    'success', true,
    'inserted_count', v_inserted_count,
    'quizzes', v_result
  );
END;
$$;

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT EXECUTE ON FUNCTION insert_quiz_with_questions TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION insert_quizzes_batch TO authenticated, anon, service_role;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ RPC Functions para Quizzes criadas com sucesso!';
  RAISE NOTICE '📝 Use: insert_quiz_with_questions(bloco_id, titulo, pergunta, opcoes, correct_index, pontos)';
  RAISE NOTICE '📦 Use: insert_quizzes_batch(quizzes_data_jsonb)';
END $$;

