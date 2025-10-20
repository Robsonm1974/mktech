-- ============================================================================
-- CRIAR/ATUALIZAR TABELA ALUNOS - Sistema Completo
-- Data: 2025-10-20
-- Descrição: Estrutura completa para gerenciamento de alunos
-- ============================================================================

-- 1. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL,
  
  -- Dados Pessoais
  full_name VARCHAR(255) NOT NULL,
  data_nascimento DATE,
  numero_matricula VARCHAR(50),
  
  -- Acesso Rápido (Ícone + PIN)
  icone_afinidade VARCHAR(50) DEFAULT 'dog',
  pin_code VARCHAR(4) NOT NULL,
  
  -- Foto de Perfil (opcional)
  foto_url VARCHAR(512),
  
  -- Contato Responsável
  email_responsavel VARCHAR(255),
  nome_responsavel VARCHAR(255),
  telefone_responsavel VARCHAR(20),
  
  -- Gamificação
  pontos_totais INTEGER DEFAULT 0,
  badges_conquistados JSONB DEFAULT '[]'::jsonb,
  nivel INTEGER DEFAULT 1,
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Adicionar colunas que podem não existir
DO $$
BEGIN
  -- data_nascimento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'alunos' AND column_name = 'data_nascimento'
  ) THEN
    ALTER TABLE alunos ADD COLUMN data_nascimento DATE;
  END IF;

  -- numero_matricula
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'alunos' AND column_name = 'numero_matricula'
  ) THEN
    ALTER TABLE alunos ADD COLUMN numero_matricula VARCHAR(50);
  END IF;

  -- foto_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'alunos' AND column_name = 'foto_url'
  ) THEN
    ALTER TABLE alunos ADD COLUMN foto_url VARCHAR(512);
  END IF;

  -- email_responsavel
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'alunos' AND column_name = 'email_responsavel'
  ) THEN
    ALTER TABLE alunos ADD COLUMN email_responsavel VARCHAR(255);
  END IF;

  -- nome_responsavel
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'alunos' AND column_name = 'nome_responsavel'
  ) THEN
    ALTER TABLE alunos ADD COLUMN nome_responsavel VARCHAR(255);
  END IF;

  -- telefone_responsavel
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'alunos' AND column_name = 'telefone_responsavel'
  ) THEN
    ALTER TABLE alunos ADD COLUMN telefone_responsavel VARCHAR(20);
  END IF;

  -- pontos_totais
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'alunos' AND column_name = 'pontos_totais'
  ) THEN
    ALTER TABLE alunos ADD COLUMN pontos_totais INTEGER DEFAULT 0;
  END IF;

  -- badges_conquistados
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'alunos' AND column_name = 'badges_conquistados'
  ) THEN
    ALTER TABLE alunos ADD COLUMN badges_conquistados JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- nivel
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'alunos' AND column_name = 'nivel'
  ) THEN
    ALTER TABLE alunos ADD COLUMN nivel INTEGER DEFAULT 1;
  END IF;

  RAISE NOTICE '✅ Colunas verificadas/adicionadas';
END $$;

-- 3. Criar/Atualizar indexes
CREATE INDEX IF NOT EXISTS idx_alunos_tenant ON alunos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alunos_turma ON alunos(turma_id);
CREATE INDEX IF NOT EXISTS idx_alunos_pin ON alunos(pin_code);
CREATE INDEX IF NOT EXISTS idx_alunos_active ON alunos(active);
CREATE INDEX IF NOT EXISTS idx_alunos_matricula ON alunos(numero_matricula) WHERE numero_matricula IS NOT NULL;

-- 4. Criar constraint para PIN único por tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_pin_per_tenant'
  ) THEN
    ALTER TABLE alunos 
    ADD CONSTRAINT unique_pin_per_tenant 
    UNIQUE (tenant_id, pin_code);
  END IF;
END $$;

-- 5. Criar constraint para matrícula única por tenant (se tiver matrícula)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_matricula_per_tenant'
  ) THEN
    ALTER TABLE alunos 
    ADD CONSTRAINT unique_matricula_per_tenant 
    UNIQUE (tenant_id, numero_matricula);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Ignora se já existir
END $$;

-- 6. Desabilitar RLS (desenvolvimento)
ALTER TABLE alunos DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE alunos TO postgres, authenticated, anon, service_role;

-- 7. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_alunos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_alunos_updated_at ON alunos;
CREATE TRIGGER trigger_alunos_updated_at
  BEFORE UPDATE ON alunos
  FOR EACH ROW
  EXECUTE FUNCTION update_alunos_updated_at();

-- 8. Verificação final
DO $$
DECLARE
  v_total_alunos INTEGER;
  v_total_colunas INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_alunos FROM alunos;
  SELECT COUNT(*) INTO v_total_colunas 
  FROM information_schema.columns 
  WHERE table_name = 'alunos';
  
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ TABELA ALUNOS - Estrutura Completa';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 ESTATÍSTICAS:';
  RAISE NOTICE '   • Total de colunas: %', v_total_colunas;
  RAISE NOTICE '   • Alunos cadastrados: %', v_total_alunos;
  RAISE NOTICE '';
  RAISE NOTICE '🔧 RECURSOS:';
  RAISE NOTICE '   • Indexes criados: 5';
  RAISE NOTICE '   • Constraints: PIN único, Matrícula única';
  RAISE NOTICE '   • Trigger: updated_at automático';
  RAISE NOTICE '   • RLS: Desabilitado (dev)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Pronto para implementar RPCs!';
  RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;

