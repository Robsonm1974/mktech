# 🐛 DEBUG PLAYER - FASE 8

## 🔍 PROBLEMAS IDENTIFICADOS

### 1. ❌ **Player NÃO carrega JOGOS**
O RPC `get_blocos_sessao` retorna apenas BLOCOS, não jogos!

**Linha 227-230** (`sessao/[sessionId]/page.tsx`):
```typescript
const { data: blocosResponse } = await supabase.rpc(
  'get_blocos_sessao',
  { p_session_id: sessionId }
)
```

**Problema**: Este RPC só busca da tabela `aulas_blocos`, ignora `aulas_jogos`!

---

### 2. ❌ **Sequência de blocos pode estar quebrada**
O player depende do campo `ordem` dos blocos.

---

### 3. ❌ **Áudios podem não estar funcionando**
O player usa `audioRef` mas pode não estar inicializado.

---

## 🎯 SOLUÇÃO

### **OPÇÃO A: Criar RPC Novo** (RECOMENDADO)
Criar `get_itens_sessao` que retorna BLOCOS + JOGOS misturados.

### **OPÇÃO B: Atualizar RPC Existente**
Modificar `get_blocos_sessao` para incluir jogos.

---

## ✅ IMPLEMENTAÇÃO

### PASSO 1: Criar RPC para buscar blocos + jogos

```sql
CREATE OR REPLACE FUNCTION get_itens_aula_sessao(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_aula_id UUID;
  v_blocos JSONB;
  v_jogos JSONB;
  v_itens JSONB;
BEGIN
  -- 1. Buscar ID da aula da sessão
  SELECT aula_id INTO v_aula_id
  FROM sessions
  WHERE id = p_session_id;
  
  IF v_aula_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sessão não encontrada');
  END IF;
  
  RAISE NOTICE 'Buscando itens para aula_id: %', v_aula_id;
  
  -- 2. Buscar BLOCOS
  SELECT jsonb_agg(
    jsonb_build_object(
      'tipo', 'bloco',
      'id', bt.id,
      'ordem_na_aula', ab.ordem_na_aula,
      'titulo', bt.titulo,
      'conteudo_texto', bt.conteudo_texto,
      'tipo_midia', bt.tipo_midia,
      'midia_url', bt.midia_url,
      'midia_metadata', bt.midia_metadata,
      'pontos_bloco', bt.pontos_bloco,
      'quiz_id', bt.quiz_id,
      'quiz', (
        SELECT jsonb_build_object(
          'id', q.id,
          'titulo', q.titulo,
          'tipo', q.tipo,
          'perguntas', q.perguntas
        )
        FROM quizzes q
        WHERE q.bloco_id = bt.id
        LIMIT 1
      )
    )
    ORDER BY ab.ordem_na_aula
  )
  INTO v_blocos
  FROM aulas_blocos ab
  JOIN blocos_templates bt ON ab.bloco_template_id = bt.id
  WHERE ab.aula_id = v_aula_id;
  
  RAISE NOTICE 'Blocos encontrados: %', jsonb_array_length(COALESCE(v_blocos, '[]'::jsonb));
  
  -- 3. Buscar JOGOS
  SELECT jsonb_agg(
    jsonb_build_object(
      'tipo', 'jogo',
      'id', g.id,
      'ordem_na_aula', aj.ordem_na_aula,
      'titulo', g.titulo,
      'descricao', g.descricao,
      'duracao_segundos', g.duracao_segundos,
      'codigo', g.codigo,
      'configuracao', g.configuracao
    )
    ORDER BY aj.ordem_na_aula
  )
  INTO v_jogos
  FROM aulas_jogos aj
  JOIN games g ON aj.game_id = g.id
  WHERE aj.aula_id = v_aula_id;
  
  RAISE NOTICE 'Jogos encontrados: %', jsonb_array_length(COALESCE(v_jogos, '[]'::jsonb));
  
  -- 4. Combinar blocos + jogos
  v_itens := COALESCE(v_blocos, '[]'::jsonb) || COALESCE(v_jogos, '[]'::jsonb);
  
  -- 5. Ordenar por ordem_na_aula
  v_itens := (
    SELECT jsonb_agg(item ORDER BY (item->>'ordem_na_aula')::int)
    FROM jsonb_array_elements(v_itens) item
  );
  
  RAISE NOTICE 'Total de itens combinados: %', jsonb_array_length(COALESCE(v_itens, '[]'::jsonb));
  
  -- 6. Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'itens', COALESCE(v_itens, '[]'::jsonb),
    'total_blocos', jsonb_array_length(COALESCE(v_blocos, '[]'::jsonb)),
    'total_jogos', jsonb_array_length(COALESCE(v_jogos, '[]'::jsonb))
  );
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERRO: %', SQLERRM;
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
```

---

### PASSO 2: Atualizar Frontend

**Arquivo**: `src/app/sessao/[sessionId]/page.tsx`

#### 2.1. Adicionar interface para Jogo:
```typescript
interface Game {
  id: string
  titulo: string
  descricao: string
  duracao_segundos: number
  codigo: string
  configuracao: Record<string, unknown>
}

interface ItemAula {
  tipo: 'bloco' | 'jogo'
  id: string
  ordem_na_aula: number
  dados: BlocoTemplate | Game
}
```

#### 2.2. Mudar estado:
```typescript
// ANTES:
const [blocos, setBlocos] = useState<BlocoWithOrder[]>([])
const [blocoAtual, setBlocoAtual] = useState<BlocoWithOrder | null>(null)

// DEPOIS:
const [itens, setItens] = useState<ItemAula[]>([])
const [itemAtual, setItemAtual] = useState<ItemAula | null>(null)
```

#### 2.3. Atualizar loadSessionData:
```typescript
// Buscar itens da aula (blocos + jogos)
const { data: itensResponse, error: itensError } = await supabase.rpc(
  'get_itens_aula_sessao',
  { p_session_id: sessionId }
)

if (itensError || !itensResponse?.success) {
  throw new Error('Erro ao carregar itens da aula')
}

const itensTransformados: ItemAula[] = (itensResponse.itens || []).map((item: any) => ({
  tipo: item.tipo,
  id: item.id,
  ordem_na_aula: item.ordem_na_aula,
  dados: item.tipo === 'bloco' ? {
    id: item.id,
    titulo: item.titulo,
    conteudo_texto: item.conteudo_texto,
    // ... resto dos campos de bloco
  } : {
    id: item.id,
    titulo: item.titulo,
    descricao: item.descricao,
    duracao_segundos: item.duracao_segundos,
    // ... resto dos campos de jogo
  }
}))

setItens(itensTransformados)
```

#### 2.4. Renderização condicional:
```tsx
{itemAtual?.tipo === 'bloco' && (
  <div>
    {/* Renderizar conteúdo do bloco */}
    {/* Renderizar quiz do bloco */}
  </div>
)}

{itemAtual?.tipo === 'jogo' && (
  <div>
    {/* Renderizar jogo */}
    <AdventureRunnerPlayer
      questions={/* buscar perguntas do jogo */}
      duration={itemAtual.dados.duracao_segundos}
      onComplete={handleJogoCompleto}
    />
  </div>
)}
```

---

## 🧪 TESTE

### SQL:
```sql
-- Testar RPC
SELECT get_itens_aula_sessao('SESSION_ID_AQUI');

-- Deve retornar:
{
  "success": true,
  "itens": [
    {"tipo": "bloco", "ordem_na_aula": 1, ...},
    {"tipo": "jogo", "ordem_na_aula": 2, ...},
    {"tipo": "bloco", "ordem_na_aula": 3, ...}
  ],
  "total_blocos": 2,
  "total_jogos": 1
}
```

---

## ⚠️ PRIORIDADE

1. **URGENTE**: Criar RPC `get_itens_aula_sessao`
2. **URGENTE**: Atualizar player para usar novo RPC
3. **MÉDIO**: Integrar AdventureRunnerPlayer
4. **BAIXO**: Corrigir áudios

---

**Status**: 📋 AGUARDANDO APROVAÇÃO PARA IMPLEMENTAR



