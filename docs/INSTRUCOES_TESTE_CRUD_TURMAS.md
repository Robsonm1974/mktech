# 🧪 Instruções para Testar CRUD de Turmas

**Data:** 2025-10-20  
**Status:** ✅ Pronto para testar

---

## 📋 O QUE FOI IMPLEMENTADO

1. ✅ **Página de Edição** - `/turmas/[id]/editar`
2. ✅ **RPC Update Turma** - `update_turma_admin()`
3. ✅ **RPC Delete Turma** - `delete_turma_admin()` (já existia, corrigido)
4. ✅ **Documentação Completa**

---

## 🚀 PASSO A PASSO PARA TESTAR

### **ETAPA 1: Executar Script SQL no Supabase**

1. **Abrir Supabase SQL Editor**
2. **Copiar e colar todo o conteúdo de:**
   ```
   supabase/migrations/COMPLETE_CRUD_TURMAS.sql
   ```
3. **Executar (Run)**
4. **Verificar mensagens no console:**
   ```
   ✅ CRUD COMPLETO DE TURMAS - Configuração Finalizada
   📊 ESTATÍSTICAS:
      • Total de turmas: 5
   🔧 RPCs DISPONÍVEIS:
      • insert_turma_admin: 1 (✅ Criar)
      • update_turma_admin: 1 (✅ Editar)
      • delete_turma_admin: 1 (✅ Deletar)
   ```

---

### **ETAPA 2: Testar EDITAR Turma**

1. **Acessar:** http://localhost:3001/dashboard/admin-escola/turmas
2. **Localizar a turma "2º Ano A"** (ou qualquer outra)
3. **Clicar no botão "✏️ Editar"**
4. **Verificar página de edição:**
   - ✅ Dados atuais carregados
   - ✅ Ano Escolar bloqueado (não editável)
   - ✅ Formulário completo exibido

5. **Modificar dados:**
   - Designação: Mude de "A" para "B"
   - Nome: Mude para "2º Ano B"
   - Sala: Mude para "Sala 202"
   - Turno: Mude para "Tarde"

6. **Clicar em "Salvar Alterações"**
7. **Verificar:**
   - ✅ Toast "Turma atualizada com sucesso!"
   - ✅ Redirecionado para `/turmas`
   - ✅ Turma aparece com novos dados

---

### **ETAPA 3: Testar DELETAR Turma (SEM Alunos)**

1. **Na lista de turmas, escolher uma turma SEM alunos**
   - Exemplo: "7º Ano C" (Alunos: 0)

2. **Clicar no botão "🗑️ Deletar"**

3. **Verificar popup de confirmação:**
   ```
   Confirma a exclusão da turma "7º Ano C"?
   ```

4. **Clicar em "OK"**

5. **Verificar:**
   - ✅ Toast "Turma excluída com sucesso!"
   - ✅ Turma sumiu da lista
   - ✅ Estatísticas atualizadas (Total de Turmas: 4)

---

### **ETAPA 4: Testar DELETAR Turma (COM Alunos) - DEVE BLOQUEAR**

1. **Primeiro, precisamos adicionar um aluno a uma turma**
   - (Como ainda não temos CRUD de alunos, vou criar um script SQL)

2. **Executar no Supabase:**
   ```sql
   -- Adicionar um aluno de teste à turma "1º Ano Especial"
   INSERT INTO alunos (
     tenant_id,
     turma_id,
     full_name,
     pin_code,
     icone_afinidade,
     active
   )
   SELECT
     '550e8400-e29b-41d4-a716-446655440000'::UUID,
     id,
     'Aluno Teste',
     '1234',
     'star',
     true
   FROM turmas
   WHERE name = '1º Ano Especial'
   LIMIT 1;
   ```

3. **Recarregar página de turmas:** http://localhost:3001/dashboard/admin-escola/turmas

4. **Verificar que "1º Ano Especial" agora tem "Alunos: 1"**

5. **Tentar deletar "1º Ano Especial"**

6. **Clicar no botão "🗑️ Deletar"**

7. **Verificar:**
   - ✅ Toast de erro aparece
   - ✅ Mensagem: "Não é possível excluir. A turma '1º Ano Especial' possui 1 alunos ativos."
   - ✅ Turma **NÃO foi deletada**

---

### **ETAPA 5: Testar Validações de EDIÇÃO**

1. **Editar uma turma**
2. **Tentar mudar nome para um nome que já existe**
   - Ex: Mudar "5º Ano A" para "1º Ano Especial"
3. **Clicar em "Salvar Alterações"**
4. **Verificar:**
   - ✅ Toast de erro: "Já existe uma turma com este nome"
   - ✅ Dados não foram salvos

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### **Funcionalidades Básicas:**
- [ ] Listar turmas carrega sem erros
- [ ] Estatísticas exibem valores corretos
- [ ] Filtros funcionam (Ano, Professor, Turno)

### **Criar Turma:**
- [ ] Formulário carrega
- [ ] Pode criar turma nova
- [ ] Aparece no topo da lista

### **Editar Turma:**
- [ ] Botão "Editar" funciona
- [ ] Página carrega com dados atuais
- [ ] Ano Escolar está bloqueado
- [ ] Pode alterar designação
- [ ] Pode alterar nome
- [ ] Pode alterar professor
- [ ] Pode alterar sala
- [ ] Pode alterar turno
- [ ] Pode alterar descrição
- [ ] Salva alterações com sucesso
- [ ] Redireciona para lista

### **Deletar Turma:**
- [ ] Botão "Deletar" funciona
- [ ] Popup de confirmação aparece
- [ ] Deleta turma **SEM alunos**
- [ ] **BLOQUEIA** turma **COM alunos**
- [ ] Mensagem de erro clara quando bloqueado
- [ ] Lista atualiza após delete

### **Validações:**
- [ ] Não permite nome duplicado ao editar
- [ ] Professor obrigatório
- [ ] Nome obrigatório

---

## 🐛 SE ALGO NÃO FUNCIONAR

### **Erro ao editar:**
1. Abrir Console (F12)
2. Verificar erro exato
3. Executar no Supabase:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'update_turma_admin';
   ```
4. Me enviar resultado

### **Erro ao deletar:**
1. Abrir Console (F12)
2. Verificar erro exato
3. Executar no Supabase:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'delete_turma_admin';
   ```
4. Me enviar resultado

### **Página de edição não carrega:**
1. Verificar URL: deve ser `/dashboard/admin-escola/turmas/[uuid]/editar`
2. Verificar console do navegador
3. Me enviar screenshot

---

## 📸 SCREENSHOTS ESPERADOS

### **1. Lista de Turmas:**
- Cards com todas as turmas
- Botões "✏️ Editar" e "🗑️ Deletar" visíveis
- Estatísticas no topo

### **2. Página de Edição:**
- Formulário preenchido
- Banner azul com "Ano Escolar: [ano] (não pode ser alterado)"
- Todos os campos editáveis (exceto ano)
- Botões "Salvar" e "Cancelar"

### **3. Confirmação de Delete:**
- Popup nativo do browser
- Mensagem: "Confirma a exclusão da turma '[nome]'?"

### **4. Erro ao Deletar (com alunos):**
- Toast vermelho
- Mensagem clara sobre alunos ativos

---

## 🎯 RESULTADO ESPERADO

Após todos os testes, você deve ter:
- ✅ Conseguido editar uma turma
- ✅ Conseguido deletar uma turma SEM alunos
- ✅ Bloqueio ao tentar deletar turma COM alunos
- ✅ Validações funcionando

---

**Status:** ✅ **PRONTO PARA TESTAR**  
**Ação:** Execute o SQL e teste no navegador!  
**Me avise:** Como foram os testes! 🚀

