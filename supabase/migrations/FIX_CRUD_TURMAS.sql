-- ============================================================================
-- FIX CRUD TURMAS - Correção rápida para erros
-- Data: 2025-10-18
-- ============================================================================

-- 1. Garantir que a tabela turmas tem todas as colunas necessárias
DO $$ 
BEGIN
  -- ano_escolar_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'turmas' AND column_name = 'ano_escolar_id'
  ) THEN
    ALTER TABLE turmas ADD COLUMN ano_escolar_id VARCHAR(20);
  END IF;

  -- designacao
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'turmas' AND column_name = 'designacao'
  ) THEN
    ALTER TABLE turmas ADD COLUMN designacao VARCHAR(50);
  END IF;

  -- sala
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'turmas' AND column_name = 'sala'
  ) THEN
    ALTER TABLE turmas ADD COLUMN sala VARCHAR(50);
  END IF;

  -- turno
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'turmas' AND column_name = 'turno'
  ) THEN
    ALTER TABLE turmas ADD COLUMN turno VARCHAR(20);
  END IF;
END $$;

-- 2. Migrar dados existentes
UPDATE turmas
SET ano_escolar_id = CASE
  WHEN grade_level LIKE 'EF1%' THEN 'EF1'
  WHEN grade_level LIKE 'EF2%' THEN 'EF2'
  WHEN grade_level LIKE 'EF3%' THEN 'EF3'
  WHEN grade_level LIKE 'EF4%' THEN 'EF4'
  WHEN grade_level LIKE 'EF5%' THEN 'EF5'
  WHEN grade_level LIKE 'EF6%' THEN 'EF6'
  WHEN grade_level LIKE 'EF7%' THEN 'EF7'
  WHEN grade_level LIKE 'EF8%' THEN 'EF8'
  WHEN grade_level LIKE 'EF9%' THEN 'EF9'
  ELSE grade_level
END
WHERE ano_escolar_id IS NULL;

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_turmas_ano_escolar ON turmas(ano_escolar_id);
CREATE INDEX IF NOT EXISTS idx_turmas_professor ON turmas(professor_id);
CREATE INDEX IF NOT EXISTS idx_turmas_tenant ON turmas(tenant_id);

-- 4. Desabilitar RLS
ALTER TABLE turmas DISABLE ROW LEVEL SECURITY;
ALTER TABLE anos_escolares DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE turmas TO postgres, authenticated, anon, service_role;
GRANT ALL ON TABLE anos_escolares TO postgres, authenticated, anon, service_role;

-- 5. Recriar RPC insert_turma_admin com tratamento de erro
DROP FUNCTION IF EXISTS insert_turma_admin(UUID, VARCHAR, VARCHAR, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT);

CREATE OR REPLACE FUNCTION insert_turma_admin(
  p_tenant_id UUID,
  p_ano_escolar_id VARCHAR,
  p_designacao VARCHAR,
  p_name VARCHAR,
  p_professor_id UUID,
  p_sala VARCHAR DEFAULT NULL,
  p_turno VARCHAR DEFAULT NULL,
  p_descricao TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_turma_id UUID;
BEGIN
  -- Validações
  IF p_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Tenant ID é obrigatório');
  END IF;

  IF p_ano_escolar_id IS NULL OR TRIM(p_ano_escolar_id) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ano Escolar é obrigatório');
  END IF;

  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nome da turma é obrigatório');
  END IF;

  IF p_professor_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Professor é obrigatório');
  END IF;

  -- Verificar duplicata
  IF EXISTS (
    SELECT 1 FROM turmas 
    WHERE tenant_id = p_tenant_id AND name = p_name
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Já existe uma turma com este nome');
  END IF;

  -- Inserir turma
  BEGIN
    INSERT INTO turmas (
      tenant_id,
      ano_escolar_id,
      designacao,
      name,
      professor_id,
      sala,
      turno,
      descricao,
      grade_level,
      created_at,
      updated_at
    ) VALUES (
      p_tenant_id,
      p_ano_escolar_id,
      NULLIF(p_designacao, ''),
      p_name,
      p_professor_id,
      NULLIF(p_sala, ''),
      NULLIF(p_turno, ''),
      NULLIF(p_descricao, ''),
      p_ano_escolar_id,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_turma_id;

    RETURN jsonb_build_object(
      'success', true,
      'turma_id', v_turma_id,
      'message', 'Turma criada com sucesso'
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'Erro ao criar turma: ' || SQLERRM
      );
  END;
END;
$$;

-- 6. Recriar RPC get_turmas_admin
DROP FUNCTION IF EXISTS get_turmas_admin(UUID);

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
    ae.nome AS ano_nome,
    t.designacao,
    t.professor_id,
    u.full_name AS professor_nome,
    u.email AS professor_email,
    t.sala,
    t.turno,
    t.descricao,
    COUNT(a.id) AS total_alunos,
    t.created_at,
    t.updated_at
  FROM turmas t
  LEFT JOIN anos_escolares ae ON t.ano_escolar_id = ae.id
  LEFT JOIN users u ON t.professor_id = u.id
  LEFT JOIN alunos a ON t.id = a.turma_id AND a.active = true
  WHERE (p_tenant_id IS NULL OR t.tenant_id = p_tenant_id)
  GROUP BY t.id, ae.nome, u.full_name, u.email
  ORDER BY ae.ordem, t.name;
END;
$$;

-- 7. Recriar RPC update_turma_admin
DROP FUNCTION IF EXISTS update_turma_admin(UUID, VARCHAR, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT);

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
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM turmas WHERE id = p_turma_id;

  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Turma não encontrada');
  END IF;

  IF p_name IS NOT NULL AND EXISTS (
    SELECT 1 FROM turmas 
    WHERE tenant_id = v_tenant_id 
      AND name = p_name 
      AND id != p_turma_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Já existe uma turma com este nome');
  END IF;

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

  RETURN jsonb_build_object('success', true, 'message', 'Turma atualizada com sucesso');
END;
$$;

-- 8. Recriar RPC delete_turma_admin
DROP FUNCTION IF EXISTS delete_turma_admin(UUID, UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION delete_turma_admin(
  p_turma_id UUID,
  p_mover_para_turma_id UUID DEFAULT NULL,
  p_desativar_alunos BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_alunos INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_alunos 
  FROM alunos 
  WHERE turma_id = p_turma_id AND active = true;

  IF v_total_alunos > 0 THEN
    IF p_mover_para_turma_id IS NOT NULL THEN
      UPDATE alunos
      SET turma_id = p_mover_para_turma_id, updated_at = NOW()
      WHERE turma_id = p_turma_id;
    ELSIF p_desativar_alunos THEN
      UPDATE alunos
      SET active = false, updated_at = NOW()
      WHERE turma_id = p_turma_id;
    ELSE
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'Turma possui ' || v_total_alunos || ' alunos ativos. Mova-os ou desative-os primeiro.'
      );
    END IF;
  END IF;

  DELETE FROM turmas WHERE id = p_turma_id;

  RETURN jsonb_build_object('success', true, 'message', 'Turma deletada com sucesso');
END;
$$;

-- 9. Verificação final
DO $$
DECLARE
  v_count_turmas INTEGER;
  v_count_anos INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count_turmas FROM turmas;
  SELECT COUNT(*) INTO v_count_anos FROM anos_escolares;
  
  RAISE NOTICE '✅ Fix CRUD Turmas concluído!';
  RAISE NOTICE '✅ Turmas: %', v_count_turmas;
  RAISE NOTICE '✅ Anos Escolares: %', v_count_anos;
  RAISE NOTICE '✅ RPCs criados: insert_turma_admin, get_turmas_admin, update_turma_admin, delete_turma_admin';
END $$;

