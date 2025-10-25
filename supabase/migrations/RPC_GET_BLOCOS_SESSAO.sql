-- ============================================================================
-- RPC: Buscar blocos de uma sessão (bypass RLS)
-- Data: 2025-10-20
-- ============================================================================

DROP FUNCTION IF EXISTS get_blocos_sessao(UUID);

CREATE OR REPLACE FUNCTION get_blocos_sessao(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_aula_id UUID;
  v_blocos JSONB;
BEGIN
  -- Buscar aula_id da sessão
  SELECT aula_id INTO v_aula_id
  FROM sessions
  WHERE id = p_session_id;

  IF v_aula_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Sessão não encontrada'
    );
  END IF;

  -- Buscar blocos com quizzes
  SELECT jsonb_agg(
    jsonb_build_object(
      'ordem_na_aula', ab.ordem_na_aula,
      'id', bt.id,
      'titulo', bt.titulo,
      'conteudo_texto', bt.conteudo_texto,
      'tipo_midia', bt.tipo_midia,
      'midia_url', bt.midia_url,
      'midia_metadata', bt.midia_metadata,
      'pontos_bloco', bt.pontos_bloco,
      'quiz_id', bt.quiz_id,
      'quiz', CASE 
        WHEN q.id IS NOT NULL THEN
          jsonb_build_object(
            'id', q.id,
            'titulo', q.titulo,
            'tipo', q.tipo,
            'perguntas', q.perguntas
          )
        ELSE NULL
      END
    ) ORDER BY ab.ordem_na_aula
  )
  INTO v_blocos
  FROM aulas_blocos ab
  JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
  LEFT JOIN quizzes q ON q.id = bt.quiz_id
  WHERE ab.aula_id = v_aula_id;

  -- Retornar blocos
  RETURN jsonb_build_object(
    'success', TRUE,
    'blocos', COALESCE(v_blocos, '[]'::jsonb)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$;

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '✅ RPC get_blocos_sessao criado com sucesso!';
END $$;





