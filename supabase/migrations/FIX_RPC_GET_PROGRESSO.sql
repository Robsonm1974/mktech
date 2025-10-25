-- ============================================================================
-- FIX: Corrigir RPC get_progresso_aluno_sessao (bloco_id → bloco_template_id)
-- Data: 2025-10-20
-- ============================================================================

DROP FUNCTION IF EXISTS get_progresso_aluno_sessao(UUID, UUID);

CREATE OR REPLACE FUNCTION get_progresso_aluno_sessao(
  p_session_id UUID,
  p_aluno_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_participacao JSONB;
  v_blocos JSONB;
BEGIN
  -- Buscar participação
  SELECT jsonb_build_object(
    'id', ps.id,
    'session_id', ps.session_id,
    'aluno_id', ps.aluno_id,
    'entrou_em', ps.entrou_em,
    'saiu_em', ps.saiu_em,
    'ultima_atividade', ps.ultima_atividade,
    'bloco_atual_numero', ps.bloco_atual_numero,
    'blocos_completados', ps.blocos_completados,
    'total_blocos', ps.total_blocos,
    'pontos_ganhos_sessao', ps.pontos_ganhos_sessao,
    'status', ps.status,
    'created_at', ps.created_at,
    'updated_at', ps.updated_at
  )
  INTO v_participacao
  FROM participacoes_sessao ps
  WHERE ps.session_id = p_session_id
    AND ps.aluno_id = p_aluno_id;

  IF v_participacao IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Participação não encontrada'
    );
  END IF;

  -- Buscar progresso dos blocos (CORRIGIDO: bloco_template_id)
  SELECT jsonb_agg(
    jsonb_build_object(
      'bloco_id', pb.bloco_template_id,
      'numero_sequencia', pb.numero_sequencia,
      'status', pb.status,
      'iniciado_em', pb.iniciado_em,
      'completado_em', pb.completado_em,
      'pontos_total', pb.pontos_total
    ) ORDER BY pb.numero_sequencia
  )
  INTO v_blocos
  FROM progresso_blocos pb
  WHERE pb.participacao_id = (v_participacao->>'id')::UUID;

  -- Retornar resultado
  RETURN jsonb_build_object(
    'participacao', v_participacao,
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

-- Testar RPC corrigido
SELECT get_progresso_aluno_sessao(
  '93d40cf9-78d8-43ab-b011-75e2fa29cbf0'::UUID,
  '5a3fab0b-d7cd-4db3-8324-f5aa04aecefb'::UUID
) AS teste_resultado;

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '✅ RPC get_progresso_aluno_sessao corrigido!';
  RAISE NOTICE 'Agora retorna bloco_template_id ao invés de bloco_id';
END $$;





