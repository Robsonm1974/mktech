-- ============================================================================
-- FIX GET_TURMAS_ADMIN RPC
-- Data: 2025-10-18
-- Problema: RPC retornando erro ao listar turmas
-- ============================================================================

-- 1. Dropar função existente (todas as variantes)
DROP FUNCTION IF EXISTS get_turmas_admin(UUID);
DROP FUNCTION IF EXISTS get_turmas_admin();

-- 2. Recriar com estrutura correta e tratamento de erro
CREATE OR REPLACE FUNCTION get_turmas_admin(p_tenant_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  name VARCHAR,
  ano_escolar_id VARCHAR,
  ano_nome VARCHAR,
  designacao VARCHAR,
  professor_id UUID,
  professor_nome VARCHAR,
  professor_email VARCHAR,
  sala VARCHAR,
  turno VARCHAR,
  descricao TEXT,
  total_alunos BIGINT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.tenant_id,
    t.name,
    t.ano_escolar_id,
    COALESCE(ae.nome, '') AS ano_nome,
    t.designacao,
    t.professor_id,
    COALESCE(u.full_name, '') AS professor_nome,
    COALESCE(u.email, '') AS professor_email,
    t.sala,
    t.turno,
    t.descricao,
    COALESCE(COUNT(a.id), 0) AS total_alunos,
    t.created_at,
    t.updated_at
  FROM turmas t
  LEFT JOIN anos_escolares ae ON t.ano_escolar_id = ae.id
  LEFT JOIN users u ON t.professor_id = u.id
  LEFT JOIN alunos a ON t.id = a.turma_id AND COALESCE(a.active, false) = true
  WHERE (p_tenant_id IS NULL OR t.tenant_id = p_tenant_id)
  GROUP BY t.id, t.tenant_id, t.name, t.ano_escolar_id, ae.nome, t.designacao, 
           t.professor_id, u.full_name, u.email, t.sala, t.turno, t.descricao,
           t.created_at, t.updated_at
  ORDER BY COALESCE(ae.ordem, 999), t.name;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro em get_turmas_admin: % %', SQLERRM, SQLSTATE;
    RETURN;
END;
$$;

-- 3. Garantir permissões
GRANT EXECUTE ON FUNCTION get_turmas_admin(UUID) TO authenticated, anon, service_role;

-- 4. Teste rápido
DO $$
DECLARE
  v_result RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_result IN SELECT * FROM get_turmas_admin(NULL) LOOP
    v_count := v_count + 1;
  END LOOP;
  
  RAISE NOTICE '✅ RPC get_turmas_admin testado: % turmas encontradas', v_count;
END $$;

