-- ============================================
-- FIX: RLS para Banco de Perguntas
-- Permitir que admins autenticados gerenciem perguntas
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Banco perguntas: público pode ler" ON banco_perguntas;
DROP POLICY IF EXISTS "Banco perguntas: admin pode gerenciar" ON banco_perguntas;

-- Criar políticas corretas
CREATE POLICY "Banco perguntas: admin pode ler" 
ON banco_perguntas FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Banco perguntas: admin pode inserir" 
ON banco_perguntas FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Banco perguntas: admin pode atualizar" 
ON banco_perguntas FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Banco perguntas: admin pode deletar" 
ON banco_perguntas FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Fix para as outras tabelas também
DROP POLICY IF EXISTS "Mascote níveis: todos podem ler" ON mascote_niveis;
CREATE POLICY "Mascote níveis: public read" 
ON mascote_niveis FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Aluno mascote: ver próprio" ON aluno_mascote;
CREATE POLICY "Aluno mascote: read all authenticated" 
ON aluno_mascote FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Aluno mascote: insert authenticated" 
ON aluno_mascote FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Aluno mascote: update authenticated" 
ON aluno_mascote FOR UPDATE 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Game templates: todos podem ler ativos" ON game_templates;
CREATE POLICY "Game templates: public read active" 
ON game_templates FOR SELECT 
USING (ativo = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Game templates: admin manage" 
ON game_templates FOR ALL 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Game assets: todos podem ler" ON game_assets;
CREATE POLICY "Game assets: public read" 
ON game_assets FOR SELECT 
USING (true);

CREATE POLICY "Game assets: admin manage" 
ON game_assets FOR ALL 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Games: ler publicados" ON games;
DROP POLICY IF EXISTS "Games: admin pode gerenciar" ON games;
CREATE POLICY "Games: read published or admin" 
ON games FOR SELECT 
USING (publicado = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Games: admin manage" 
ON games FOR ALL 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Game sessions: ver próprias" ON game_sessions;
CREATE POLICY "Game sessions: read own or admin" 
ON game_sessions FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Game sessions: insert authenticated" 
ON game_sessions FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Game sessions: update authenticated" 
ON game_sessions FOR UPDATE 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Aluno moedas: ver próprias" ON aluno_moedas;
CREATE POLICY "Aluno moedas: read authenticated" 
ON aluno_moedas FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Aluno moedas: insert authenticated" 
ON aluno_moedas FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Aluno moedas: update authenticated" 
ON aluno_moedas FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Permitir leitura pública de aulas_jogos
ALTER TABLE aulas_jogos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aulas jogos: public read" 
ON aulas_jogos FOR SELECT 
USING (true);

CREATE POLICY "Aulas jogos: admin manage" 
ON aulas_jogos FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Permitir leitura de progresso de perguntas
CREATE POLICY "Aluno progresso: read authenticated" 
ON aluno_progresso_perguntas FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Aluno progresso: insert authenticated" 
ON aluno_progresso_perguntas FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Aluno progresso: update authenticated" 
ON aluno_progresso_perguntas FOR UPDATE 
USING (auth.uid() IS NOT NULL);

COMMENT ON POLICY "Banco perguntas: admin pode ler" ON banco_perguntas IS 'Permite que usuários autenticados (admin) leiam perguntas';

