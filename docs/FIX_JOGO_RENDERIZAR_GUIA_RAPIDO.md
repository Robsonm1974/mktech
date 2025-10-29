# 🎮 GUIA RÁPIDO: Como Renderizar Jogos no Player

**Status:** ⚠️ REQUER IMPLEMENTAÇÃO

---

## 📊 SITUAÇÃO ATUAL

✅ **O que está funcionando:**
- RPC retorna blocos + jogos
- Frontend carrega blocos + jogos
- Estado `itensAula` salva TODOS os itens

❌ **O que falta:**
- Renderizar `AdventureRunnerPlayer` quando item é jogo
- Navegar para o próximo item após completar bloco/jogo
- Controlar progresso considerando jogos

---

## 🎯 SOLUÇÃO SIMPLES (ATÉ 15 MIN)

### Passo 1: Importar AdventureRunnerPlayer

**Arquivo:** `src/app/sessao/[sessionId]/page.tsx`

**Linha ~12:**
```typescript
import { AdventureRunnerPlayer } from '@/components/games/AdventureRunnerPlayer'
```

---

### Passo 2: Verificar se item atual é um jogo

Encontre onde `blocoAtual` é renderizado (linha ~800+):

```typescript
// PROCURE por:
{blocoAtual && (
  <div>... conteúdo do bloco ...</div>
)}

// SUBSTITUA por:
{itemAtual && itemAtual.tipo === 'bloco' && (
  <div>... conteúdo do bloco ...</div>
)}

{itemAtual && itemAtual.tipo === 'jogo' && (
  <AdventureRunnerPlayer 
    gameId={itemAtual.id}
    duration={itemAtual.duracao_segundos}
    questions={[]} // TODO: Carregar perguntas do jogo
    onGameComplete={() => {
      console.log('🎮 Jogo completado!')
      handleProximoItem()
    }}
  />
)}
```

---

### Passo 3: Definir `itemAtual` baseado em `blocoAtual`

Antes de renderizar, adicione:

```typescript
useEffect(() => {
  // Atualizar itemAtual quando blocoAtual mudar
  if (blocoAtual) {
    const itemCorrespondente = itensAula.find(item => 
      item.tipo === 'bloco' && item.id === blocoAtual.id
    )
    if (itemCorrespondente) {
      setItemAtual(itemCorrespondente)
    }
  }
}, [blocoAtual, itensAula])
```

---

### Passo 4: Criar função `handleProximoItem()`

```typescript
const handleProximoItem = async () => {
  if (!participacao || !itemAtual) return
  
  const proximoItem = itensAula.find(item => item.ordem > itemAtual.ordem)
  
  if (proximoItem) {
    if (proximoItem.tipo === 'bloco') {
      // Se for bloco, definir como blocoAtual
      setBlocoAtual(proximoItem)
    } else if (proximoItem.tipo === 'jogo') {
      // Se for jogo, definir como itemAtual diretamente
      setItemAtual(proximoItem)
    }
  } else {
    // Não há mais itens, sessão completa
    console.log('🎉 Sessão completa!')
    // Chama tela de conclusão
  }
}
```

---

## 🧪 TESTAR

1. **Abra o player** em uma sessão com jogo
2. **Complete o último bloco**
3. **Deve aparecer o jogo** na ordem 4
4. **Complete o jogo**
5. **Deve aparecer tela de conclusão**

---

## ⚠️ PROBLEMAS CONHECIDOS

### Problema 1: Progresso não conta jogos
**Sintoma:** Progresso mostra "3/3 blocos" mesmo tendo jogo

**Solução:** Atualizar `total_blocos` para incluir jogos

```typescript
const totalItens = itensAula.length // Inclui blocos + jogos
```

---

### Problema 2 leadboard de perguntas do jogo
**Sintoma:** Jogo não tem perguntas

**Solução:** Carregar perguntas do banco

```typescript
const loadGameQuestions = async (gameId: string) => {
  const { data, error } = await supabase
    .from('games')
    .select('configuracao')
    .eq('id', gameId)
    .single()
  
  // Extrair perguntas da configuracao
  return data?.configuracao?.perguntas || []
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Importar `AdventureRunnerPlayer`
- [ ] Adicionar verificação `itemAtual.tipo === 'jogo'`
- [ ] Criar `useEffect` para sincronizar `blocoAtual` e `itemAtual`
- [ ] Criar função `handleProximoItem()`
- [ ] Testar fluxo completo
- [ ] Corrigir progresso (total de itens)
- [ ] Carregar perguntas do jogo

---

**Status:** Aguardando implementação! 🚀



