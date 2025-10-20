-- =====================================================
-- TORNAR COLUNA turma NULLABLE e TESTAR RPC
-- =====================================================

-- 1. Tornar coluna turma nullable (para permitir migração gradual)
ALTER TABLE planejamentos 
ALTER COLUMN turma DROP NOT NULL;

-- 2. Atualizar registros existentes que não têm ano_escolar_id
UPDATE planejamentos 
SET ano_escolar_id = CASE
    WHEN turma LIKE 'EF1%' THEN 'EF1'
    WHEN turma LIKE 'EF2%' THEN 'EF2'
    WHEN turma LIKE 'EF3%' THEN 'EF3'
    WHEN turma LIKE 'EF4%' THEN 'EF4'
    WHEN turma LIKE 'EF5%' THEN 'EF5'
    WHEN turma LIKE 'EF6%' THEN 'EF6'
    WHEN turma LIKE 'EF7%' THEN 'EF7'
    WHEN turma LIKE 'EF8%' THEN 'EF8'
    WHEN turma LIKE 'EF9%' THEN 'EF9'
    ELSE 'EF1'
END
WHERE ano_escolar_id IS NULL AND turma IS NOT NULL;

-- 3. Verificar se a função RPC existe
SELECT 
    proname AS function_name,
    pg_get_function_arguments(oid) AS arguments,
    pg_get_function_result(oid) AS return_type
FROM pg_proc
WHERE proname = 'insert_planejamento_admin';

-- 4. Testar RPC com dados reais
DO $$
DECLARE
    v_result JSONB;
    v_disciplina_id UUID;
BEGIN
    -- Pegar ID da disciplina "Algoritmos"
    SELECT id INTO v_disciplina_id 
    FROM disciplinas 
    WHERE codigo = 'ALG' 
    LIMIT 1;
    
    IF v_disciplina_id IS NULL THEN
        RAISE NOTICE '❌ ERRO: Nenhuma disciplina encontrada';
        RETURN;
    END IF;
    
    RAISE NOTICE '🔍 Testando RPC com disciplina_id: %', v_disciplina_id;
    
    -- Executar RPC
    BEGIN
        v_result := insert_planejamento_admin(
            v_disciplina_id,           -- p_disciplina_id
            'EF1',                      -- p_ano_escolar_id
            'Teste de Importação',      -- p_titulo
            '# Teste de Documento MD',  -- p_documento_md
            5,                          -- p_num_blocos
            50,                         -- p_pontos_totais
            10,                         -- p_pontos_por_quiz
            'TEST-DIAG-1',              -- p_codigo_base
            'rascunho'                  -- p_status
        );
        
        RAISE NOTICE '✅ Resultado do RPC: %', v_result;
        
        -- Verificar se foi inserido
        IF (v_result->>'success')::BOOLEAN = TRUE THEN
            RAISE NOTICE '✅ Planejamento criado com ID: %', v_result->>'planejamento_id';
            
            -- Limpar teste
            DELETE FROM planejamentos WHERE codigo_base = 'TEST-DIAG-1';
            RAISE NOTICE '🧹 Teste limpo';
        ELSE
            RAISE NOTICE '❌ ERRO no RPC: %', v_result->>'error';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ ERRO ao executar RPC: %', SQLERRM;
        RAISE NOTICE '❌ SQLSTATE: %', SQLSTATE;
    END;
END $$;

-- 5. Verificar estrutura final
SELECT 
    'ESTRUTURA FINAL' AS info,
    column_name,
    data_type,
    is_nullable,
    CASE WHEN is_nullable = 'YES' THEN '✅' ELSE '⚠️ NOT NULL' END AS status
FROM information_schema.columns
WHERE table_name = 'planejamentos'
  AND column_name IN ('turma', 'ano_escolar_id')
ORDER BY column_name;

