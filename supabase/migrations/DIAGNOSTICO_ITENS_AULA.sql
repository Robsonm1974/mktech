-- ============================================
-- DIAGNÓSTICO: Verificar RPCs e estrutura
-- ============================================

-- 1. Verificar se RPC existe
SELECT 
  proname AS "Nome da Função",
  pg_get_functiondef(oid) AS "Definição"
FROM pg_proc
WHERE proname = 'get_itens_aula_sessao';

-- 2. Verificar se tabela aulas_jogos existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'aulas_jogos'
) AS "aulas_jogos_existe";

-- 3. Listar todas as aulas
SELECT id, titulo, descricao FROM aulas LIMIT 5;

-- 4. Verificar blocos de cada aula
SELECT 
  a.titulo AS aula,
  COUNT(ab.id) AS total_blocos
FROM aulas a
LEFT JOIN aulas_blocos ab ON ab.aula_id = a.id
GROUP BY a.id, a.titulo;

-- 5. Verificar jogos de cada aula (se existir a tabela)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'aulas_jogos') THEN
    EXECUTE 'SELECT 
      a.titulo AS aula,
      COUNT(aj.id) AS total_jogos
    FROM aulas a
    LEFT JOIN aulas_jogos aj ON aj.aula_id = a.id
    GROUP BY a.id, a.titulo';
  ELSE
    RAISE NOTICE 'Tabela aulas_jogos não existe ainda';
  END IF;
END $$;

-- 6. Testar RPC com uma sessão ativa
DO $$
DECLARE
  v_session_id UUID;
  v_resultado JSONB;
BEGIN
  -- Pegar primeira sessão ativa
  SELECT id INTO v_session_id FROM sessions WHERE status = 'active' LIMIT 1;
  
  IF v_session_id IS NULL THEN
    RAISE NOTICE '⚠️ Nenhuma sessão ativa encontrada para testar';
  ELSE
    RAISE NOTICE '🔍 Testando com session_id: %', v_session_id;
    
    -- Testar RPC
    v_resultado := get_itens_aula_sessao(v_session_id);
    
    RAISE NOTICE '✅ Resultado: %', v_resultado;
  END IF;
END $$;

-- 7. Resumo final
DO $$
DECLARE
  v_rpc_existe BOOLEAN;
  v_tabela_jogos_existe BOOLEAN;
  v_total_aulas INTEGER;
  v_sessoes_ativas INTEGER;
BEGIN
  -- Verificar RPC
  SELECT EXISTS (
    SELECT FROM pg_proc WHERE proname = 'get_itens_aula_sessao'
  ) INTO v_rpc_existe;
  
  -- Verificar tabela aulas_jogos
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'aulas_jogos'
  ) INTO v_tabela_jogos_existe;
  
  -- Contar aulas
  SELECT COUNT(*) INTO v_total_aulas FROM aulas;
  
  -- Contar sessões ativas
  SELECT COUNT(*) INTO v_sessoes_ativas FROM sessions WHERE status = 'active';
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE '📊 RESUMO DO DIAGNÓSTICO';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'RPC get_itens_aula_sessao existe: %', v_rpc_existe;
  RAISE NOTICE 'Tabela aulas_jogos existe: %', v_tabela_jogos_existe;
  RAISE NOTICE 'Total de aulas: %', v_total_aulas;
  RAISE NOTICE 'Sessões ativas: %', v_sessoes_ativas;
  RAISE NOTICE '==========================================';
  
  IF NOT v_rpc_existe THEN
    RAISE NOTICE '❌ PROBLEMA: RPC não existe!';
    RAISE NOTICE '💡 SOLUÇÃO: Execute supabase/migrations/20251027_rpc_get_itens_aula_completa.sql';
  END IF;
  
  IF NOT v_tabela_jogos_existe THEN
    RAISE NOTICE '⚠️ AVISO: Tabela aulas_jogos não existe';
    RAISE NOTICE '💡 Isso é normal se ainda não criou jogos';
  END IF;
  
  IF v_sessoes_ativas = 0 THEN
    RAISE NOTICE '⚠️ AVISO: Nenhuma sessão ativa';
    RAISE NOTICE '💡 Crie uma sessão em /dashboard/professor';
  END IF;
END $$;



