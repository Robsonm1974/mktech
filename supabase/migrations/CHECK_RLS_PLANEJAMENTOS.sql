-- =====================================================
-- VERIFICAR RLS NA TABELA planejamentos
-- =====================================================

-- 1. Verificar se RLS está ativo
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'planejamentos';

-- 2. Listar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'planejamentos';

-- 3. Testar insert direto (bypass RLS via SECURITY DEFINER)
-- O RPC usa SECURITY DEFINER, então deve funcionar independente do RLS
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
            AND p.proname = 'insert_planejamento_admin'
            AND prosecdef = true
        ) THEN '✅ Função usa SECURITY DEFINER (bypass RLS)'
        ELSE '⚠️ Função NÃO usa SECURITY DEFINER'
    END AS security_status;

