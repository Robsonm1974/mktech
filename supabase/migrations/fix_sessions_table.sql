-- ============================================================================
-- FIX: Adicionar coluna bloco_ativo_numero se não existir
-- ============================================================================

-- Verificar e adicionar coluna bloco_ativo_numero
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        AND column_name = 'bloco_ativo_numero'
    ) THEN
        ALTER TABLE sessions ADD COLUMN bloco_ativo_numero INTEGER DEFAULT 1;
        RAISE NOTICE 'Coluna bloco_ativo_numero adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna bloco_ativo_numero já existe';
    END IF;
END $$;

-- Verificar estrutura completa da tabela sessions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY ordinal_position;




