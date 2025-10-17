-- ============================================================================
-- DIAGNÓSTICO RÁPIDO: Disciplinas e RLS
-- Execute este script no Supabase SQL Editor para diagnosticar o problema
-- ============================================================================

-- 1. Verificar se a tabela disciplinas existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'disciplinas') THEN
    RAISE NOTICE '✅ Tabela disciplinas existe';
  ELSE
    RAISE NOTICE '❌ Tabela disciplinas NÃO existe - Execute 20241017_admin_extensions.sql';
  END IF;
END $$;

-- 2. Contar quantas disciplinas existem
SELECT 
  '2. Contagem de disciplinas' as verificacao,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE ativa = true) as ativas
FROM disciplinas;

-- 3. Listar disciplinas
SELECT 
  '3. Lista de disciplinas' as verificacao,
  id, codigo, nome, icone, ativa
FROM disciplinas
ORDER BY codigo;

-- 4. Verificar se RLS está habilitado
SELECT 
  '4. Status do RLS' as verificacao,
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename = 'disciplinas';

-- 5. Listar políticas RLS existentes
SELECT 
  '5. Políticas RLS' as verificacao,
  policyname,
  cmd as tipo_comando,
  roles as papeis,
  CASE WHEN qual IS NOT NULL THEN 'Sim' ELSE 'Não' END as tem_condicao_using
FROM pg_policies
WHERE tablename = 'disciplinas';

-- 6. Verificar usuário atual
SELECT 
  '6. Usuário atual' as verificacao,
  current_user as usuario,
  auth.uid() as auth_uid;

-- 7. Verificar se o usuário está autenticado
SELECT 
  '7. Auth check' as verificacao,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN '✅ Autenticado' 
    ELSE '❌ NÃO autenticado (RLS vai bloquear!)' 
  END as status;

-- 8. Verificar role do usuário atual no sistema
SELECT 
  '8. Role do usuário' as verificacao,
  u.email,
  u.role,
  u.active
FROM users u
WHERE u.auth_id = auth.uid();

-- ============================================================================
-- INTERPRETAÇÃO DOS RESULTADOS
-- ============================================================================
-- 
-- Se "2. Contagem" retornar 0:
--   → Execute: supabase/migrations/20241017_admin_extensions.sql
--
-- Se "4. Status RLS" retornar rls_habilitado = false:
--   → Execute: supabase/migrations/20241017_rls_disciplinas.sql
--
-- Se "5. Políticas RLS" retornar 0 linhas:
--   → Execute: supabase/migrations/20241017_rls_disciplinas.sql
--
-- Se "7. Auth check" retornar "NÃO autenticado":
--   → Você não está logado no painel admin
--   → Faça login em /admin/login primeiro
--
-- Se "8. Role do usuário" não retornar nada:
--   → Seu usuário não está na tabela users
--   → Execute o script de criação do superadmin
--
-- ============================================================================


