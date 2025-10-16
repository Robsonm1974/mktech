---

## 22. CHECKLIST PRÁTICO ANTES DE INICIAR NO CURSOR

> **Onde guardar:** Manter esta seção no PRD + criar arquivos operacionais no repositório: `BUILD_CHECKLIST.md`, `TECH_DECISIONS.md`, `ENVIRONMENT.md`, `BUGS.md`, `RLS_POLICIES.md`.

### 22.1 Variáveis & Ambientes ⚠️

**IMPORTANTE:** Valores de chaves **NUNCA** entram no PRD/README/Git!

**Criar `ENVIRONMENT.md`** orientando:
- `.env.local` (desenvolvimento local)
- **Vercel → Settings → Environment Variables** (Preview/Production)

**Variáveis mínimas:**
```bash
# Cliente (pode expor)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Servidor (NUNCA expor; NUNCA prefixar com NEXT_PUBLIC)
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Apenas server-side

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000  # ou https://app.mktech.com.br
NODE_ENV=development  # production no Vercel
```

**Política de segredos:**
- `.env.local` no `.gitignore` (✅ já deve estar)
- Valores no Vercel Environment Variables
- **Rotacionar** chaves vazadas imediatamente
- **NUNCA** usar `SUPABASE_SERVICE_ROLE_KEY` no client

### 22.2 Versões de Runtime

**Fixar em `package.json`:**
```# MKTECH PRD (Product Requirements Document)

**Versão:** 1.0  
**Autores:** Robson Martins & MAKARISPO TECH  
**Data:** Outubro 2025  
**Status:** MVP - Em Desenvolvimento

---

## 1. VISÃO GERAL

**MKTECH** é uma plataforma SaaS multitenant que entrega aulas de tecnologia gamificadas para escolas de Ensino Fundamental 1 e 2 (EF1/EF2). Um "professor virtual" (sistema de blocos + quizzes) conduz microlições interativas, com pontuação, badges e ranking em tempo real.

### Proposta de Valor

- **Para Escolas:** Diferencial de atração/retenção de matrículas; conteúdo incluído (reduz gastos externos); plataforma simples sem instalação.
- **Para Famílias:** Aprendizado moderno (programação, lógica, inglês aplicado); acompanhamento transparente; economiza cursos extras.
- **Para Alunos:** Aulas interativas com gamificação (badges, pontos, ranking); microlições + feedback imediato; aprender brincando.

---

## 2. OBJETIVOS DO PRODUTO (KPIs de Sucesso)

| KPI | Meta |
|-----|------|
| **Adoção** | ≥ 3 escolas piloto no Q1 pós-MVP |
| **Engajamento (Alunos)** | ≥ 70% presença em sessões; ≥ 60% quizzes concluídos |
| **Satisfação (NPS)** | ≥ 60 (mensagens: "aprende brincando", "ganha badges", "inglês aplicado") |
| **Impacto Escolar** | Aumento de percepção de valor e captação/retenção |
| **Disponibilidade** | ≥ 99.5% em horário letivo (weekdays 7h-18h) |
| **Retenção Mensal** | ≥ 80% escolas renovam assinatura após 1º ciclo |

---

## 3. PÚBLICO-ALVO & PERSONAS

### 3.1 Tenant (Escola/Direção/Coordenação)
- **Perfil:** Diretor, coordenador ou gestor da escola.
- **Motivação:** Diferenciar oferta educativa; atrair pais; reduzir custos com conteúdo externo.
- **Necessidades:** Gerenciar professores, turmas, alunos; acompanhar desempenho geral; relatórios simples.
- **Permissões:** CRUD de usuários (professores), turmas, alunos; visualizar relatórios agregados; gerenciar assinatura/pagamento.

### 3.2 Professor/Monitor
- **Perfil:** Professor ou monitor da turma.
- **Motivação:** Facilitar aula; ver engajamento dos alunos; ativar blocos conforme o andamento.
- **Necessidades:** Iniciar sessão; escolher aula; ativar blocos; ver participação em tempo real; encerrar sessão.
- **Permissões:** Criar/iniciar sessões; visualizar resultados de sua turma; relatórios de performance.

### 3.3 Aluno
- **Perfil:** Criança/adolescente (EF1/EF2 = 6-14 anos).
- **Motivação:** Aprender jogando; ganhar pontos, badges, subir ranking.
- **Necessidades:** Entrar na aula (QR + ícone + PIN); jogar/responder quizzes; ver pontuação, badges, ranking.
- **Permissões:** Acessar aulas ativas; responder quizzes; visualizar seu perfil (pontos, badges, ranking).

### 3.4 Pais/Responsáveis
- **Perfil:** Pai, mãe ou responsável do aluno.
- **Motivação:** Acompanhar progresso do filho; estar seguro da qualidade da aprendizagem.
- **Necessidades:** Ver desempenho do filho; histórico de aulas; pontuação, badges, ranking.
- **Permissões:** Visualizar perfil do aluno (login com credenciais do aluno); exportar relatórios simples; sem edit.

### 3.5 Admin MKTECH
- **Perfil:** Equipe técnica/conteúdo da MAKARISPO TECH.
- **Motivação:** Gerenciar plataforma, criar/editar conteúdo, suporte.
- **Necessidades:** CRUD completo de aulas, blocos, quizzes, trilhas; gerenciar tenants; analytics; configurações globais.
- **Permissões:** Acesso total (superadmin).

---

## 4. ESCOPO & DIRETRIZES (MVP)

### 4.1 Incluído no MVP

- ✅ **Modelo Pedagógico:** Aulas compostas de Blocos + Quizzes (vídeo/apresentação/animação + MCQ/V-F).
- ✅ **Gamificação Básica:** Pontos, badges (por marcos), ranking (turma/escola).
- ✅ **Multitenancy:** Isolamento de dados via RLS (Supabase).
- ✅ **Autenticação Simples (Aluno):** QR + Ícone (4 opções) + PIN (4 dígitos).
- ✅ **Session Workflow:** Professor inicia sessão → escolhe aula → ativa blocos → alunos respondem.
- ✅ **Dashboards:** Professor (tempo real), Pais (resultados aluno), Escola (visão geral).
- ✅ **Admin MKTECH:** CRUD completo de aulas/blocos/quizzes.
- ✅ **Faturamento:** Modelo manual (R$50/aluno/mês); teste gratuito com 1 aula demo.
- ✅ **Seed Data:** Escolas, turmas, alunos fake para testes.

### 4.2 NÃO Incluído no MVP (Roadmap V2+)

- ❌ Sistema de pagamento automatizado (Stripe/PagSeguro) — implementar depois.
- ❌ Hints/Dicas via IA — planejado para futuro.
- ❌ Assistente IA para perguntas durante aula — futuro.
- ❌ Audit logs completo — postergar.
- ❌ Integração com LMS externo (Google Classroom, etc.) — futuro.
- ❌ Relatórios avançados/exportação em massa — futuro.
- ❌ Mobile app nativo — focar web responsiva por enquanto.

---

## 5. FUNCIONALIDADES DETALHADAS

### 5.1 Modelo Pedagógico & Conteúdo

#### Estrutura Hierárquica

```
Trilha (ex.: "Pensamento Computacional - EF2")
├── Aula 1 (ex.: "Algoritmos Básicos")
│   ├── Bloco 1 (vídeo 3-5 min)
│   │   ├── Quiz (3-5 perguntas MCQ/V-F)
│   ├── Bloco 2 (apresentação interativa)
│   │   ├── Quiz (Phaser Game ou H5P)
│   └── Bloco 3 (animação Lottie + conteúdo)
│       ├── Quiz (MCQ/V-F)
└── Aula 2 (próxima sequência)
```

#### Metadados por Aula
- **id, titulo, descricao**
- **disciplinas:** string array (ex.: ["Lógica", "Programação", "Matemática", "Inglês"])
- **grade_level:** EF1-3, EF1-4, EF2-5, EF2-6, EF2-7, EF2-8, EF2-9
- **duracao_estimada:** minutos
- **objetivos_aprendizado:** texto
- **pontos_totais:** número (soma de todos os blocos)
- **badges_desbloqueáveis:** array [{ id, titulo, icone, condicao }]
- **publicada:** boolean
- **created_at, updated_at**

#### Metadados por Bloco
- **id, aula_id, numero_sequencia**
- **tipo:** "video" | "apresentacao" | "animacao_lottie"
- **titulo, descricao**
- **duracao:** minutos
- **conteudo_url:** caminho para asset (video hospedado, JSON Lottie, etc.)
- **pontos_por_bloco:** número
- **quiz_id:** referência ao quiz associado
- **created_at, updated_at**

#### Metadados por Quiz
- **id, bloco_id**
- **tipo:** "mcq" | "verdadeiro_falso" | "phaser_game" | "h5p_interativo"
- **descricao, titulo**
- **perguntas:** array (estrutura varia por tipo)
- **tentativas_permitidas:** número (padrão: 2)
- **tempo_limite_seg:** número (padrão: 300)
- **pontos_max:** número
- **hints:** array (future feature)
- **created_at, updated_at**

**Exemplo MCQ:**
```json
{
  "id": "quiz_001",
  "tipo": "mcq",
  "perguntas": [
    {
      "id": "q1",
      "prompt": "Qual estrutura repete uma ação?",
      "choices": ["Se (if)", "Loop", "Função"],
      "correctIndex": 1,
      "pontos": 1,
      "hint": "Pense em repetir passos." // future
    }
  ]
}
```

**Exemplo Phaser Game (TreasureRun v1):**
```json
{
  "id": "quiz_phaser_001",
  "tipo": "phaser_game",
  "nivel_json": { /* tilemap, player, chests, audio, rules */ },
  "question_pack_id": "qpack_001",
  "pontos_max": 50
}
```

---

### 5.2 Fluxo de Usuário por Papel

#### **Aluno (Student)**

1. **Pré-Aula:**
   - Acessa `/entrar` (login page simples).
   - Escaneia QR da sessão OU digita código curto (ex.: AB-94).
   - Seleciona seu nome da turma (ou busca).
   - Autentica com **Ícone (4 opções) + PIN (4 dígitos)**.
   - Entra na página de Boas-vindas da Sessão.

2. **Durante Aula:**
   - Vê botão **INICIAR AULA**.
   - Sistema carrega o Player (Bloco 1 ativo).
   - Assiste bloco (vídeo/apresentação/Lottie).
   - Responde Quiz ao final do bloco.
   - Avança automaticamente ou clica "Próximo".
   - Repete para todos os blocos da aula.
   - **Progresso preservado:** Se sair, volta onde parou.

3. **Pós-Aula:**
   - Tela de Conclusão com:
     - Pontos totais ganhos.
     - Badges desbloqueadas (se houver).
     - Ranking atualizado.
     - Botão "Voltar ao Perfil".

4. **Acesso ao Perfil:**
   - Aluno acessa `/meu-perfil` para ver:
     - Pontuação total.
     - Badges conquistadas.
     - Ranking (turma/escola, nomes abreviados).
     - Histórico de aulas completadas.

#### **Pais/Responsável**

1. **Acesso:**
   - Vai para página pública `/relatorio-aluno` (sem login aparente).
   - Seleciona seu filho (ou digita código).
   - Faz login com **e-mail + senha do aluno** (ou link mágico).
   - **Primeiro acesso:** Obrigado a trocar senha.

2. **Dashboard Pais:**
   - Vê perfil do aluno (read-only):
     - Pontuação total e por disciplina.
     - Badges conquistadas com datas.
     - Ranking na turma/escola (nome aluno abreviado: ex. "J.S.").
     - Histórico de últimas 5 aulas (data, título, pontos).
     - Disciplinas recomendadas (opcional).

#### **Professor/Monitor**

1. **Setup:**
   - Faz login com e-mail + senha.
   - Acessa Dashboard Professor.
   - Seleciona turma + aula do calendário.

2. **Inicia Sessão:**
   - Clica "Iniciar Sessão" para turma X.
   - Sistema gera **QR grande + código curto (ex.: AB-94)**.
   - Exibe na TV/Tablet (tela espelhada).
   - Mostra lista de alunos habilitados da turma.

3. **Durante Aula:**
   - Vê em tempo real: alunos conectados, bloco ativo, participação (% que respondeu).
   - **Não vê respostas individuais** (por enquanto).
   - Pode ativar blocos manualmente ou deixar automático.
   - Encerra sessão quando termina.

4. **Pós-Sessão:**
   - Vê relatório rápido: pontos, badges, ranking atualizado.
   - Acessa histórico de sessões anteriores.

#### **Admin Escola (Coordenação)**

1. **Gerenciamento:**
   - CRUD de Professores (criar, editar, desativar).
   - CRUD de Turmas (criar, editar, desativar).
   - CRUD de Alunos (importar CSV, editar, desativar).

2. **Visualização:**
   - Dashboard com KPIs: total alunos, aulas executadas, engajamento médio.
   - Relatório simples de performance por turma/disciplina.
   - Gerenciar assinatura/billing (ver status, upgrade, cancelamento).

#### **Admin MKTECH (Superadmin)**

1. **Gestão de Conteúdo:**
   - CRUD completo de Trilhas, Aulas, Blocos, Quizzes.
   - Upload de assets (vídeos, tilemaps, sprites, áudio).
   - Editor de Phaser Level JSON + Question Packs.
   - IA para gerar Question Packs (validação Zod).

2. **Gestão de Plataforma:**
   - CRUD de Tenants (escolas).
   - Analytics: uso por tenant, engajamento global, churn rate.
   - Configurações globais (temas, trilhas, mensagens).
   - Suporte/troubleshooting.

---

### 5.3 Autenticação & Acesso

#### Fluxo Professor/Admin

1. E-mail + Senha (via Supabase Auth).
2. 2FA opcional (future).
3. Recuperação: link mágico via e-mail.

#### Fluxo Aluno (Login Rápido em Sala - QR/Código)

**Objetivo:** Login em < 10 segundos por aluno; zero fricção; segurança multi-tenant.

**Mecânica:**

1. **Professor inicia sessão** → Sistema gera:
   - **QR Code grande** (exibido na TV)
   - **Código curto** (ex: `AB-47`)
   - URL: `https://mktech.app/app/{tenantSlug}/join?session={sessionId}&code=AB-47`

2. **Aluno com tablet da escola:**
   - **Opção A:** Escaneia QR → Abre URL automaticamente
   - **Opção B:** Digita código `AB-47` manualmente → Sistema redireciona

3. **Tela Join (escopo do tenant + sessão):**
   - Mostra: **Nome da Escola** + **Turma** (read-only)
   - Campos de entrada:
     - **ID do Aluno** (ex: `12345` ou `joao.silva`)
     - **PIN** (4 dígitos numéricos)
   - Botões: **Entrar** | **Voltar**

4. **Autenticação:**
   - Sistema valida: `(tenant_id, turma_id, aluno_id) + PIN` são corretos
   - Se correto: ✅ JWT gerado; entra direto na sessão ativa
   - Se errado: ❌ "ID ou PIN incorretos" (genérico, anti-enumeração)
   - **Limite:** 3 tentativas; depois bloqueia por 5 min

5. **Segurança Multi-Tenant:**
   - `tenantSlug` na URL é apenas roteamento visual
   - Segurança real: **RLS por `tenant_id`** no JWT do aluno
   - Backend valida: `sessionId` pertence ao mesmo `tenant_id` do JWT
   - Toda leitura/escrita ocorre **somente** dentro do `tenant_id` autenticado

**PWA/Kiosk Mode (Tablets da Escola):**
- **Add to Home Screen** com ícone MKTECH
- Android: **App Pinning** (modo quiosque)
- iOS: **Guided Access** (modo guiado)
- Ao abrir PWA: tela inicial mostra **"Escanear QR / Digitar Código"**
- Dispositivo mantém estado anônimo mínimo: `{ tenantSlug, sessionId }`
- **Não é login persistente** (sessão expira ao fechar/logout)

**Uso em Casa (Sem QR):**
- Aluno acessa: `https://mktech.app/app/{tenantSlug}`
- Login tradicional: **ID + PIN**
- Vê: Homework, aulas disponíveis, perfil

**LGPD & UX:**
- **Primeiro acesso:** Sistema força:
  - Trocar PIN (aluno escolhe novo)
  - Vincular email/telefone do responsável (notificações)
- **Erros genéricos:** "ID ou PIN incorretos" (não revela qual campo errou)
- **Rate limiting:** 3 tentativas/5 min; depois captcha ou bloqueio temporário

**Regras:**
- Combinação `(tenant_id, turma_id, aluno_id) + PIN` deve ser única no tenant
- PIN pode ser resetado pelo professor (botão "Reset PIN" no CRUD aluno)
- ID do aluno pode ser: matrícula numérica OU username (ex: `joao.silva`)

#### Fluxo Pais

1. Acessa `/relatorio-aluno` (página pública)
2. Seleciona filho ou digita código do filho
3. Faz login com **ID do aluno + PIN** (credenciais compartilhadas inicialmente)
4. **Primeiro acesso:** Obriga trocar PIN e vincular email/contato do responsável
5. Acessa apenas perfil do aluno (read-only)
6. Pode ativar **notificações por email** (badges, homework, relatórios)

#### Recuperação de Acesso

| Persona | Método |
|---------|--------|
| **Professor/Admin** | Link mágico via e-mail do admin |
| **Aluno** | Professor reseta PIN; novo PIN entregue via papel/email pais |
| **Pais** | Link mágico via e-mail vinculado (campo `email_responsavel`) |

---

### 5.4 Gamificação

#### Pontos
- **Por Quiz:** Acertou = pontos (baseado em dificuldade + tentativas); errou = 0 ou pontos parciais.
- **Agregação:** Soma total por aula, trilha, período.
- **Visualização:** Perfil aluno, painel pais, dashboard professor.

#### Badges
- **Tipos:**
  - Marco: "5 Aulas Concluídas", "10 Aulas Concluídas", "Primeiro Acerto 100%"
  - Disciplina: "Mestre em Programação", "Lógico", "Poliglota"
  - Série: "Novato", "Aprendiz", "Expert"
- **Desbloqueio:** Automático ao atingir condição (regra de negócio).
- **Visibilidade:** Perfil aluno, ranking turma, relatório pais.

#### Ranking
- **Escopo:** Por turma, por escola.
- **Métrica:** Pontos totais.
- **Privacidade:** Nomes abreviados (ex.: "J.S.") a partir do 2º lugar; 1º lugar com nome completo (opcional).
- **Atualização:** Em tempo real após cada quiz.
- **Exibição:** Página de ranking acessível do perfil aluno; gráfico no dashboard professor.

---

### 5.5 Landing Page

#### Seções Recomendadas

**1. Hero**
- Headline: "Aulas de Tecnologia que Preparam o Aluno para o Futuro!"
- Subheadline: "Pensamento computacional, programação, lógica e inglês aplicado — tudo em microlições divertidas."
- CTA: "Agendar Demonstração" / "Falar com Especialista"
- Visual: Animação Lottie (ex.: criança com tablet, badge flutuando) + cores tema.

**2. Para Escolas (Pain Points)**
- Diferencial que atrai e retém matrículas.
- Economia: conteúdos e trilhas incluídos (inspiração Kumon).
- Zero instalação: roda em navegador (Chromebooks, tablets).
- Suporte técnico incluído.
- CTA: "Ver Plano"

**3. Para Famílias**
- Seu filho aprende programação + lógica + inglês aplicado na rotina escolar.
- Economiza com cursos extras: trilhas incluídas.
- Acompanhe evolução em painel simples e transparente.
- Aprende brincando: gamificação com badges e ranking.
- CTA: "Saiba Mais"

**4. Prova Pedagógica**
- Loop: Microlição → Prática Guiada → Jogo/Quiz com Recompensas → Feedback Imediato.
- 3-4 cards com ícones/ilustrações.

**5. Gamificação**
- Pontos por participação.
- Badges por marcos.
- Ranking com privacidade.
- KPIs visuais.

**6. Testimoniais** (future, após pilotos)
- Frases curtas de pais/diretores.

**7. Pricing**
- Plano único: R$50/aluno/mês.
- Demonstração gratuita: 1 aula completa.
- CTA: "Começar Teste Gratuito"

**8. FAQ**
- Como funciona a segurança?
- Que dispositivos preciso?
- Posso exportar relatórios?
- Como funciona o suporte?

**9. Footer**
- Links: Sobre, Contato, Privacidade, Termos.
- Redes sociais (future).

---

### 5.6 Assinatura & Billing (Manual MVP)

#### Modelo
- **Plano único:** Mensal, cobrado por aluno ativo.
- **Valor:** R$50/aluno/mês.
- **Teste gratuito:** 1 aula completa (sem alunos associados); acesso por 14 dias.

#### Definições

| Termo | Descrição |
|-------|-----------|
| **Aluno Contratado (Seat)** | Direito de manter 1 aluno ativo durante ciclo de cobrança. |
| **Aluno Ativo** | Aluno habilitado a entrar em sessões durante ciclo vigente. |
| **Ciclo de Cobrança** | Mensal (ex.: 01/11 a 30/11). |
| **Contagem** | Escola cadastra quantos alunos quiser; pagamento baseado em alunos **habilitados** no período. |

#### Fluxo

1. **Onboarding:**
   - Escola cria conta.
   - Acessa 1 aula demo por 14 dias.
   - Convencida, clica "Assinar" → contacta MKTECH (email/formulário).

2. **Contratação:**
   - MKTECH envia proposta (valor = N alunos × R$50).
   - Escola aceita e faz PIX/transferência.
   - MKTECH confirma e ativa: libera N seats.

3. **Durante Ciclo:**
   - Escola pode habilitar até N alunos.
   - Se tentar habilitar > N: sistema bloqueia + sugere upgrade.

4. **Upgrade:**
   - Escola solicita upgrade (email).
   - MKTECH valida e aplica **efeito imediato** (novo N disponível na hora).

5. **Downgrade:**
   - Aplica **no próximo ciclo** (não reduz capacidade atual).

#### Atraso de Pagamento

| Status | Ação |
|--------|------|
| **Até 7 dias** | Funcionamento normal + avisos por email. |
| **7-30 dias** | Admin escola: leitura apenas (faturas, opção pagar). Professores/Alunos: bloqueados para novas sessões; alunos podem ver badges. |
| **> 30 dias** | Congelamento até regularização. |
| **Reativação** | Imediata ao confirmar pagamento. |

#### Cancelamento

| Cenário | Ação |
|---------|------|
| **Cliente cancela** | 30 dias read-only (export relatórios); depois congelamento. |
| **Inadimplência > 30 dias** | Congelamento até regularização. |

---

## 6. LANDING PAGE & MESSAGING

*(Detalhado em seção 5.5 acima)*

---

## 7. JORNADA TÉCNICA (Overview)

### 7.1 Tech Stack (MVP)

| Layer | Tech |
|-------|------|
| **Frontend** | Next.js 15 (App Router), React 18+, TypeScript (strict) |
| **Styling** | Tailwind CSS 4 + Shadcn/ui; OKLCH theme (CSS Variables) |
| **State Management** | Context7 + React Context API |
| **Backend** | Supabase (PostgreSQL + RLS) |
| **Auth** | Supabase Auth (Session/JWT) |
| **Games** | Phaser 3 (WebGL); JSON-based level config |
| **Quizzes** | H5P (locally hosted) + xAPI events; MCQ custom |
| **Assets** | Lottie Files (JSON animations) |
| **Hosting** | Vercel (Frontend) + Supabase Cloud (Backend) |
| **Package Manager** | PNPM ≥ 9 |
| **Node Version** | Node ≥ 20 (fixar em `package.json` engines e `.nvmrc`) |
| **AI (Future)** | OpenAI API (question generation, hints, IA voice) |
| **PWA** | Manifest, service worker (offline básico), add-to-home |
| **Observability (Post-MVP)** | Sentry (errors), Logtail/Logflare (logs) |
| **Utils (Criteriosos)** | ReactBits.dev (usar seletivamente) |

### 7.2 Database Multi-Tenant (RLS)

- **Isolamento:** Via `tenant_id` + Supabase RLS policies.
- **Escalabilidade:** Schema único compartilhado; segurança em layer de permissões.
- **Backup:** Supabase gerencia (automated daily).
- **Tipagem:** Gerar tipos do Postgres com `supabase gen types typescript`

### 7.3 API Conventions

- RESTful com Supabase PostgREST.
- Real-time via Supabase Realtime (websockets).
- Validação: Zod (client + server).
- **NUNCA expor `SUPABASE_SERVICE_ROLE` no client** (usar RLS)

### 7.4 Internacionalização (i18n)

- Estratégia com **dicionários** e **namespaces**
- Fallback PT-BR
- Arquitetura preparada para EN/ES
- Rotas e conteúdos textuais **parametrizados**
- Strings externalizadas desde início

---

## 8. PLANEJAMENTO DE BANCO DE DADOS (Alto Nível)

### 8.1 Entidades Principais

```
tenants (escolas)
├── users (admin_escola, professor/monitor)
├── students (alunos; vinculados a tenant; contato responsável)
├── guardians (pais/responsáveis; opcional; podem compartilhar credenciais aluno)
├── classes (turmas)
├── enrollments (matrículas: students ↔ classes)
├── sessions (aula ativa por turma)
├── subscriptions (billing, ciclo, seats contratados)
├── invoices (faturas)
└── audit_logs (acessos, eventos relevantes)

collections (coleções/trilhas de aulas)
└── lessons (aulas)
    ├── lesson_metadata (disciplinas, pesos, KPIs)
    ├── blocks (blocos: vídeo/apresentação/lottie/game)
    │   └── quizzes
    │       └── questions
    │           └── options
    ├── homework_assignments (tarefas atribuídas)
    └── answers (respostas por aluno/bloco/quiz)

scores (pontos, badges, ranking snapshot)
badges (recompensas mestras)
user_progress (progresso agregado por aluno)
```

### 8.2 Observações Importantes

- **Toda tabela de escola** contém `tenant_id` + **RLS** correspondente
- **students** podem ser cadastrados em massa (CSV import)
- **subscriptions** controlam **seats** (alunos ativos permitidos) e ciclo
- **collections**: nova entidade para organizar trilhas/currículo
- **homework_assignments**: permite atribuir tarefas para casa
- Métricas agregadas (KPIs) em tabelas auxiliares ou materializadas
- **Migrations** estruturadas em `./supabase/migrations/`

### 8.3 Storage (Supabase)

**Buckets:**
- `content-draft` (privado; Admin MKTECH)
- `content-published` (público/signed URLs; alunos)
- `user-uploads` (avatars, attachments; por tenant)

**Publicação Editorial:**
- Colunas: `status` (draft|in_review|published|archived)
- `version`, `published_at`, `locale` (i18n)

---

## 9. ROADMAP

### MVP 1 (Fundação)
- ✅ Painel **Admin MKTECH** (CRUD aulas/blocos/quizzes + metadados)
- ✅ Login e sessões funcionais
- ✅ Estrutura de blocos (podem iniciar vazios)
- ✅ RLS básico
- ✅ Collections (trilhas)

### MVP 2 (Dashboards)
- ✅ **Dashboard Professor** (tempo real)
- ✅ **Dashboard Pais** (progresso)
- ✅ **Login rápido QR/Código** (sala de aula)
- ✅ PWA básico (add-to-home)

### MVP 3 (Engajamento Avançado)
- 🔲 Botão IA **"Levantar a Mão"** (perguntar à IA)
- 🔲 **Homework** (tarefas para casa)
- 🔲 **Rede Social de Desafios** (postagens moderadas + rankings)
- 🔲 Feature flags (A/B testing)

### Pós-MVP
- 🔲 SSO (Google Workspace for Education)
- 🔲 Observabilidade completa (Sentry + Logtail)
- 🔲 Mascote/UX avançada
- 🔲 Loja de conteúdos (curadoria MKTECH)
- 🔲 Mobile app nativo (iOS/Android)
- 🔲 Adaptive learning (trilhas personalizadas por IA)
- 🔲 AR/VR experiments
- 🔲 Rede pública (municípios/estados)

---

## 10. REQUISITOS NÃO FUNCIONAIS

### 10.1 Performance
- Carregamento < 2.5s em 4G
- Interação fluida em tablets de entrada
- Vídeos adaptativos (quality switching)
- Assets otimizados (WebP, lazy loading)

### 10.2 Disponibilidade
- ≥ 99.5% no horário letivo (weekdays 7h-18h, fuso São Paulo)
- Manutenção planejada (announced 48h antes)
- Healthcheck endpoint

### 10.3 Segurança & Privacidade
- **LGPD compliant:** consentimento explícito, direitos de acesso/correção/deleção
- Dados segregados por **tenant** com **RLS**
- Logs de acesso/auditoria (audit_logs)
- Criptografia em trânsito (HTTPS) e repouso (Supabase default)
- Rotação de chaves vazadas
- Rate limiting (3 tentativas login/5min)

### 10.4 Acessibilidade
- WCAG AA (legendas nos vídeos, contraste, navegação por teclado)
- Semantic HTML
- ARIA labels onde necessário

### 10.5 Observabilidade (Pós-MVP)
- **Sentry** para erros (frontend + backend)
- **Logtail/Logflare** para logs estruturados
- Feature flags simples (tabela `feature_flags` por tenant)
- Metrics: DAU, WAU, MAU, engagement rate, NPS

---

## 8. MÉTRICAS DE SUCESSO & TRACKING

### 8.1 Product Metrics (Dashboard)

- **Engajamento:** % sessões completadas, tempo médio por aula, taxa de retry quiz.
- **Adoção:** # tenants ativos, # alunos cadastrados, # aulas criadas.
- **Retenção:** % tenants renovam após 30 dias, churn rate.
- **Performance:** Tempo de carregamento (< 2s), taxa de erro (< 1%), uptime (≥ 99.5%).

### 8.2 Learning Metrics

- **Progresso Aluno:** % quizzes concluídos, pontuação média, badges ganhos.
- **Disciplinas:** Performance por disciplina (ex.: Programação vs Lógica).
- **Comparação Turma:** Aluno vs média turma/escola.

### 8.3 Tracking Implementation

- **xAPI Events:** H5P emite eventos (answered, completed); registrados em `h5p_xapi_events`.
- **Phaser Events:** Jogo emite game_score (coins, acertos, tempo) → `game_scores`.
- **Quiz Responses:** `quiz_responses` armazena pergunta, resposta, tempo, pontos.
- **Session Logs:** `session_logs` rastreia início, fim, # participantes, # quizzes.
- **User Progress:** `user_progress` agregação por aluno (pontos totais, badges, última aula).

---

## 9. CONFORMIDADE & SEGURANÇA (MVP)

### 9.1 LGPD (Lei Geral de Proteção de Dados)

- **Dados Menores:** Coleta autorização do responsável (checkbox em signup).
- **Retenção:** Alunos inativos: deletar dados após 1 ano (ou política definida).
- **Transparência:** Privacy Policy acessível na landing page.
- **Direito de Acesso:** Admin escola pode exportar dados alunos (future).
- **Direito de Exclusão:** Botão "Deletar Aluno" (soft delete, preserva histórico agregado).

### 9.2 Segurança

- **Senhas:** Hash via Supabase Auth (bcrypt).
- **Sessions:** JWT via Supabase (expira em 1 hora; refresh token em 7 dias).
- **RLS:** Policies no Supabase validam tenant_id + role antes de qualquer query.
- **HTTPS:** Enforced.
- **CORS:** Restrito a domínios conhecidos.
- **Rate Limiting:** Implementar após MVP (Vercel middleware ou Supabase).

---

## 10. ROADMAP (Pós-MVP)

### V1.5
- [ ] Pagamento automatizado (Stripe/PagSeguro).
- [ ] 2FA (professor/admin).
- [ ] Exportação de relatórios (PDF/CSV).

### V2.0
- [ ] Hints + Dica IA durante quiz.
- [ ] Assistente IA para perguntas.
- [ ] Audit logs completo.
- [ ] Integração LMS (Google Classroom).
- [ ] Mobile app nativo.
- [ ] Relatórios avançados (análise por competência).

### V3.0+
- [ ] Adaptative learning (trilhas personalizadas).
- [ ] Multiplayer features (competições turma).
- [ ] AR/VR experiments.
- [ ] Integração redes sociais (compartilhar badges).

---

## 11. RISCOS & MITIGAÇÃO

| Risco | Impacto | Mitigação |
|-------|--------|-----------|
| **Uptime < 99.5%** | Alto | Monitorar Vercel/Supabase; setup alerts; SLA na proposta. |
| **Dados sensíveis vazados** | Crítico | RLS rigoroso; audit logs; encryption em repouso (future). |
| **Aluno não consegue entrar (UX PIN)** | Médio | Teste com crianças reais; botão "Esqueci PIN" claro. |
| **Churn alto após 1º ciclo** | Alto | NPS surveys; onboarding 1-on-1 com diretor. |
| **IA Phaser lag** | Médio | Testes de carga; otimizar WebGL; cache assets. |

---

## 12. DEFINIÇÕES (Glossário)

| Termo | Definição |
|-------|-----------|
| **Tenant** | Escola que assina o SaaS; isolada por RLS. |
| **Session** | Instância de aula (prof inicia, N alunos entram, quiz respondido). |
| **Bloco** | Unidade de conteúdo (vídeo, apresentação, Lottie). |
| **Quiz** | Teste de aprendizado (MCQ, V-F, Phaser game, H5P). |
| **Seat** | Direito de 1 aluno ativo/mês. |
| **Badge** | Recompensa visual por marco. |
| **Ranking** | Ordenação por pontos (turma/escola). |
| **RLS** | Row Level Security (Supabase); segurança multi-tenant. |
| **xAPI** | Experience API (padrão de rastreamento; usado por H5P). |

---

## 13. APROVAÇÃO & SIGN-OFF

- **Product Owner:** Robson Martins
- **Tech Lead:** (a definir)
- **Data Aprovação:** Outubro 2025
- **Status:** ✅ Pronto para Development

---
## 14. Informações Empresariais do MKTECH
CNPJ: 00.123.548/0001-29
RAZÃO SOCIAL: Makarispo Serviços Tecnológicos Ltda
ENDEREÇO: Rua Augusto Criminácio, 106 #147 - São José dos Pinhais
CEP 83065-542
TELEFONE: 4199599-9648
EMAIL: makarispo@gmail.com
www.makarispo.com

---
**Próximo:** Project Rules + User Rules (em artifacts separados)