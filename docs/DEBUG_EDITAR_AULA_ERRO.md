# 🐛 DEBUG: Erro ao Atualizar Aula

**Data:** 27/10/2025  
**Status:** 🔍 Logs Adicionados

---

## 🎯 PROBLEMA

Ao tentar salvar a edição de uma aula, erro genérico aparece: `Erro ao atualizar aula: {}`

---

## ✅ SOLUÇÃO APLICADA

Adicionados **logs detalhados** em cada etapa do processo:

### Logs que você vai ver:

```
🔄 Iniciando atualização da aula...
   Aula ID: xxx
   Título: xxx
   Itens selecionados: X

1️⃣ Atualizando informações básicas...
✅ Informações básicas atualizadas

2️⃣ Deletando associações antigas...
✅ Associações antigas deletadas

3️⃣ Inserindo blocos: X
   Dados dos blocos: [...]
✅ Blocos inseridos: X

4️⃣ Inserindo jogos: X
   Dados dos jogos: [...]
✅ Jogos inseridos: X

5️⃣ Atualizando pontos totais: X
✅ Pontos totais atualizados

🎉 Aula atualizada com sucesso!
```

### Se houver erro, você verá:

```
❌ ERRO COMPLETO: Error {...}
❌ Tipo do erro: object
❌ Nome do erro: Error
❌ Mensagem: [mensagem detalhada]
❌ Stack: [stack trace]
```

---

## 🧪 COMO TESTAR

1. **Limpe o cache** (Ctrl+F5)
2. **Abra o Console do Navegador** (F12)
3. Acesse `/admin/aulas/editar/[id]`
4. Faça alguma alteração (adicionar/remover item)
5. Clique em **"Salvar Alterações"**
6. **Veja os logs no console**

---

## 🔍 POSSÍVEIS CAUSAS

### Causa 1: Permissões RLS
**Sintoma:** Erro ao deletar ou inserir
**Solução:** Verificar RLS das tabelas `aulas_blocos` e `aulas_jogos`

```sql
-- Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('aulas_blocos', 'aulas_jogos');

-- Se RLS estiver ativado, desabilitar (admin não precisa)
ALTER TABLE aulas_blocos DISABLE ROW LEVEL SECURITY;
ALTER TABLE aulas_jogos DISABLE ROW LEVEL SECURITY;
```

### Causa 2: Foreign Key Constraint
**Sintoma:** Erro ao inserir jogo inexistente
**Solução:** Verificar se `game_id` existe

```sql
-- Ver jogos disponíveis
SELECT id, titulo, publicado FROM games WHERE publicado = true;

-- Verificar se game_id do erro existe
SELECT * FROM games WHERE id = 'UUID_DO_ERRO';
```

### Causa 3: Coluna `obrigatorio` não existe
**Sintoma:** Erro ao inserir em `aulas_jogos`
**Solução:** Verificar schema da tabela

```sql
-- Ver colunas de aulas_jogos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'aulas_jogos';

-- Se coluna 'obrigatorio' não existir, remover do código
-- ou adicionar coluna:
ALTER TABLE aulas_jogos ADD COLUMN obrigatorio BOOLEAN DEFAULT true;
```

### Causa 4: Tipo de dado errado
**Sintoma:** Erro ao converter valor
**Solução:** Ver logs `Dados dos blocos:` e `Dados dos jogos:`

---

## 📝 CHECKLIST DE DEBUG

### Passo 1: Ver Logs
- [ ] Abrir console (F12)
- [ ] Tentar salvar
- [ ] Copiar TODOS os logs
- [ ] Identificar em qual etapa falhou

### Passo 2: Verificar Banco
- [ ] Tabelas existem?
- [ ] RLS desabilitado para admin?
- [ ] Colunas corretas?
- [ ] Dados de teste válidos?

### Passo 3: Testar Manualmente
```sql
-- Testar delete
DELETE FROM aulas_blocos WHERE aula_id = 'UUID_DA_AULA';
DELETE FROM aulas_jogos WHERE aula_id = 'UUID_DA_AULA';

-- Testar insert bloco
INSERT INTO aulas_blocos (aula_id, bloco_template_id, ordem_na_aula)
VALUES ('UUID_DA_AULA', 'UUID_DO_BLOCO', 1);

-- Testar insert jogo
INSERT INTO aulas_jogos (aula_id, game_id, ordem_na_aula, obrigatorio)
VALUES ('UUID_DA_AULA', 'UUID_DO_JOGO', 2, true);
```

---

## 🆘 SE NADA FUNCIONAR

Envie-me:

1. **Logs completos do console** (desde 🔄 até ❌)
2. **Schema das tabelas:**
```sql
\d aulas_blocos
\d aulas_jogos
```
3. **RLS status:**
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('aulas_blocos', 'aulas_jogos');
```

---

## ✅ APÓS IDENTIFICAR O ERRO

1. Corrigir o problema (RLS, coluna, permissão, etc)
2. Testar novamente
3. Documentar solução

---

**Status:** Aguardando logs do console para diagnóstico! 🔍



