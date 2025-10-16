-- ============================================================================
-- MKTECH - Complete Schema Migration
-- Versão: 1.0
-- Data: Outubro 2025
-- Descrição: Schema completo conforme mktech_project_rules.md
-- ============================================================================

-- DROP existing tables if needed (já foram recriadas sem RLS)
-- Vamos adicionar apenas as tabelas que faltam

-- ============================================================================
-- TRILHAS (Learning Paths)
-- ============================================================================
CREATE TABLE IF NOT EXISTS trilhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  descricao TEXT,
  disciplinas TEXT[],  -- ex.: ["Programação", "Lógica"]
  grade_levels TEXT[],  -- ex.: ["EF2-5", "EF2-6"]
  sequencia INTEGER DEFAULT 1,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- AULAS (Classes/Lessons)
-- ============================================================================
CREATE TABLE IF NOT EXISTS aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_id UUID NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  numero_sequencia INTEGER,
  duracao_minutos INTEGER DEFAULT 30,
  objetivos_aprendizado TEXT,
  disciplinas TEXT[],  -- ex.: ["Lógica", "Programação"]
  grade_level VARCHAR(20),
  pontos_totais INTEGER DEFAULT 0,
  badges_desbloqueaveis JSONB,  -- [ { id, titulo, icone, condicao } ]
  publicada BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- BLOCOS (Content Blocks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS blocos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  numero_sequencia INTEGER NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL,  -- video, apresentacao, animacao_lottie
  descricao TEXT,
  duracao_minutos INTEGER DEFAULT 5,
  conteudo_url VARCHAR(512),  -- path to video, lottie JSON, etc.
  pontos_por_bloco INTEGER DEFAULT 0,
  quiz_id UUID,  -- ref to quiz (will add after creating quizzes table)
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- QUIZZES
-- ============================================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bloco_id UUID NOT NULL REFERENCES blocos(id) ON DELETE CASCADE,
  titulo VARCHAR(255),
  tipo VARCHAR(50) NOT NULL,  -- mcq, verdadeiro_falso, phaser_game, h5p_interativo
  descricao TEXT,
  perguntas JSONB,  -- estrutura varia por tipo
  tentativas_permitidas INTEGER DEFAULT 2,
  tempo_limite_seg INTEGER DEFAULT 300,
  pontos_max INTEGER DEFAULT 10,
  hints JSONB,  -- future: array de hints
  phaser_level_json JSONB,  -- se tipo = phaser_game
  h5p_content_id VARCHAR(100),  -- se tipo = h5p_interativo
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- SESSIONS (Instâncias de Aula)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_code VARCHAR(20) UNIQUE,  -- ex.: AB-94
  session_qr_data JSONB,  -- QR payload (ex.: { sessionId, aula_id, turma_id })
  bloco_ativo_numero INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'active',  -- active, paused, completed
  data_inicio TIMESTAMP DEFAULT now(),
  data_fim TIMESTAMP,
  alunos_participantes INTEGER DEFAULT 0,
  criada_em TIMESTAMP DEFAULT now(),
  atualizada_em TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- QUIZ RESPONSES (Respostas de Quiz)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  pergunta_id VARCHAR(100),  -- ex.: "q1"
  resposta_selecionada VARCHAR(500),
  correta BOOLEAN,
  pontos_ganhos INTEGER DEFAULT 0,
  tempo_resposta_seg INTEGER,
  tentativa_numero INTEGER DEFAULT 1,
  criada_em TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- GAME SCORES (Pontuação Phaser Games)
-- ============================================================================
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  moedas_coletadas INTEGER DEFAULT 0,
  acertos INTEGER DEFAULT 0,
  tempo_total_seg INTEGER DEFAULT 0,
  pontos_finais INTEGER DEFAULT 0,
  criada_em TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- xAPI EVENTS (H5P Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS h5p_xapi_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  event_type VARCHAR(100),  -- answered, completed, interacted
  event_data JSONB,  -- { score, maxScore, time, ... }
  timestamp TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- USER PROGRESS (Agregação)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  pontos_totais INTEGER DEFAULT 0,
  badges_conquistadas JSONB,  -- [ { id, titulo, data_conquista } ]
  ultima_aula_id UUID REFERENCES aulas(id),
  ultima_aula_data TIMESTAMP,
  aulas_completadas INTEGER DEFAULT 0,
  atualizada_em TIMESTAMP DEFAULT now(),
  UNIQUE(aluno_id)
);

-- ============================================================================
-- BADGES (Recompensas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50),  -- marco, disciplina, serie
  condicao_tipo VARCHAR(50),  -- x_aulas_completadas, x_acertos_100, etc.
  condicao_valor INTEGER,  -- ex.: 5 (para 5 aulas)
  icon_url VARCHAR(512),
  criada_em TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- SESSION LOGS (Auditoria básica)
-- ============================================================================
CREATE TABLE IF NOT EXISTS session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  action VARCHAR(100),  -- session_started, session_ended, quiz_completed, etc.
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  aluno_id UUID REFERENCES alunos(id) ON DELETE SET NULL,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- H5P CONTENTS (Self-hosted)
-- ============================================================================
CREATE TABLE IF NOT EXISTS h5p_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255),
  library VARCHAR(100),  -- ex.: H5P.MultiChoice
  json_data JSONB,  -- conteúdo H5P
  max_score INTEGER DEFAULT 10,
  storage_path VARCHAR(512),  -- path em Supabase Storage
  criada_em TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- INDEXES (Performance optimization)
-- ============================================================================

-- Trilhas
CREATE INDEX IF NOT EXISTS idx_trilhas_ativa ON trilhas(ativa);

-- Aulas
CREATE INDEX IF NOT EXISTS idx_aulas_trilha ON aulas(trilha_id);
CREATE INDEX IF NOT EXISTS idx_aulas_publicada ON aulas(publicada);

-- Blocos
CREATE INDEX IF NOT EXISTS idx_blocos_aula ON blocos(aula_id);
CREATE INDEX IF NOT EXISTS idx_blocos_sequencia ON blocos(aula_id, numero_sequencia);

-- Quizzes
CREATE INDEX IF NOT EXISTS idx_quizzes_bloco ON quizzes(bloco_id);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_turma ON sessions(turma_id);
CREATE INDEX IF NOT EXISTS idx_sessions_professor ON sessions(professor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(session_code);

-- Quiz Responses
CREATE INDEX IF NOT EXISTS idx_quiz_responses_session ON quiz_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_aluno ON quiz_responses(aluno_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_quiz ON quiz_responses(quiz_id);

-- User Progress
CREATE INDEX IF NOT EXISTS idx_user_progress_aluno ON user_progress(aluno_id);

-- Session Logs
CREATE INDEX IF NOT EXISTS idx_session_logs_tenant ON session_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_timestamp ON session_logs(timestamp DESC);

-- ============================================================================
-- UPDATED_AT TRIGGERS (Auto-update timestamps)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_trilhas_updated_at BEFORE UPDATE ON trilhas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aulas_updated_at BEFORE UPDATE ON aulas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocos_updated_at BEFORE UPDATE ON blocos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_atualizada_em BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE trilhas IS 'Learning paths that group related lessons';
COMMENT ON TABLE aulas IS 'Individual lessons within a learning path';
COMMENT ON TABLE blocos IS 'Content blocks (video, presentation, animation, game)';
COMMENT ON TABLE quizzes IS 'Assessments attached to blocks';
COMMENT ON TABLE sessions IS 'Live classroom sessions led by professors';
COMMENT ON TABLE quiz_responses IS 'Student answers to quiz questions';
COMMENT ON TABLE game_scores IS 'Scores from Phaser games';
COMMENT ON TABLE h5p_xapi_events IS 'xAPI events from H5P interactions';
COMMENT ON TABLE user_progress IS 'Aggregated student progress (points, badges, completion)';
COMMENT ON TABLE badges IS 'Master list of available badges';
COMMENT ON TABLE session_logs IS 'Audit log of session events';
COMMENT ON TABLE h5p_contents IS 'Self-hosted H5P content library';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ MKTECH Complete Schema created successfully!';
  RAISE NOTICE '📋 Tables created: trilhas, aulas, blocos, quizzes, sessions, quiz_responses, game_scores, h5p_xapi_events, user_progress, badges, session_logs, h5p_contents';
  RAISE NOTICE '🔍 Indexes created for performance optimization';
  RAISE NOTICE '⏰ Auto-update triggers configured';
  RAISE NOTICE '📝 Next step: Run seed data script';
END $$;


