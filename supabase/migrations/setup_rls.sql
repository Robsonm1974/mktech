-- MKTECH RLS (Row Level Security) Setup
-- Migration: 20241215_setup_rls.sql

-- Habilitar RLS em todas as tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE trilhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE h5p_xapi_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE h5p_contents ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para obter tenant_id do usuário atual
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM users 
    WHERE auth_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para verificar se é admin do tenant
CREATE OR REPLACE FUNCTION is_tenant_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin_escola' 
    FROM users 
    WHERE auth_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para verificar se é professor
CREATE OR REPLACE FUNCTION is_professor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'professor' 
    FROM users 
    WHERE auth_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para verificar se é admin MKTECH
CREATE OR REPLACE FUNCTION is_mktech_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin_mktech', 'superadmin') 
    FROM users 
    WHERE auth_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para tenants
CREATE POLICY "Tenants are viewable by authenticated users" ON tenants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Tenants can be managed by admins" ON tenants
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    id = get_user_tenant_id() AND 
    is_tenant_admin()
  );

-- Admin MKTECH vê todos os tenants
CREATE POLICY "MKTECH admin sees all tenants" ON tenants
  FOR ALL USING (is_mktech_admin());

-- Políticas para users
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "Users can view tenant users" ON users
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth_id = auth.uid());

CREATE POLICY "Admins can manage tenant users" ON users
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    is_tenant_admin()
  );

-- Admin MKTECH vê todos os users
CREATE POLICY "MKTECH admin sees all users" ON users
  FOR ALL USING (is_mktech_admin());

-- Políticas para turmas
CREATE POLICY "Turmas are viewable by tenant users" ON turmas
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );

CREATE POLICY "Teachers can manage their turmas" ON turmas
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    (
      professor_id = (SELECT id FROM users WHERE auth_id = auth.uid()) OR
      is_tenant_admin()
    )
  );

-- Políticas para alunos
CREATE POLICY "Alunos are viewable by tenant users" ON alunos
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );

CREATE POLICY "Teachers can manage alunos in their turmas" ON alunos
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    (
      turma_id IN (
        SELECT id FROM turmas 
        WHERE professor_id = (SELECT id FROM users WHERE auth_id = auth.uid())
      ) OR
      is_tenant_admin()
    )
  );

-- Políticas para trilhas (globais, mas com controle de acesso)
CREATE POLICY "Trilhas are viewable by authenticated users" ON trilhas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only MKTECH admins can manage trilhas" ON trilhas
  FOR ALL USING (is_mktech_admin());

-- Políticas para aulas
CREATE POLICY "Aulas are viewable by authenticated users" ON aulas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only MKTECH admins can manage aulas" ON aulas
  FOR ALL USING (is_mktech_admin());

-- Políticas para blocos
CREATE POLICY "Blocos are viewable by authenticated users" ON blocos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only MKTECH admins can manage blocos" ON blocos
  FOR ALL USING (is_mktech_admin());

-- Políticas para quizzes
CREATE POLICY "Quizzes are viewable by authenticated users" ON quizzes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only MKTECH admins can manage quizzes" ON quizzes
  FOR ALL USING (is_mktech_admin());

-- Políticas para sessions
CREATE POLICY "Sessions are viewable by tenant users" ON sessions
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );

CREATE POLICY "Teachers can manage their sessions" ON sessions
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    (
      professor_id = (SELECT id FROM users WHERE auth_id = auth.uid()) OR
      is_tenant_admin()
    )
  );

-- Políticas para quiz_responses
CREATE POLICY "Students can view own quiz_responses" ON quiz_responses
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    aluno_id IN (
      SELECT id FROM alunos WHERE tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "Students can create quiz_responses" ON quiz_responses
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    aluno_id IN (
      SELECT id FROM alunos WHERE tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "Teachers can view all quiz_responses in their sessions" ON quiz_responses
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    session_id IN (
      SELECT id FROM sessions 
      WHERE tenant_id = get_user_tenant_id() AND
      (
        professor_id = (SELECT id FROM users WHERE auth_id = auth.uid()) OR
        is_tenant_admin()
      )
    )
  );

-- Políticas para game_scores
CREATE POLICY "Students can view own game_scores" ON game_scores
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    aluno_id IN (
      SELECT id FROM alunos WHERE tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "Students can create game_scores" ON game_scores
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    aluno_id IN (
      SELECT id FROM alunos WHERE tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "Teachers can view all game_scores in their sessions" ON game_scores
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    session_id IN (
      SELECT id FROM sessions 
      WHERE tenant_id = get_user_tenant_id() AND
      (
        professor_id = (SELECT id FROM users WHERE auth_id = auth.uid()) OR
        is_tenant_admin()
      )
    )
  );

-- Políticas para h5p_xapi_events
CREATE POLICY "Students can view own h5p_xapi_events" ON h5p_xapi_events
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    aluno_id IN (
      SELECT id FROM alunos WHERE tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "Students can create h5p_xapi_events" ON h5p_xapi_events
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    aluno_id IN (
      SELECT id FROM alunos WHERE tenant_id = get_user_tenant_id()
    )
  );

-- Políticas para user_progress
CREATE POLICY "Students can view own user_progress" ON user_progress
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    aluno_id IN (
      SELECT id FROM alunos WHERE tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "Students can update own user_progress" ON user_progress
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    aluno_id IN (
      SELECT id FROM alunos WHERE tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "System can create user_progress" ON user_progress
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    aluno_id IN (
      SELECT id FROM alunos WHERE tenant_id = get_user_tenant_id()
    )
  );

-- Políticas para badges (globais)
CREATE POLICY "Badges are viewable by authenticated users" ON badges
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only MKTECH admins can manage badges" ON badges
  FOR ALL USING (is_mktech_admin());

-- Políticas para session_logs
CREATE POLICY "Session logs are viewable by tenant admins" ON session_logs
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    is_tenant_admin()
  );

CREATE POLICY "System can create session logs" ON session_logs
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );

-- Políticas para h5p_contents (globais)
CREATE POLICY "H5P contents are viewable by authenticated users" ON h5p_contents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only MKTECH admins can manage h5p_contents" ON h5p_contents
  FOR ALL USING (is_mktech_admin());