-- ============================================================================
-- CRUD COMPLETO DE TURMAS - Script Consolidado
-- Data: 2025-10-20
-- Descrição: Criar/Atualizar todos os RPCs necessários para CRUD de Turmas
-- ============================================================================

-- ============================================================================
-- 1. RPC: INSERT TURMA (já existe e está funcionando)
-- ============================================================================
-- Não precisa recriar, já está funcionando

-- ============================================================================
-- 2. RPC: UPDATE TURMA
-- ============================================================================
DROP FUNCTION IF EXISTS update_turma_admin(UUID, VARCHAR, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS update_turma_admin(UUID, UUID, VARCHAR, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT);

CREATE OR REPLACE FUNCTION update_turma_admin(
  p_turma_id UUID,
  p_designacao VARCHAR DEFAULT NULL,
  p_name VARCHAR DEFAULT NULL,
  p_professor_id UUID DEFAULT NULL,
  p_sala VARCHAR DEFAULT NULL,
  p_turno VARCHAR DEFAULT NULL,
  p_descricao TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_turma RECORD;
BEGIN
  -- Buscar turma atual
  SELECT * INTO v_turma FROM turmas WHERE id = p_turma_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Turma não encontrada');
  END IF;

  -- Verificar duplicata de nome (se estiver mudando)
  IF p_name IS NOT NULL AND p_name != v_turma.name THEN
    IF EXISTS (
      SELECT 1 FROM turmas 
      WHERE tenant_id = v_turma.tenant_id 
        AND name = p_name 
        AND id != p_turma_id
    ) THEN
      RETURN jsonb_build_object('success', false, 'message', 'Já existe uma turma com este nome');
    END IF;
  END IF;

  -- Atualizar (só atualiza campos não-NULL)
  UPDATE turmas
  SET
    designacao = CASE WHEN p_designacao IS NOT NULL THEN p_designacao ELSE designacao END,
    name = CASE WHEN p_name IS NOT NULL THEN p_name ELSE name END,
    professor_id = CASE WHEN p_professor_id IS NOT NULL THEN p_professor_id ELSE professor_id END,
    sala = CASE WHEN p_sala IS NOT NULL THEN p_sala ELSE sala END,
    turno = CASE WHEN p_turno IS NOT NULL THEN p_turno ELSE turno END,
    descricao = CASE WHEN p_descricao IS NOT NULL THEN p_descricao ELSE descricao END,
    updated_at = NOW()
  WHERE id = p_turma_id;

  RETURN jsonb_build_object('success', true, 'message', 'Turma atualizada com sucesso');

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Erro: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION update_turma_admin(UUID, VARCHAR, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT) TO authenticated, anon, service_role;

-- ============================================================================
-- 3. RPC: DELETE TURMA
-- ============================================================================
DROP FUNCTION IF EXISTS delete_turma_admin(UUID, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS delete_turma_admin(UUID);

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
  SELECT 
    name,
    (SELECT COUNT(*) FROM alunos WHERE turma_id = p_turma_id AND active = true)
  INTO v_turma_nome, v_total_alunos
  FROM turmas
  WHERE id = p_turma_id;

  IF v_turma_nome IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Turma não encontrada');
  END IF;

  -- Verificar se há alunos ativos
  IF v_total_alunos > 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Não é possível deletar. A turma possui ' || v_total_alunos || ' alunos ativos.'
    );
  END IF;

  -- Deletar turma
  DELETE FROM turmas WHERE id = p_turma_id;

  RETURN jsonb_build_object('success', true, 'message', 'Turma deletada com sucesso');

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Erro: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION delete_turma_admin(UUID) TO authenticated, anon, service_role;

-- ============================================================================
-- 4. VERIFICAÇÃO FINAL
-- ============================================================================
DO $$
DECLARE
  v_count_turmas INTEGER;
  v_count_insert INTEGER;
  v_count_update INTEGER;
  v_count_delete INTEGER;
BEGIN
  -- Contar turmas
  SELECT COUNT(*) INTO v_count_turmas FROM turmas;
  
  -- Verificar RPCs
  SELECT COUNT(*) INTO v_count_insert FROM pg_proc WHERE proname = 'insert_turma_admin';
  SELECT COUNT(*) INTO v_count_update FROM pg_proc WHERE proname = 'update_turma_admin';
  SELECT COUNT(*) INTO v_count_delete FROM pg_proc WHERE proname = 'delete_turma_admin';
  
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ CRUD COMPLETO DE TURMAS - Configuração Finalizada';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 ESTATÍSTICAS:';
  RAISE NOTICE '   • Total de turmas: %', v_count_turmas;
  RAISE NOTICE '';
  RAISE NOTICE '🔧 RPCs DISPONÍVEIS:';
  RAISE NOTICE '   • insert_turma_admin: % (✅ Criar)', v_count_insert;
  RAISE NOTICE '   • update_turma_admin: % (✅ Editar)', v_count_update;
  RAISE NOTICE '   • delete_turma_admin: % (✅ Deletar)', v_count_delete;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRÓXIMOS PASSOS:';
  RAISE NOTICE '   1. Testar editar turma no frontend';
  RAISE NOTICE '   2. Testar deletar turma no frontend';
  RAISE NOTICE '   3. Verificar validações (não deletar com alunos)';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

