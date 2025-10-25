# 🧪 Guia de Testes: Sistema de Sessões

**Data:** 2025-10-20  
**Objetivo:** Testar o fluxo completo de uma sessão de aula

---

## 📋 **PRÉ-REQUISITOS**

Antes de começar os testes, verifique:

1. ✅ **SQL executado no Supabase:**
   - `CREATE_TABELAS_SESSOES_PONTUACAO.sql`
   - `RPC_SESSOES_PONTUACAO.sql`

2. ✅ **Dados no banco:**
   - Pelo menos 1 disciplina
   - Pelo menos 1 ano escolar
   - Pelo menos 1 planejamento importado com blocos e quizzes
   - Pelo menos 1 aula criada (vinculando blocos)
   - Pelo menos 1 turma criada (com `ano_escolar_id`)
   - Pelo menos 2 alunos criados (com PIN e ícone)
   - 1 professor vinculado à turma

3. ✅ **Frontend buildado:**
   ```bash
   pnpm run build
   pnpm run dev
   ```

---

## 🧪 **TESTE 1: PREPARAÇÃO DE DADOS**

### **Passo 1.1: Verificar Aulas**
```sql
-- Execute no Supabase SQL Editor
SELECT 
  a.id,
  a.titulo,
  a.ano_escolar_id,
  a.disciplina_id,
  COUNT(ab.id) as total_blocos
FROM aulas a
LEFT JOIN aulas_blocos ab ON ab.aula_id = a.id
GROUP BY a.id, a.titulo, a.ano_escolar_id, a.disciplina_id;
```

**Resultado esperado:**
```
| id   | titulo                  | ano_escolar_id | total_blocos |
|------|------------------------|----------------|--------------|
| uuid | Algoritmos - Bloco 1   | EF1            | 5            |
```

Se `total_blocos = 0`, você precisa criar uma aula em `/admin/aulas/criar`.

---

### **Passo 1.2: Verificar Quizzes**
```sql
SELECT 
  bt.id,
  bt.titulo,
  bt.quiz_id,
  q.titulo as quiz_titulo
FROM blocos_templates bt
LEFT JOIN quizzes q ON q.id = bt.quiz_id
WHERE bt.ano_escolar_id = 'EF1'
LIMIT 5;
```

**Resultado esperado:**
```
| id   | titulo                      | quiz_id | quiz_titulo           |
|------|----------------------------|---------|----------------------|
| uuid | O Despertar do Pensamento  | uuid    | Quiz - Despertar     |
```

Se `quiz_id IS NULL`, você precisa criar quizzes para os blocos.

---

### **Passo 1.3: Verificar Turma e Alunos**
```sql
-- Verificar turma
SELECT id, name, ano_escolar_id, professor_id
FROM turmas
WHERE ano_escolar_id = 'EF1';

-- Verificar alunos
SELECT id, full_name, pin_code, icone_afinidade
FROM alunos
WHERE turma_id = '<turma_id_acima>';
```

**Resultado esperado:**
- **Turma:** 1º Ano A (ano_escolar_id = EF1, professor_id preenchido)
- **Alunos:** Pelo menos 2 alunos com PIN e ícone

---

## 🧪 **TESTE 2: PROFESSOR INICIA SESSÃO**

### **Passo 2.1: Login como Professor**
1. Acesse: `http://localhost:3000/auth/login`
2. Email: `professor@escolapiloto.com.br`
3. Senha: `professor123`

### **Passo 2.2: Iniciar Sessão**
1. Clique em "Iniciar Sessão" no dashboard
2. **Selecione a Turma:** "1º Ano A"
3. Observe que as aulas são filtradas pelo ano da turma
4. **Selecione uma Aula:** "Algoritmos - Bloco 1"
5. Clique em "Iniciar Sessão"

**Resultado esperado:**
- ✅ Redireciona para `/dashboard/professor/sessao/[id]`
- ✅ Exibe QR Code
- ✅ Exibe código de 4 letras (ex: "AB-94")
- ✅ Mostra "0 alunos conectados"

---

### **Passo 2.3: Copiar Código da Sessão**
- Anote o código exibido (ex: **AB-94**)
- Você vai usar esse código para os alunos entrarem

---

## 🧪 **TESTE 3: ALUNO ENTRA NA SESSÃO**

### **Passo 3.1: Abrir Nova Janela Anônima**
- Abra uma janela anônima/privada no navegador
- Isso simula o dispositivo do aluno

### **Passo 3.2: Acessar Página de Login do Aluno**
1. Acesse: `http://localhost:3000/entrar`
2. Digite o código da sessão (ex: **AB-94**)
3. Clique em "Entrar"

**Resultado esperado:**
- ✅ Exibe lista de alunos da turma

---

### **Passo 3.3: Selecionar Aluno**
1. Clique no nome de um aluno (ex: "João Silva")
2. **Digite o PIN:** `1234` (ou o PIN real do aluno)
3. **Selecione o Ícone:** Clique no ícone de afinidade do aluno
4. Clique em "Entrar"

**Resultado esperado:**
- ✅ Redireciona para `/sessao/[id]`
- ✅ Exibe título da aula
- ✅ Exibe "Bloco 1 de 5"
- ✅ Exibe "0 pontos" no header
- ✅ Card do primeiro bloco (status: locked)

---

### **Passo 3.4: Verificar no Dashboard do Professor**
- Volte para a janela do professor
- **Resultado esperado:**
  - ✅ "1 aluno conectado"
  - ✅ Aparece card com nome do aluno
  - ✅ Progresso: "Bloco 1/5"
  - ✅ "0 pontos"

---

## 🧪 **TESTE 4: ALUNO COMPLETA BLOCO DE VÍDEO**

### **Passo 4.1: Iniciar Bloco**
- Na janela do aluno, clique em **"Iniciar Bloco"**

**Resultado esperado:**
- ✅ Exibe player de vídeo (se `tipo_midia = 'video'`)
- ✅ OU exibe conteúdo de texto (se `tipo_midia = 'texto'`)

---

### **Passo 4.2: Ver Conteúdo**
- **Se vídeo:** Assista até o final (ou pule para o final)
- **Se texto:** Clique em "Continuar"

**Resultado esperado:**
- ✅ Marca conteúdo como visto
- ✅ Se **não tem quiz:** completa bloco automaticamente
- ✅ Se **tem quiz:** exibe o quiz

---

## 🧪 **TESTE 5: ALUNO RESPONDE QUIZ**

### **Passo 5.1: Visualizar Quiz**
**Resultado esperado:**
- ✅ Exibe título do quiz
- ✅ Exibe pergunta
- ✅ Exibe 4 alternativas (A, B, C, D)
- ✅ **NÃO exibe qual é a correta** (importante!)

---

### **Passo 5.2: Responder Errado (1ª tentativa)**
1. Selecione uma alternativa **INCORRETA**
2. Clique em "Responder"

**Resultado esperado:**
- ✅ Toast: "❌ Incorreto - Tente novamente!"
- ✅ Contador: "Tentativa 1/2"
- ✅ Alternativa permanece selecionável

---

### **Passo 5.3: Responder Certo (2ª tentativa)**
1. Selecione a alternativa **CORRETA**
2. Clique em "Responder"

**Resultado esperado:**
- ✅ Toast: "✅ Correto! +5 pontos" (50% porque é 2ª tentativa)
- ✅ Pergunta marcada como "✓ Completo"
- ✅ Header atualiza: "5 pontos"
- ✅ Se todas respondidas: completa bloco automaticamente

---

### **Passo 5.4: Verificar Pontos no Dashboard do Professor**
- Volte para a janela do professor

**Resultado esperado:**
- ✅ Card do aluno mostra "5 pontos"
- ✅ Progresso: "1 de 5 completados"
- ✅ Barra de progresso: 20%

---

## 🧪 **TESTE 6: ALUNO COMPLETA MAIS BLOCOS**

### **Passo 6.1: Próximo Bloco**
- Na janela do aluno, observe que o **Bloco 2** está desbloqueado

**Resultado esperado:**
- ✅ Card do Bloco 2 está visível
- ✅ Status: "active"
- ✅ Botão "Iniciar Bloco" disponível

---

### **Passo 6.2: Completar Bloco com Quiz (1ª tentativa certa)**
1. Clique em "Iniciar Bloco"
2. Ver conteúdo
3. Responder quiz **na 1ª tentativa**

**Resultado esperado:**
- ✅ Toast: "✅ Correto! +10 pontos" (100% porque é 1ª tentativa)
- ✅ Header: "15 pontos" (5 + 10)
- ✅ Desbloqueia Bloco 3

---

## 🧪 **TESTE 7: MÚLTIPLOS ALUNOS SIMULTÂNEOS**

### **Passo 7.1: Abrir 2ª Janela Anônima (Aluno 2)**
1. Abra outra janela anônima
2. Acesse `/entrar` com o mesmo código
3. Selecione **outro aluno** da lista
4. Faça login com PIN e ícone

---

### **Passo 7.2: Aluno 2 no Bloco 1, Aluno 1 no Bloco 3**
- **Aluno 1:** Está no Bloco 3
- **Aluno 2:** Está no Bloco 1

**Resultado esperado no Dashboard do Professor:**
```
┌─────────────┬───────────┬──────────┬──────────┐
│ Aluno       │ Bloco     │ Pontos   │ Status   │
├─────────────┼───────────┼──────────┼──────────┤
│ João Silva  │ 3/5       │ 15       │ ● Ativo  │
│ Maria Santos│ 1/5       │ 0        │ ● Ativo  │
└─────────────┴───────────┴──────────┴──────────┘
```

- ✅ Cada aluno avança no próprio ritmo
- ✅ Barras de progresso diferentes
- ✅ Atualização a cada 5 segundos

---

## 🧪 **TESTE 8: SESSÃO COMPLETA**

### **Passo 8.1: Aluno Completa Todos os Blocos**
- Continue completando blocos até o último (Bloco 5/5)

**Resultado esperado:**
- ✅ Toast: "🎉 Sessão Completa! Parabéns!"
- ✅ Participação marcada como 'completed'
- ✅ No dashboard do professor:
  - Status do aluno: "✓ Completo"
  - Barra de progresso: 100%

---

## 🧪 **TESTE 9: ENCERRAR SESSÃO**

### **Passo 9.1: Professor Encerra Sessão**
1. Na janela do professor, clique em **"Encerrar Sessão"**
2. Confirme no alerta

**Resultado esperado:**
- ✅ Redireciona para `/dashboard/professor`
- ✅ `sessions.status` → 'completed'
- ✅ `sessions.data_fim` → timestamp atual

---

### **Passo 9.2: Aluno Tenta Entrar em Sessão Encerrada**
1. Tente acessar `/entrar` com o mesmo código

**Resultado esperado:**
- ✅ Mensagem: "Sessão não encontrada ou inativa"
- ✅ Não permite entrar

---

## ✅ **TESTE 10: VALIDAÇÃO NO BANCO DE DADOS**

### **Verificar Pontos dos Alunos**
```sql
SELECT 
  a.full_name,
  a.pontos_totais,
  ps.pontos_ganhos_sessao,
  ps.blocos_completados,
  ps.status
FROM alunos a
JOIN participacoes_sessao ps ON ps.aluno_id = a.id
WHERE ps.session_id = '<session_id>';
```

**Resultado esperado:**
```
| full_name    | pontos_totais | pontos_ganhos_sessao | blocos_completados | status    |
|--------------|---------------|---------------------|-------------------|-----------|
| João Silva   | 50            | 50                  | 5                 | completed |
| Maria Santos | 15            | 15                  | 2                 | active    |
```

---

### **Verificar Respostas dos Quizzes**
```sql
SELECT 
  a.full_name,
  q.titulo as quiz_titulo,
  rq.pergunta_index,
  rq.correto,
  rq.pontos_ganhos,
  rq.tentativa_numero,
  rq.created_at
FROM respostas_quizzes rq
JOIN alunos a ON a.id = rq.aluno_id
JOIN quizzes q ON q.id = rq.quiz_id
WHERE rq.session_id = '<session_id>'
ORDER BY rq.created_at;
```

**Resultado esperado:**
- ✅ Registro de todas as tentativas
- ✅ Pontos corretos (10 para 1ª, 5 para 2ª)
- ✅ Flag `correto` = true/false

---

## 📊 **CHECKLIST FINAL**

### **Funcionalidades Testadas:**
- [ ] Professor escolhe turma e aula
- [ ] Sistema filtra aulas por ano escolar
- [ ] Gera QR Code e código de sessão
- [ ] Aluno faz login com PIN + ícone
- [ ] Player renderiza vídeo
- [ ] Player renderiza texto
- [ ] Quiz exibe perguntas sem revelar resposta
- [ ] Sistema de tentativas (2 máximo)
- [ ] Pontuação com multiplicador (100%, 50%)
- [ ] Pontos salvos no banco
- [ ] Cada aluno avança no próprio ritmo
- [ ] Professor vê progresso em tempo real
- [ ] Múltiplos alunos simultâneos
- [ ] Sessão completa (todos blocos)
- [ ] Encerrar sessão
- [ ] Dados salvos corretamente no banco

---

## 🐛 **PROBLEMAS COMUNS**

### **1. "Nenhuma aula disponível"**
**Causa:** Turma não tem `ano_escolar_id` ou não há aulas para esse ano.  
**Solução:**
```sql
-- Verificar turma
SELECT id, name, ano_escolar_id FROM turmas;

-- Criar aula em /admin/aulas/criar com o mesmo ano
```

---

### **2. "Quiz não aparece"**
**Causa:** Bloco não tem `quiz_id` vinculado.  
**Solução:**
```sql
-- Verificar blocos sem quiz
SELECT id, titulo, quiz_id FROM blocos_templates WHERE quiz_id IS NULL;

-- Criar quiz em /admin/quizzes/criar e vincular ao bloco
```

---

### **3. "Aluno não ganha pontos"**
**Causa:** RPC `registrar_resposta_quiz` não está funcionando.  
**Solução:**
```sql
-- Testar RPC manualmente
SELECT * FROM registrar_resposta_quiz(
  '<quiz_id>',
  '<aluno_id>',
  '<session_id>',
  '<participacao_id>',
  0,  -- pergunta_index
  1,  -- resposta_escolhida
  true,  -- correto
  10,  -- pontos_ganhos
  1  -- tentativa_numero
);
```

---

### **4. "Progresso não atualiza no dashboard do professor"**
**Causa:** RPC `get_alunos_sessao` não está funcionando.  
**Solução:**
```sql
-- Testar RPC
SELECT * FROM get_alunos_sessao('<session_id>');
```

---

## 🎉 **CONCLUSÃO**

Se todos os testes passaram, o sistema está **100% funcional**!

**Próximos passos:**
1. Deploy para produção (Vercel)
2. Configurar domínio personalizado
3. Testar com alunos reais
4. Coletar feedback
5. Implementar melhorias (Lottie, Phaser, H5P)

---

**Status:** 🟢 **PRONTO PARA PRODUÇÃO**






