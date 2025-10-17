-- ============================================================================
-- RPC Function: Inserir Quizzes em Batch
-- Descrição: Insere quizzes e perguntas associadas a blocos_templates
-- ============================================================================

-- Tabela de quizzes (se não existir)
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bloco_template_id UUID REFERENCES blocos_templates(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) DEFAULT 'mcq',  -- mcq, verdadeiro_falso
  pontos_max INTEGER DEFAULT 10,
  tentativas_permitidas INTEGER DEFAULT 2,
  tempo_limite_seg INTEGER DEFAULT 300,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Tabela de perguntas (se não existir)
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  choices JSONB NOT NULL,  -- ["opção 1", "opção 2", "opção 3", "opção 4"]
  correct_index INTEGER NOT NULL,
  pontos INTEGER DEFAULT 10,
  ordem INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quizzes_bloco_template ON quizzes(bloco_template_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);

-- ============================================================================
-- FUNCTION: Inserir Quiz com Perguntas
-- ============================================================================
CREATE OR REPLACE FUNCTION insert_quiz_with_questions(
  p_bloco_template_id UUID,
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
  -- 1. Criar quiz
  INSERT INTO quizzes (
    bloco_template_id,
    titulo,
    tipo,
    pontos_max,
    tentativas_permitidas,
    tempo_limite_seg
  ) VALUES (
    p_bloco_template_id,
    p_titulo,
    'mcq',
    p_pontos,
    2,
    300
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

  -- 3. Atualizar bloco_template com quiz_id
  UPDATE blocos_templates
  SET 
    quiz_id = v_quiz_id,
    status = CASE 
      WHEN tipo_midia IS NOT NULL THEN 'completo'
      ELSE 'com_quiz'
    END,
    updated_at = now()
  WHERE id = p_bloco_template_id;

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
GRANT EXECUTE ON FUNCTION insert_quiz_with_questions TO authenticated;
GRANT EXECUTE ON FUNCTION insert_quizzes_batch TO authenticated;

-- Garantir permissões nas tabelas
GRANT ALL ON TABLE quizzes TO authenticated, anon, service_role;
GRANT ALL ON TABLE quiz_questions TO authenticated, anon, service_role;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ RPC Functions para Quizzes criadas com sucesso!';
  RAISE NOTICE '📝 Use: insert_quiz_with_questions(bloco_id, titulo, pergunta, opcoes, correct_index, pontos)';
  RAISE NOTICE '📦 Use: insert_quizzes_batch(quizzes_data_jsonb)';
END $$;

