-- ============================================================================
-- 🔥 NUCLEAR OPTION: FORCE FIX RLS
-- Este SQL vai REMOVER TODAS as políticas e DESABILITAR RLS
-- USE APENAS EM DESENVOLVIMENTO!!!
-- ============================================================================

-- PASSO 1: REMOVER TODAS AS POLÍTICAS EXISTENTES (não importa o nome)
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  -- Disciplinas
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'disciplinas' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON disciplinas', pol.policyname);
  END LOOP;
  
  -- Planejamentos
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'planejamentos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON planejamentos', pol.policyname);
  END LOOP;
  
  -- Blocos Templates
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'blocos_templates' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON blocos_templates', pol.policyname);
  END LOOP;
  
  -- Aulas Blocos
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'aulas_blocos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON aulas_blocos', pol.policyname);
  END LOOP;
  
  -- Config Global
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'config_global' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON config_global', pol.policyname);
  END LOOP;
  
  RAISE NOTICE '🗑️ Todas as políticas RLS removidas!';
END $$;

-- PASSO 2: DESABILITAR RLS em TODAS as tabelas admin
ALTER TABLE disciplinas DISABLE ROW LEVEL SECURITY;
ALTER TABLE planejamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE blocos_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE aulas_blocos DISABLE ROW LEVEL SECURITY;
ALTER TABLE config_global DISABLE ROW LEVEL SECURITY;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '🔥 RLS COMPLETAMENTE DESABILITADO!';
  RAISE NOTICE '⚠️ TODAS as tabelas admin estão agora SEM proteção RLS!';
  RAISE NOTICE '✅ Qualquer usuário autenticado pode acessar tudo!';
  RAISE NOTICE '🔒 ISTO É APENAS PARA DESENVOLVIMENTO - NÃO USE EM PRODUÇÃO!';
END $$;

