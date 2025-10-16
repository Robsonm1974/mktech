# MKTECH User Rules - Business Rules & Access Control

**Versão:** 1.0  
**Para:** Product Managers, Business Analysts, Operações  
**Data:** Outubro 2025

---

## 1. RBAC (Role-Based Access Control)

### 1.1 Roles Definidas

| Role | Descrição | Acesso |
|------|-----------|--------|
| **superadmin** | Anthropic/MKTECH staff | Acesso total; gerenciar tenants |
| **admin_mktech** | Equipe MKTECH | Criar/editar aulas, blocos, quizzes, conteúdo |
| **admin_escola** | Diretor/Coordenador da escola | CRUD usuários, turmas, alunos; faturamento |
| **professor** | Professor/Monitor | Iniciar sessões, acompanhar turma |
| **aluno** | Criança (EF1/EF2) | Participar aulas, responder quizzes |
| **responsavel** | Pais/Responsável | Ver perfil do aluno (read-only) |

---

## 2. MATRIZ DE PERMISSÕES

### 2.1 Acesso a Recursos

| Recurso | Superadmin | Admin MKTECH | Admin Escola | Professor | Aluno | Responsável |
|---------|-----------|--------------|-------------|-----------|-------|-------------|
| **Tenants (CRUD)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Trilhas (CRUD)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Aulas (CRUD)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Blocos (CRUD)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Quizzes (CRUD)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Users (CRUD)** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Turmas (CRUD)** | ✅ | ❌ | ✅ | ✅ (read) | ❌ | ❌ |
| **Alunos (CRUD)** | ✅ | ❌ | ✅ | ✅ (read) | ❌ | ❌ |
| **Sessions (R/Iniciar/Encerrar)** | ✅ | ❌ | ✅ (read) | ✅ | ❌ | ❌ |
| **Resultados Aula** | ✅ | ✅ | ✅ | ✅ | ✅ (own) | ✅ (own) |
| **Billing/Faturamento** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Analytics Global** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 3. CICLO DE VIDA DO TENANT

### 3.1 Estados

```
┌─────────────────────────────────────────────────────────────┐
│ NOVO TENANT                                                 │
│ (School signup → trial)                                     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ TRIAL (14 dias)│
        │ • 1 aula demo  │
        │ • Sem alunos   │
        └────────┬───────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼ (Assina)          ▼ (Expira)
┌──────────┐        ┌──────────────┐
│ ACTIVE   │        │ TRIAL_EXPIRED│
│ • N seats│        │ (congelado)  │
│ • Paga   │        └──────────────┘
└────┬─────┘
     │
     ├─ UPGRADE: mais seats (efeito imediato)
     │
     ├─ DOWNGRADE: menos seats (próximo ciclo)
     │
     └─ Pagamento atrasado (7 dias tolerância)
        ▼
    ┌──────────────┐
    │ GRACE_PERIOD │
    │ (7 dias)     │
    │ • Funcional  │
    │ • Alertas    │
    └────────┬─────┘
             │ (sem pagamento após 7 dias)
             ▼
    ┌──────────────┐
    │ SUSPENDED    │
    │ • Bloqueado  │
    │ • Read-only  │
    │   (Admin)    │
    └────────┬─────┘
             │ (paga)
             ▼
         ACTIVE
```

### 3.2 Transições de Estado

| De | Para | Gatilho | Ação |
|---|------|---------|------|
| NOVO | TRIAL | Signup completo | Libera demo aula; define expira_at = now + 14 dias |
| TRIAL | ACTIVE | Assina plano | Recebe seats_total; status = active |
| TRIAL | TRIAL_EXPIRED | 14 dias passam | Status = trial_expired; sem acesso |
| ACTIVE | GRACE_PERIOD | Pagamento atrasa | Após vencimento, status = grace_period; alerta email |
| GRACE_PERIOD | SUSPENDED | 7 dias sem pagar | Status = suspended; bloqueia alunos/professores |
| SUSPENDED | ACTIVE | Pagamento recebido | Reativa imediatamente |
| ACTIVE | CANCELLED | Tenant solicita | Status = cancelled; read-only 30 dias; depois congelado |

---

## 4. REGRAS DE COBRANÇA & BILLING

### 4.1 Modelo de Preço (MVP)

```
Plano: Único
Preço: R$ 50,00 por aluno/mês
Ciclo: Mensal
```

### 4.2 Contagem de Alunos

**Definição:**
- **Aluno Contratado (Seat):** Direito de 1 aluno ativo durante o ciclo.
- **Aluno Ativo:** Marcado como `ativo = true` no cadastro da escola.
- **Ciclo de Cobrança:** Mensal (ex.: 01/11 a 30/11).

**Regra de Contagem:**
```
Total a Pagar = (Nº Alunos Ativos no Período) × R$ 50,00
```

**Exemplo:**
- Escola contrata 30 seats → R$ 1.500,00/mês.
- Habilitam 25 alunos → Pagam R$ 1.250,00 (cobrança é por habilitado, não por seat).
- Habilitam mais 5 alunos (total 30) → Pagam R$ 1.500,00 no próximo ciclo.

### 4.3 Fluxo de Assinatura

#### Onboarding
1. Escola cria conta (signup).
2. Acessa 1 aula demo por 14 dias (sem alunos).
3. Clica "Assinar" → Redirecionado para formulário de contato.

#### Contratação
1. Admin MKTECH envia proposta (N seats × R$ 50).
2. Escola aceita e efetua pagamento (PIX/TED).
3. MKTECH confirma pagamento e ativa: `status = active`, `seats_total = N`.

#### Cobrança
1. **Antecipado:** Antes do ciclo começar.
2. **Faturamento:** Manual (invoice gerado no admin MKTECH).
3. **Período:** Mensal, fixo (ex.: dia 1º a 30 de cada mês).

### 4.4 Upgrade & Downgrade

#### Upgrade
- **Quando:** Escola quer mais alunos que `seats_total`.
- **Gatilho:** Clica "Upgrade" ou tenta habilitar aluno > limite.
- **Fluxo:** Contacta MKTECH → Nova proposta → Pagamento → Ativa **imediato**.
- **Efeito:** Novo `seats_total` válido na mesma hora.

#### Downgrade
- **Quando:** Escola quer menos alunos.
- **Gatilho:** Solicita ao MKTECH.
- **Fluxo:** MKTECH aprova → Ajusta `seats_total`.
- **Efeito:** **Aplica no próximo ciclo** (não reduz capacidade do ciclo atual).
- **Exemplo:** Escola com 30 seats até 30/11, solicita downgrade em 15/11. Em 01/12, terá novo `seats_total`.

### 4.5 Atraso de Pagamento (Grace Period)

#### Timeline

| Evento | Ação | Acesso |
|--------|------|--------|
| **Vencimento** | Fatura gerada | Normal |
| **Dia 1-7 (Grace)** | Avisos email | Normal + alertas |
| **Dia 8+** | Status = SUSPENDED | Bloqueado (exceto admin) |
| **Paga** | Status = ACTIVE | Reativa imediato |

#### Regras Detalhadas

**Grace Period (Dias 1-7):**
```
- Plataforma: 100% funcional
- Email: Aviso polido (1x no dia 3, 1x no dia 6)
- Dados: Preservados
- Dashboard Tenant: Mostra status "Pagamento Atrasado"
```

**Suspensão (Dia 8+):**
```
- Alunos: ❌ Não podem entrar em novas sessões
- Professores: ❌ Não podem iniciar sessões
- Admin Escola: ✅ Acesso read-only (faturas, opção pagar)
- Histórico: ✅ Alunos veem badges/ranking (opcional)
- Dados: Preservados
```

**Reativação (ao pagar):**
```
- Status: ACTIVE (imediato)
- Acesso: 100% restaurado
- Email: Confirmação de reativação
- Próxima Fatura: 30 dias após reativação
```

### 4.6 Cancelamento

#### Cancelamento pelo Cliente
```
Timeline:
1. Tenant clica "Cancelar Assinatura"
2. MKTECH envia email confirmação
3. Status = CANCELLED
4. 30 dias: Read-only (exporta relatórios, dados)
5. Após 30 dias: Congelamento (sem acesso)
```

#### Cancelamento por Inadimplência (> 30 dias)
```
1. Após 30 dias de atraso (grace + suspended)
2. MKTECH marca: Status = CANCELLED_DEBT
3. Congelamento imediato
4. Reativação: Após regularizar débito + reinscição
```

#### O que Acontece ao Cancelar
| Item | Ação |
|------|------|
| **Dados Alunos** | Preservados (20 anos por LGPD) |
| **Badges/Pontos** | Preservados |
| **Acesso** | Bloqueado (read-only 30 dias) |
| **Relatórios** | Exportáveis durante 30 dias |
| **Readmissão** | Reinscição = novo contrato |

---

## 5. REGRAS DE ACESSO: PROFESSOR

### 5.1 Fluxo de Professor (Resumido)

```
1. Login (email + senha)
2. Dashboard: lista turmas de sua responsabilidade
3. Seleciona turma + aula
4. Clica "Iniciar Sessão"
   → Sistema gera QR + código curto
   → Exibe na tela (compartilhada)
5. Alunos escaneia/digita código
6. Professor ativa blocos (manual ou auto)
7. Encerra sessão
8. Vê relatório de participação
```

### 5.2 Permissões do Professor

| Ação | Permitido | Observação |
|------|-----------|-----------|
| **Ver turmas próprias** | ✅ | Apenas turmas atribuídas |
| **Ver alunos da turma** | ✅ | Apenas de suas turmas |
| **Iniciar sessão** | ✅ | Se tenant está ACTIVE |
| **Escolher aula** | ✅ | Aulas publicadas da trilha |
| **Ativar blocos** | ✅ | Manualmente ou automático |
| **Ver resultados em tempo real** | ✅ | % participação, não detalhe |
| **Ver respostas individuais** | ❌ | Future feature |
| **Dar dicas/hints** | ❌ | Future feature |
| **Editar aulas** | ❌ | Only Admin MKTECH |
| **Exportar relatórios** | ✅ | (future; CSV/PDF) |
| **Reset PIN aluno** | ✅ | Botão "Reset PIN" no aluno |

### 5.3 Limite de Sessões Simultâneas

```
Por Professor: 1 sessão ativa por vez
Por Turma: 1 sessão ativa por vez

Regra: Se professor tenta iniciar 2ª sessão enquanto 1ª está ativa,
sistema alerta: "Você já tem uma sessão ativa para esta turma.
Encerrá-la antes de iniciar outra?"
```

---

## 6. REGRAS DE ACESSO: ALUNO

### 6.1 Autenticação Aluno (Híbrida Simples)

**Fluxo:**
1. Acessa `/entrar` (page pública).
2. Escaneia QR **OU** digita código (ex.: `AB-94`).
3. Sistema valida e busca alunos daquela turma/sessão.
4. Seleciona seu nome (ou busca por nome).
5. Autentica com:
   - 1 **ícone de afinidade** (4 opções aleatórias: dog, cat, fruit, flower).
   - 1 **PIN numérico** (4 dígitos, fixo cadastrado).
6. Entra na sessão.

**Observações:**
- Sem e-mail/senha para aluno (MVP).
- Ícone é fixo (não muda entre sessões).
- PIN pode ser resetado pelo professor.
- Combinação (tenant, turma, aluno) + (ícone, PIN) deve ser única no tenant.

### 6.2 Permissões do Aluno (Durante Sessão)

| Ação | Permitido | Observação |
|------|-----------|-----------|
| **Entrar em sessão ativa** | ✅ | Se `ativo = true` |
| **Ver bloco ativo** | ✅ | Professor ativa |
| **Responder quiz** | ✅ | 1-N tentativas permitidas |
| **Ver próxima pergunta no quiz** | ✅ | Conforme responde |
| **Pausa/Saída** | ❌ | Sem pausa; saída preserva progresso |
| **Ver pontos/badges em tempo real** | ✅ | Atualiza após cada quiz |
| **Acessar perfil (fora sessão)** | ✅ | `/meu-perfil` |
| **Ver ranking** | ✅ | Turma + escola (nomes abreviados) |
| **Editar dados próprios** | ❌ | Apenas professor/admin |

### 6.3 Ciclo de Vida Aluno

```
┌──────────────┐
│ CADASTRADO   │ (admin_escola cria via CSV)
│ ativo = false│
└────────┬─────┘
         │
         ▼
    ┌─────────┐
    │ ATIVO   │ (admin_escola habilita)
    │ Pode    │
    │ entrar  │
    └────┬────┘
         │
    ┌────┴─────────────────┐
    │                      │
    ▼ (fim do ciclo)  ▼ (admin desativa)
┌──────────────┐   ┌──────────────┐
│ FIM_CICLO    │   │ INATIVO      │
│ (dados saved)│   │ (dados saved)│
└──────────────┘   └──────────────┘
```

### 6.4 Dados Preservados ao Sair

```
Quando aluno sai da sessão (acidental ou intencional):

✅ Preservado:
  - Respostas já respondidas
  - Pontos já ganhos
  - Badges já conquistadas
  - Progresso do bloco (qual bloco estava)

❌ Não preservado:
  - Timer do quiz (reseta)
  - Tentativas não usadas (reseta)

Ao voltar à mesma sessão:
  - Sistema detecta aluno (tenant + turma + aluno_id)
  - Recarrega bloco onde parou
  - Aluno continua do ponto onde saiu
```

---

## 7. REGRAS DE ACESSO: PAIS/RESPONSÁVEL

### 7.1 Autenticação Pais

**Fluxo:**
1. Acessa `/relatorio-aluno` (página pública, sem login aparente).
2. Sistema mostra campo: "Qual é o seu filho?"
3. Pais pode:
   - **Opção A:** Selecionar nome do filho (dropdown).
   - **Opção B:** Digitar código único do filho (ex.: `JO-1234`).
4. Faz login com:
   - **Email:** Email do responsável (cadastrado no aluno).
   - **Senha:** Senha do aluno (gerada pelo sistema).
5. **Primeiro acesso:** Força trocar senha.
6. Acessa perfil do filho (read-only).

### 7.2 Dados Visíveis para Pais

| Item | Visível | Detalhe |
|------|---------|--------|
| **Nome do Aluno** | ✅ | Completo |
| **Foto do Aluno** | ✅ | Se cadastrado |
| **Pontos Totais** | ✅ | Agregado |
| **Pontos por Disciplina** | ✅ | Gráfico (future) |
| **Badges Conquistadas** | ✅ | Com data |
| **Ranking Turma** | ✅ | Nomes abreviados (ex.: J.S.) |
| **Ranking Escola** | ✅ | Nomes abreviados |
| **Histórico de Aulas** | ✅ | Últimas 10 aulas |
| **Aula > Bloco > Quiz** | ✅ | Detalhes de cada quiz respondido |
| **% Acerto por Disciplina** | ✅ | Gráfico (future) |
| **Comparativo Turma** | ✅ | "Seu filho está X% acima da média" (future) |
| **Dados de Outros Alunos** | ❌ | Privado |
| **Respostas Exatas** | ❌ | Apenas agregado |

### 7.3 Permissões Pais

```
Leitura: ✅ Perfil do filho (pontos, badges, histórico)
Edição: ❌ Sem editar
Exportação: ✅ (future; PDF com histórico)
Feedback: ✅ Comentários/notas (future)
Contato: ✅ Com professor/escola (future)
```

---

## 8. REGRAS DE ACESSO: ADMIN ESCOLA

### 8.1 Permissões Admin Escola

| Ação | Permitido | Escopo |
|------|-----------|--------|
| **CRUD Professores** | ✅ | Seu tenant |
| **CRUD Turmas** | ✅ | Seu tenant |
| **CRUD Alunos** | ✅ | Seu tenant; import CSV |
| **Habilitar/Desabilitar Aluno** | ✅ | Respeita seats_total |
| **Reset PIN Aluno** | ✅ | Via botão |
| **Ver Dashboard Agregado** | ✅ | KPIs por turma/disciplina |
| **Ver Relatórios** | ✅ | Participação, engajamento |
| **Exportar Relatórios** | ✅ | (future; CSV/PDF) |
| **Gerenciar Assinatura** | ✅ | Ver status, upgrade, cancelamento |
| **Ver Faturamento** | ✅ | Invoices, histórico pagamento |
| **Criar Conteúdo** | ❌ | Only Admin MKTECH |
| **Ver Dados Outros Tenants** | ❌ | Bloqueado por RLS |

### 8.2 CRUD Alunos (Admin Escola)

#### Criar Alunos
```
Métodos:
1. Adicionar um a um (form)
2. Importar CSV (bulk)

CSV Esperado:
  nome_completo,email_responsavel,turma,numero_matricula
  João Silva,joao.pai@email.com,5ºA,12345
  Maria Santos,maria.mae@email.com,5ºA,12346

Validação:
  ✅ Email válido
  ✅ Turma existe
  ✅ Nome não vazio

Resultado:
  - Aluno criado com ativo = false
  - Sistema gera: icone_afinidade aleatório, pin_code aleatório
  - Email enviado para responsável (senha temporária) — future
```

#### Editar Aluno
```
Campos editáveis:
  - Nome
  - Email responsável
  - Turma (mudar para outra)
  - Ícone de afinidade
  - PIN code (reset)

Campos não editáveis:
  - Data criação
  - Histórico (imutável)
```

#### Habilitar/Desabilitar Aluno
```
Habilitar (ativo = true):
  - Pré-requisito: Tenant está ACTIVE
  - Pré-requisito: seats_used < seats_total
  - Se seats_used >= seats_total: Bloqueado; sugerir upgrade

Desabilitar (ativo = false):
  - Aluno não pode entrar em novas sessões
  - Dados preservados
  - Badges/histórico íntegro
```

#### Deletar Aluno
```
Soft Delete:
  - Marca ativo = false (não deleta physicamente)
  - Dados preservados por 1 ano (LGPD)

Após 1 ano:
  - Automático: delete de dados sensíveis
  - Mantém: Agregados anônimos (relatórios históricos)
```

### 8.3 Importação em Massa (CSV)

```typescript
// Fluxo técnico
1. Admin upload CSV
2. Sistema valida:
   - Formato (colunas esperadas)
   - Dados (emails, turmas)
   - Duplicatas
3. Preview: mostra # alunos a criar, alertas
4. Admin confirma
5. Sistema cria batch de alunos
6. Email com resultado (✅ criados, ⚠️ erros)
```

---

## 9. REGRAS DE ACESSO: ADMIN MKTECH

### 9.1 Permissões (Superadmin)

```
CRUD Tenants: ✅ Criar, editar, suspender, ativar
CRUD Trilhas: ✅ Criar, editar, publicar
CRUD Aulas: ✅ Criar, editar, publicar
CRUD Blocos: ✅ Criar, editar, deletar
CRUD Quizzes: ✅ Criar, editar, deletar
CRUD Badges: ✅ Criar, editar, deletar
Upload Assets: ✅ Vídeos, tilemaps, sprites, áudio
IA Question Gen: ✅ Gerar question packs com validação
Analytics Global: ✅ Dashboards de todo o sistema
Suporte/Troubleshoot: ✅ Acessar dados qualquer tenant
Configurações: ✅ Tema, mensagens, rate limiting
```

### 9.2 Dashboard Admin MKTECH

**Seções:**
1. **Tenants:** Lista, status, MRR (Monthly Recurring Revenue), churn.
2. **Analytics:** DAU, WAU, MAU, EngagementRate, NPS.
3. **Conteúdo:** Aulas publicadas, quizzes, blocos, versões.
4. **Issues:** Bugs reportados, uptime, latência.
5. **Financeiro:** Receita, inadimplentes, forecasting.

---

## 10. CICLO DE VIDA DA SESSÃO

### 10.1 Estados da Sessão

```
┌────────────────┐
│ INICIALIZANDO  │
│ (professor     │
│  clica start)  │
└────────┬───────┘
         │
         ▼
    ┌─────────┐
    │ ACTIVE  │ (QR gerado, alunos entram)
    │ Bloco 1 │
    └────┬────┘
         │
    ┌────┴──────────────────┐
    │ (aluno responde quiz) │
    │                       │
    ▼                       ▼
┌──────────┐        ┌────────────┐
│ Bloco 2  │ ← ←    │ PAUSED     │ (future)
│ (próximo)│        │ (professor │
└────┬─────┘        │  pausa)    │
     │              └────────────┘
     │ (último bloco respondido)
     ▼
┌─────────────────┐
│ COMPLETED       │
│ (fim da aula;   │
│  tela final com │
│  badges/pontos) │
└────────┬────────┘
         │
         ▼
    ┌──────────┐
    │ CLOSED   │
    │ (arquivada)
    └──────────┘
```

### 10.2 Regras de Progressão de Bloco

```
Progressão Manual (Professor controla):
  - Professor clica "Ativar Bloco N"
  - Alunos veem conteúdo bloco N
  - Alunos respondem quiz N
  - Professor clica "Próximo Bloco"

Progressão Automática (Sistema controla):
  - Aluno responde quiz N
  - Sistema: todos responderam OU timeout?
  - Se sim: auto-ativa bloco N+1
  - (Configurável por aula)

Timeout:
  - Se ninguém responde por 5 min: avança anyway
  - Alunos que não responderam: 0 pontos
```

### 10.3 Cálculo de Pontuação

```
Por Quiz Respondido:
  pontos_ganhos = (acertou ? pontos_max : 0) × multiplicador_tentativas
  
  Multiplicador:
    - Tentativa 1: 1.0x
    - Tentativa 2: 0.75x
    - Tentativa 3+: 0.5x (se permitido)

Agregação:
  pontos_aula = SUM(pontos_ganhos por bloco)
  pontos_usuario += pontos_aula
```

---

## 11. REGRAS DE GAMIFICAÇÃO

### 11.1 Pontos

```
Fonte: Quiz responses (correto vs errado)

Exemplo Aula "Algoritmos Básicos":
  Bloco 1 Quiz: 10 pts
  Bloco 2 Quiz: 15 pts
  Bloco 3 Quiz: 20 pts
  ────────────────────
  Total Aula: 45 pts

Aluno participa:
  - Quiz 1: Acerta (1ª tentativa) = 10 pts
  - Quiz 2: Erra (1ª tentativa) = 0 pts
  - Quiz 2: Acerta (2ª tentativa) = 15 × 0.75 = 11.25 pts
  - Quiz 3: Acerta (1ª tentativa) = 20 pts
  ────────────────────────────────
  Total: 10 + 0 + 11.25 + 20 = 41.25 pts
```

### 11.2 Badges

**Tipos:**

| Tipo | Exemplo | Condição | Frequência |
|------|---------|----------|-----------|
| **Marco** | "5 Aulas" | Completar 5 aulas | 1x |
| **Marco** | "Primeira 100%" | 1º quiz com 100% | 1x |
| **Disciplina** | "Mestre em Programação" | 100+ pts em Programação | 1x |
| **Disciplina** | "Lógico" | 50+ pts em Lógica | 1x |
| **Série** | "Novato" | Completar 1ª aula | 1x |
| **Série** | "Aprendiz" | 200+ pts total | 1x |
| **Série** | "Expert" | 500+ pts total | 1x |

**Desbloqueio Automático:**
```
Sistema verifica após cada quiz:
  IF (condição badge atendida) {
    badge_conquistada = true
    notifica aluno: "🎉 Você conquistou Badge X!"
    atualiza ranking
    envia email pais (notificação)
  }
```

### 11.3 Ranking

**Escopo:**
- Turma (alunos mesma turma)
- Escola (todos alunos tenant)

**Métrica:** Pontos totais (decrescente)

**Privacidade:**
```
Turma com 25 alunos:
  1º lugar: "João Silva" (nome completo — seu filho vê)
  2º lugar: "M.S." (abreviado — outro aluno não vê nome)
  3º lugar: "P.C." (abreviado)
  ...

Ranking Escola:
  Idem; nomes abreviados para não-1º lugar
```

**Atualização:** Em tempo real após cada quiz

---

## 12. CONFORMIDADE & PROTEÇÃO DE DADOS (LGPD)

### 12.1 Dados Sensíveis

```
Identificação:
  - Nome completo
  - CPF (se coletado — future)
  - Email responsável
  - Data nascimento

Biométricos:
  - Foto (optional)
  - (Reconhecimento facial: ❌ não coletar)

Comportamento:
  - Pontuação, badges (ok, não identificável agregado)
  - Histórico aulas (ok)
  - Respostas quiz (sensível: não compartilhar)
```

### 12.2 Autorização & Consentimento

**Signup Tenant:**
```
Checkbox obrigatório:
  ☑ Autorizo coletar dados de menores de idade para fins educacionais
     conforme LGPD.

  [ ] Desejo receber comunicações de marketing
```

**Cadastro Aluno (Admin Escola):**
```
Email enviado ao responsável:

  "Seu filho <nome> foi cadastrado na plataforma MKTECH.
   Seus dados (nome, email, scores educacionais) serão coletados
   para fins de ensino e acompanhamento escolar.
   
   Você tem direito de: Acessar, Corrigir, Deletar dados.
   Contato: privacidade@mktech.com.br
   
   [ Aceitar ] [ Revisar Termos ]"
```

### 12.3 Direitos LGPD

| Direito | Como Atender |
|--------|--------------|
| **Acesso** | Pais acessa `/relatorio-aluno`; export completo (future) |
| **Correção** | Admin escola edita dados aluno |
| **Deleção** | Botão "Deletar Aluno" (soft delete); dado hard-delete após 1 ano |
| **Portabilidade** | Export CSV com dados aluno (future) |
| **Remoção Consentimento** | Admin escola desativa aluno; dados preservados 1 ano |

### 12.4 Retenção de Dados

```
Aluno Ativo:
  - Dados: Preservados enquanto ativo

Aluno Inativo (desabilitado):
  - Dados: Preservados por 1 ano
  - Após 1 ano: Hard delete (GDPR compliance)

Tenant Cancelado:
  - Dados: Preservados 30 dias (read-only export)
  - Após 30 dias: Soft-delete (ativo = false); hard-delete após 1 ano

Relatórios Agregados:
  - Preservados indefinidamente (anônimos, ex.: "50 alunos; média 75 pts")
```

---

## 13. EDGE CASES & REGRAS ESPECIAIS

### 13.1 Aluno Tenta Entrar 2x Mesma Sessão

```
Fluxo:
1. João entra em Sessão A
2. João abre outro browser, tenta entrar novamente em Sessão A

Resultado: ✅ Permitido (mesma sessão, progresso sincronizado)
  - Sistema identifica: mesmo (tenant, turma, aluno)
  - Browser 1 & 2 veem conteúdo sincronizado (real-time)
  - Se responde quiz em browser 1, browser 2 avança automaticamente
```

### 13.2 Professor Encerra Sessão Enquanto Aluno Está Respondendo

```
Fluxo:
1. Aluno no meio de um quiz
2. Professor clica "Encerrar Sessão"

Resultado:
  - Aluno vê mensagem: "Sessão encerrada pelo professor"
  - Resposta atual: ❌ NÃO é salva
  - Respostas anteriores: ✅ Preservadas
  - Aluno pode?: ❌ Não; sessão fechada
  - Dados: Consultáveis em perfil (histórico)
```

### 13.3 Aluno Desativa Enquanto Sessão Está Ativa

```
Fluxo:
1. João (ativo = true) em sessão
2. Admin escola clica "Desativar João"

Resultado (imediato):
  - João: ⚠️ Alerta "Sua conta foi desativada"
  - Sessão: ❌ Encerra
  - Respostas atuais: ❌ NÃO salvas
  - Histórico: ✅ Preservado
  - Reativação: Admin re-ativa (ativo = true) → João pode entrar novamente
```

### 13.4 Tenant Suspende Enquanto Alunos Estão em Sessão

```
Fluxo:
1. Vários alunos em sessão ativa
2. Pagamento atrasa > 7 dias → Tenant suspended

Resultado (imediato):
  - Alunos: Recebem aviso "Plataforma indisponível"
  - Sessão: ❌ Congelada
  - Dados: ✅ Preservados
  - Reativação: Ao pagar → Alunos podem retomar histórico
```

### 13.5 Aluno Tenta Entrar em Sessão de Outra Turma

```
Fluxo:
1. João (turma 5ºA) escaneia QR de Sessão 5ºB

Resultado:
  - Sistema valida: aluno_id NÃO está em turma daquela sessão
  - Mensagem: "Você não está autorizado a entrar nesta aula"
  - Bloqueado
```

### 13.6 Pais com Múltiplos Filhos

```
Fluxo (Future Enhancement):
1. Pais (mesma email) tem 2 filhos cadastrados
2. Acessa `/relatorio-aluno`

Resultado (MVP):
  - Pais escolhe 1 filho (dropdown)
  - Acessa apenas perfil daquele filho

Future (V2):
  - Dashboard pais com abas (filho 1, filho 2)
  - Comparação entre irmãos (opcional)
```

---

## 14. NOTIFICAÇÕES & COMUNICAÇÃO

### 14.1 Emails Automáticos

| Evento | Para Quem | Mensagem |
|--------|-----------|----------|
| **Aluno Criado** | Responsável | Credenciais temporárias + link primeiro acesso |
| **Sessão Iniciada** | Pais (optional) | "Seu filho está em aula agora; pontuação ao final" |
| **Aula Completada** | Pais | "João completou 'Algoritmos' e ganhou Badge X" |
| **Pagamento Atrasado** | Admin Escola | "Seu pagamento venceu; plataforma suspenderá em 7 dias" |
| **Grace Period Fim** | Admin Escola | "Plataforma suspendida; regularize pagamento" |
| **Reativado** | Admin Escola | "Pagamento recebido; plataforma ativada" |
| **Desativado** | Admin Escola | "Aluno desativado; não pode entrar em novas aulas" |

### 14.2 In-App Notifications (Toast/Banner)

```
Aluno vê:
  - ✅ Quiz respondido corretamente (com pontos)
  - ❌ Quiz respondido incorretamente
  - 🎉 Badge conquistada
  - ⚠️ PIN resetado (professor)

Professor vê:
  - 👥 N alunos conectados
  - ✅ Quiz bloqueio respondido por X alunos
  - ⏰ Próximo bloco (aviso 1 min antes)

Pais vê:
  - 🎉 Filho conquistou badge
  - 📊 Novo relatório disponível
```

---

## 15. SLA (Service Level Agreement) & COMPLIANCE

### 15.1 Uptime Commitment

```
Target: ≥ 99.5% no horário letivo (weekdays 7h-18h, fuso São Paulo)

Exceções:
  - Manutenção planejada (announced 48h antes)
  - Eventos de força maior

Medição: Checker externo (ex.: Pingdom)

Compensação (future):
  - 30min-1h downtime: desconto 5% próximo ciclo
  - >1h downtime: desconto 10% próximo ciclo
```

### 15.2 Performance (Latência)

```
Targets:
  - Página carrega: < 2s (P95)
  - Quiz responde: < 500ms (P95)
  - Real-time sync: < 1s (P95)

Monitores:
  - Vercel Analytics
  - Supabase Logs
  - Custom RUM (future)
```

### 15.3 LGPD Compliance Checklist

- [ ] Política de Privacidade publicada.
- [ ] Consentimento explícito para coleta de menores.
- [ ] Direitos LGPD documentados (acesso, correção, deleção).
- [ ] Retenção de dados: 1 ano após inatividade.
- [ ] Criptografia em trânsito (HTTPS).
- [ ] Criptografia em repouso (Supabase default).
- [ ] RLS policies testadas (isolamento tenant).
- [ ] Audit logs para ações críticas (future).
- [ ] DPA (Data Processing Agreement) assinado com Supabase.
- [ ] Breach notification procedure documentada.

---

## 16. TESTES & VALIDAÇÃO DE REGRAS

### 16.1 Cenários de Teste (QA Checklist)

#### Autenticação Aluno
- [ ] QR code válido → aluno entra ✅
- [ ] QR code inválido → erro ❌
- [ ] Código curto válido → aluno entra ✅
- [ ] Código curto inválido → erro ❌
- [ ] Ícone correto + PIN correto → acesso ✅
- [ ] Ícone correto + PIN errado → bloqueado ❌
- [ ] Aluno outro tenant tenta entrar → bloqueado ❌

#### Progressão de Bloco
- [ ] Professor ativa bloco 1 → alunos veem ✅
- [ ] Aluno responde quiz 1 → avança bloco 2 ✅
- [ ] Último bloco respondido → tela fim de aula ✅
- [ ] Aluno sai e volta → retoma onde parou ✅

#### Pontuação & Badges
- [ ] Quiz acertado (1ª tentativa) → pontos max ✅
- [ ] Quiz acertado (2ª tentativa) → pontos 75% ✅
- [ ] 5 aulas completadas → badge "5 Aulas" ✅
- [ ] Ranking atualiza em tempo real ✅

#### Billing
- [ ] Upgrade seats → efeito imediato ✅
- [ ] Downgrade seats → efeito próximo ciclo ✅
- [ ] Pagamento atrasado 7 dias → SUSPENDED ✅
- [ ] Paga → reativa imediato ✅

#### Permissões (RLS)
- [ ] Professor vê apenas suas turmas ✅
- [ ] Admin escola vê todos alunos seu tenant ✅
- [ ] Admin MKTECH vê todos tenants ✅
- [ ] Aluno não vê dados outros alunos ❌

#### Pais
- [ ] Pais login com email + senha aluno ✅
- [ ] Pais vê apenas seu filho ✅
- [ ] Pais não pode editar ❌
- [ ] Pais vê badges filho em tempo real ✅

---

## 17. GLOSSÁRIO & DEFINIÇÕES

| Termo | Definição |
|-------|-----------|
| **Tenant** | Escola assinante; isolada por RLS no banco. |
| **Session** | Instância de aula executada (professor inicia, alunos entram). |
| **Bloco** | Unidade de conteúdo (vídeo, apresentação, Lottie). |
| **Quiz** | Teste de aprendizado ao fim do bloco (MCQ, V-F, game, H5P). |
| **Seat** | Direito contratual de 1 aluno ativo/mês. |
| **Aluno Ativo** | Aluno com `ativo = true`; pode entrar em sessões. |
| **Aluno Inativo** | Aluno com `ativo = false`; não pode entrar. |
| **Badge** | Recompensa visual por marco (ex.: "5 Aulas"). |
| **Ranking** | Ordenação de alunos por pontos (turma/escola). |
| **RLS** | Row Level Security; segurança multi-tenant Supabase. |
| **Grace Period** | 7 dias de tolerância pós-vencimento; plataforma funciona. |
| **SUSPENDED** | Estado de bloqueio; alunos/profs não acessam. |
| **PIN** | 4 dígitos numéricos; autenticação aluno. |
| **Ícone de Afinidade** | 1 de 4 opções (dog, cat, fruit, flower); autenticação aluno. |
| **xAPI** | Experience API; padrão de rastreamento eventos H5P. |
| **LGPD** | Lei Geral de Proteção de Dados (Brasil). |
| **MRR** | Monthly Recurring Revenue. |
| **DAU/WAU/MAU** | Daily/Weekly/Monthly Active Users. |

---

## 18. ROADMAP DE FEATURES (Pós-MVP)

### V1.1
- [ ] Pagamento automatizado (Stripe/PagSeguro).
- [ ] 2FA (professor/admin).
- [ ] Hints durante quiz.
- [ ] IA para gerar question packs.

### V1.5
- [ ] Exportação de relatórios (PDF/CSV).
- [ ] Relatórios avançados (por competência, disciplina).
- [ ] Múltiplos filhos para pais (dashboard).
- [ ] Audit logs completo.

### V2.0
- [ ] Assistente IA durante quiz ("Pergunta à IA").
- [ ] Adaptive learning (trilhas personalizadas).
- [ ] Mobile app nativo.
- [ ] Integração LMS (Google Classroom).
- [ ] Competições entre turmas.

### V3.0+
- [ ] AR/VR experiments.
- [ ] Feedback de voz (IA coach).
- [ ] Compartilhamento badges redes sociais.
- [ ] Pais-professor chat (comunicação).

---

## 19. TROUBLESHOOTING & SUPORTE

### 19.1 Problemas Comuns & Soluções

| Problema | Causa | Solução |
|----------|-------|--------|
| **Aluno não consegue entrar** | PIN errado | Professor reseta PIN via CRUD |
| **"Não há seats disponíveis"** | Limite atingido | Admin contata MKTECH para upgrade |
| **Ranking não atualiza** | Cache ou RLS | Refresh página; verificar RLS policy |
| **Session não abre** | QR inválido | Gerar novo QR |
| **Pais não consegue acessar** | Senha errada | Link de recuperação por email |
| **Dados não sincronizam** | Conexão internet | Aguardar reconexão; dados preservados |
| **Badge não aparece** | Condição não atingida | Verificar critério no admin MKTECH |

### 19.2 Contato Suporte

```
Aluno/Pais:
  → Contato escola/professor

Professor/Admin Escola:
  → Email: suporte@mktech.com.br
  → Chat: dashboard (future)
  → Telefone: (xx) xxxx-xxxx (future)

Admin MKTECH:
  → Slack interno
  → Meetup semanal (segunda 10h)
```

---

## 20. ASSINATURA & APROVAÇÃO

### 20.1 Sign-Off

| Papel | Nome | Data | ✅ |
|------|------|------|-----|
| **Product Owner** | Robson Martins | Outubro 2025 | ☐ |
| **Tech Lead** | (a definir) | | ☐ |
| **Compliance** | (a definir) | | ☐ |
| **Operations** | (a definir) | | ☐ |

---

## 21. ANEXOS

### 21.1 Exemplo: Jornada Completa Aluno

```
08:00 - Professor (Profa. Maria) login
  → Acessa dashboard
  → Seleciona turma "5ºA"
  → Escolhe aula "Algoritmos Básicos"
  → Clica "Iniciar Sessão"

08:02 - QR + Código (AB-94) exibido na TV

08:03 - Aluno 1 (João)
  → Escaneia QR
  → Seleciona "João Silva"
  → Seleciona ícone "dog"
  → Digita PIN "1111"
  → ✅ Entra na sessão
  → Vê bloco 1 (vídeo 3 min)

08:06 - Bloco 1 Quiz (MCQ: "Qual estrutura repete?")
  → João responde: "Loop"
  → Correto! ✅ 10 pontos
  → Sistema avança bloco 2

08:08 - Bloco 2 (Apresentação interativa)
  → João vê conteúdo

08:10 - Bloco 2 Quiz (Phaser Game: TreasureRun)
  → João coleta baús
  → Responde 3 perguntas corretas
  → Ganha 15 pontos × 1.0 = 15 pontos
  → Total até agora: 25 pontos

08:12 - Bloco 3 (Lottie animação)
  → João vê animação

08:14 - Bloco 3 Quiz (MCQ: "O que é função?")
  → João erra primeira tentativa = 0 pts
  → Dica: "Agrupa instruções"
  → João acerta segunda tentativa = 10 × 0.75 = 7.5 pts

08:15 - FIM DE AULA
  → Tela exibe:
    • Total pontos: 32.5
    • Badges: "Primeira 100%" ✅
    • Ranking turma: 3º lugar (antes era 5º)
    • Botão "Ver Perfil" / "Voltar"

08:16 - Perfil de João (acesso próprio)
  → Pontos totais: 542
  → Badges: 5 conquistadas (3 novas hoje)
  → Ranking turma: 3º de 25
  → Ranking escola: 12º de 150
  → Últimas aulas: lista

18:00 - Pais acessa `/relatorio-aluno`
  → Seleciona "João Silva"
  → Faz login (email + senha aluno)
  → Vê perfil atualizado:
    • Pontos: 542 (atualizado em tempo real)
    • Badges: "Primeira 100%", "5 Aulas"
    • Ranking: 3º turma, 12º escola
    • Aula hoje: "Algoritmos" - 32.5 pontos
  → Email recebido: "João conquistou 'Primeira 100%'" 🎉
```

### 21.2 Exemplo: Fluxo Faturamento

```
Mês 1 (Outubro):
  - Escola Piloto cria conta (14 dias trial)
  - Cadastra 20 alunos (ativo = false)
  - Admin habilita 15 alunos (ativo = true)
  - Convencida, contrata plano: 30 seats
  - PIX recebido: R$ 1.500 (30 × R$ 50)
  - Status: ACTIVE; seats_total = 30

Mês 2 (Novembro):
  - Escola habilita 25 alunos
  - 1º de Novembro: Fatura gerada (R$ 1.250; 25 alunos)
  - Escola paga em 05/11
  - Status: ACTIVE; continua

Mês 3 (Dezembro):
  - Escola habilita 28 alunos
  - 1º de Dezembro: Fatura gerada (R$ 1.400; 28 alunos)
  - Escola não paga
  - 08 de Dezembro: Aviso email (7 dias grace)
  - 15 de Dezembro: SUSPENDED (alunos/profs bloqueados)
  - 18 de Dezembro: PIX recebido
  - Reativação imediata; status ACTIVE
  - Email: "Plataforma reativada!"
```

---

**Status:** ✅ Pronto para Implementação  
**Versão PRD:** 1.0  
**Versão Project Rules:** 1.0  
**Versão User Rules:** 1.0

---

## PRÓXIMOS PASSOS

1. ✅ **PRD Criado:** Visão, objetivos, personas, features, fluxos
2. ✅ **Project Rules Criado:** Tech stack, arquitetura, code patterns, deployment
3. ✅ **User Rules Criado:** Permissões RBAC, regras de negócio, ciclos de vida, billing
4. ⏭️ **Database Setup:** Criar schema no Supabase (próximo sprint)
5. ⏭️ **Auth Setup:** Supabase Auth (email/senha, session handling)
6. ⏭️ **Landing Page:** Hero, seções, CTA
7. ⏭️ **Dashboard Tenant:** CRUD users, turmas, alunos
8. ⏭️ **Fluxo Aluno:** Login QR, player, quizzes
9. ⏭️ **Admin MKTECH:** CRUD aulas/blocos/quizzes, asset management
10. ⏭️ **Testing & Deploy:** MVP ready

---

**Documentação Completa & Pronta para Cursor AI Implementar! 🚀**