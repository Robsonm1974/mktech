# 🐛 DEBUG: Página de Edição Não Carrega Blocos/Jogos

**Data:** 27/10/2025  
**Status:** 🔍 Investigando

---

## 🎯 PROBLEMA

Quando você clica em "Editar Aula":
- ❌ Blocos não aparecem na lista
- ❌ Jogos não aparecem na lista
- ❌ Ao salvar, tenta deletar tudo (porque a lista está vazia)

**Possíveis causas:**
1. Dados não foram salvos corretamente na criação
2. Query do frontend está com erro
3. Foreign keys apontando para registros inexistentes
4. RLS bloqueando leitura (improvável, mas possível)

---

## ✅ PASSO 1: LOGS DETALHADOS NO FRONTEND

**O que foi feito:**
- Adicionados logs completos na função `loadAula()`
- Cada etapa agora mostra sucesso ou erro

**Como testar:**

1. **Abra o Console** (F12)
2. Acesse `/admin/aulas/editar/[ID_DA_AULA]`
3. **Veja os logs:**

### Logs esperados (SUCESSO):
```
🔄 Iniciando carregamento da aula: 0db70d0d-...
✅ Aula carregada: { id: "...", titulo: "...", descricao: "..." }

📦 Carregando blocos da aula...
✅ Blocos carregados: 3 blocos
   Dados brutos: [...]

🎮 Carregando jogos da aula...
✅ Jogos carregados: 1 jogos
   Dados brutos: [...]

🔄 Transformando blocos em ItemAula...
  ✅ Bloco transformado: Introdução ao Python
  ✅ Bloco transformado: Variáveis e Tipos
  ✅ Bloco transformado: Estruturas de Controle

🔄 Transformando jogos em ItemAula...
  ✅ Jogo transformado: Adventure Runner - Python

🎯 RESULTADO FINAL:
   Total de itens: 4
   Blocos: 3
   Jogos: 1
   Itens ordenados: ["1. [bloco] Introdução ao Python", "2. [bloco] Variáveis...", ...]
```

### Logs de ERRO (se houver problema):
```
❌ Erro ao carregar blocos: { code: "...", message: "..." }
❌ Erro ao carregar jogos: { code: "...", message: "..." }
⚠️ Bloco sem dados de template: { ordem_na_aula: 1, bloco_template_id: "..." }
⚠️ Nenhum bloco encontrado para esta aula
⚠️ Nenhum jogo encontrado para esta aula
```

---

## ✅ PASSO 2: DIAGNÓSTICO NO BANCO DE DADOS

**Execute este SQL no Supabase:**

📄 `supabase/migrations/DIAGNOSTICO_EDITAR_AULA.sql`

### O que o script faz:

1. **Lista todas as aulas**
2. **Mostra blocos de cada aula** (com JOIN)
3. **Mostra jogos de cada aula** (com JOIN)
4. **Combina blocos + jogos da última aula**
5. **Verifica status RLS**
6. **Conta itens por aula**
7. **Verifica foreign keys quebradas**
8. **Testa as queries do frontend**

### Resultado esperado:

```sql
-- 1. Ver aulas
┌──────────────────────────┬────────────────────────┬────────┐
│ id                       │ titulo                 │ itens  │
├──────────────────────────┼────────────────────────┼────────┤
│ 0db70d0d-...            │ Teste de aula com jogo │ 4      │
└──────────────────────────┴────────────────────────┴────────┘

-- 2. Ver blocos da aula
┌──────────┬────────────────────────┬───────┐
│ ordem    │ titulo                 │ pontos│
├──────────┼────────────────────────┼───────┤
│ 1        │ Introdução ao Python   │ 10    │
│ 2        │ Variáveis e Tipos      │ 10    │
│ 3        │ Estruturas de Controle │ 10    │
└──────────┴────────────────────────┴───────┘

-- 3. Ver jogos da aula
┌──────────┬────────────────────────┬──────────┐
│ ordem    │ titulo                 │ duração  │
├──────────┼────────────────────────┼──────────┤
│ 4        │ Adventure Runner       │ 120      │
└──────────┴────────────────────────┴──────────┘
```

### ⚠️ Se aparecer 0 itens:
```
total_blocos: 0
total_jogos: 0
```

**Significa:** Os dados **NÃO FORAM SALVOS** ao criar a aula!

---

## 🔍 PASSO 3: IDENTIFICAR A CAUSA

### Cenário A: Dados NÃO existem no banco

**Sintoma:** SQL mostra 0 blocos e 0 jogos

**Causa:** A página de **criar aula** não salvou corretamente

**Solução:** Verificar `/admin/aulas/criar` e testar criação novamente

---

### Cenário B: Dados EXISTEM mas frontend não carrega

**Sintoma:** SQL mostra blocos/jogos, mas frontend não carrega

**Causa possível 1:** Query do frontend tem erro de sintaxe

**Logs esperados:**
```
❌ Erro ao carregar blocos: { code: "42P01", message: "relation does not exist" }
```

**Causa possível 2:** Foreign keys quebradas

**SQL de verificação:**
```sql
-- Ver se há foreign keys quebradas
SELECT * FROM aulas_blocos ab
LEFT JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
WHERE bt.id IS NULL;

-- Se retornar algo, há problema!
```

**Causa possível 3:** RLS bloqueando

**SQL de verificação:**
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('aulas_blocos', 'aulas_jogos', 'blocos_templates', 'games');

-- TODOS devem estar FALSE (ou RLS desativado)
```

---

### Cenário C: Dados CARREGAM mas não APARECEM na UI

**Sintoma:** 
- Console mostra `✅ Blocos carregados: 3 blocos`
- Console mostra `🎯 Total de itens: 4`
- Mas a UI está vazia

**Causa:** Problema de renderização React

**Verificar:** Estado `itensSelecionados` está sendo atualizado?

```javascript
// Adicione este log no componente:
useEffect(() => {
  console.log('🔄 itensSelecionados mudou:', itensSelecionados)
}, [itensSelecionados])
```

---

## 🆘 PRÓXIMOS PASSOS

### AGORA:

1. ✅ **Abra o console** (F12)
2. ✅ **Acesse a página de editar** (`/admin/aulas/editar/[ID]`)
3. ✅ **Copie TODOS os logs** do console
4. ✅ **Execute o SQL de diagnóstico** no Supabase
5. ✅ **Copie os resultados** das queries

### DEPOIS:

Me envie:
- 📋 Logs completos do console
- 📋 Resultados das queries SQL
- 📋 ID da aula que você está tentando editar

Com essas informações, vou identificar **exatamente** onde está o problema!

---

## 🎯 CHECKLIST RÁPIDO

- [ ] Console aberto (F12)
- [ ] Acessar página de editar
- [ ] Copiar logs do console
- [ ] Executar SQL de diagnóstico
- [ ] Copiar resultados SQL
- [ ] Enviar tudo para análise

---

**Status:** Aguardando logs e resultados SQL! 🔍



