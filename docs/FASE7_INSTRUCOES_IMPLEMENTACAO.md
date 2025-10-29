# 🚀 FASE 7 - INSTRUÇÕES DE IMPLEMENTAÇÃO

## ⚠️ IMPORTANTE: O QUE NÃO MEXER

**Estes arquivos/funcionalidades estão funcionando perfeitamente:**
- ✅ RPC `insert_aula_with_blocos_admin` (antigo) - **NÃO DELETAR**
- ✅ Tabela `aulas_blocos` - **NÃO ALTERAR**
- ✅ Tabela `aulas_jogos` - **JÁ EXISTE**
- ✅ Criação de aulas com apenas blocos - **DEVE CONTINUAR FUNCIONANDO**

---

## 📋 PASSO 1: Executar SQL no Supabase

1. Abra o **SQL Editor** no Supabase
2. Cole e execute o código abaixo:

```sql
-- ============================================
-- RPC: insert_aula_with_itens_admin
-- Cria aula com BLOCOS + JOGOS misturados
-- ============================================

CREATE OR REPLACE FUNCTION insert_aula_with_itens_admin(
  p_trilha_id UUID,
  p_titulo VARCHAR,
  p_descricao TEXT DEFAULT NULL,
  p_itens JSONB DEFAULT '[]'::JSONB
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
  -- 1. Criar aula
  INSERT INTO aulas (trilha_id, titulo, descricao, ordem, pontos_totais, publicada)
  VALUES (p_trilha_id, p_titulo, p_descricao, 1, 0, false)
  RETURNING id INTO v_aula_id;
  
  RAISE NOTICE 'Aula criada com ID: %', v_aula_id;
  
  -- 2. Percorrer itens (blocos + jogos)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    RAISE NOTICE 'Processando item tipo: %, id: %, ordem: %', 
      v_item->>'tipo', v_item->>'id', v_item->>'ordem';
    
    IF v_item->>'tipo' = 'bloco' THEN
      -- Inserir em aulas_blocos
      INSERT INTO aulas_blocos (aula_id, bloco_template_id, ordem_na_aula)
      VALUES (v_aula_id, (v_item->>'id')::uuid, (v_item->>'ordem')::int);
      
      -- Somar pontos do bloco
      SELECT COALESCE(pontos_bloco, 0) INTO v_pontos_bloco
      FROM blocos_templates WHERE id = (v_item->>'id')::uuid;
      
      v_pontos_totais := v_pontos_totais + v_pontos_bloco;
      
      RAISE NOTICE 'Bloco inserido, pontos acumulados: %', v_pontos_totais;
      
    ELSIF v_item->>'tipo' = 'jogo' THEN
      -- Inserir em aulas_jogos
      INSERT INTO aulas_jogos (aula_id, game_id, ordem_na_aula, obrigatorio)
      VALUES (v_aula_id, (v_item->>'id')::uuid, (v_item->>'ordem')::int, true);
      
      RAISE NOTICE 'Jogo inserido';
    END IF;
  END LOOP;
  
  -- 3. Detectar ano e disciplina do primeiro BLOCO
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
  
  -- 4. Atualizar aula com ano, disciplina e pontos
  UPDATE aulas 
  SET 
    ano_escolar_id = v_ano_escolar_id,
    disciplina_id = v_disciplina_id,
    pontos_totais = v_pontos_totais
  WHERE id = v_aula_id;
  
  RAISE NOTICE 'Aula atualizada - Ano: %, Disciplina: %, Pontos: %', 
    v_ano_escolar_id, v_disciplina_id, v_pontos_totais;
  
  -- 5. Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'aula_id', v_aula_id,
    'message', 'Aula criada com sucesso'
  );
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Erro: %', SQLERRM;
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$;

COMMENT ON FUNCTION insert_aula_with_itens_admin IS 
'Cria aula com blocos e jogos misturados. p_itens = [{"tipo":"bloco"|"jogo", "id":"uuid", "ordem":1}]';
```

3. **Teste** com este comando:

```sql
-- Buscar ID de um bloco existente primeiro
SELECT id, titulo FROM blocos_templates LIMIT 1;

-- Teste básico (substitua SEU_BLOCO_ID pelo ID retornado acima)
SELECT insert_aula_with_itens_admin(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Teste Aula Mista SQL',
  'Teste de criação',
  '[{"tipo": "bloco", "id": "SEU_BLOCO_ID_AQUI", "ordem": 1}]'::jsonb
);

-- Verificar se funcionou
SELECT * FROM aulas WHERE titulo = 'Teste Aula Mista SQL' ORDER BY created_at DESC LIMIT 1;

-- Limpar teste
DELETE FROM aulas WHERE titulo = 'Teste Aula Mista SQL';
```

---

## 📋 PASSO 2: Testar RPC no Supabase

**Antes de mexer no frontend**, certifique-se que o RPC funciona:

1. No SQL Editor, teste criar uma aula apenas com blocos:

```sql
-- Busque um bloco real
SELECT id, codigo_bloco, titulo FROM blocos_templates LIMIT 3;

-- Crie aula de teste (use IDs reais dos blocos acima)
SELECT insert_aula_with_itens_admin(
  '00000000-0000-0000-0000-000000000001'::uuid,
  '🧪 Teste FASE 7 - Apenas Blocos',
  'Teste com 2 blocos',
  '[
    {"tipo": "bloco", "id": "BLOCO_ID_1", "ordem": 1},
    {"tipo": "bloco", "id": "BLOCO_ID_2", "ordem": 2}
  ]'::jsonb
);
```

2. Verifique se a aula foi criada:

```sql
SELECT 
  a.id,
  a.titulo,
  a.pontos_totais,
  ae.nome as ano,
  d.nome as disciplina
FROM aulas a
LEFT JOIN anos_escolares ae ON a.ano_escolar_id = ae.id
LEFT JOIN disciplinas d ON a.disciplina_id = d.id
WHERE a.titulo LIKE '%Teste FASE 7%'
ORDER BY a.created_at DESC;
```

3. Verifique os blocos da aula:

```sql
SELECT 
  ab.ordem_na_aula,
  bt.titulo,
  bt.pontos_bloco
FROM aulas_blocos ab
JOIN blocos_templates bt ON ab.bloco_template_id = bt.id
WHERE ab.aula_id = (SELECT id FROM aulas WHERE titulo LIKE '%Teste FASE 7%' ORDER BY created_at DESC LIMIT 1)
ORDER BY ab.ordem_na_aula;
```

4. Se tudo estiver OK, limpe o teste:

```sql
DELETE FROM aulas WHERE titulo LIKE '%Teste FASE 7%';
```

---

## 📋 PASSO 3: Atualizar Frontend (Depois que RPC funcionar)

**Apenas após confirmar que o RPC funciona**, me avise e eu vou:

1. Atualizar `src/app/admin/aulas/criar/page.tsx` para:
   - Carregar jogos disponíveis
   - Mostrar 3 colunas (Blocos | Jogos | Selecionados)
   - Permitir adicionar blocos E jogos
   - Enviar para o novo RPC `insert_aula_with_itens_admin`

2. Garantir **compatibilidade reversa**:
   - Se o admin criar aula SEM jogos, deve funcionar igual antes
   - Código antigo não será quebrado

---

## ✅ CHECKLIST

### Antes de mexer no frontend:
- [ ] SQL executado no Supabase
- [ ] RPC `insert_aula_with_itens_admin` testado com blocos
- [ ] Aula de teste criada e verificada
- [ ] Blocos inseridos em `aulas_blocos` corretamente
- [ ] Teste limpo do banco

### Após frontend atualizado:
- [ ] Carregar jogos disponíveis na página
- [ ] Adicionar coluna "Jogos Disponíveis"
- [ ] Permitir selecionar blocos + jogos
- [ ] Reordenar itens misturados
- [ ] Visual diferente (azul = bloco, verde = jogo)
- [ ] Testar criar aula apenas com blocos (deve funcionar)
- [ ] Testar criar aula com blocos + jogos
- [ ] Testar criar aula apenas com jogos

---

## 🎯 ORDEM DE EXECUÇÃO

```
1. EXECUTAR SQL
   ↓
2. TESTAR RPC NO SUPABASE
   ↓
3. CONFIRMAR QUE FUNCIONA
   ↓
4. AVISAR PARA ATUALIZAR FRONTEND
   ↓
5. TESTAR TUDO NOVAMENTE
```

---

## 📞 ME AVISE QUANDO:

1. ✅ Terminar de executar o SQL
2. ✅ Testar o RPC e confirmar que funciona
3. ❌ Se der algum erro no SQL

**Só vou mexer no frontend DEPOIS que você confirmar que o RPC está funcionando!**

---

**Data**: 26/10/2025  
**Status**: 📋 **AGUARDANDO PASSO 1 (SQL)**



