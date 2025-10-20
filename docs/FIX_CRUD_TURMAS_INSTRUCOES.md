# 🔧 Fix CRUD Turmas - Instruções

**Data:** 2025-10-18  
**Status:** ✅ Pronto para executar

---

## ⚠️ PROBLEMAS IDENTIFICADOS

1. **Erro SQL:** `RAISE NOTICE` fora do bloco `DO $$` → **CORRIGIDO**
2. **Erro RPC:** Retornando objeto vazio `{}` → **CORRIGIDO com logs detalhados**
3. **Tabela anos_escolares:** Estrutura diferente (tem `idade_referencia` ao invés de `idade_minima`) → **CORRIGIDO**

---

## 🚀 SOLUÇÃO RÁPIDA

### **Execute este único script no Supabase:**

```sql
-- Copie e cole todo o conteúdo de:
supabase/migrations/FIX_CRUD_TURMAS.sql
```

**O que este script faz:**
1. ✅ Verifica e adiciona colunas faltantes em `turmas`
2. ✅ Migra dados existentes de `grade_level` para `ano_escolar_id`
3. ✅ Cria índices para performance
4. ✅ Desabilita RLS (desenvolvimento)
5. ✅ Recria todos os 4 RPCs com tratamento de erro robusto
6. ✅ Valida a estrutura final

---

## 📝 PASSO A PASSO

### **1. Abrir Supabase SQL Editor**
- Acesse: https://supabase.com/dashboard/project/[seu-projeto]/sql
- Clique em "+ New query"

### **2. Copiar e Colar o Script**
- Abra: `supabase/migrations/FIX_CRUD_TURMAS.sql`
- Copie TODO o conteúdo
- Cole no SQL Editor

### **3. Executar**
- Clique em "Run" ou `Ctrl+Enter`
- Aguarde execução (deve levar ~2 segundos)

### **4. Verificar Resultado**
Você deve ver mensagens como:
```
NOTICE: ✅ Fix CRUD Turmas concluído!
NOTICE: ✅ Turmas: X
NOTICE: ✅ Anos Escolares: 9
NOTICE: ✅ RPCs criados: insert_turma_admin, get_turmas_admin, update_turma_admin, delete_turma_admin
```

---

## 🧪 TESTAR NO NAVEGADOR

### **1. Iniciar servidor:**
```bash
pnpm run dev
```

### **2. Fazer login:**
- URL: http://localhost:3001/auth/login
- Email: `makarispo@gmail.com`
- Senha: [sua senha]

### **3. Navegar para Turmas:**
- URL: http://localhost:3001/dashboard/admin-escola/turmas

### **4. Criar primeira turma:**
- Clique em "Nova Turma"
- Preencha:
  - **Ano Escolar:** 1º Ano (EF1)
  - **Designação:** A
  - **Nome:** (auto-gerado: "1º Ano A")
  - **Professor:** [selecione um professor]
  - **Sala:** Sala 201 (opcional)
  - **Turno:** Manhã (opcional)
- Clique em "Salvar Turma"

### **5. Verificar:**
- ✅ Toast "Turma criada com sucesso!"
- ✅ Redirecionado para lista de turmas
- ✅ Turma aparece na lista
- ✅ Estatísticas atualizadas

### **6. Testar Filtros:**
- Filtrar por Ano Escolar: 1º Ano
- Filtrar por Professor: [seu professor]
- Filtrar por Turno: Manhã
- Clicar em "Limpar Filtros"

### **7. Testar Edição:**
- Clicar no botão "✏️ Editar"
- Alterar designação para "B"
- Alterar nome para "1º Ano B"
- Salvar
- Verificar que turma foi atualizada

### **8. Testar Exclusão:**
- Tentar excluir turma SEM alunos → Deve funcionar
- Tentar excluir turma COM alunos → Deve bloquear com mensagem

---

## 🐛 LOGS DE DEBUG

Se ainda houver erro ao criar turma, verifique os logs:

### **No Console do Navegador (F12):**
```javascript
// Deve aparecer:
console.error('Erro ao criar turma:', error)
// ou
console.error('RPC retornou erro:', data)
```

### **No Supabase (Logs):**
- Acesse: Project → Logs → Postgres Logs
- Procure por: `insert_turma_admin chamado com:`
- Veja os parâmetros enviados e o erro exato

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] Script `FIX_CRUD_TURMAS.sql` executado sem erros
- [ ] Mensagens de sucesso apareceram
- [ ] Página de turmas carrega sem erro 404
- [ ] Pode criar nova turma
- [ ] Nome auto-gerado funciona
- [ ] Pode editar turma
- [ ] Ano Escolar bloqueado na edição
- [ ] Pode excluir turma (sem alunos)
- [ ] Bloqueia exclusão (com alunos)
- [ ] Filtros funcionam
- [ ] Estatísticas atualizam

---

## 🔍 ESTRUTURA FINAL ESPERADA

### **Tabela `turmas`:**
```
id: UUID
tenant_id: UUID
ano_escolar_id: VARCHAR(20)  ← NOVO
designacao: VARCHAR(50)      ← NOVO
name: VARCHAR(255)
professor_id: UUID
sala: VARCHAR(50)            ← NOVO
turno: VARCHAR(20)           ← NOVO
descricao: TEXT
grade_level: VARCHAR(20)     ← MANTIDO
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### **Tabela `anos_escolares`:**
```
id: VARCHAR(20)              ← "EF1", "EF2", ..., "EF9"
nome: VARCHAR(50)            ← "1º Ano", "2º Ano", ...
idade_referencia: INTEGER    ← 6, 7, 8, ..., 14
ordem: INTEGER               ← 1, 2, 3, ..., 9
descricao: TEXT
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### **RPCs criados:**
1. ✅ `insert_turma_admin()` - Criar turma
2. ✅ `get_turmas_admin()` - Listar turmas
3. ✅ `update_turma_admin()` - Editar turma
4. ✅ `delete_turma_admin()` - Deletar turma

---

## ❌ PROBLEMAS CONHECIDOS (CORRIGIDOS)

### **Problema 1:** Erro de sintaxe SQL
```
ERROR: syntax error at or near "RAISE"
```
**Solução:** `RAISE NOTICE` movido para dentro do bloco `DO $$`

### **Problema 2:** Erro vazio ao criar turma
```javascript
console.error('Erro ao criar turma:', {})
```
**Solução:** RPC reescrito com:
- Validações detalhadas
- Logs de debug (`RAISE NOTICE`)
- Try-catch com mensagens de erro
- Retorno JSON sempre estruturado

### **Problema 3:** Estrutura da tabela `anos_escolares`
**Solução:** Script atualizado para usar `idade_referencia` ao invés de `idade_minima`

---

## 📞 SUPORTE

Se ainda houver problemas após executar o script:

1. **Verificar logs no console do navegador**
2. **Verificar Postgres Logs no Supabase**
3. **Enviar screenshot do erro**
4. **Copiar mensagem exata do erro**

---

**Status:** ✅ **PRONTO PARA EXECUTAR**  
**Próxima ação:** Executar `FIX_CRUD_TURMAS.sql` no Supabase  
**Última atualização:** 2025-10-18

