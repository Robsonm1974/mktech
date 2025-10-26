-- ============================================
-- DIAGNÓSTICO COMPLETO: RLS e Permissões
-- ============================================

-- 1. Verificar RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'banco_perguntas';

-- 2. Ver TODAS as políticas (não deveria ter nenhuma)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'banco_perguntas';

-- 3. Verificar GRANTS na tabela
SELECT 
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'banco_perguntas'
ORDER BY grantee, privilege_type;

-- 4. Verificar owner da tabela
SELECT 
  t.tablename,
  t.tableowner,
  pg_catalog.pg_get_userbyid(c.relowner) as real_owner
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename = 'banco_perguntas';

-- 5. Testar SELECT como usuário atual
SELECT COUNT(*) as total FROM banco_perguntas;

-- 6. Ver se existe alguma função/trigger bloqueando
SELECT 
  t.tgname as trigger_name,
  t.tgenabled as enabled,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'public.banco_perguntas'::regclass;

