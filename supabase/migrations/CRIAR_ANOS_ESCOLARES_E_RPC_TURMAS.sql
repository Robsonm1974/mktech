-- ============================================================================
-- CRIAR TABELA ANOS_ESCOLARES E RPCs PARA TURMAS
-- Data: 2025-10-18
-- Descrição: Tabela de anos escolares e funções RPC para gestão de turmas
-- ============================================================================

-- 1. Verificar se a tabela anos_escolares já existe
-- Se já existir (como mostra a imagem), não fazer nada
-- Se não existir, criar com a estrutura correta

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'anos_escolares') THEN
    CREATE TABLE anos_escolares (
      id VARCHAR(20) PRIMARY KEY,
      nome VARCHAR(50) NOT NULL,
      idade_referencia INTEGER,
      ordem INTEGER NOT NULL,
      descricao TEXT,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
    
    RAISE NOTICE '✅ Tabela anos_escolares criada';
  ELSE
    RAISE NOTICE '✅ Tabela anos_escolares já existe';
  END IF;
END $$;

-- 2. Inserir anos escolares (se não existirem)
-- A tabela já existe com dados, então vamos apenas garantir que os dados estão corretos
INSERT INTO anos_escolares (id, nome, idade_referencia, ordem, descricao) VALUES
  ('EF1', '1º Ano', 6, 1, 'Primeiro ano do Ensino Fundamental'),
  ('EF2', '2º Ano', 7, 2, 'Segundo ano do Ensino Fundamental'),
  ('EF3', '3º Ano', 8, 3, 'Terceiro ano do Ensino Fundamental'),
  ('EF4', '4º Ano', 9, 4, 'Quarto ano do Ensino Fundamental'),
  ('EF5', '5º Ano', 10, 5, 'Quinto ano do Ensino Fundamental'),
  ('EF6', '6º Ano', 11, 6, 'Sexto ano do Ensino Fundamental'),
  ('EF7', '7º Ano', 12, 7, 'Sétimo ano do Ensino Fundamental'),
  ('EF8', '8º Ano', 13, 8, 'Oitavo ano do Ensino Fundamental'),
  ('EF9', '9º Ano', 14, 9, 'Nono ano do Ensino Fundamental')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  idade_referencia = EXCLUDED.idade_referencia,
  ordem = EXCLUDED.ordem,
  descricao = EXCLUDED.descricao,
  updated_at = now();

-- Desabilitar RLS para desenvolvimento
ALTER TABLE anos_escolares DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE anos_escolares TO postgres, authenticated, anon, service_role;

-- 3. RPC: Buscar turmas com relações (admin escola)
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

-- 4. RPC: Criar turma (admin escola)
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
  v_result JSONB;
BEGIN
  -- Log inicial
  RAISE NOTICE 'insert_turma_admin chamado com: tenant=%, ano=%, nome=%, professor=%', 
    p_tenant_id, p_ano_escolar_id, p_name, p_professor_id;

  -- Validações
  IF p_tenant_id IS NULL THEN
    RAISE NOTICE 'Erro: Tenant ID é NULL';
    RETURN jsonb_build_object('success', false, 'message', 'Tenant ID é obrigatório');
  END IF;

  IF p_ano_escolar_id IS NULL THEN
    RAISE NOTICE 'Erro: Ano Escolar é NULL';
    RETURN jsonb_build_object('success', false, 'message', 'Ano Escolar é obrigatório');
  END IF;

  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    RAISE NOTICE 'Erro: Nome da turma está vazio';
    RETURN jsonb_build_object('success', false, 'message', 'Nome da turma é obrigatório');
  END IF;

  IF p_professor_id IS NULL THEN
    RAISE NOTICE 'Erro: Professor ID é NULL';
    RETURN jsonb_build_object('success', false, 'message', 'Professor é obrigatório');
  END IF;

  -- Verificar se já existe turma com mesmo nome no tenant
  IF EXISTS (
    SELECT 1 FROM turmas 
    WHERE tenant_id = p_tenant_id AND name = p_name
  ) THEN
    RAISE NOTICE 'Erro: Turma com nome % já existe', p_name;
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
      grade_level,  -- Manter compatibilidade com código antigo
      created_at,
      updated_at
    ) VALUES (
      p_tenant_id,
      p_ano_escolar_id,
      p_designacao,
      p_name,
      p_professor_id,
      p_sala,
      p_turno,
      p_descricao,
      p_ano_escolar_id,  -- grade_level = ano_escolar_id
      NOW(),
      NOW()
    )
    RETURNING id INTO v_turma_id;

    RAISE NOTICE 'Turma criada com sucesso: ID=%', v_turma_id;

    v_result := jsonb_build_object(
      'success', true,
      'turma_id', v_turma_id,
      'message', 'Turma criada com sucesso'
    );

    RETURN v_result;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Erro ao inserir turma: % %', SQLERRM, SQLSTATE;
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'Erro ao criar turma: ' || SQLERRM,
        'error_code', SQLSTATE
      );
  END;
END;
$$;

-- 5. RPC: Atualizar turma (admin escola)
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
  -- Buscar tenant_id da turma
  SELECT tenant_id INTO v_tenant_id FROM turmas WHERE id = p_turma_id;

  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Turma não encontrada');
  END IF;

  -- Verificar duplicata de nome (se alterado)
  IF p_name IS NOT NULL AND EXISTS (
    SELECT 1 FROM turmas 
    WHERE tenant_id = v_tenant_id 
      AND name = p_name 
      AND id != p_turma_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Já existe uma turma com este nome');
  END IF;

  -- Atualizar turma (apenas campos fornecidos)
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

-- 6. RPC: Deletar turma (admin escola)
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
  -- Contar alunos ativos
  SELECT COUNT(*) INTO v_total_alunos 
  FROM alunos 
  WHERE turma_id = p_turma_id AND active = true;

  -- Se tem alunos, exigir ação
  IF v_total_alunos > 0 THEN
    IF p_mover_para_turma_id IS NOT NULL THEN
      -- Mover alunos para outra turma
      UPDATE alunos
      SET turma_id = p_mover_para_turma_id, updated_at = NOW()
      WHERE turma_id = p_turma_id;
      
      RAISE NOTICE '% alunos movidos para nova turma', v_total_alunos;
    ELSIF p_desativar_alunos THEN
      -- Desativar alunos
      UPDATE alunos
      SET active = false, updated_at = NOW()
      WHERE turma_id = p_turma_id;
      
      RAISE NOTICE '% alunos desativados', v_total_alunos;
    ELSE
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'Turma possui alunos ativos. Escolha mover para outra turma ou desativar alunos.'
      );
    END IF;
  END IF;

  -- Deletar turma
  DELETE FROM turmas WHERE id = p_turma_id;

  RETURN jsonb_build_object('success', true, 'message', 'Turma deletada com sucesso');
END;
$$;

-- 7. Verificação final
DO $$
DECLARE
  v_count_anos INTEGER;
  v_count_turmas INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count_anos FROM anos_escolares;
  SELECT COUNT(*) INTO v_count_turmas FROM turmas;
  
  RAISE NOTICE '✅ Anos Escolares: %', v_count_anos;
  RAISE NOTICE '✅ Turmas: %', v_count_turmas;
  RAISE NOTICE '✅ Migration CRIAR_ANOS_ESCOLARES_E_RPC_TURMAS concluída!';
END $$;

