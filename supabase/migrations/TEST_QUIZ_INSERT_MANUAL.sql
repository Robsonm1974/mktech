-- ============================================================================
-- TESTE MANUAL: Inserir um quiz de teste
-- ============================================================================

-- 1. Verificar se há blocos disponíveis
SELECT 
  '📋 Blocos disponíveis:' as info;

SELECT 
  id,
  codigo_bloco,
  titulo,
  quiz_id
FROM blocos_templates
WHERE codigo_bloco LIKE 'AXG-%'
ORDER BY codigo_bloco
LIMIT 5;

-- 2. Pegar o ID do primeiro bloco
DO $$
DECLARE
  v_bloco_id UUID;
  v_quiz_id UUID;
BEGIN
  -- Pegar primeiro bloco sem quiz
  SELECT id INTO v_bloco_id
  FROM blocos_templates
  WHERE quiz_id IS NULL
  LIMIT 1;

  IF v_bloco_id IS NULL THEN
    RAISE NOTICE '❌ Nenhum bloco disponível sem quiz';
    RETURN;
  END IF;

  RAISE NOTICE '📊 Bloco selecionado: %', v_bloco_id;

  -- Inserir quiz de teste
  INSERT INTO quizzes (
    bloco_id,
    titulo,
    tipo,
    perguntas
  ) VALUES (
    v_bloco_id,
    'Quiz Teste Manual',
    'mcq',
    '[
      {
        "id": "1",
        "prompt": "Esta é uma pergunta de teste?",
        "choices": ["Sim", "Não", "Talvez", "Com certeza"],
        "correctIndex": 0,
        "pontos": 10
      }
    ]'::JSONB
  )
  RETURNING id INTO v_quiz_id;

  RAISE NOTICE '✅ Quiz criado: %', v_quiz_id;

  -- Atualizar bloco
  UPDATE blocos_templates
  SET 
    quiz_id = v_quiz_id,
    status = 'com_quiz',
    updated_at = now()
  WHERE id = v_bloco_id;

  RAISE NOTICE '✅ Bloco atualizado com quiz_id';

  -- Mostrar resultado
  RAISE NOTICE '';
  RAISE NOTICE '==============================';
  RAISE NOTICE '✅ TESTE CONCLUÍDO COM SUCESSO!';
  RAISE NOTICE '==============================';

END $$;

-- 3. Verificar resultado
SELECT 
  '📊 Resultado do teste:' as info;

SELECT 
  bt.codigo_bloco,
  bt.titulo as bloco_titulo,
  q.titulo as quiz_titulo,
  q.perguntas
FROM blocos_templates bt
INNER JOIN quizzes q ON q.id = bt.quiz_id
WHERE bt.quiz_id IS NOT NULL
ORDER BY bt.codigo_bloco
LIMIT 3;

