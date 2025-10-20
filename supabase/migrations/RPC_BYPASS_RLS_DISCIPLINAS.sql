-- ============================================================================
-- 🚀 SOLUÇÃO RPC: Bypass Completo de RLS com SECURITY DEFINER
-- Esta função executa com privilégios do owner do banco, ignorando RLS
-- ============================================================================

-- Função para buscar disciplinas (bypass RLS)
CREATE OR REPLACE FUNCTION get_disciplinas_admin()
RETURNS TABLE (
  id UUID,
  codigo VARCHAR,
  nome VARCHAR,
  descricao TEXT,
  cor_hex VARCHAR,
  icone VARCHAR,
  ativa BOOLEAN,
  created_at TIMESTAMP
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id, 
    d.codigo, 
    d.nome, 
    d.descricao,
    d.cor_hex,
    d.icone, 
    d.ativa,
    d.created_at
  FROM disciplinas d
  WHERE d.ativa = true
  ORDER BY d.nome;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar planejamentos (bypass RLS)
CREATE OR REPLACE FUNCTION get_planejamentos_admin()
RETURNS TABLE (
  id UUID,
  disciplina_id UUID,
  turma VARCHAR,
  titulo VARCHAR,
  documento_md TEXT,
  num_blocos INTEGER,
  pontos_totais INTEGER,
  pontos_por_quiz INTEGER,
  codigo_base VARCHAR,
  status VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.disciplina_id,
    p.turma,
    p.titulo,
    p.documento_md,
    p.num_blocos,
    p.pontos_totais,
    p.pontos_por_quiz,
    p.codigo_base,
    p.status,
    p.created_at,
    p.updated_at
  FROM planejamentos p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar blocos_templates (bypass RLS)
CREATE OR REPLACE FUNCTION get_blocos_templates_admin()
RETURNS TABLE (
  id UUID,
  planejamento_id UUID,
  disciplina_id UUID,
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
  updated_at TIMESTAMP
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.planejamento_id,
    b.disciplina_id,
    b.codigo_bloco,
    b.numero_sequencia,
    b.titulo,
    b.conteudo_texto,
    b.tipo_midia,
    b.midia_url,
    b.midia_metadata,
    b.quiz_id,
    b.pontos_bloco,
    b.status,
    b.created_at,
    b.updated_at
  FROM blocos_templates b
  ORDER BY b.codigo_bloco;
END;
$$ LANGUAGE plpgsql;

-- Dar permissão para authenticated users chamarem as funções
GRANT EXECUTE ON FUNCTION get_disciplinas_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_planejamentos_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_blocos_templates_admin() TO authenticated;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Funções RPC criadas com sucesso!';
  RAISE NOTICE '🚀 Use: supabase.rpc("get_disciplinas_admin")';
  RAISE NOTICE '🔓 Estas funções bypassam completamente o RLS';
END $$;



