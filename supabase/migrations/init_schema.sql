-- MKTECH Schema Initial - Baseado no mktech_project_rules.md
-- Migration: 20241215_init_schema.sql

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants (Escolas)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  email_admin VARCHAR(255),
  phone VARCHAR(20),
  plan_type VARCHAR(50) DEFAULT 'starter',  -- starter, pro, enterprise
  seats_total INTEGER DEFAULT 30,
  seats_used INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',  -- active, trial, suspended, cancelled
  trial_ends_at TIMESTAMP,
  billing_cycle_start DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Users (Professores, Admins Escola)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL,  -- admin_escola, professor, admin_mktech, superadmin
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(tenant_id, email)
);

-- Turmas (Classes)
CREATE TABLE turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,  -- ex.: "5º Ano A"
  grade_level VARCHAR(20) NOT NULL,  -- EF1-3, EF1-4, EF2-5, etc.
  professor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  descricao TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Alunos (Students)
CREATE TABLE alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email_pais VARCHAR(255),  -- email do responsável
  numero_matricula VARCHAR(50),
  data_nascimento DATE,
  sexo VARCHAR(10),
  icone_afinidade VARCHAR(50),  -- dog, cat, fruit, flower
  pin_code VARCHAR(4),  -- 4 dígitos, hash em produção
  ativo BOOLEAN DEFAULT true,
  auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- opcional, para login próprio
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Trilhas (Learning Paths)
CREATE TABLE trilhas (
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

-- Aulas (Classes/Lessons)
CREATE TABLE aulas (
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

-- Blocos (Content Blocks)
CREATE TABLE blocos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  numero_sequencia INTEGER NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL,  -- video, apresentacao, animacao_lottie
  descricao TEXT,
  duracao_minutos INTEGER DEFAULT 5,
  conteudo_url VARCHAR(512),  -- path to video, lottie JSON, etc.
  pontos_por_bloco INTEGER DEFAULT 0,
  quiz_id UUID,  -- ref to quiz (will add later)
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Quizzes
CREATE TABLE quizzes (
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

-- Sessions (Instâncias de Aula)
CREATE TABLE sessions (
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

-- Quiz Responses (Respostas de Quiz)
CREATE TABLE quiz_responses (
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

-- Game Scores (Pontuação Phaser Games)
CREATE TABLE game_scores (
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

-- xAPI Events (H5P Tracking)
CREATE TABLE h5p_xapi_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  event_type VARCHAR(100),  -- answered, completed, interacted
  event_data JSONB,  -- { score, maxScore, time, ... }
  timestamp TIMESTAMP DEFAULT now()
);

-- User Progress (Agregação)
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  pontos_totais INTEGER DEFAULT 0,
  badges_conquistadas JSONB,  -- [ { id, titulo, data_conquista } ]
  ultima_aula_id UUID REFERENCES aulas(id),
  ultima_aula_data TIMESTAMP,
  aulas_completadas INTEGER DEFAULT 0,
  atualizada_em TIMESTAMP DEFAULT now()
);

-- Badges (Recompensas)
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50),  -- marco, disciplina, serie
  condicao_tipo VARCHAR(50),  -- x_aulas_completadas, x_acertos_100, etc.
  condicao_valor INTEGER,  -- ex.: 5 (para 5 aulas)
  icon_url VARCHAR(512),
  criada_em TIMESTAMP DEFAULT now()
);

-- Session Logs (Auditoria básica)
CREATE TABLE session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  action VARCHAR(100),  -- session_started, session_ended, quiz_completed, etc.
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  aluno_id UUID REFERENCES alunos(id) ON DELETE SET NULL,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT now()
);

-- H5P Contents (Self-hosted)
CREATE TABLE h5p_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255),
  library VARCHAR(100),  -- ex.: H5P.MultiChoice
  json_data JSONB,  -- conteúdo H5P
  max_score INTEGER DEFAULT 10,
  storage_path VARCHAR(512),  -- path em Supabase Storage
  criada_em TIMESTAMP DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_turmas_tenant ON turmas(tenant_id);
CREATE INDEX idx_turmas_professor ON turmas(professor_id);
CREATE INDEX idx_alunos_tenant ON alunos(tenant_id);
CREATE INDEX idx_alunos_turma ON alunos(turma_id);
CREATE INDEX idx_aulas_trilha ON aulas(trilha_id);
CREATE INDEX idx_blocos_aula ON blocos(aula_id);
CREATE INDEX idx_quizzes_bloco ON quizzes(bloco_id);
CREATE INDEX idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX idx_sessions_code ON sessions(session_code);
CREATE INDEX idx_sessions_turma ON sessions(turma_id);
CREATE INDEX idx_quiz_responses_session ON quiz_responses(session_id);
CREATE INDEX idx_quiz_responses_aluno ON quiz_responses(aluno_id);
CREATE INDEX idx_game_scores_session ON game_scores(session_id);
CREATE INDEX idx_game_scores_aluno ON game_scores(aluno_id);
CREATE INDEX idx_user_progress_aluno ON user_progress(aluno_id);
CREATE INDEX idx_session_logs_tenant ON session_logs(tenant_id);
CREATE INDEX idx_session_logs_session ON session_logs(session_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_turmas_updated_at BEFORE UPDATE ON turmas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alunos_updated_at BEFORE UPDATE ON alunos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aulas_updated_at BEFORE UPDATE ON aulas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blocos_updated_at BEFORE UPDATE ON blocos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_atualizada_em BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_atualizada_em BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();