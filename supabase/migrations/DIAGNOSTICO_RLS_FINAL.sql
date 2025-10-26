-- ============================================
-- DIAGNÓSTICO FINAL: Verificar estado do RLS
-- ============================================

-- 1. Ver se RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_esta_habilitado
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'banco_perguntas';

-- 2. Ver políticas (não deveria ter nenhuma)
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'banco_perguntas';

-- 3. Tentar SELECT direto
SELECT COUNT(*) as total_perguntas FROM banco_perguntas;

-- 4. Tentar INSERT de teste
INSERT INTO banco_perguntas (
  codigo,
  pergunta,
  ano_escolar_id,
  dificuldade,
  explicacao,
  opcoes,
  ativa
) VALUES (
  'TEST-DIRETO-001',
  'Teste direto no SQL',
  '2ano',
  'facil',
  'Só um teste',
  '[{"id": "a", "texto": "Sim", "correta": true}]'::jsonb,
  true
) RETURNING id, codigo, pergunta;

