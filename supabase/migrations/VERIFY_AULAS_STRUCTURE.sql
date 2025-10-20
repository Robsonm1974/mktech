-- ===================================================
-- VERIFICAR ESTRUTURA E RPCs DE AULAS
-- ===================================================

-- 1. Verificar estrutura da tabela aulas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'aulas'
ORDER BY ordinal_position;

-- 2. Verificar se a trilha padrão existe
SELECT * FROM trilhas WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3. Verificar RPCs existentes para aulas
SELECT 
    proname AS function_name,
    pg_get_function_arguments(oid) AS arguments,
    pg_get_function_result(oid) AS return_type
FROM pg_proc
WHERE proname LIKE '%aula%'
ORDER BY proname;

-- 4. Testar RPC insert_aula_with_blocos_admin (simulação)
DO $$
DECLARE
    v_result JSONB;
    v_trilha_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Verificar se a trilha existe
    IF NOT EXISTS (SELECT 1 FROM trilhas WHERE id = v_trilha_id) THEN
        RAISE NOTICE '❌ Trilha padrão não existe! Execute SEED_TRILHA_PADRAO.sql primeiro';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Trilha padrão existe';
    
    -- Verificar se a função existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'insert_aula_with_blocos_admin'
    ) THEN
        RAISE NOTICE '❌ RPC insert_aula_with_blocos_admin não existe! Execute RPC_GET_AULAS_ADMIN.sql';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ RPC insert_aula_with_blocos_admin existe';
    
    -- Testar criação de aula (será revertido por estar em bloco DO)
    BEGIN
        SELECT insert_aula_with_blocos_admin(
            v_trilha_id,
            'Teste de Aula',
            'Descrição de teste',
            ARRAY[]::UUID[]
        ) INTO v_result;
        
        RAISE NOTICE '✅ RPC executou com sucesso!';
        RAISE NOTICE '📦 Resultado: %', v_result;
        
        -- Limpar teste
        DELETE FROM aulas WHERE titulo = 'Teste de Aula';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao executar RPC: %', SQLERRM;
    END;
END $$;

-- 5. Contar blocos disponíveis
SELECT COUNT(*) as total_blocos FROM blocos_templates;

