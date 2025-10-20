-- =====================================================
-- VERIFICAR E ATUALIZAR RPC get_blocos_with_relations_admin
-- =====================================================

-- 1. Verificar se a função existe
SELECT 
    proname AS function_name,
    pg_get_function_arguments(oid) AS arguments,
    pg_get_function_result(oid) AS return_type
FROM pg_proc
WHERE proname = 'get_blocos_with_relations_admin';

-- 2. Ver a definição atual da função
SELECT pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'get_blocos_with_relations_admin';

-- 3. Testar a função e ver o resultado
SELECT 
    id,
    codigo_bloco,
    titulo,
    ano_escolar_id,
    disciplina_id,
    planejamento_id,
    status,
    pontos_bloco
FROM blocos_templates
LIMIT 3;

-- 4. Verificar estrutura completa
SELECT 
    bt.id,
    bt.codigo_bloco,
    bt.titulo,
    bt.ano_escolar_id,
    bt.status,
    bt.pontos_bloco,
    bt.tipo_midia,
    bt.quiz_id,
    d.codigo AS disciplina_codigo,
    d.nome AS disciplina_nome,
    d.cor_hex AS disciplina_cor,
    d.icone AS disciplina_icone,
    p.ano_escolar_id AS planejamento_ano
FROM blocos_templates bt
LEFT JOIN disciplinas d ON bt.disciplina_id = d.id
LEFT JOIN planejamentos p ON bt.planejamento_id = p.id
LIMIT 3;

