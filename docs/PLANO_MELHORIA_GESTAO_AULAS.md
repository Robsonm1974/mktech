# 📋 PLANO: Melhoria da Gestão de Aulas com Filtros por Ano e Disciplina

**Data:** 18 de Outubro de 2025  
**Objetivo:** Adicionar campos de ano_escolar e disciplina às aulas para permitir filtros e melhor organização

---

## 🔍 ANÁLISE DA SITUAÇÃO ATUAL

### **Estrutura Atual da Tabela `aulas`**
```sql
CREATE TABLE aulas (
  id UUID PRIMARY KEY,
  trilha_id UUID NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMP
);
```

### **Estrutura da Tabela `blocos_templates`**
```sql
CREATE TABLE blocos_templates (
  id UUID PRIMARY KEY,
  planejamento_id UUID,
  disciplina_id UUID,           -- ✅ TEM
  ano_escolar_id VARCHAR,        -- ✅ TEM
  codigo_bloco VARCHAR,
  titulo VARCHAR,
  pontos_bloco INTEGER,
  ...
);
```

### **Problema Identificado**
- ❌ Aulas **NÃO têm** `ano_escolar_id`
- ❌ Aulas **NÃO têm** `disciplina_id`
- ✅ Blocos **TÊM** ambos os campos
- ❌ Interface atual mostra todas as aulas em lista simples
- ❌ Não há filtros por ano ou disciplina

---

## 🎯 OBJETIVOS

### **1. Adicionar Campos à Tabela `aulas`**
- `ano_escolar_id` (VARCHAR) - Referência para `anos_escolares.id`
- `disciplina_id` (UUID, nullable) - Referência para `disciplinas.id`

### **2. Detectar Ano e Disciplina Automaticamente**
Quando uma aula é criada com blocos, inferir:
- **Ano:** Do bloco mais comum na aula
- **Disciplina:** Da disciplina mais comum nos blocos (ou null se multidisciplinar)

### **3. Melhorar Interface de Listagem**
- Cards por Ano Escolar (como na Fábrica de Blocos)
- Filtros por Ano e Disciplina
- Estatísticas por ano/disciplina
- Vista em grid/lista

---

## 📐 ARQUITETURA PROPOSTA

### **Hierarquia de Dados**
```
Anos Escolares (EF1-EF9)
  └── Disciplinas (Algoritmos, Lógica, etc)
      └── Aulas
          └── Blocos Templates (vinculados via aulas_blocos)
```

### **Fluxo de Criação de Aula**
```
1. Admin cria aula
2. Seleciona blocos templates
3. Sistema detecta automaticamente:
   - ano_escolar_id: do bloco predominante
   - disciplina_id: da disciplina predominante (ou NULL)
4. Admin pode editar esses campos manualmente
5. Aula é salva com metadados corretos
```

---

## 🛠️ IMPLEMENTAÇÃO

### **FASE 1: Migração do Banco de Dados**

#### **Script SQL: `UPGRADE_AULAS_METADATA.sql`**

```sql
-- ===================================================
-- UPGRADE: Adicionar metadados às aulas
-- ===================================================

-- 1. Adicionar colunas
ALTER TABLE aulas 
ADD COLUMN IF NOT EXISTS ano_escolar_id VARCHAR(10) REFERENCES anos_escolares(id),
ADD COLUMN IF NOT EXISTS disciplina_id UUID REFERENCES disciplinas(id);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_aulas_ano_escolar ON aulas(ano_escolar_id);
CREATE INDEX IF NOT EXISTS idx_aulas_disciplina ON aulas(disciplina_id);

-- 3. Atualizar aulas existentes (inferir de blocos)
UPDATE aulas a
SET 
  ano_escolar_id = (
    SELECT bt.ano_escolar_id
    FROM aulas_blocos ab
    JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
    WHERE ab.aula_id = a.id
    GROUP BY bt.ano_escolar_id
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ),
  disciplina_id = (
    SELECT bt.disciplina_id
    FROM aulas_blocos ab
    JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
    WHERE ab.aula_id = a.id AND bt.disciplina_id IS NOT NULL
    GROUP BY bt.disciplina_id
    ORDER BY COUNT(*) DESC
    LIMIT 1
  )
WHERE ano_escolar_id IS NULL;

-- 4. Comentários
COMMENT ON COLUMN aulas.ano_escolar_id IS 'Ano escolar alvo (inferido dos blocos ou definido manualmente)';
COMMENT ON COLUMN aulas.disciplina_id IS 'Disciplina principal (NULL = multidisciplinar)';
```

#### **Atualizar RPC `insert_aula_with_blocos_admin`**

```sql
CREATE OR REPLACE FUNCTION insert_aula_with_blocos_admin(
  p_trilha_id UUID,
  p_titulo VARCHAR,
  p_descricao TEXT DEFAULT NULL,
  p_blocos_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_aula_id UUID;
  v_ano_escolar_id VARCHAR;
  v_disciplina_id UUID;
  v_pontos_totais INTEGER := 0;
BEGIN
  -- Detectar ano e disciplina dos blocos
  IF array_length(p_blocos_ids, 1) > 0 THEN
    -- Ano mais comum
    SELECT bt.ano_escolar_id INTO v_ano_escolar_id
    FROM blocos_templates bt
    WHERE bt.id = ANY(p_blocos_ids)
    GROUP BY bt.ano_escolar_id
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    -- Disciplina mais comum (se houver)
    SELECT bt.disciplina_id INTO v_disciplina_id
    FROM blocos_templates bt
    WHERE bt.id = ANY(p_blocos_ids) AND bt.disciplina_id IS NOT NULL
    GROUP BY bt.disciplina_id
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    -- Calcular pontos
    SELECT COALESCE(SUM(pontos_bloco), 0) INTO v_pontos_totais
    FROM blocos_templates
    WHERE id = ANY(p_blocos_ids);
  END IF;

  -- Inserir aula
  INSERT INTO aulas (
    trilha_id,
    titulo,
    descricao,
    ano_escolar_id,
    disciplina_id,
    ordem,
    created_at
  ) VALUES (
    p_trilha_id,
    p_titulo,
    p_descricao,
    v_ano_escolar_id,
    v_disciplina_id,
    1,
    NOW()
  )
  RETURNING id INTO v_aula_id;

  -- Vincular blocos
  IF array_length(p_blocos_ids, 1) > 0 THEN
    FOR i IN 1..array_length(p_blocos_ids, 1) LOOP
      INSERT INTO aulas_blocos (aula_id, bloco_template_id, ordem_na_aula)
      VALUES (v_aula_id, p_blocos_ids[i], i);
    END LOOP;
  END IF;

  -- Retornar resultado
  RETURN jsonb_build_object(
    'success', TRUE,
    'aula_id', v_aula_id,
    'ano_escolar_id', v_ano_escolar_id,
    'disciplina_id', v_disciplina_id,
    'total_blocos', COALESCE(array_length(p_blocos_ids, 1), 0),
    'pontos_totais', v_pontos_totais,
    'message', 'Aula criada com sucesso'
  );
END;
$$;
```

#### **Atualizar RPC `get_aulas_with_relations_admin`**

```sql
CREATE OR REPLACE FUNCTION get_aulas_with_relations_admin()
RETURNS TABLE (
  id UUID,
  trilha_id UUID,
  titulo VARCHAR,
  descricao TEXT,
  ordem INTEGER,
  ano_escolar_id VARCHAR,
  disciplina_id UUID,
  created_at TIMESTAMP,
  total_blocos INTEGER,
  blocos_ids UUID[],
  ano_nome VARCHAR,
  disciplina_nome VARCHAR,
  disciplina_codigo VARCHAR,
  pontos_totais INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.trilha_id,
    a.titulo,
    a.descricao,
    a.ordem,
    a.ano_escolar_id,
    a.disciplina_id,
    a.created_at,
    COALESCE(COUNT(ab.bloco_template_id), 0)::INTEGER AS total_blocos,
    ARRAY_AGG(ab.bloco_template_id ORDER BY ab.ordem_na_aula) FILTER (WHERE ab.bloco_template_id IS NOT NULL) AS blocos_ids,
    ae.nome AS ano_nome,
    d.nome AS disciplina_nome,
    d.codigo AS disciplina_codigo,
    COALESCE(SUM(bt.pontos_bloco), 0)::INTEGER AS pontos_totais
  FROM aulas a
  LEFT JOIN anos_escolares ae ON ae.id = a.ano_escolar_id
  LEFT JOIN disciplinas d ON d.id = a.disciplina_id
  LEFT JOIN aulas_blocos ab ON ab.aula_id = a.id
  LEFT JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
  GROUP BY 
    a.id, a.trilha_id, a.titulo, a.descricao, a.ordem,
    a.ano_escolar_id, a.disciplina_id, a.created_at,
    ae.nome, d.nome, d.codigo
  ORDER BY a.created_at DESC;
END;
$$;
```

---

### **FASE 2: Interface Frontend**

#### **1. Página Principal - Cards por Ano**

**Arquivo:** `src/app/admin/aulas/page.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Gestão de Aulas                    [+ Nova Aula] │
│  Organize aulas por ano e disciplina              │
├─────────────────────────────────────────────────┤
│                                                    │
│  [🎓 1º Ano]  [🎓 2º Ano]  [🎓 3º Ano] ...       │
│  5 aulas      3 aulas      0 aulas               │
│  [Ver Aulas]  [Ver Aulas]                        │
│                                                    │
├─────────────────────────────────────────────────┤
│  Filtros:                                          │
│  [ Todos os Anos ▼ ]  [ Todas Disciplinas ▼ ]    │
│                                                    │
│  Lista de Aulas (filtrada):                       │
│  ┌─────────────────────────────────────────────┐ │
│  │ Introdução aos Algoritmos                    │ │
│  │ 1º Ano • Algoritmos • 5 blocos • 50 pts     │ │
│  │ [Detalhes] [Editar]                          │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Features:**
- ✅ Cards por ano com contadores
- ✅ Filtros independentes (Ano + Disciplina)
- ✅ Toggle Cards/Lista
- ✅ Badges visuais (ano, disciplina)
- ✅ Estatísticas (blocos, pontos)

#### **2. Formulário de Criação - Preview Automático**

**Arquivo:** `src/app/admin/aulas/criar/page.tsx`

**Adições:**
```typescript
// Preview automático do ano/disciplina
const [preview, setPreview] = useState({
  ano: null,
  disciplina: null,
  multidisciplinar: false
})

useEffect(() => {
  if (blocosSelecionados.length > 0) {
    // Detectar ano mais comum
    const anosCount = {}
    blocosSelecionados.forEach(b => {
      const ano = b.ano_escolar_id
      anosCount[ano] = (anosCount[ano] || 0) + 1
    })
    const anoMaisComum = Object.keys(anosCount)
      .sort((a, b) => anosCount[b] - anosCount[a])[0]
    
    // Detectar disciplina mais comum
    const discsCount = {}
    blocosSelecionados.forEach(b => {
      const disc = b.disciplinas?.codigo
      if (disc) discsCount[disc] = (discsCount[disc] || 0) + 1
    })
    
    const disciplinaMaisComum = Object.keys(discsCount)
      .sort((a, b) => discsCount[b] - discsCount[a])[0]
    
    setPreview({
      ano: anoMaisComum,
      disciplina: disciplinaMaisComum || null,
      multidisciplinar: Object.keys(discsCount).length > 1
    })
  }
}, [blocosSelecionados])
```

---

## 📊 BENEFÍCIOS

### **Para Administradores**
✅ Organização clara por ano escolar  
✅ Filtros eficientes  
✅ Visão geral de cobertura (quais anos têm aulas)  
✅ Identificação rápida de disciplinas  

### **Para Professores (futuro)**
✅ Encontrar aulas do ano da turma facilmente  
✅ Filtrar por disciplina que leciona  
✅ Preview claro dos blocos incluídos  

### **Para o Sistema**
✅ Metadados estruturados  
✅ Relatórios e analytics  
✅ Recomendações inteligentes  

---

## 🚀 CRONOGRAMA DE IMPLEMENTAÇÃO

### **Etapa 1: Database (30 min)**
1. ✅ Criar `UPGRADE_AULAS_METADATA.sql`
2. ✅ Executar migração no Supabase
3. ✅ Verificar dados das aulas existentes

### **Etapa 2: Backend RPCs (30 min)**
1. ✅ Atualizar `insert_aula_with_blocos_admin`
2. ✅ Atualizar `get_aulas_with_relations_admin`
3. ✅ Atualizar `update_aula_blocos_admin`
4. ✅ Testar RPCs

### **Etapa 3: Frontend Interface (1h)**
1. ✅ Atualizar interface TypeScript
2. ✅ Implementar cards por ano
3. ✅ Implementar filtros
4. ✅ Adicionar preview no formulário
5. ✅ Testar fluxo completo

### **Etapa 4: Testes e Ajustes (30 min)**
1. ✅ Criar 2-3 aulas de teste
2. ✅ Verificar filtros
3. ✅ Ajustar UI/UX
4. ✅ Documentar

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Database**
- [ ] Executar `UPGRADE_AULAS_METADATA.sql`
- [ ] Verificar colunas adicionadas
- [ ] Verificar aulas existentes atualizadas
- [ ] Testar constraints e índices

### **Backend**
- [ ] Atualizar RPC insert
- [ ] Atualizar RPC get
- [ ] Atualizar RPC update
- [ ] Atualizar RPC delete
- [ ] Testar todos os RPCs

### **Frontend**
- [ ] Atualizar interfaces TypeScript
- [ ] Implementar cards por ano
- [ ] Implementar filtros
- [ ] Adicionar badges visuais
- [ ] Preview automático no form
- [ ] Testar build

### **Testes**
- [ ] Criar aula multidisciplinar
- [ ] Criar aula disciplina única
- [ ] Filtrar por ano
- [ ] Filtrar por disciplina
- [ ] Editar aula e verificar metadados

---

## 🎯 RESULTADO ESPERADO

Uma interface de gestão de aulas completa e intuitiva:

**Antes:**
- Lista simples de todas as aulas
- Sem filtros
- Sem informação de ano/disciplina

**Depois:**
- Cards organizados por ano escolar
- Filtros por ano e disciplina
- Metadados detectados automaticamente
- Preview visual dos metadados
- Estatísticas por ano/disciplina

---

**Próximo passo:** Implementar scripts SQL e atualizar RPCs! 🚀

