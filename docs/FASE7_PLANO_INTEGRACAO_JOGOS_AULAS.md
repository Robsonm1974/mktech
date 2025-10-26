# 🎮 FASE 7: Integrar Jogos na Criação de Aulas

## ✅ ENTENDIMENTO CONFIRMADO

**Situação Atual:**
- Admin cria aulas em `/admin/aulas/criar`
- Seleciona **blocos** da lista disponível
- Blocos são adicionados à aula em sequência
- Aluno assiste a aula percorrendo todos os blocos + quizzes
- Blocos são salvos em `aulas_blocos` com `ordem_na_aula`

**Objetivo:**
- Adicionar **jogos** à criação de aulas
- Jogos devem aparecer na mesma sequência dos blocos
- Jogos são salvos em `aulas_jogos` (tabela já existe!)
- Aluno joga os jogos durante a aula, na ordem definida

---

## 📊 ESTRUTURA ATUAL DO BANCO

### Tabelas Relevantes:

#### `aulas_blocos` (já existe)
```sql
CREATE TABLE aulas_blocos (
  id UUID PRIMARY KEY,
  aula_id UUID REFERENCES aulas(id) ON DELETE CASCADE,
  bloco_template_id UUID REFERENCES blocos_templates(id),
  ordem_na_aula INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(aula_id, bloco_template_id)
);
```

#### `aulas_jogos` (já existe! ✅)
```sql
CREATE TABLE aulas_jogos (
  id UUID PRIMARY KEY,
  aula_id UUID REFERENCES aulas(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id),
  ordem_na_aula INTEGER NOT NULL,
  obrigatorio BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(aula_id, ordem_na_aula)
);
```

**Solução:** Os blocos e jogos compartilham a mesma sequência de `ordem_na_aula`:
- Bloco 1 → `ordem_na_aula = 1` (em `aulas_blocos`)
- Jogo 1 → `ordem_na_aula = 2` (em `aulas_jogos`)
- Bloco 2 → `ordem_na_aula = 3` (em `aulas_blocos`)
- Jogo 2 → `ordem_na_aula = 4` (em `aulas_jogos`)

---

## 🎯 PLANO DE IMPLEMENTAÇÃO

### **ETAPA 1: Atualizar RPC de Criação de Aula** ⚠️ BACKEND

#### Criar novo RPC `insert_aula_with_itens_admin`:
```sql
CREATE OR REPLACE FUNCTION insert_aula_with_itens_admin(
  p_trilha_id UUID,
  p_titulo VARCHAR,
  p_descricao TEXT DEFAULT NULL,
  p_itens JSONB  -- [{"tipo": "bloco", "id": "uuid", "ordem": 1}, {"tipo": "jogo", "id": "uuid", "ordem": 2}]
)
RETURNS JSONB
```

**Lógica:**
- Criar aula
- Percorrer `p_itens` (JSONB array)
- Se `tipo = 'bloco'` → inserir em `aulas_blocos`
- Se `tipo = 'jogo'` → inserir em `aulas_jogos`
- Calcular pontos totais (apenas blocos)
- Detectar ano e disciplina do primeiro bloco

---

### **ETAPA 2: Criar RPC de Leitura de Aula Completa** ⚠️ BACKEND

#### Criar novo RPC `get_aula_completa_com_itens`:
```sql
CREATE OR REPLACE FUNCTION get_aula_completa_com_itens(p_aula_id UUID)
RETURNS JSONB
```

**Retorna:**
```json
{
  "aula": {...},
  "itens": [
    {"tipo": "bloco", "ordem": 1, "id": "...", "titulo": "...", "quizzes": [...]},
    {"tipo": "jogo", "ordem": 2, "id": "...", "titulo": "...", "duracao": 120},
    {"tipo": "bloco", "ordem": 3, ...}
  ]
}
```

---

### **ETAPA 3: Atualizar Frontend `/admin/aulas/criar`** ⚠️ FRONTEND

#### Mudanças na UI:

**ANTES** (2 colunas):
```
┌─────────────────┬──────────────────┐
│ Blocos          │ Blocos           │
│ Disponíveis     │ Selecionados     │
└─────────────────┴──────────────────┘
```

**DEPOIS** (3 colunas):
```
┌──────────────┬──────────────┬─────────────────┐
│ Blocos       │ 🎮 Jogos     │ Sequência       │
│ Disponíveis  │ Disponíveis  │ da Aula         │
│              │   (NOVO!)    │ (Blocos+Jogos)  │
└──────────────┴──────────────┴─────────────────┘
```

#### Mudanças no State:
```typescript
type ItemAula = {
  tipo: 'bloco' | 'jogo'
  id: string
  ordem: number
  dados: BlocoTemplate | Game
}
const [itensSelecionados, setItensSelecionados] = useState<ItemAula[]>([])
const [jogosDisponiveis, setJogosDisponiveis] = useState<Game[]>([])
```

---

### **ETAPA 4: Atualizar Player do Aluno** ⚠️ FRONTEND

**Arquivo:** `src/app/sessao/[sessionId]/page.tsx`

#### Renderização condicional:
```tsx
{itemAtual?.tipo === 'bloco' && (
  <div>{/* Renderizar bloco + quiz */}</div>
)}

{itemAtual?.tipo === 'jogo' && (
  <AdventureRunnerPlayer
    questions={perguntas}
    duration={itemAtual.duracao_segundos}
    onComplete={handleJogoCompleto}
  />
)}
```

---

## 🎯 RESUMO DAS MUDANÇAS

### Backend (SQL):
1. ✅ `aulas_jogos` já existe
2. 🔄 Criar RPC `insert_aula_with_itens_admin` (NOVO)
3. 🔄 Criar RPC `get_aula_completa_com_itens` (NOVO)

### Frontend:
1. 🔄 `/admin/aulas/criar` - Adicionar coluna "Jogos Disponíveis"
2. 🔄 `/admin/aulas/criar` - Lista unificada de blocos + jogos selecionados
3. 🔄 `/sessao/[sessionId]` - Player suportar blocos + jogos

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### SQL (Backend):
- [ ] Criar migration `insert_aula_with_itens_admin.sql`
- [ ] Criar migration `get_aula_completa_com_itens.sql`
- [ ] Testar RPCs manualmente no SQL Editor

### Frontend (Admin):
- [ ] Adicionar `loadJogosDisponiveis()` em `criar/page.tsx`
- [ ] Modificar state de `blocosSelecionados` para `itensSelecionados`
- [ ] Adicionar coluna "Jogos Disponíveis" no grid
- [ ] Atualizar `handleSubmit` para chamar novo RPC

### Frontend (Player):
- [ ] Modificar `loadBlocos` para `loadItensAula`
- [ ] Adicionar renderização condicional bloco vs jogo
- [ ] Integrar `AdventureRunnerPlayer` no fluxo

---

**Data**: 26/10/2025  
**Status**: 📋 **PLANO COMPLETO - PRONTO PARA IMPLEMENTAR**

