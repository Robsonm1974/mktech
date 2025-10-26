-- ============================================
-- Verificar RLS do banco_perguntas
-- ============================================

-- 1. Ver se RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'banco_perguntas';

-- 2. Ver todas as políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE tablename = 'banco_perguntas';

-- 3. Testar INSERT direto
INSERT INTO banco_perguntas (
  codigo,
  pergunta,
  ano_escolar_id,
  disciplina_id,
  dificuldade,
  explicacao,
  opcoes,
  ativa
) VALUES (
  'TEST-001',
  'Pergunta de teste',
  '2ano',
  (SELECT id FROM disciplinas WHERE codigo = 'PROG' LIMIT 1),
  'medio',
  'Explicação de teste',
  '[{"id": "a", "texto": "Opção A", "correta": true}, {"id": "b", "texto": "Opção B", "correta": false}]'::jsonb,
  true
) RETURNING *;

