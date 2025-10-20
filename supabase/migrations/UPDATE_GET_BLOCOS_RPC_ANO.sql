-- =====================================================
-- ATUALIZAR RPC get_blocos_with_relations_admin
-- Incluir ano_escolar_id no retorno
-- =====================================================

-- Dropar função antiga primeiro
DROP FUNCTION IF EXISTS get_blocos_with_relations_admin();

-- Criar nova função
CREATE OR REPLACE FUNCTION get_blocos_with_relations_admin()
RETURNS TABLE (
    id UUID,
    planejamento_id UUID,
    disciplina_id UUID,
    ano_escolar_id VARCHAR,
    codigo_bloco VARCHAR,
    numero_sequencia INTEGER,
    titulo VARCHAR,
    conteudo_texto TEXT,
    tipo_midia VARCHAR,
    midia_url VARCHAR,
    midia_metadata JSONB,
    quiz_id UUID,
    pontos_bloco INTEGER,
    status VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    disciplinas JSONB,
    planejamentos JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bt.id,
        bt.planejamento_id,
        bt.disciplina_id,
        bt.ano_escolar_id,
        bt.codigo_bloco,
        bt.numero_sequencia,
        bt.titulo,
        bt.conteudo_texto,
        bt.tipo_midia,
        bt.midia_url,
        bt.midia_metadata,
        bt.quiz_id,
        bt.pontos_bloco,
        bt.status,
        bt.created_at,
        bt.updated_at,
        CASE 
            WHEN d.id IS NOT NULL THEN
                jsonb_build_object(
                    'codigo', d.codigo,
                    'nome', d.nome,
                    'cor_hex', d.cor_hex,
                    'icone', d.icone
                )
            ELSE NULL
        END AS disciplinas,
        CASE 
            WHEN p.id IS NOT NULL THEN
                jsonb_build_object(
                    'ano_escolar_id', p.ano_escolar_id,
                    'turma', p.turma,
                    'codigo_base', p.codigo_base
                )
            ELSE NULL
        END AS planejamentos
    FROM blocos_templates bt
    LEFT JOIN disciplinas d ON bt.disciplina_id = d.id
    LEFT JOIN planejamentos p ON bt.planejamento_id = p.id
    ORDER BY bt.created_at DESC;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION get_blocos_with_relations_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_blocos_with_relations_admin TO anon;

-- Testar a função
SELECT 
    id,
    codigo_bloco,
    titulo,
    ano_escolar_id,
    disciplinas,
    planejamentos
FROM get_blocos_with_relations_admin()
LIMIT 3;

