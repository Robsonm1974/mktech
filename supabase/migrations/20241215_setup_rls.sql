-- MKTECH RLS (Row Level Security) Setup
-- Migration: 20241215_setup_rls.sql

-- Habilitar RLS em todas as tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para obter tenant_id do usuário atual
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para verificar se é admin do tenant
CREATE OR REPLACE FUNCTION is_tenant_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin' 
    FROM users 
    WHERE id = auth.uid()
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

-- Políticas para users
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view tenant users" ON users
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage tenant users" ON users
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    is_tenant_admin()
  );

-- Políticas para students
CREATE POLICY "Students are viewable by tenant users" ON students
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );

CREATE POLICY "Teachers can manage students" ON students
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    (
      SELECT role IN ('teacher', 'admin') 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Políticas para classes
CREATE POLICY "Classes are viewable by tenant users" ON classes
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );

CREATE POLICY "Teachers can manage classes" ON classes
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    (
      SELECT role IN ('teacher', 'admin') 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Políticas para collections
CREATE POLICY "Collections are viewable by tenant users" ON collections
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );

CREATE POLICY "Teachers can manage collections" ON collections
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    (
      SELECT role IN ('teacher', 'admin') 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Políticas para lessons
CREATE POLICY "Lessons are viewable by tenant users" ON lessons
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );

CREATE POLICY "Teachers can manage lessons" ON lessons
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    (
      SELECT role IN ('teacher', 'admin') 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Políticas para blocks
CREATE POLICY "Blocks are viewable by tenant users" ON blocks
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );

CREATE POLICY "Teachers can manage blocks" ON blocks
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    (
      SELECT role IN ('teacher', 'admin') 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Políticas para quizzes
CREATE POLICY "Quizzes are viewable by tenant users" ON quizzes
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );

CREATE POLICY "Teachers can manage quizzes" ON quizzes
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    (
      SELECT role IN ('teacher', 'admin') 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Políticas para questions
CREATE POLICY "Questions are viewable by tenant users" ON questions
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );

CREATE POLICY "Teachers can manage questions" ON questions
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    (
      SELECT role IN ('teacher', 'admin') 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Políticas para options
CREATE POLICY "Options are viewable by tenant users" ON options
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );

CREATE POLICY "Teachers can manage options" ON options
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    (
      SELECT role IN ('teacher', 'admin') 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Políticas para sessions
CREATE POLICY "Sessions are viewable by tenant users" ON sessions
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );

CREATE POLICY "Teachers can manage sessions" ON sessions
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    (
      SELECT role IN ('teacher', 'admin') 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Políticas para answers
CREATE POLICY "Students can view own answers" ON answers
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    (
      student_id IN (
        SELECT id FROM students WHERE tenant_id = get_user_tenant_id()
      ) OR
      tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "Students can create answers" ON answers
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    student_id IN (
      SELECT id FROM students WHERE tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "Teachers can view all answers" ON answers
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    (
      SELECT role IN ('teacher', 'admin') 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Políticas para scores
CREATE POLICY "Students can view own scores" ON scores
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    (
      student_id IN (
        SELECT id FROM students WHERE tenant_id = get_user_tenant_id()
      ) OR
      tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "Teachers can view all scores" ON scores
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    (
      SELECT role IN ('teacher', 'admin') 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can create scores" ON scores
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );

-- Políticas para enrollments
CREATE POLICY "Enrollments are viewable by tenant users" ON enrollments
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );

CREATE POLICY "Teachers can manage enrollments" ON enrollments
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    (
      SELECT role IN ('teacher', 'admin') 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Políticas para subscriptions
CREATE POLICY "Subscriptions are viewable by tenant admins" ON subscriptions
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    is_tenant_admin()
  );

CREATE POLICY "Admins can manage subscriptions" ON subscriptions
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    is_tenant_admin()
  );

-- Políticas para invoices
CREATE POLICY "Invoices are viewable by tenant admins" ON invoices
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    is_tenant_admin()
  );

CREATE POLICY "Admins can manage invoices" ON invoices
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    is_tenant_admin()
  );

-- Políticas para audit_logs
CREATE POLICY "Audit logs are viewable by tenant admins" ON audit_logs
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id() AND 
    is_tenant_admin()
  );

CREATE POLICY "System can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    tenant_id = get_user_tenant_id()
  );
