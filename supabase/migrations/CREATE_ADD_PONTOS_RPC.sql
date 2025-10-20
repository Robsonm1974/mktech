-- =====================================================
-- CRIAR FUNÇÃO RPC PARA ADICIONAR PONTOS DO ALUNO
-- =====================================================

-- Função para adicionar pontos ao aluno após completar bloco/quiz
CREATE OR REPLACE FUNCTION add_pontos_aluno(
  p_aluno_id UUID,
  p_bloco_id UUID,
  p_pontos INTEGER,
  p_tentativas INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_pontos INTEGER;
  v_result JSONB;
BEGIN
  -- Atualizar ou inserir pontos do aluno
  INSERT INTO aluno_pontos (aluno_id, total_pontos, updated_at)
  VALUES (p_aluno_id, p_pontos, NOW())
  ON CONFLICT (aluno_id)
  DO UPDATE SET
    total_pontos = aluno_pontos.total_pontos + EXCLUDED.total_pontos,
    updated_at = NOW()
  RETURNING total_pontos INTO v_total_pontos;

  -- Registrar progresso do bloco
  INSERT INTO aluno_blocos_progresso (
    aluno_id,
    bloco_id,
    status,
    pontos_ganhos,
    tentativas,
    completed_at,
    created_at
  )
  VALUES (
    p_aluno_id,
    p_bloco_id,
    'completo',
    p_pontos,
    p_tentativas,
    NOW(),
    NOW()
  )
  ON CONFLICT (aluno_id, bloco_id)
  DO UPDATE SET
    status = 'completo',
    pontos_ganhos = GREATEST(aluno_blocos_progresso.pontos_ganhos, EXCLUDED.pontos_ganhos),
    tentativas = aluno_blocos_progresso.tentativas + EXCLUDED.tentativas,
    completed_at = NOW();

  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', TRUE,
    'aluno_id', p_aluno_id,
    'bloco_id', p_bloco_id,
    'pontos_adicionados', p_pontos,
    'total_pontos', v_total_pontos,
    'tentativas', p_tentativas
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$;

-- =====================================================
-- CRIAR TABELAS SE NÃO EXISTIREM
-- =====================================================

-- Tabela de pontos totais do aluno
CREATE TABLE IF NOT EXISTS aluno_pontos (
  aluno_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_pontos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de progresso de blocos do aluno
CREATE TABLE IF NOT EXISTS aluno_blocos_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bloco_id UUID NOT NULL REFERENCES blocos_templates(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'nao_iniciado', -- nao_iniciado, em_progresso, completo
  pontos_ganhos INTEGER DEFAULT 0,
  tentativas INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(aluno_id, bloco_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_aluno_pontos_aluno ON aluno_pontos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_aluno_blocos_progresso_aluno ON aluno_blocos_progresso(aluno_id);
CREATE INDEX IF NOT EXISTS idx_aluno_blocos_progresso_bloco ON aluno_blocos_progresso(bloco_id);
CREATE INDEX IF NOT EXISTS idx_aluno_blocos_progresso_status ON aluno_blocos_progresso(status);

-- =====================================================
-- PERMISSÕES
-- =====================================================

-- Permitir que usuários autenticados chamem a função
GRANT EXECUTE ON FUNCTION add_pontos_aluno TO authenticated;

-- RLS para aluno_pontos
ALTER TABLE aluno_pontos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alunos podem ver próprios pontos"
  ON aluno_pontos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = aluno_id);

CREATE POLICY "Sistema pode atualizar pontos"
  ON aluno_pontos
  FOR ALL
  TO authenticated
  USING (TRUE);

-- RLS para aluno_blocos_progresso
ALTER TABLE aluno_blocos_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alunos podem ver próprio progresso"
  ON aluno_blocos_progresso
  FOR SELECT
  TO authenticated
  USING (auth.uid() = aluno_id);

CREATE POLICY "Sistema pode atualizar progresso"
  ON aluno_blocos_progresso
  FOR ALL
  TO authenticated
  USING (TRUE);

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION add_pontos_aluno IS 'Adiciona pontos ao aluno após completar um bloco/quiz';
COMMENT ON TABLE aluno_pontos IS 'Armazena o total de pontos de cada aluno';
COMMENT ON TABLE aluno_blocos_progresso IS 'Registra o progresso do aluno em cada bloco';

-- =====================================================
-- FIM
-- =====================================================


