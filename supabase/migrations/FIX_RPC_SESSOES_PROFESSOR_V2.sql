-- ============================================================================
-- FIX V2: RPCs para Dashboard do Professor
-- ============================================================================
-- Data: 24/10/2024
-- Correção: Aceitar tanto UUID quanto TEXT para professor_id
-- ============================================================================

-- ============================================================================
-- 1. RPC: get_sessoes_professor (CORRIGIDO - aceita TEXT)
-- Retorna sessões recentes de um professor
-- ============================================================================

DROP FUNCTION IF EXISTS get_sessoes_professor(uuid);
DROP FUNCTION IF EXISTS get_sessoes_professor(text);

CREATE OR REPLACE FUNCTION get_sessoes_professor(p_professor_id text)
RETURNS TABLE (
  id uuid,
  session_code text,
  aula_titulo text,
  aula_id uuid,
  turma_nome text,
  turma_id uuid,
  status text,
  data_inicio timestamptz,
  data_fim timestamptz,
  total_alunos integer,
  bloco_ativo_numero integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE NOTICE '🔍 Buscando sessões para professor: %', p_professor_id;
  
  RETURN QUERY
  SELECT 
    s.id,
    s.session_code,
    au.titulo as aula_titulo,
    au.id as aula_id,
    t.name as turma_nome,
    t.id as turma_id,
    s.status::text,
    s.data_inicio,
    s.data_fim,
    COALESCE(
      (SELECT COUNT(*)::integer FROM participacoes_sessao WHERE session_id = s.id),
      0
    ) as total_alunos,
    s.bloco_ativo_numero
  FROM sessions s
  INNER JOIN turmas t ON t.id = s.turma_id
  INNER JOIN aulas au ON au.id = s.aula_id
  WHERE t.professor_id::text = p_professor_id
  ORDER BY s.data_inicio DESC
  LIMIT 20;
  
  RAISE NOTICE '✅ Sessões encontradas!';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro ao buscar sessões: %', SQLERRM;
    RETURN;
END;
$$;

-- ============================================================================
-- 2. RPC: get_estatisticas_professor (CORRIGIDO - aceita TEXT)
-- Retorna estatísticas gerais do professor
-- ============================================================================

DROP FUNCTION IF EXISTS get_estatisticas_professor(uuid);
DROP FUNCTION IF EXISTS get_estatisticas_professor(text);

CREATE OR REPLACE FUNCTION get_estatisticas_professor(p_professor_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  RAISE NOTICE '📊 Calculando estatísticas para professor: %', p_professor_id;
  
  SELECT json_build_object(
    'total_turmas', (
      SELECT COUNT(*)
      FROM turmas
      WHERE professor_id::text = p_professor_id
    ),
    'total_alunos', (
      SELECT COUNT(*)
      FROM alunos a
      INNER JOIN turmas t ON t.id = a.turma_id
      WHERE t.professor_id::text = p_professor_id
        AND a.active = true
    ),
    'sessoes_realizadas', (
      SELECT COUNT(*)
      FROM sessions s
      INNER JOIN turmas t ON t.id = s.turma_id
      WHERE t.professor_id::text = p_professor_id
        AND s.status = 'completed'
    ),
    'sessoes_ativas', (
      SELECT COUNT(*)
      FROM sessions s
      INNER JOIN turmas t ON t.id = s.turma_id
      WHERE t.professor_id::text = p_professor_id
        AND s.status = 'active'
    )
  ) INTO v_result;
  
  RAISE NOTICE '✅ Estatísticas: %', v_result;

  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro ao calcular estatísticas: %', SQLERRM;
    RETURN json_build_object(
      'total_turmas', 0,
      'total_alunos', 0,
      'sessoes_realizadas', 0,
      'sessoes_ativas', 0,
      'error', SQLERRM
    );
END;
$$;

-- ============================================================================
-- TESTES RÁPIDOS
-- ============================================================================

-- Teste 1: Ver qual é o professor_id do usuário atual
DO $$
DECLARE
  v_user_id text;
BEGIN
  SELECT auth.uid()::text INTO v_user_id;
  RAISE NOTICE '👤 User ID atual: %', v_user_id;
END $$;

-- Teste 2: Ver quantas turmas existem e seus professores
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM turmas;
  RAISE NOTICE '🏫 Total de turmas no sistema: %', v_count;
  
  IF v_count > 0 THEN
    RAISE NOTICE '📋 Lista de turmas e professores:';
    FOR v_count IN 
      SELECT t.name, t.professor_id::text
      FROM turmas t
      LIMIT 5
    LOOP
      RAISE NOTICE '  - Turma: % | Professor ID: %', v_count.name, v_count.professor_id;
    END LOOP;
  END IF;
END $$;

-- Teste 3: Ver quantas sessões existem
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM sessions;
  RAISE NOTICE '🎯 Total de sessões no sistema: %', v_count;
END $$;

RAISE NOTICE '======================================';
RAISE NOTICE '✅ RPCs V2 criados com sucesso!';
RAISE NOTICE '======================================';
RAISE NOTICE 'Agora teste chamando:';
RAISE NOTICE 'SELECT * FROM get_sessoes_professor(auth.uid()::text);';
RAISE NOTICE 'SELECT * FROM get_estatisticas_professor(auth.uid()::text);';
RAISE NOTICE '======================================';

