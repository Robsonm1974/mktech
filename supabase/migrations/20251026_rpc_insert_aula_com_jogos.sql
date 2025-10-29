-- ============================================
-- FASE 7: RPC para criar aulas com BLOCOS + JOGOS
-- Data: 26/10/2025
-- ============================================

-- Este RPC ADICIONA a funcionalidade de jogos, mas mantém compatibilidade
-- com o RPC antigo (insert_aula_with_blocos_admin)

CREATE OR REPLACE FUNCTION insert_aula_with_itens_admin(
  p_trilha_id UUID,
  p_titulo VARCHAR,
  p_descricao TEXT DEFAULT NULL,
  p_itens JSONB DEFAULT '[]'::JSONB  -- [{"tipo": "bloco", "id": "uuid", "ordem": 1}, {"tipo": "jogo", "id": "uuid", "ordem": 2}]
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_aula_id UUID;
  v_pontos_totais INTEGER := 0;
  v_ano_escolar_id VARCHAR;
  v_disciplina_id UUID;
  v_item JSONB;
  v_pontos_bloco INTEGER;
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Iniciando criação de aula: %', p_titulo;
  RAISE NOTICE 'Total de itens: %', jsonb_array_length(p_itens);
  
  -- 1. Criar aula
  INSERT INTO aulas (trilha_id, titulo, descricao, ordem, pontos_totais, publicada)
  VALUES (p_trilha_id, p_titulo, p_descricao, 1, 0, false)
  RETURNING id INTO v_aula_id;
  
  RAISE NOTICE '✅ Aula criada com ID: %', v_aula_id;
  
  -- 2. Validar que há itens
  IF jsonb_array_length(p_itens) = 0 THEN
    RAISE EXCEPTION 'É necessário adicionar pelo menos um bloco ou jogo';
  END IF;
  
  -- 3. Percorrer itens (blocos + jogos)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    RAISE NOTICE '---';
    RAISE NOTICE 'Processando item:';
    RAISE NOTICE '  - Tipo: %', v_item->>'tipo';
    RAISE NOTICE '  - ID: %', v_item->>'id';
    RAISE NOTICE '  - Ordem: %', v_item->>'ordem';
    
    IF v_item->>'tipo' = 'bloco' THEN
      -- Inserir em aulas_blocos
      INSERT INTO aulas_blocos (aula_id, bloco_template_id, ordem_na_aula)
      VALUES (v_aula_id, (v_item->>'id')::uuid, (v_item->>'ordem')::int);
      
      -- Buscar pontos do bloco
      SELECT COALESCE(pontos_bloco, 0) INTO v_pontos_bloco
      FROM blocos_templates WHERE id = (v_item->>'id')::uuid;
      
      v_pontos_totais := v_pontos_totais + v_pontos_bloco;
      
      RAISE NOTICE '  ✅ Bloco inserido | Pontos: % | Total acumulado: %', v_pontos_bloco, v_pontos_totais;
      
    ELSIF v_item->>'tipo' = 'jogo' THEN
      -- Inserir em aulas_jogos
      INSERT INTO aulas_jogos (aula_id, game_id, ordem_na_aula, obrigatorio)
      VALUES (v_aula_id, (v_item->>'id')::uuid, (v_item->>'ordem')::int, true);
      
      RAISE NOTICE '  ✅ Jogo inserido';
      
    ELSE
      RAISE WARNING '  ⚠️ Tipo desconhecido: %. Ignorando.', v_item->>'tipo';
    END IF;
  END LOOP;
  
  RAISE NOTICE '---';
  RAISE NOTICE 'Total de pontos calculado: %', v_pontos_totais;
  
  -- 4. Detectar ano e disciplina do primeiro BLOCO
  SELECT 
    bt.ano_escolar_id,
    bt.disciplina_id
  INTO 
    v_ano_escolar_id,
    v_disciplina_id
  FROM aulas_blocos ab
  JOIN blocos_templates bt ON ab.bloco_template_id = bt.id
  WHERE ab.aula_id = v_aula_id
  ORDER BY ab.ordem_na_aula ASC
  LIMIT 1;
  
  RAISE NOTICE 'Ano escolar detectado: %', v_ano_escolar_id;
  RAISE NOTICE 'Disciplina detectada: %', v_disciplina_id;
  
  -- 5. Atualizar aula com ano, disciplina e pontos
  UPDATE aulas 
  SET 
    ano_escolar_id = v_ano_escolar_id,
    disciplina_id = v_disciplina_id,
    pontos_totais = v_pontos_totais
  WHERE id = v_aula_id;
  
  RAISE NOTICE '✅ Aula atualizada';
  RAISE NOTICE '==========================================';
  
  -- 6. Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'aula_id', v_aula_id,
    'pontos_totais', v_pontos_totais,
    'message', 'Aula criada com sucesso'
  );
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ ERRO: %', SQLERRM;
  RAISE NOTICE '==========================================';
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;

-- Comentário detalhado
COMMENT ON FUNCTION insert_aula_with_itens_admin IS 
'Cria aula com blocos e/ou jogos. 
Parâmetros:
- p_trilha_id: ID da trilha (usar 00000000-0000-0000-0000-000000000001)
- p_titulo: Título da aula
- p_descricao: Descrição opcional
- p_itens: Array JSONB com objetos {tipo: "bloco"|"jogo", id: UUID, ordem: INTEGER}

Exemplo:
[
  {"tipo": "bloco", "id": "uuid-do-bloco", "ordem": 1},
  {"tipo": "jogo", "id": "uuid-do-jogo", "ordem": 2},
  {"tipo": "bloco", "id": "outro-uuid", "ordem": 3}
]

Retorna: {success: boolean, aula_id: UUID, message: string}';

-- ============================================
-- FIM DA MIGRATION
-- ============================================



