-- ===================================================
-- FASE 1.3: Atualizar RPC get_aulas_with_relations_admin
-- Adiciona ano_escolar_id e disciplina_id ao retorno
-- ===================================================

-- 1. Dropar função existente EXPLICITAMENTE
DROP FUNCTION IF EXISTS get_aulas_with_relations_admin() CASCADE;

-- 2. Recriar com nova estrutura
CREATE OR REPLACE FUNCTION get_aulas_with_relations_admin()
RETURNS TABLE (
  id UUID,
  trilha_id UUID,
  titulo VARCHAR,
  descricao TEXT,
  ordem INTEGER,
  created_at TIMESTAMP,
  total_blocos INTEGER,
  blocos_ids UUID[],
  ano_escolar_id VARCHAR,
  disciplina_id UUID,
  ano_nome VARCHAR,
  disciplina_codigo VARCHAR,
  disciplina_nome VARCHAR
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.trilha_id,
    a.titulo,
    a.descricao,
    a.ordem,
    a.created_at,
    COALESCE(COUNT(ab.bloco_template_id), 0)::INTEGER AS total_blocos,
    ARRAY_AGG(ab.bloco_template_id ORDER BY ab.ordem_na_aula) FILTER (WHERE ab.bloco_template_id IS NOT NULL) AS blocos_ids,
    a.ano_escolar_id,
    a.disciplina_id,
    ae.nome AS ano_nome,
    d.codigo AS disciplina_codigo,
    d.nome AS disciplina_nome
  FROM aulas a
  LEFT JOIN aulas_blocos ab ON ab.aula_id = a.id
  LEFT JOIN anos_escolares ae ON ae.id = a.ano_escolar_id
  LEFT JOIN disciplinas d ON d.id = a.disciplina_id
  GROUP BY 
    a.id, a.trilha_id, a.titulo, a.descricao, a.ordem, a.created_at, 
    a.ano_escolar_id, a.disciplina_id, ae.nome, d.codigo, d.nome
  ORDER BY a.created_at DESC;
END;
$$;

-- 3. Verificar criação
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_aulas_with_relations_admin'
  ) THEN
    RAISE NOTICE '✅ RPC get_aulas_with_relations_admin atualizado com sucesso!';
  ELSE
    RAISE EXCEPTION '❌ Falha ao criar RPC get_aulas_with_relations_admin';
  END IF;
END $$;

-- 4. Teste simples
SELECT 
  id, 
  titulo, 
  ano_escolar_id, 
  disciplina_id, 
  ano_nome, 
  disciplina_codigo,
  total_blocos
FROM get_aulas_with_relations_admin()
LIMIT 5;

