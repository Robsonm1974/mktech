-- =====================================================
-- TESTE SIMPLES DO RPC (SEM DO BLOCK)
-- =====================================================

-- Executar o RPC diretamente
SELECT insert_planejamento_admin(
    '6a5e4351-0853-4709-b9ac-031432acbbd7'::UUID,  -- Algoritmos
    'EF1',
    'Teste RPC Direto',
    '# Documento de Teste',
    5,
    50,
    10,
    'TEST-SIMPLE-1',
    'rascunho'
) AS resultado;

-- Verificar se foi inserido
SELECT 
    id,
    disciplina_id,
    ano_escolar_id,
    turma,
    titulo,
    codigo_base,
    status
FROM planejamentos
WHERE codigo_base = 'TEST-SIMPLE-1';

-- Limpar teste
DELETE FROM planejamentos WHERE codigo_base = 'TEST-SIMPLE-1';

-- Confirmar limpeza
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Teste limpo com sucesso'
        ELSE '⚠️ Registro ainda existe'
    END AS status
FROM planejamentos
WHERE codigo_base = 'TEST-SIMPLE-1';

