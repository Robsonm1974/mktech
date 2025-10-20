-- ============================================================================
-- FIX UPDATE_TURMA_ADMIN RPC
-- Data: 2025-10-20
-- Descrição: Corrigir RPC para atualizar turma
-- ============================================================================

-- 1. Dropar versão antiga
DROP FUNCTION IF EXISTS update_turma_admin(UUID, VARCHAR, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS update_turma_admin(UUID, UUID, VARCHAR, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT);

-- 2. Criar versão correta
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
  v_tenant_id UUID;
  v_turma RECORD;
BEGIN
  -- Buscar turma atual
  SELECT * INTO v_turma FROM turmas WHERE id = p_turma_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Turma não encontrada'
    );
  END IF;

  v_tenant_id := v_turma.tenant_id;

  -- Verificar se o nome já existe (se estiver mudando)
  IF p_name IS NOT NULL AND p_name != v_turma.name THEN
    IF EXISTS (
      SELECT 1 FROM turmas 
      WHERE tenant_id = v_tenant_id 
        AND name = p_name 
        AND id != p_turma_id
    ) THEN
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'Já existe uma turma com este nome'
      );
    END IF;
  END IF;

  -- Atualizar turma
  UPDATE turmas
  SET
    designacao = COALESCE(p_designacao, designacao),
    name = COALESCE(p_name, name),
    professor_id = COALESCE(p_professor_id, professor_id),
    sala = COALESCE(p_sala, sala),
    turno = COALESCE(p_turno, turno),
    descricao = COALESCE(p_descricao, descricao),
    updated_at = NOW()
  WHERE id = p_turma_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Erro ao atualizar turma'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Turma atualizada com sucesso',
    'turma_id', p_turma_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Erro ao atualizar turma: ' || SQLERRM
    );
END;
$$;

-- 3. Garantir permissões
GRANT EXECUTE ON FUNCTION update_turma_admin(UUID, VARCHAR, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT) TO authenticated, anon, service_role;

-- 4. Teste
DO $$
BEGIN
  RAISE NOTICE '✅ RPC update_turma_admin criado/atualizado com sucesso!';
END $$;

