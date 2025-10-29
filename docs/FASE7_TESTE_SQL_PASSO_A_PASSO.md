# 🧪 FASE 7 - Teste SQL Passo a Passo

## 📋 O QUE FAZER AGORA

### **PASSO 1: Executar a Migration**

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Clique em **+ New Query**
4. Cole o conteúdo do arquivo: `supabase/migrations/20251026_rpc_insert_aula_com_jogos.sql`
5. Clique em **Run** ou pressione `Ctrl+Enter`

**Resultado esperado:**
```
Success. No rows returned
```

---

### **PASSO 2: Buscar IDs de Blocos Reais**

No SQL Editor, execute:

```sql
-- Buscar 3 blocos disponíveis
SELECT 
  id,
  codigo_bloco,
  titulo,
  pontos_bloco,
  disciplinas.nome as disciplina
FROM blocos_templates
LEFT JOIN disciplinas ON blocos_templates.disciplina_id = disciplinas.id
WHERE blocos_templates.status = 'ativo'
ORDER BY blocos_templates.created_at DESC
LIMIT 3;
```

**Anote os IDs** retornados. Exemplo:
```
┌──────────────────────────────────────┬──────────────┬──────────────────────┬──────────────┬──────────────┐
│ id                                   │ codigo_bloco │ titulo               │ pontos_bloco │ disciplina   │
├──────────────────────────────────────┼──────────────┼──────────────────────┼──────────────┼──────────────┤
│ abc123...                            │ PROG-001     │ Introdução Python    │ 10           │ Programação  │
│ def456...                            │ PROG-002     │ Variáveis            │ 15           │ Programação  │
│ ghi789...                            │ MAT-001      │ Soma e Subtração     │ 10           │ Matemática   │
└──────────────────────────────────────┴──────────────┴──────────────────────┴──────────────┴──────────────┘
```

---

### **PASSO 3: Teste 1 - Criar Aula Apenas com Blocos**

**Este teste garante que o novo RPC funciona igual ao antigo.**

```sql
-- Substitua os UUIDs pelos IDs reais dos blocos
SELECT insert_aula_with_itens_admin(
  '00000000-0000-0000-0000-000000000001'::uuid,
  '🧪 Teste 1: Apenas Blocos',
  'Testando compatibilidade com RPC antigo',
  '[
    {"tipo": "bloco", "id": "COLE_ID_BLOCO_1_AQUI", "ordem": 1},
    {"tipo": "bloco", "id": "COLE_ID_BLOCO_2_AQUI", "ordem": 2}
  ]'::jsonb
);
```

**Resultado esperado:**
```json
{
  "success": true,
  "aula_id": "uuid-gerado",
  "pontos_totais": 25,
  "message": "Aula criada com sucesso"
}
```

---

### **PASSO 4: Verificar Aula Criada**

```sql
-- Ver aula criada
SELECT 
  a.id,
  a.titulo,
  a.descricao,
  a.pontos_totais,
  ae.nome as ano_escolar,
  d.nome as disciplina,
  a.created_at
FROM aulas a
LEFT JOIN anos_escolares ae ON a.ano_escolar_id = ae.id
LEFT JOIN disciplinas d ON a.disciplina_id = d.id
WHERE a.titulo LIKE '%Teste 1%'
ORDER BY a.created_at DESC
LIMIT 1;
```

**Verificar blocos:**
```sql
-- Ver blocos da aula (use o ID retornado acima)
SELECT 
  ab.ordem_na_aula,
  bt.codigo_bloco,
  bt.titulo,
  bt.pontos_bloco
FROM aulas_blocos ab
JOIN blocos_templates bt ON ab.bloco_template_id = bt.id
WHERE ab.aula_id = (
  SELECT id FROM aulas WHERE titulo LIKE '%Teste 1%' ORDER BY created_at DESC LIMIT 1
)
ORDER BY ab.ordem_na_aula;
```

**Resultado esperado:**
```
┌───────────────┬──────────────┬──────────────────────┬──────────────┐
│ ordem_na_aula │ codigo_bloco │ titulo               │ pontos_bloco │
├───────────────┼──────────────┼──────────────────────┼──────────────┤
│ 1             │ PROG-001     │ Introdução Python    │ 10           │
│ 2             │ PROG-002     │ Variáveis            │ 15           │
└───────────────┴──────────────┴──────────────────────┴──────────────┘
```

✅ **Se você viu os 2 blocos na ordem correta, o RPC está funcionando!**

---

### **PASSO 5: Limpar Teste 1**

```sql
-- Deletar aula de teste
DELETE FROM aulas WHERE titulo LIKE '%Teste 1%';
```

---

### **PASSO 6: (OPCIONAL) Teste 2 - Com Jogos**

**⚠️ SÓ FAÇA ESTE TESTE SE TIVER JOGOS CRIADOS!**

```sql
-- Primeiro, verificar se há jogos
SELECT id, codigo, titulo, duracao_segundos 
FROM games 
WHERE publicado = true 
LIMIT 3;
```

Se houver jogos, teste:

```sql
-- Substitua pelos IDs reais
SELECT insert_aula_with_itens_admin(
  '00000000-0000-0000-0000-000000000001'::uuid,
  '🧪 Teste 2: Blocos + Jogos',
  'Testando funcionalidade nova',
  '[
    {"tipo": "bloco", "id": "ID_BLOCO_1", "ordem": 1},
    {"tipo": "jogo", "id": "ID_JOGO_1", "ordem": 2},
    {"tipo": "bloco", "id": "ID_BLOCO_2", "ordem": 3}
  ]'::jsonb
);
```

Verificar:
```sql
-- Ver blocos
SELECT ab.ordem_na_aula, 'BLOCO' as tipo, bt.titulo
FROM aulas_blocos ab
JOIN blocos_templates bt ON ab.bloco_template_id = bt.id
WHERE ab.aula_id = (SELECT id FROM aulas WHERE titulo LIKE '%Teste 2%' ORDER BY created_at DESC LIMIT 1)

UNION ALL

-- Ver jogos
SELECT aj.ordem_na_aula, 'JOGO' as tipo, g.titulo
FROM aulas_jogos aj
JOIN games g ON aj.game_id = g.id
WHERE aj.aula_id = (SELECT id FROM aulas WHERE titulo LIKE '%Teste 2%' ORDER BY created_at DESC LIMIT 1)

ORDER BY ordem_na_aula;
```

**Resultado esperado:**
```
┌───────────────┬───────┬───────────────────────┐
│ ordem_na_aula │ tipo  │ titulo                │
├───────────────┼───────┼───────────────────────┤
│ 1             │ BLOCO │ Introdução Python     │
│ 2             │ JOGO  │ Adventure Runner      │
│ 3             │ BLOCO │ Variáveis             │
└───────────────┴───────┴───────────────────────┘
```

Limpar:
```sql
DELETE FROM aulas WHERE titulo LIKE '%Teste 2%';
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Marque quando completar cada passo:

- [ ] **PASSO 1**: Migration executada com sucesso
- [ ] **PASSO 2**: IDs de blocos anotados
- [ ] **PASSO 3**: Teste 1 executado (aula criada)
- [ ] **PASSO 4**: Aula verificada no banco
- [ ] **PASSO 4**: Blocos verificados na ordem correta
- [ ] **PASSO 5**: Teste 1 limpo
- [ ] **PASSO 6**: (Opcional) Teste 2 com jogos

---

## 🎯 QUANDO TUDO ESTIVER OK

**Me avise dizendo:**
> "SQL testado e funcionando! IDs dos blocos: [cole os IDs aqui]"

**Aí eu vou:**
1. Atualizar o frontend
2. Testar criar aula pela interface
3. Garantir que tudo funciona

---

## ❌ SE DER ERRO

**Me envie:**
1. O comando SQL que executou
2. A mensagem de erro completa
3. Screenshot se possível

**Vou corrigir imediatamente!**

---

**Data**: 26/10/2025  
**Status**: 📋 **AGUARDANDO EXECUÇÃO DOS TESTES**



