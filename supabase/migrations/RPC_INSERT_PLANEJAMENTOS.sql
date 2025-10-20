-- ============================================================================
-- 🚀 RPC para INSERT de Planejamentos e Blocos (Bypass RLS)
-- ============================================================================

-- Função para inserir planejamento
CREATE OR REPLACE FUNCTION insert_planejamento_admin(
  p_disciplina_id UUID,
  p_turma VARCHAR,
  p_titulo VARCHAR,
  p_documento_md TEXT,
  p_num_blocos INTEGER,
  p_pontos_totais INTEGER,
  p_pontos_por_quiz INTEGER,
  p_codigo_base VARCHAR,
  p_status VARCHAR DEFAULT 'processado'
)
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
  INSERT INTO planejamentos (
    disciplina_id,
    turma,
    titulo,
    documento_md,
    num_blocos,
    pontos_totais,
    pontos_por_quiz,
    codigo_base,
    status
  ) VALUES (
    p_disciplina_id,
    p_turma,
    p_titulo,
    p_documento_md,
    p_num_blocos,
    p_pontos_totais,
    p_pontos_por_quiz,
    p_codigo_base,
    p_status
  )
  RETURNING 
    planejamentos.id,
    planejamentos.disciplina_id,
    planejamentos.turma,
    planejamentos.titulo,
    planejamentos.documento_md,
    planejamentos.num_blocos,
    planejamentos.pontos_totais,
    planejamentos.pontos_por_quiz,
    planejamentos.codigo_base,
    planejamentos.status,
    planejamentos.created_at,
    planejamentos.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Função para inserir múltiplos blocos de uma vez
CREATE OR REPLACE FUNCTION insert_blocos_templates_admin(
  blocos_json JSONB
)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bloco JSONB;
  inserted_count INTEGER := 0;
BEGIN
  FOR bloco IN SELECT * FROM jsonb_array_elements(blocos_json)
  LOOP
    INSERT INTO blocos_templates (
      planejamento_id,
      disciplina_id,
      codigo_bloco,
      numero_sequencia,
      titulo,
      conteudo_texto,
      pontos_bloco,
      status
    ) VALUES (
      (bloco->>'planejamento_id')::UUID,
      (bloco->>'disciplina_id')::UUID,
      bloco->>'codigo_bloco',
      (bloco->>'numero_sequencia')::INTEGER,
      bloco->>'titulo',
      bloco->>'conteudo_texto',
      (bloco->>'pontos_bloco')::INTEGER,
      COALESCE(bloco->>'status', 'incompleto')
    );
    inserted_count := inserted_count + 1;
  END LOOP;
  
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Dar permissão para authenticated users
GRANT EXECUTE ON FUNCTION insert_planejamento_admin(UUID, VARCHAR, VARCHAR, TEXT, INTEGER, INTEGER, INTEGER, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_blocos_templates_admin(JSONB) TO authenticated;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Funções RPC de INSERT criadas com sucesso!';
  RAISE NOTICE '🚀 Use: supabase.rpc("insert_planejamento_admin", { ... })';
  RAISE NOTICE '🚀 Use: supabase.rpc("insert_blocos_templates_admin", { blocos_json: [...] })';
END $$;



