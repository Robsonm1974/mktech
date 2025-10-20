-- =====================================================
-- ADICIONAR COLUNA ano_escolar_id NA TABELA planejamentos
-- =====================================================

-- 1. Verificar se a coluna existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'planejamentos' 
        AND column_name = 'ano_escolar_id'
    ) THEN
        -- Adicionar coluna se não existir
        ALTER TABLE planejamentos 
        ADD COLUMN ano_escolar_id VARCHAR(10);
        
        RAISE NOTICE 'Coluna ano_escolar_id adicionada à tabela planejamentos';
    ELSE
        RAISE NOTICE 'Coluna ano_escolar_id já existe na tabela planejamentos';
    END IF;
END $$;

-- 2. Remover coluna turma se ainda existir (migração)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'planejamentos' 
        AND column_name = 'turma'
    ) THEN
        -- Migrar dados de turma para ano_escolar_id antes de remover
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
        WHERE ano_escolar_id IS NULL;
        
        RAISE NOTICE 'Dados migrados de turma para ano_escolar_id';
        
        -- Remover coluna turma
        -- ALTER TABLE planejamentos DROP COLUMN turma;
        -- RAISE NOTICE 'Coluna turma removida (comentado para segurança)';
    END IF;
END $$;

-- 3. Verificar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'planejamentos'
ORDER BY ordinal_position;

-- 4. Teste rápido do RPC
DO $$
DECLARE
    v_result JSONB;
    v_disciplina_id UUID;
BEGIN
    -- Pegar primeira disciplina
    SELECT id INTO v_disciplina_id FROM disciplinas LIMIT 1;
    
    IF v_disciplina_id IS NULL THEN
        RAISE NOTICE 'AVISO: Nenhuma disciplina disponível para teste';
        RETURN;
    END IF;
    
    -- Testar RPC
    BEGIN
        v_result := insert_planejamento_admin(
            v_disciplina_id,
            'EF1',
            'Teste RPC Corrigido',
            '# Teste',
            5,
            50,
            10,
            'TEST-FIX-1',
            'rascunho'
        );
        
        RAISE NOTICE 'Resultado do teste RPC: %', v_result;
        
        -- Limpar
        DELETE FROM planejamentos WHERE codigo_base = 'TEST-FIX-1';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERRO no teste RPC: % - %', SQLERRM, SQLSTATE;
    END;
END $$;

