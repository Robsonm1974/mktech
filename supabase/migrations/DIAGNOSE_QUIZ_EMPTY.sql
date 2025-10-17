-- ============================================================================
-- DIAGNOSTICAR: Por que quizzes estão vazios?
-- ============================================================================

-- 1. Ver quizzes criados recentemente
SELECT 
  '🔍 Quizzes criados (últimos 5):' as info;

SELECT 
  id,
  bloco_id,
  titulo,
  tipo,
  perguntas,
  created_at
FROM quizzes
ORDER BY created_at DESC
LIMIT 5;

-- 2. Ver estrutura das perguntas
SELECT 
  '📊 Estrutura detalhada das perguntas:' as info;

SELECT 
  id as quiz_id,
  titulo,
  jsonb_typeof(perguntas) as tipo_perguntas,
  jsonb_array_length(perguntas) as num_perguntas,
  perguntas
FROM quizzes
ORDER BY created_at DESC
LIMIT 3;

-- 3. Ver blocos com quizzes
SELECT 
  '🔗 Blocos vinculados a quizzes:' as info;

SELECT 
  bt.codigo_bloco,
  bt.titulo as bloco_titulo,
  bt.status,
  q.id as quiz_id,
  q.titulo as quiz_titulo,
  jsonb_array_length(q.perguntas) as num_perguntas
FROM blocos_templates bt
LEFT JOIN quizzes q ON q.id = bt.quiz_id
WHERE bt.codigo_bloco LIKE 'AXG-%'
ORDER BY bt.codigo_bloco
LIMIT 10;

-- 4. Verificar se há quizzes sem perguntas
SELECT 
  '⚠️  Quizzes VAZIOS (sem perguntas):' as info;

SELECT 
  q.id,
  q.titulo,
  q.perguntas,
  bt.codigo_bloco
FROM quizzes q
LEFT JOIN blocos_templates bt ON bt.quiz_id = q.id
WHERE jsonb_array_length(q.perguntas) = 0 
   OR q.perguntas = '[]'::jsonb
   OR q.perguntas IS NULL;

-- 5. Exemplo de quiz correto (para comparação)
SELECT 
  '✅ Exemplo de como DEVERIA ser:' as info;

SELECT 
  '[
    {
      "id": "1",
      "prompt": "O que é um algoritmo?",
      "choices": ["Um brinquedo", "Uma sequência de passos", "Um número", "Um jogo"],
      "correctIndex": 1,
      "pontos": 10
    }
  ]'::jsonb as estrutura_correta;

-- 6. Contar quizzes vazios vs. preenchidos
SELECT 
  '📊 Resumo de quizzes:' as info;

SELECT 
  COUNT(*) FILTER (WHERE jsonb_array_length(perguntas) > 0) as quizzes_preenchidos,
  COUNT(*) FILTER (WHERE jsonb_array_length(perguntas) = 0) as quizzes_vazios,
  COUNT(*) as total
FROM quizzes;

-- 7. Verificar funções RPC disponíveis
SELECT 
  '🔧 Funções RPC disponíveis:' as info;

SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname LIKE '%quiz%'
ORDER BY proname;

