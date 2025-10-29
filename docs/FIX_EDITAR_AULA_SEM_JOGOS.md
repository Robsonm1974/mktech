# 🐛 BUG: Página de Edição de Aula NÃO Mostra Jogos

**Data:** 27/10/2025  
**Status:** 🔴 **BUG CRÍTICO CONFIRMADO**

---

## 🔍 INVESTIGAÇÃO

### Aula de Teste: "Teste de aula com jogo"
**ID:** `0db70d0d-e6b6-4d18-801f-ce4fe8ea4586`

### Dados no Banco (CORRETOS ✅):

**Tabela `aulas_jogos`:**
```json
{
  "aula_id": "0db70d0d-e6b6-4d18-801f-ce4fe8ea4586",
  "game_id": "77020417-f335-4f16-88af-a041a39b0b73",
  "ordem_na_aula": 1  ← JOGO NA POSIÇÃO 1
}
```

**Tabela `aulas_blocos`:**
```json
[
  {"aula_id": "0db70d0d-...", "ordem_na_aula": 2},  ← Bloco 1
  {"aula_id": "0db70d0d-...", "ordem_na_aula": 3},  ← Bloco 2
  {"aula_id": "0db70d0d-...", "ordem_na_aula": 4}   ← Bloco 3
]
```

**Sequência esperada:**
1. 🎮 Jogo (ordem 1)
2. 📄 Bloco 1 (ordem 2)
3. 📄 Bloco 2 (ordem 3)
4. 📄 Bloco 3 (ordem 4)

---

## 🐛 PROBLEMA CONFIRMADO

### Página: `/admin/aulas/editar/[id]/page.tsx`

**O que acontece:**
1. ❌ NÃO carrega jogos de `aulas_jogos`
2. ✅ Carrega apenas blocos de `aulas_blocos`
3. ❌ NÃO exibe jogos na lista "Blocos Selecionados"
4. ❌ NÃO permite adicionar/remover jogos
5. ❌ Ao salvar, perde os jogos associados

**Resultado:** Jogos são **ignorados completamente** na edição!

---

## 📊 ANÁLISE DO CÓDIGO ATUAL

### `loadAula()` - Linhas 83-137

**Problema 1:** Carrega apenas `blocos_ids`
```typescript
// Linha 101 - SÓ BUSCA BLOCOS ❌
if (aulaEncontrada.blocos_ids && aulaEncontrada.blocos_ids.length > 0) {
  const { data: blocos, error: blocosError } = await supabase
    .from('blocos_templates')  // ❌ SÓ BLOCOS
    .select('...')
    .in('id', aulaEncontrada.blocos_ids)
  
  // ...
  setBlocosSelecionados(blocosOrdenados)  // ❌ SÓ BLOCOS
}
```

**Falta:**
- Carregar jogos de `aulas_jogos`
- Mesclar blocos + jogos na ordem correta
- Exibir na interface

### `handleSubmit()` - Linhas 221-266

**Problema 2:** Salva apenas blocos
```typescript
// Linha 246 - SÓ ATUALIZA BLOCOS ❌
const { data, error: blocosError } = await supabase.rpc('update_aula_blocos_admin', {
  p_aula_id: aulaId,
  p_blocos_ids: blocosSelecionados.map(b => b.id)  // ❌ SÓ BLOCOS
})
```

**Falta:**
- Salvar jogos em `aulas_jogos`
- Usar RPC que aceita blocos + jogos
- Manter ordem correta

### Interface - Linhas 435-563

**Problema 3:** UI mostra apenas blocos
```tsx
{/* Linha 437 - SÓ BLOCOS DISPONÍVEIS ❌ */}
<div className="bg-white border border-slate-200 rounded-lg p-6">
  <h2>Blocos Disponíveis</h2>
  {/* ... só lista blocos */}
</div>

{/* Linha 502 - SÓ BLOCOS SELECIONADOS ❌ */}
<div className="bg-white border border-slate-200 rounded-lg p-6">
  <h2>Blocos Selecionados</h2>
  {/* ... só lista blocos */}
</div>
```

**Falta:**
- Coluna "Jogos Disponíveis"
- Exibir jogos na lista selecionada
- Visual diferenciado para jogos (ícone 🎮)

---

## ✅ SOLUÇÃO NECESSÁRIA

### 1. **Atualizar Interface**

Usar o mesmo padrão da página `/admin/aulas/criar/page.tsx`:

**Estrutura com 3 colunas:**
```
┌─────────────┬─────────────┬─────────────┐
│   Blocos    │    Jogos    │  Sequência  │
│ Disponíveis │ Disponíveis │   da Aula   │
├─────────────┼─────────────┼─────────────┤
│             │             │             │
│ [Blocos...] │ [Jogos...]  │ 1. 🎮 Jogo  │
│             │             │ 2. 📄 Bloco │
│             │             │ 3. 📄 Bloco │
│             │             │ 4. 📄 Bloco │
│             │             │             │
└─────────────┴─────────────┴─────────────┘
```

### 2. **Carregar Blocos + Jogos**

**Nova função `loadItensAula()`:**
```typescript
const loadItensAula = async (aulaId: string) => {
  // 1. Buscar blocos de aulas_blocos
  const { data: blocos } = await supabase
    .from('aulas_blocos')
    .select(`
      ordem_na_aula,
      bloco_template_id,
      blocos_templates (id, titulo, codigo_bloco, pontos_bloco)
    `)
    .eq('aula_id', aulaId)
  
  // 2. Buscar jogos de aulas_jogos
  const { data: jogos } = await supabase
    .from('aulas_jogos')
    .select(`
      ordem_na_aula,
      game_id,
      games (id, titulo, descricao, duracao_segundos)
    `)
    .eq('aula_id', aulaId)
  
  // 3. Transformar em itens unificados
  const itensBlocos = blocos?.map(b => ({
    tipo: 'bloco',
    id: b.bloco_template_id,
    ordem: b.ordem_na_aula,
    dados: b.blocos_templates
  })) || []
  
  const itensJogos = jogos?.map(j => ({
    tipo: 'jogo',
    id: j.game_id,
    ordem: j.ordem_na_aula,
    dados: j.games
  })) || []
  
  // 4. Combinar e ordenar
  const todosItens = [...itensBlocos, ...itensJogos]
    .sort((a, b) => a.ordem - b.ordem)
  
  setItensSelecionados(todosItens)
}
```

### 3. **Salvar Blocos + Jogos**

**Usar RPC que já existe: `insert_aula_with_itens_admin`**

Mas adaptar para UPDATE:
```typescript
const handleSubmit = async () => {
  // 1. Deletar associações antigas
  await supabase.from('aulas_blocos').delete().eq('aula_id', aulaId)
  await supabase.from('aulas_jogos').delete().eq('aula_id', aulaId)
  
  // 2. Inserir novas associações
  const blocos = itensSelecionados
    .filter(i => i.tipo === 'bloco')
    .map((item, index) => ({
      aula_id: aulaId,
      bloco_template_id: item.id,
      ordem_na_aula: itensSelecionados.indexOf(item) + 1
    }))
  
  const jogos = itensSelecionados
    .filter(i => i.tipo === 'jogo')
    .map((item, index) => ({
      aula_id: aulaId,
      game_id: item.id,
      ordem_na_aula: itensSelecionados.indexOf(item) + 1,
      obrigatorio: true
    }))
  
  if (blocos.length > 0) {
    await supabase.from('aulas_blocos').insert(blocos)
  }
  
  if (jogos.length > 0) {
    await supabase.from('aulas_jogos').insert(jogos)
  }
  
  toast.success('Aula atualizada!')
}
```

### 4. **Criar RPC de Edição (Opcional)**

Criar `update_aula_with_itens_admin` similar ao `insert_aula_with_itens_admin`:

```sql
CREATE OR REPLACE FUNCTION update_aula_with_itens_admin(
  p_aula_id UUID,
  p_titulo VARCHAR,
  p_descricao TEXT,
  p_itens JSONB
)
RETURNS JSONB
...
```

---

## 🚨 IMPACTO DO BUG

### Usuário cria aula com jogo:
1. ✅ Jogo é salvo corretamente em `aulas_jogos`
2. ✅ Aparece na listagem de aulas
3. ❌ **Ao editar: jogo desaparece da interface**
4. ❌ **Ao salvar: jogo é perdido permanentemente**
5. ❌ **Player não executa o jogo**

### Gravidade: 🔴 **CRÍTICA**
- Perda de dados
- Funcionalidade quebrada
- Inconsistência entre criar/editar

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### Backend (SQL):
- [ ] Criar `update_aula_with_itens_admin` RPC (opcional)
- [ ] Testar delete + insert de blocos/jogos

### Frontend:
- [ ] Adicionar coluna "Jogos Disponíveis"
- [ ] Carregar jogos de `aulas_jogos`
- [ ] Mesclar blocos + jogos em `itensSelecionados`
- [ ] Exibir ícone 🎮 para jogos, 📄 para blocos
- [ ] Permitir reordenar blocos + jogos juntos
- [ ] Atualizar `handleSubmit` para salvar ambos
- [ ] Testar edição completa

### Testes:
- [ ] Editar aula com só blocos
- [ ] Editar aula com só jogos
- [ ] Editar aula com blocos + jogos
- [ ] Reordenar itens
- [ ] Remover/adicionar jogos
- [ ] Salvar e verificar no banco
- [ ] Testar no player

---

## 🎯 SOLUÇÃO RÁPIDA (Temporária)

Se não puder implementar agora, **documentar claramente**:

```
⚠️ AVISO NA INTERFACE:
"Esta página de edição ainda não suporta jogos.
Para alterar jogos, delete a aula e crie novamente."
```

E adicionar botão para recriar aula com jogos.

---

## ✅ CONCLUSÃO

**Status:** Bug confirmado e documentado  
**Próximo passo:** Implementar edição completa com blocos + jogos  
**Prioridade:** Alta (perda de dados)  
**Tempo estimado:** 2-3 horas de desenvolvimento

**Observação:** O sistema de criação (`/criar`) JÁ FUNCIONA corretamente. Apenas a **edição** (`/editar/[id]`) está quebrada para jogos.



