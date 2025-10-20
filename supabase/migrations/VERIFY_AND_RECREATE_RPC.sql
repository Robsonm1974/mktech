-- =====================================================
-- VERIFICAR E RECRIAR RPC insert_planejamento_admin
-- =====================================================

-- 1. Verificar se a função existe
SELECT 
    'FUNÇÃO ATUAL' AS status,
    proname AS nome,
    pg_get_function_arguments(oid) AS argumentos,
    pg_get_function_result(oid) AS retorno
FROM pg_proc
WHERE proname = 'insert_planejamento_admin';

-- 2. Dropar e recriar a função (garantir que está atualizada)
DROP FUNCTION IF EXISTS insert_planejamento_admin(UUID, VARCHAR, VARCHAR, TEXT, INTEGER, INTEGER, INTEGER, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS insert_planejamento_admin(UUID, VARCHAR, VARCHAR, TEXT, INTEGER, INTEGER, INTEGER, VARCHAR);

-- 3. Criar função corrigida
CREATE OR REPLACE FUNCTION insert_planejamento_admin(
  p_disciplina_id UUID,
  p_ano_escolar_id VARCHAR,
  p_titulo VARCHAR,
  p_documento_md TEXT,
  p_num_blocos INTEGER,
  p_pontos_totais INTEGER,
  p_pontos_por_quiz INTEGER,
  p_codigo_base VARCHAR,
  p_status VARCHAR DEFAULT 'processado'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_planejamento_id UUID;
  v_result JSONB;
BEGIN
  RAISE NOTICE '📝 Inserindo planejamento: disciplina=%, ano=%, titulo=%', p_disciplina_id, p_ano_escolar_id, p_titulo;
  
  -- Inserir planejamento
  INSERT INTO planejamentos (
    disciplina_id,
    ano_escolar_id,
    titulo,
    documento_md,
    num_blocos,
    pontos_totais,
    pontos_por_quiz,
    codigo_base,
    status,
    created_at,
    updated_at
  )
  VALUES (
    p_disciplina_id,
    p_ano_escolar_id,
    p_titulo,
    p_documento_md,
    p_num_blocos,
    p_pontos_totais,
    p_pontos_por_quiz,
    p_codigo_base,
    p_status,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_planejamento_id;

  RAISE NOTICE '✅ Planejamento inserido com ID: %', v_planejamento_id;

  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', TRUE,
    'planejamento_id', v_planejamento_id,
    'message', 'Planejamento inserido com sucesso'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- 4. Conceder permissões
GRANT EXECUTE ON FUNCTION insert_planejamento_admin TO authenticated;
GRANT EXECUTE ON FUNCTION insert_planejamento_admin TO anon;

-- 5. Verificar criação
SELECT 
    'FUNÇÃO CRIADA' AS status,
    proname AS nome,
    pg_get_function_arguments(oid) AS argumentos,
    pg_get_function_result(oid) AS retorno
FROM pg_proc
WHERE proname = 'insert_planejamento_admin';

-- 6. TESTE COMPLETO DO RPC
DO $$
DECLARE
    v_result JSONB;
    v_disciplina_id UUID;
    v_test_codigo VARCHAR := 'TEST-FINAL-' || floor(random() * 1000)::TEXT;
BEGIN
    -- Pegar disciplina Algoritmos
    SELECT id INTO v_disciplina_id 
    FROM disciplinas 
    WHERE codigo = 'ALG';
    
    IF v_disciplina_id IS NULL THEN
        RAISE NOTICE '❌ Disciplina não encontrada';
        RETURN;
    END IF;
    
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '🧪 INICIANDO TESTE DO RPC';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE 'Disciplina ID: %', v_disciplina_id;
    RAISE NOTICE 'Código Base: %', v_test_codigo;
    
    -- Chamar função
    BEGIN
        SELECT insert_planejamento_admin(
            v_disciplina_id,
            'EF1',
            'Teste Completo de RPC',
            '# Documento de Teste',
            5,
            50,
            10,
            v_test_codigo,
            'rascunho'
        ) INTO v_result;
        
        RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
        RAISE NOTICE '📊 RESULTADO DO RPC:';
        RAISE NOTICE '%', v_result::TEXT;
        RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
        
        IF (v_result->>'success')::BOOLEAN = TRUE THEN
            RAISE NOTICE '✅ SUCESSO! ID: %', v_result->>'planejamento_id';
            
            -- Verificar se realmente foi inserido
            IF EXISTS (SELECT 1 FROM planejamentos WHERE id = (v_result->>'planejamento_id')::UUID) THEN
                RAISE NOTICE '✅ Registro confirmado no banco';
            ELSE
                RAISE NOTICE '⚠️ Registro não encontrado no banco';
            END IF;
            
            -- Limpar
            DELETE FROM planejamentos WHERE codigo_base = v_test_codigo;
            RAISE NOTICE '🧹 Teste limpo';
        ELSE
            RAISE NOTICE '❌ FALHA: %', v_result->>'error';
            RAISE NOTICE '❌ Detalhes: %', v_result->>'detail';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
        RAISE NOTICE '❌ EXCEÇÃO CAPTURADA:';
        RAISE NOTICE 'Erro: %', SQLERRM;
        RAISE NOTICE 'Estado: %', SQLSTATE;
        RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    END;
END $$;

