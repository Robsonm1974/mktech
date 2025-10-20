-- ============================================================================
-- RPCs PARA CRUD DE ALUNOS
-- Data: 2025-10-20
-- Descrição: Funções para gerenciar alunos (Create, Read, Update, Delete)
-- ============================================================================

-- ============================================================================
-- 1. RPC: GERAR PIN ÚNICO
-- ============================================================================
CREATE OR REPLACE FUNCTION gerar_pin_unico(p_tenant_id UUID)
RETURNS VARCHAR(4)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pin VARCHAR(4);
  v_existe BOOLEAN;
  v_tentativas INTEGER := 0;
  v_max_tentativas INTEGER := 100;
BEGIN
  LOOP
    -- Gerar PIN aleatório de 4 dígitos
    v_pin := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Verificar se já existe
    SELECT EXISTS (
      SELECT 1 FROM alunos 
      WHERE tenant_id = p_tenant_id AND pin_code = v_pin
    ) INTO v_existe;
    
    -- Se não existe, retornar
    IF NOT v_existe THEN
      RETURN v_pin;
    END IF;
    
    -- Incrementar tentativas
    v_tentativas := v_tentativas + 1;
    
    -- Evitar loop infinito
    IF v_tentativas >= v_max_tentativas THEN
      RAISE EXCEPTION 'Não foi possível gerar PIN único após % tentativas', v_max_tentativas;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION gerar_pin_unico(UUID) TO authenticated, anon, service_role;

-- ============================================================================
-- 2. RPC: LISTAR ALUNOS
-- ============================================================================
CREATE OR REPLACE FUNCTION get_alunos_admin(
  p_tenant_id UUID DEFAULT NULL,
  p_turma_id UUID DEFAULT NULL,
  p_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  turma_id UUID,
  turma_nome VARCHAR,
  ano_escolar_id VARCHAR,
  ano_nome VARCHAR,
  full_name VARCHAR,
  data_nascimento DATE,
  numero_matricula VARCHAR,
  icone_afinidade VARCHAR,
  pin_code VARCHAR,
  foto_url VARCHAR,
  email_responsavel VARCHAR,
  nome_responsavel VARCHAR,
  telefone_responsavel VARCHAR,
  pontos_totais INTEGER,
  badges_conquistados JSONB,
  nivel INTEGER,
  active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.tenant_id,
    a.turma_id,
    COALESCE(t.name, '') AS turma_nome,
    t.ano_escolar_id,
    COALESCE(ae.nome, '') AS ano_nome,
    a.full_name,
    a.data_nascimento,
    a.numero_matricula,
    a.icone_afinidade,
    a.pin_code,
    a.foto_url,
    a.email_responsavel,
    a.nome_responsavel,
    a.telefone_responsavel,
    a.pontos_totais,
    a.badges_conquistados,
    a.nivel,
    a.active,
    a.created_at,
    a.updated_at
  FROM alunos a
  LEFT JOIN turmas t ON a.turma_id = t.id
  LEFT JOIN anos_escolares ae ON t.ano_escolar_id = ae.id
  WHERE 
    (p_tenant_id IS NULL OR a.tenant_id = p_tenant_id)
    AND (p_turma_id IS NULL OR a.turma_id = p_turma_id)
    AND (p_active IS NULL OR a.active = p_active)
  ORDER BY a.full_name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_alunos_admin(UUID, UUID, BOOLEAN) TO authenticated, anon, service_role;

-- ============================================================================
-- 3. RPC: CRIAR ALUNO
-- ============================================================================
CREATE OR REPLACE FUNCTION insert_aluno_admin(
  p_tenant_id UUID,
  p_turma_id UUID,
  p_full_name VARCHAR,
  p_data_nascimento DATE DEFAULT NULL,
  p_numero_matricula VARCHAR DEFAULT NULL,
  p_icone_afinidade VARCHAR DEFAULT 'dog',
  p_pin_code VARCHAR DEFAULT NULL,  -- Se NULL, gera automaticamente
  p_foto_url VARCHAR DEFAULT NULL,
  p_email_responsavel VARCHAR DEFAULT NULL,
  p_nome_responsavel VARCHAR DEFAULT NULL,
  p_telefone_responsavel VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_aluno_id UUID;
  v_pin VARCHAR(4);
BEGIN
  -- Validações
  IF p_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Tenant ID é obrigatório');
  END IF;

  IF p_turma_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Turma é obrigatória');
  END IF;

  IF p_full_name IS NULL OR TRIM(p_full_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nome completo é obrigatório');
  END IF;

  -- Gerar PIN se não foi fornecido
  IF p_pin_code IS NULL OR p_pin_code = '' THEN
    v_pin := gerar_pin_unico(p_tenant_id);
  ELSE
    -- Validar PIN fornecido (4 dígitos)
    IF LENGTH(p_pin_code) != 4 OR p_pin_code !~ '^\d{4}$' THEN
      RETURN jsonb_build_object('success', false, 'message', 'PIN deve ter exatamente 4 dígitos numéricos');
    END IF;
    
    -- Verificar se PIN já existe
    IF EXISTS (SELECT 1 FROM alunos WHERE tenant_id = p_tenant_id AND pin_code = p_pin_code) THEN
      RETURN jsonb_build_object('success', false, 'message', 'PIN já está em uso');
    END IF;
    
    v_pin := p_pin_code;
  END IF;

  -- Verificar matrícula duplicada (se fornecida)
  IF p_numero_matricula IS NOT NULL AND p_numero_matricula != '' THEN
    IF EXISTS (
      SELECT 1 FROM alunos 
      WHERE tenant_id = p_tenant_id AND numero_matricula = p_numero_matricula
    ) THEN
      RETURN jsonb_build_object('success', false, 'message', 'Número de matrícula já está em uso');
    END IF;
  END IF;

  -- Inserir aluno
  INSERT INTO alunos (
    tenant_id,
    turma_id,
    full_name,
    data_nascimento,
    numero_matricula,
    icone_afinidade,
    pin_code,
    foto_url,
    email_responsavel,
    nome_responsavel,
    telefone_responsavel,
    pontos_totais,
    badges_conquistados,
    nivel,
    active,
    created_at,
    updated_at
  ) VALUES (
    p_tenant_id,
    p_turma_id,
    p_full_name,
    p_data_nascimento,
    NULLIF(p_numero_matricula, ''),
    COALESCE(p_icone_afinidade, 'dog'),
    v_pin,
    NULLIF(p_foto_url, ''),
    NULLIF(p_email_responsavel, ''),
    NULLIF(p_nome_responsavel, ''),
    NULLIF(p_telefone_responsavel, ''),
    0,
    '[]'::jsonb,
    1,
    true,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_aluno_id;

  RETURN jsonb_build_object(
    'success', true,
    'aluno_id', v_aluno_id,
    'pin_code', v_pin,
    'message', 'Aluno cadastrado com sucesso'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Erro ao cadastrar aluno: ' || SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION insert_aluno_admin(UUID, UUID, VARCHAR, DATE, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO authenticated, anon, service_role;

-- ============================================================================
-- 4. RPC: ATUALIZAR ALUNO
-- ============================================================================
CREATE OR REPLACE FUNCTION update_aluno_admin(
  p_aluno_id UUID,
  p_turma_id UUID DEFAULT NULL,
  p_full_name VARCHAR DEFAULT NULL,
  p_data_nascimento DATE DEFAULT NULL,
  p_numero_matricula VARCHAR DEFAULT NULL,
  p_icone_afinidade VARCHAR DEFAULT NULL,
  p_pin_code VARCHAR DEFAULT NULL,
  p_foto_url VARCHAR DEFAULT NULL,
  p_email_responsavel VARCHAR DEFAULT NULL,
  p_nome_responsavel VARCHAR DEFAULT NULL,
  p_telefone_responsavel VARCHAR DEFAULT NULL,
  p_active BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_aluno RECORD;
BEGIN
  -- Buscar aluno atual
  SELECT * INTO v_aluno FROM alunos WHERE id = p_aluno_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Aluno não encontrado');
  END IF;

  -- Validar PIN (se fornecido)
  IF p_pin_code IS NOT NULL THEN
    IF LENGTH(p_pin_code) != 4 OR p_pin_code !~ '^\d{4}$' THEN
      RETURN jsonb_build_object('success', false, 'message', 'PIN deve ter exatamente 4 dígitos numéricos');
    END IF;
    
    -- Verificar duplicata de PIN (exceto o próprio aluno)
    IF EXISTS (
      SELECT 1 FROM alunos 
      WHERE tenant_id = v_aluno.tenant_id 
        AND pin_code = p_pin_code 
        AND id != p_aluno_id
    ) THEN
      RETURN jsonb_build_object('success', false, 'message', 'PIN já está em uso por outro aluno');
    END IF;
  END IF;

  -- Validar matrícula (se fornecida)
  IF p_numero_matricula IS NOT NULL AND p_numero_matricula != '' THEN
    IF EXISTS (
      SELECT 1 FROM alunos 
      WHERE tenant_id = v_aluno.tenant_id 
        AND numero_matricula = p_numero_matricula 
        AND id != p_aluno_id
    ) THEN
      RETURN jsonb_build_object('success', false, 'message', 'Número de matrícula já está em uso');
    END IF;
  END IF;

  -- Atualizar aluno (só atualiza campos não-NULL)
  UPDATE alunos
  SET
    turma_id = CASE WHEN p_turma_id IS NOT NULL THEN p_turma_id ELSE turma_id END,
    full_name = CASE WHEN p_full_name IS NOT NULL THEN p_full_name ELSE full_name END,
    data_nascimento = CASE WHEN p_data_nascimento IS NOT NULL THEN p_data_nascimento ELSE data_nascimento END,
    numero_matricula = CASE WHEN p_numero_matricula IS NOT NULL THEN NULLIF(p_numero_matricula, '') ELSE numero_matricula END,
    icone_afinidade = CASE WHEN p_icone_afinidade IS NOT NULL THEN p_icone_afinidade ELSE icone_afinidade END,
    pin_code = CASE WHEN p_pin_code IS NOT NULL THEN p_pin_code ELSE pin_code END,
    foto_url = CASE WHEN p_foto_url IS NOT NULL THEN NULLIF(p_foto_url, '') ELSE foto_url END,
    email_responsavel = CASE WHEN p_email_responsavel IS NOT NULL THEN NULLIF(p_email_responsavel, '') ELSE email_responsavel END,
    nome_responsavel = CASE WHEN p_nome_responsavel IS NOT NULL THEN NULLIF(p_nome_responsavel, '') ELSE nome_responsavel END,
    telefone_responsavel = CASE WHEN p_telefone_responsavel IS NOT NULL THEN NULLIF(p_telefone_responsavel, '') ELSE telefone_responsavel END,
    active = CASE WHEN p_active IS NOT NULL THEN p_active ELSE active END,
    updated_at = NOW()
  WHERE id = p_aluno_id;

  RETURN jsonb_build_object('success', true, 'message', 'Aluno atualizado com sucesso');

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Erro ao atualizar aluno: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION update_aluno_admin(UUID, UUID, VARCHAR, DATE, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, BOOLEAN) TO authenticated, anon, service_role;

-- ============================================================================
-- 5. RPC: DELETAR ALUNO
-- ============================================================================
CREATE OR REPLACE FUNCTION delete_aluno_admin(p_aluno_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se aluno existe
  IF NOT EXISTS (SELECT 1 FROM alunos WHERE id = p_aluno_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Aluno não encontrado');
  END IF;

  -- Deletar aluno
  DELETE FROM alunos WHERE id = p_aluno_id;

  RETURN jsonb_build_object('success', true, 'message', 'Aluno deletado com sucesso');

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Erro ao deletar aluno: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION delete_aluno_admin(UUID) TO authenticated, anon, service_role;

-- ============================================================================
-- 6. VERIFICAÇÃO FINAL
-- ============================================================================
DO $$
DECLARE
  v_count_rpcs INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count_rpcs 
  FROM pg_proc 
  WHERE proname IN ('gerar_pin_unico', 'get_alunos_admin', 'insert_aluno_admin', 'update_aluno_admin', 'delete_aluno_admin');
  
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ RPCs DE ALUNOS - Criados com Sucesso';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 RPCs DISPONÍVEIS (%):',v_count_rpcs;
  RAISE NOTICE '   1. gerar_pin_unico()      - Gera PIN único de 4 dígitos';
  RAISE NOTICE '   2. get_alunos_admin()     - Lista alunos com filtros';
  RAISE NOTICE '   3. insert_aluno_admin()   - Criar novo aluno';
  RAISE NOTICE '   4. update_aluno_admin()   - Atualizar aluno';
  RAISE NOTICE '   5. delete_aluno_admin()   - Deletar aluno';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Pronto para implementar frontend!';
  RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;

