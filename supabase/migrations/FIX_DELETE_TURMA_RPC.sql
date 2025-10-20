-- ============================================================================
-- FIX DELETE_TURMA_ADMIN RPC
-- Data: 2025-10-20
-- Descrição: Simplificar RPC para deletar turma
-- ============================================================================

-- 1. Dropar versões antigas
DROP FUNCTION IF EXISTS delete_turma_admin(UUID, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS delete_turma_admin(UUID);

-- 2. Criar versão simplificada
CREATE OR REPLACE FUNCTION delete_turma_admin(
  p_turma_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_alunos INTEGER;
  v_turma_nome VARCHAR;
BEGIN
  -- Buscar informações da turma
  SELECT name, 
         (SELECT COUNT(*) FROM alunos WHERE turma_id = p_turma_id AND active = true)
  INTO v_turma_nome, v_total_alunos
  FROM turmas
  WHERE id = p_turma_id;

  IF v_turma_nome IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Turma não encontrada'
    );
  END IF;

  -- Verificar se há alunos ativos
  IF v_total_alunos > 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Não é possível deletar a turma. Existem ' || v_total_alunos || ' alunos ativos.'
    );
  END IF;

  -- Deletar turma
  DELETE FROM turmas WHERE id = p_turma_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Erro ao deletar turma'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Turma deletada com sucesso'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Erro ao deletar turma: ' || SQLERRM
    );
END;
$$;

-- 3. Garantir permissões
GRANT EXECUTE ON FUNCTION delete_turma_admin(UUID) TO authenticated, anon, service_role;

-- 4. Teste
DO $$
BEGIN
  RAISE NOTICE '✅ RPC delete_turma_admin criado/atualizado com sucesso!';
END $$;

