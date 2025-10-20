-- ============================================================================
-- 🚀 RPC para buscar blocos_templates com relações (Bypass RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_blocos_with_relations_admin()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', bt.id,
      'codigo_bloco', bt.codigo_bloco,
      'titulo', bt.titulo,
      'status', bt.status,
      'pontos_bloco', bt.pontos_bloco,
      'tipo_midia', bt.tipo_midia,
      'quiz_id', bt.quiz_id,
      'numero_sequencia', bt.numero_sequencia,
      'disciplinas', CASE 
        WHEN d.id IS NOT NULL THEN 
          jsonb_build_object(
            'codigo', d.codigo,
            'nome', d.nome,
            'cor_hex', d.cor_hex,
            'icone', d.icone
          )
        ELSE NULL
      END,
      'planejamentos', CASE
        WHEN p.id IS NOT NULL THEN
          jsonb_build_object(
            'turma', p.turma,
            'codigo_base', p.codigo_base
          )
        ELSE NULL
      END
    )
  )
  INTO result
  FROM blocos_templates bt
  LEFT JOIN disciplinas d ON bt.disciplina_id = d.id
  LEFT JOIN planejamentos p ON bt.planejamento_id = p.id
  ORDER BY bt.codigo_bloco ASC;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Dar permissão
GRANT EXECUTE ON FUNCTION get_blocos_with_relations_admin() TO authenticated;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Função RPC get_blocos_with_relations_admin() criada com sucesso!';
  RAISE NOTICE '🚀 Use: supabase.rpc("get_blocos_with_relations_admin")';
END $$;



