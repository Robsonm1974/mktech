-- MKTECH - Recriar todas as tabelas SEM RLS
-- Para desenvolvimento/debug

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANTS
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  email_admin VARCHAR(255),
  phone VARCHAR(20),
  plan_type VARCHAR(50) DEFAULT 'starter',
  seats_total INTEGER DEFAULT 30,
  seats_used INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  trial_ends_at TIMESTAMP,
  billing_cycle_start DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. USERS (já existe, mas vamos garantir permissões)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE users TO postgres, authenticated, anon, service_role;

-- 3. GARANTIR PERMISSÕES NO TENANTS
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE tenants TO postgres, authenticated, anon, service_role;

-- 4. Inserir tenant de teste (se não existir)
INSERT INTO tenants (id, name, slug, email_admin, phone, plan_type, seats_total, status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Escola Piloto',
  'escola-piloto',
  'admin@escolapiloto.com.br',
  '+55 11 99999-9999',
  'starter',
  50,
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- 5. TURMAS
CREATE TABLE IF NOT EXISTS turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  grade_level VARCHAR(20) NOT NULL,
  professor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  descricao TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE turmas DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE turmas TO postgres, authenticated, anon, service_role;

-- 6. ALUNOS
CREATE TABLE IF NOT EXISTS alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  pin_code VARCHAR(6) NOT NULL,
  icone_afinidade VARCHAR(50) DEFAULT 'default',
  email_pais VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE alunos DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE alunos TO postgres, authenticated, anon, service_role;

-- 7. TRILHAS
CREATE TABLE IF NOT EXISTS trilhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  grade_level VARCHAR(20) NOT NULL,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE trilhas DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE trilhas TO postgres, authenticated, anon, service_role;

-- 8. AULAS
CREATE TABLE IF NOT EXISTS aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_id UUID NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE aulas DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE aulas TO postgres, authenticated, anon, service_role;

-- 9. BLOCOS
CREATE TABLE IF NOT EXISTS blocos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  numero_sequencia INTEGER NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  duracao_minutos INTEGER DEFAULT 5,
  pontos_por_bloco INTEGER DEFAULT 10,
  url_content TEXT,
  content_json JSONB,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE blocos DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE blocos TO postgres, authenticated, anon, service_role;

-- 10. QUIZZES
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bloco_id UUID NOT NULL REFERENCES blocos(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'mcq',
  perguntas JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE quizzes DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE quizzes TO postgres, authenticated, anon, service_role;

-- 11. SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  session_code VARCHAR(10) UNIQUE NOT NULL,
  qr_code_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  iniciada_em TIMESTAMP DEFAULT now(),
  finalizada_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE sessions TO postgres, authenticated, anon, service_role;

-- 12. QUIZ_RESPONSES
CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  resposta JSONB NOT NULL,
  correto BOOLEAN NOT NULL,
  pontos_ganhos INTEGER DEFAULT 0,
  criada_em TIMESTAMP DEFAULT now()
);

ALTER TABLE quiz_responses DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE quiz_responses TO postgres, authenticated, anon, service_role;

-- 13. GAME_SCORES
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  bloco_id UUID NOT NULL REFERENCES blocos(id) ON DELETE CASCADE,
  pontos INTEGER NOT NULL,
  tempo_segundos INTEGER,
  criada_em TIMESTAMP DEFAULT now()
);

ALTER TABLE game_scores DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE game_scores TO postgres, authenticated, anon, service_role;

-- 14. USER_PROGRESS
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL UNIQUE REFERENCES alunos(id) ON DELETE CASCADE,
  pontos_totais INTEGER DEFAULT 0,
  aulas_completadas INTEGER DEFAULT 0,
  badges_conquistadas TEXT[] DEFAULT '{}',
  ultima_aula_id UUID REFERENCES aulas(id),
  ultima_aula_data TIMESTAMP,
  atualizada_em TIMESTAMP DEFAULT now()
);

ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE user_progress TO postgres, authenticated, anon, service_role;

-- 15. BADGES
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  icon_url TEXT,
  criterio VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE badges TO postgres, authenticated, anon, service_role;

-- 16. H5P_XAPI_EVENTS
CREATE TABLE IF NOT EXISTS h5p_xapi_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  bloco_id UUID NOT NULL REFERENCES blocos(id) ON DELETE CASCADE,
  xapi_statement JSONB NOT NULL,
  criada_em TIMESTAMP DEFAULT now()
);

ALTER TABLE h5p_xapi_events DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE h5p_xapi_events TO postgres, authenticated, anon, service_role;

-- 17. SESSION_LOGS
CREATE TABLE IF NOT EXISTS session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  log_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE session_logs DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE session_logs TO postgres, authenticated, anon, service_role;

-- 18. H5P_CONTENTS
CREATE TABLE IF NOT EXISTS h5p_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bloco_id UUID NOT NULL REFERENCES blocos(id) ON DELETE CASCADE,
  h5p_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE h5p_contents DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE h5p_contents TO postgres, authenticated, anon, service_role;

-- Verificar todas as tabelas
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;


