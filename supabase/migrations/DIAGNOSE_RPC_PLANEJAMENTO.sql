-- =====================================================
-- DIAGNÓSTICO: RPC insert_planejamento_admin
-- =====================================================

-- 1. Verificar se a função existe
SELECT 
    'FUNÇÃO RPC' AS tipo,
    proname AS nome,
    pg_get_function_arguments(oid) AS argumentos,
    pg_get_function_result(oid) AS retorno
FROM pg_proc
WHERE proname = 'insert_planejamento_admin';

-- 2. Verificar estrutura da tabela planejamentos
SELECT 
    'COLUNA PLANEJAMENTOS' AS tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'planejamentos'
ORDER BY ordinal_position;

-- 3. Testar a função manualmente com dados de exemplo
DO $$
DECLARE
    v_result JSONB;
    v_disciplina_id UUID;
BEGIN
    -- Pegar primeira disciplina disponível
    SELECT id INTO v_disciplina_id FROM disciplinas LIMIT 1;
    
    IF v_disciplina_id IS NULL THEN
        RAISE NOTICE 'ERRO: Nenhuma disciplina encontrada. Crie uma disciplina primeiro.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testando RPC com disciplina_id: %', v_disciplina_id;
    
    -- Testar a função
    SELECT insert_planejamento_admin(
        v_disciplina_id,
        'EF1',
        'Teste de Planejamento',
        '# Teste',
        5,
        50,
        10,
        'TEST-1',
        'rascunho'
    ) INTO v_result;
    
    RAISE NOTICE 'Resultado do RPC: %', v_result;
    
    -- Limpar o teste
    DELETE FROM planejamentos WHERE codigo_base = 'TEST-1';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO ao executar RPC: % - %', SQLERRM, SQLSTATE;
END $$;

-- 4. Verificar se há disciplinas disponíveis
SELECT 
    'DISCIPLINAS' AS tipo,
    id,
    nome,
    codigo
FROM disciplinas
LIMIT 5;

