-- ============================================================================
-- VERIFICAR RELAÇÕES DA TABELA QUIZZES
-- ============================================================================

-- 1. Ver estrutura completa da tabela quizzes
SELECT 
  '📋 Estrutura completa da tabela quizzes:' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'quizzes'
ORDER BY ordinal_position;

-- 2. Verificar constraints (foreign keys)
SELECT 
  '🔗 Foreign Keys da tabela quizzes:' as info;

SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'quizzes';

-- 3. Verificar se existe tabela 'blocos'
SELECT 
  '🔍 Verificando se existe tabela blocos:' as info;

SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('blocos', 'blocos_templates')
ORDER BY table_name;

-- 4. Se a tabela blocos existir, ver sua estrutura
SELECT 
  '📋 Estrutura da tabela blocos (se existir):' as info;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'blocos'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Ver alguns registros de blocos_templates
SELECT 
  '📊 Primeiros blocos_templates:' as info;

SELECT 
  id,
  codigo_bloco,
  titulo,
  quiz_id
FROM blocos_templates
ORDER BY codigo_bloco
LIMIT 5;

-- 6. Tentar inserir um quiz de teste (comentado)
SELECT 
  '🧪 Para testar inserção manual, descomente e execute:' as info;

/*
-- TESTE DE INSERÇÃO MANUAL
-- Substitua o UUID pelo ID de um bloco real

INSERT INTO quizzes (
  bloco_id,
  titulo,
  tipo,
  perguntas
) VALUES (
  '7b8200b8-25f2-4a38-934d-36208f220fe6'::UUID, -- Substitua por um ID real
  'Quiz Teste',
  'mcq',
  '[
    {
      "id": "1",
      "prompt": "Teste?",
      "choices": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "pontos": 10
    }
  ]'::JSONB
)
RETURNING *;
*/

