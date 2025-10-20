# 🎮 Planejamento Completo: Roles, Funcionalidades e Sistema de Gamificação

**Data:** 2025-10-18  
**Status:** ✅ PLANEJAMENTO COMPLETO E CONFIRMADO

---

## 📋 ÍNDICE

1. [Roles e Responsabilidades](#1-roles-e-responsabilidades)
2. [Conceito de Turma](#2-conceito-de-turma-confirmado)
3. [Admin da Escola - CRUD Turmas](#3-admin-da-escola---crud-turmas)
4. [Admin da Escola - CRUD Alunos](#4-admin-da-escola---crud-alunos)
5. [Professor - Dashboard e Sessões](#5-professor---dashboard-e-sessões)
6. [Família - Perfil do Aluno](#6-família---perfil-do-aluno)
7. [Sistema de Gamificação](#7-sistema-de-gamificação)
8. [Player Sequencial de Aulas](#8-player-sequencial-de-aulas)
9. [Roadmap de Implementação](#9-roadmap-de-implementação)

---

## 1. ROLES E RESPONSABILIDADES

### **Hierarquia de Usuários**

```
MKTECH (Plataforma)
  └── Admin MKTECH (superadmin/admin_mktech)
       ├── Cria Aulas, Blocos, Quizzes
       ├── Cria Badges e Configurações de Pontuação
       └── Analytics Globais
       
       └── Tenant (Escola)
            ├── Admin da Escola (admin_escola)
            │    ├── CRUD Professores
            │    ├── CRUD Turmas
            │    ├── CRUD Alunos
            │    ├── Convidar Responsável (Família)
            │    └── Relatórios e Configurações
            │
            ├── Professor (professor)
            │    ├── Iniciar Sessão ✅
            │    ├── Encerrar Sessão ✅
            │    ├── Ver Lista de Alunos com PIN (para ajudar no login) ✅
            │    ├── Conduzir Aula (Player Sequencial) ✅
            │    ├── Ver Relatório de Sessão ✅
            │    └── ❌ NÃO cria turmas, alunos, aulas, blocos ou convida família
            │
            ├── Aluno (aluno)
            │    └── Participa de Sessões (Login: Ícone + PIN 4 dígitos)
            │
            └── Família (familia)
                 └── Visualiza Perfil do Aluno
                 └── Futuro: Home Works, Projetos Extras, Jogos Educativos
```

### **Resumo de Permissões por Role:**

| Ação | Admin MKTECH | Admin Escola | Professor | Aluno | Família |
|------|--------------|--------------|-----------|-------|---------|
| Criar Aulas/Blocos/Quizzes | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRUD Professores | ❌ | ✅ | ❌ | ❌ | ❌ |
| CRUD Turmas | ❌ | ✅ | ❌ | ❌ | ❌ |
| CRUD Alunos | ❌ | ✅ | ❌ | ❌ | ❌ |
| Convidar Família | ❌ | ✅ | ❌ | ❌ | ❌ |
| Iniciar/Encerrar Sessão | ❌ | ❌ | ✅ | ❌ | ❌ |
| Ver Alunos com PIN | ❌ | ✅ | ✅ | ❌ | ❌ |
| Conduzir Aula (Player) | ❌ | ❌ | ✅ | ❌ | ❌ |
| Ver Relatório de Sessão | ❌ | ✅ | ✅ | ❌ | ❌ |
| Participar de Sessão | ❌ | ❌ | ❌ | ✅ | ❌ |
| Ver Perfil de Aluno | ❌ | ✅ | ❌ | ✅ | ✅ |

---

## 2. CONCEITO DE TURMA (CONFIRMADO)

### **Hierarquia:**
```
MKTECH (Plataforma)
  └── ANO ESCOLAR (EF1 a EF9) - Base dos Planejamentos
       └── TURMA (Instância na Escola) = Ano + Designação (opcional)
```

### **Exemplos Práticos:**

**Escola Pequena (1 turma por ano):**
```
1º Ano (EF1) → Turma: "1º Ano" (sem designação)
2º Ano (EF2) → Turma: "2º Ano" (sem designação)
```

**Escola Grande (múltiplas turmas):**
```
1º Ano (EF1)
  ├── Turma: "1º Ano A" (designacao: "A", turno: Manhã)
  ├── Turma: "1º Ano B" (designacao: "B", turno: Tarde)
  ├── Turma: "1º Ano Manhã" (designacao: "Manhã")
  └── Turma: "1º Ano Especial" (designacao: "Especial")
```

### **Tabela `turmas` (Schema Ajustado):**

```sql
CREATE TABLE turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Ano base (vínculo com planejamentos MKTECH)
  ano_escolar_id VARCHAR(20) NOT NULL,  -- "EF1", "EF2", ..., "EF9"
  
  -- Designação da turma (opcional)
  designacao VARCHAR(50),  -- "A", "B", "Manhã", "Especial", NULL
  
  -- Nome completo (gerado automaticamente ou editável)
  name VARCHAR(255) NOT NULL,  -- "1º Ano A", "2º Ano B", "5º Ano"
  
  -- Professor responsável
  professor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadados
  descricao TEXT,
  sala VARCHAR(50),  -- Ex: "Sala 201", "Laboratório 3"
  turno VARCHAR(20),  -- "Manhã", "Tarde", "Integral"
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT unique_turma_tenant UNIQUE (tenant_id, name)
);

-- Índices
CREATE INDEX idx_turmas_ano_escolar ON turmas(ano_escolar_id);
CREATE INDEX idx_turmas_professor ON turmas(professor_id);
CREATE INDEX idx_turmas_tenant ON turmas(tenant_id);
```

---

## 3. ADMIN DA ESCOLA - CRUD TURMAS

### **3.1 Listar Turmas** (`/dashboard/admin-escola/turmas/page.tsx`)

**Filtros:**
- Por Ano Escolar (dropdown: 1º Ano, 2º Ano, ..., 9º Ano, Todos)
- Por Professor (dropdown: lista de professores)
- Por Turno (dropdown: Manhã, Tarde, Integral, Todos)

**Colunas da Tabela:**
| Nome | Ano | Professor | Qtd Alunos | Sala | Turno | Ações |

**Ações por Linha:**
- ✏️ **Editar** → `/dashboard/admin-escola/turmas/[id]/editar`
- 👥 **Ver Alunos** → `/dashboard/admin-escola/turmas/[id]/alunos`
- 🗑️ **Excluir** → Modal de confirmação (validar se tem alunos)

**Cards de Estatísticas:**
```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│  Total de Turmas    │  Total de Alunos    │  Professores Ativos │
│       12            │        285          │         8           │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

---

### **3.2 Criar Turma** (`/dashboard/admin-escola/turmas/nova/page.tsx`)

**Formulário:**

```
1. Ano Escolar* (Dropdown obrigatório):
   [ ] 1º Ano (EF1)
   [ ] 2º Ano (EF2)
   [ ] 3º Ano (EF3)
   [ ] 4º Ano (EF4)
   [ ] 5º Ano (EF5)
   [ ] 6º Ano (EF6)
   [ ] 7º Ano (EF7)
   [ ] 8º Ano (EF8)
   [ ] 9º Ano (EF9)

2. Designação (Opcional):
   Seleção rápida:
   [A] [B] [C] [D] [E] [Manhã] [Tarde] [Noite] [Especial]
   
   OU Personalizado: [____________]

3. Nome da Turma (Auto-gerado ou editável):
   [_______________________________]
   💡 Exemplo: Se ano=EF1 e designacao=A → "1º Ano A"

4. Professor Responsável* (Dropdown obrigatório):
   [ ] Selecione um professor...
   [ ] Prof. João Silva
   [ ] Prof. Maria Santos

5. Sala (Opcional):
   [____________]
   Exemplo: "Sala 201", "Laboratório 3"

6. Turno (Opcional):
   ( ) Manhã
   ( ) Tarde
   ( ) Integral
   ( ) Não especificado

7. Descrição (Opcional):
   [_______________________________]

[Cancelar]  [Salvar Turma]
```

**Validações:**
- Ano Escolar obrigatório
- Professor obrigatório
- Nome não pode estar vazio
- Nome único por tenant

**Ao Salvar:**
1. Criar registro em `turmas`
2. Vincular `professor_id`
3. Toast: "Turma criada com sucesso!"
4. Redirecionar para `/dashboard/admin-escola/turmas`

---

### **3.3 Editar Turma**

**Campos Editáveis:**
- Designação
- Nome
- Professor Responsável
- Sala
- Turno
- Descrição

**Campos NÃO Editáveis:**
- ❌ Ano Escolar (para evitar inconsistências)

---

### **3.4 Excluir Turma**

**Modal de Confirmação:**
```
┌─────────────────────────────────────────┐
│  ⚠️ Excluir Turma: 1º Ano A            │
├─────────────────────────────────────────┤
│  Esta turma possui 25 alunos ativos.   │
│                                         │
│  Escolha uma opção:                     │
│                                         │
│  ( ) Mover alunos para outra turma:    │
│      [Selecione a turma...]            │
│                                         │
│  ( ) Desativar todos os alunos         │
│                                         │
│  ( ) Cancelar exclusão                 │
│                                         │
│  [Cancelar]  [Confirmar Exclusão]      │
└─────────────────────────────────────────┘
```

---

## 4. ADMIN DA ESCOLA - CRUD ALUNOS

### **4.1 Tabela `alunos` (Schema Completo):**

```sql
CREATE TABLE alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  turma_id UUID NOT NULL REFERENCES turmas(id),
  
  -- Dados Pessoais
  full_name VARCHAR(255) NOT NULL,
  data_nascimento DATE,
  numero_matricula VARCHAR(50) UNIQUE,  -- Matrícula da escola
  
  -- Acesso Rápido (Ícone + PIN)
  icone_afinidade VARCHAR(50) DEFAULT 'dog',  -- dog, cat, fruit, flower
  pin_code VARCHAR(4) NOT NULL,  -- 4 dígitos numéricos
  
  -- Foto de Perfil (opcional)
  foto_url VARCHAR(512),  -- URL no Supabase Storage
  
  -- Contato Responsável
  email_responsavel VARCHAR(255),
  nome_responsavel VARCHAR(255),
  telefone_responsavel VARCHAR(20),
  
  -- Gamificação
  pontos_totais INTEGER DEFAULT 0,
  badges_conquistados JSONB DEFAULT '[]',
  nivel INTEGER DEFAULT 1,
  
  -- Status
  active BOOLEAN DEFAULT false,  -- Admin precisa ativar
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT unique_matricula_tenant UNIQUE (tenant_id, numero_matricula),
  CONSTRAINT unique_pin_turma UNIQUE (turma_id, pin_code)
);

-- Índices
CREATE INDEX idx_alunos_turma ON alunos(turma_id);
CREATE INDEX idx_alunos_tenant ON alunos(tenant_id);
CREATE INDEX idx_alunos_matricula ON alunos(numero_matricula);
CREATE INDEX idx_alunos_active ON alunos(active);
```

---

### **4.2 Listar Alunos** (`/dashboard/admin-escola/alunos/page.tsx`)

**Filtros:**
- Por Ano Escolar (dropdown)
- Por Turma (dropdown)
- Por Professor (dropdown)
- Por Status (Ativo/Inativo/Todos)
- Buscar por nome ou matrícula (input)

**Colunas da Tabela:**
| Foto | Nome | Matrícula | Turma | Pontos | Badges | Status | Ações |

**Ações por Linha:**
- 👁️ **Ver/Editar PIN e Ícone** → Modal
- ✏️ **Editar** → `/dashboard/admin-escola/alunos/[id]/editar`
- 📊 **Ver Perfil/Relatório** → `/dashboard/admin-escola/alunos/[id]/perfil`
- 👨‍👩‍👧 **Convidar Responsável** → Modal (⚠️ **APENAS ADMIN ESCOLA**)
- 🔄 **Ativar/Desativar** → Toggle inline
- 🗑️ **Excluir** → Modal de confirmação

**Ações em Lote:**
```
☑️ Selecionar Todos
[📄 Exportar CSV]  [✉️ Enviar Relatório]  [🔄 Ativar/Desativar]
```

---

### **4.3 Adicionar Aluno (Individual)** (`/dashboard/admin-escola/alunos/novo/page.tsx`)

**Formulário (Abas):**

**Aba 1 - Dados Pessoais:**
```
1. Nome Completo*:
   [_______________________________]

2. Data de Nascimento:
   [__/__/____]

3. Número de Matrícula:
   [____________]  [Gerar Automaticamente]

4. Turma*:
   [ ] Selecione uma turma...
   [ ] 1º Ano A (Prof. João Silva)
   [ ] 1º Ano B (Prof. Maria Santos)

5. Foto de Perfil (Opcional):
   [Escolher arquivo...]  [Preview]
```

**Aba 2 - Acesso Rápido:**
```
6. Ícone de Afinidade*:
   [🐕] [🐱] [🍎] [🌸]
   
   Ícone selecionado: 🐕 Dog

7. PIN de Acesso* (4 dígitos):
   [_] [_] [_] [_]
   
   [Gerar PIN Aleatório]
   
   ⚠️ O aluno usará estes dados para entrar nas sessões.
```

**Aba 3 - Responsável:**
```
8. Nome do Responsável:
   [_______________________________]

9. Email do Responsável:
   [_______________________________]

10. Telefone do Responsável:
    [_______________________________]
```

**Botões:**
```
[Cancelar]  [Salvar e Adicionar Outro]  [Salvar]
```

**Validações:**
- Nome obrigatório
- Turma obrigatória
- Ícone obrigatório
- PIN obrigatório (4 dígitos, único na turma)
- Email válido (se fornecido)

---

### **4.4 Modal: Ver/Editar PIN e Ícone**

```
┌──────────────────────────────────────────┐
│  Acesso Rápido - João Silva              │
├──────────────────────────────────────────┤
│  Ícone de Afinidade:                     │
│  [🐕] [🐱] [🍎] [🌸]  (clicável)         │
│                                          │
│  Ícone atual: 🐕 Dog                     │
│                                          │
│  PIN de Acesso:                          │
│  [1] [2] [3] [4]  (editável)             │
│                                          │
│  [Gerar Novo PIN Aleatório]              │
│                                          │
│  ⚠️ O aluno usará estes dados para       │
│     entrar nas sessões.                  │
│                                          │
│  [Cancelar]  [Salvar Alterações]         │
└──────────────────────────────────────────┘
```

---

### **4.5 Importar Alunos via CSV** (`/dashboard/admin-escola/alunos/importar/page.tsx`)

**Modelo CSV Esperado:**
```csv
nome_completo,data_nascimento,matricula,turma_id,email_responsavel,nome_responsavel,telefone_responsavel
João Silva,2012-03-15,MAT001,uuid-turma-1a,joao.pai@email.com,Paulo Silva,11987654321
Maria Santos,2012-05-20,MAT002,uuid-turma-1a,maria.mae@email.com,Ana Santos,11976543210
```

**Fluxo:**
1. Admin baixa modelo CSV
2. Preenche com dados dos alunos
3. Faz upload do arquivo
4. Sistema valida (colunas, turmas, emails, matrículas únicas)
5. Preview dos dados com status de validação
6. Admin confirma importação
7. Sistema cria alunos com:
   - Ícone aleatório
   - PIN aleatório (4 dígitos)
   - Status: Inativo
8. Resultado: X criados, Y erros (baixar log)

**CSV de PINs Gerados (para impressão):**
```csv
nome,turma,icone,pin
João Silva,1º Ano A,dog,1234
Maria Santos,1º Ano A,cat,5678
```

---

### **4.6 Convidar Responsável (Família)** ⚠️ **APENAS ADMIN ESCOLA**

**Modal:**
```
┌──────────────────────────────────────────┐
│  Convidar Responsável - João Silva       │
├──────────────────────────────────────────┤
│  Email do Responsável:                   │
│  [joao.pai@email.com]  (preenchido)      │
│                                          │
│  Escolha como enviar o convite:          │
│                                          │
│  ( ) Enviar por Email                    │
│      Sistema envia automaticamente       │
│                                          │
│  ( ) Gerar Link de Convite               │
│      Copiar link para enviar manual      │
│                                          │
│  [Cancelar]  [Enviar Convite]            │
└──────────────────────────────────────────┘
```

**Fluxo Backend:**
```sql
CREATE TABLE familia_convites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  email_responsavel VARCHAR(255) NOT NULL,
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  usado BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,  -- 7 dias
  created_at TIMESTAMP DEFAULT now()
);
```

**Tela de Ativação:** `/familia/ativar?token=xxx`
```
┌──────────────────────────────────────────┐
│  Criar Conta - Acesso Familiar           │
├──────────────────────────────────────────┤
│  Você foi convidado para acompanhar:     │
│  João Silva | 1º Ano A | Escola Piloto   │
│                                          │
│  Nome Completo*:                         │
│  [_______________________________]       │
│                                          │
│  Email*:                                 │
│  [joao.pai@email.com] (pré-preenchido)   │
│                                          │
│  Senha*:                                 │
│  [_______________________________]       │
│                                          │
│  Confirmar Senha*:                       │
│  [_______________________________]       │
│                                          │
│  [Criar Conta e Acessar]                 │
└──────────────────────────────────────────┘
```

**Ao criar conta:**
1. Criar usuário no Supabase Auth
2. Criar registro em `users` com `role: "familia"`
3. Vincular em `alunos_familia`:
   ```sql
   CREATE TABLE alunos_familia (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     relacao VARCHAR(50),  -- "Pai", "Mãe", "Responsável"
     created_at TIMESTAMP DEFAULT now(),
     UNIQUE(aluno_id, user_id)
   );
   ```
4. Marcar convite como `usado: true`
5. Redirecionar: `/familia/perfil-aluno/{aluno_id}`

---

## 5. PROFESSOR - DASHBOARD E SESSÕES

### **5.1 Papel do Professor (CLARIFICADO):**

✅ **O QUE O PROFESSOR FAZ:**
- Iniciar sessões com suas turmas
- Encerrar sessões
- Ver lista de alunos com Foto e PIN (para ajudar no login)
- Conduzir a aula usando o Player Sequencial
- Ver relatório da sessão (data, duração, alunos, pontos, disciplinas)
- Tirar dúvidas sobre acesso e funcionamento da plataforma

❌ **O QUE O PROFESSOR NÃO FAZ:**
- NÃO cria turmas (só admin escola)
- NÃO cria alunos (só admin escola)
- NÃO cria aulas, blocos, quizzes (só MKTECH)
- NÃO convida responsável para acesso online (só admin escola)
- NÃO edita conteúdo (só usa o que foi criado)

**Resumo:** O professor é um **facilitador** que conduz os alunos pelo caminho que a plataforma oferece.

---

### **5.2 Dashboard Simplificado** (`/dashboard/professor/page.tsx`)

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  Bem-vindo, Prof. João Silva!                            │
├──────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐  │
│  │  🎓 Iniciar Nova Sessão                            │  │
│  │                                                    │  │
│  │  Comece uma aula com seus alunos agora!           │  │
│  │                                                    │  │
│  │  [Iniciar Sessão →]  (botão grande destaque)      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Sessões Recentes                                  │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  📅 18/10/2025 14:30 | 1º Ano A | Algoritmos      │  │
│  │  ⏱️ Duração: 45 min  | 👥 23 alunos               │  │
│  │  [Ver Relatório]                                   │  │
│  │  ───────────────────────────────────────────────   │  │
│  │  📅 17/10/2025 10:15 | 1º Ano B | Raciocínio      │  │
│  │  ⏱️ Duração: 50 min  | 👥 25 alunos               │  │
│  │  [Ver Relatório]                                   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Minhas Turmas                                     │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  1º Ano A - 25 alunos                              │  │
│  │  [Ver Lista com PINs]                              │  │
│  │  ───────────────────────────────────────────────   │  │
│  │  1º Ano B - 28 alunos                              │  │
│  │  [Ver Lista com PINs]                              │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

### **5.3 Iniciar Sessão** (`/dashboard/professor/iniciar-sessao/page.tsx`)

**Passo 1: Selecionar Turma**
```
┌──────────────────────────────────────────┐
│  Iniciar Nova Sessão - Selecione Turma  │
├──────────────────────────────────────────┤
│  Suas Turmas:                            │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  1º Ano A                          │  │
│  │  25 alunos | Sala 201 | Manhã     │  │
│  │  [Selecionar →]                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  1º Ano B                          │  │
│  │  28 alunos | Sala 202 | Tarde     │  │
│  │  [Selecionar →]                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [← Voltar ao Dashboard]                 │
└──────────────────────────────────────────┘
```

**Passo 2: Selecionar Aula**
```
┌──────────────────────────────────────────┐
│  Turma: 1º Ano A - Selecione a Aula     │
├──────────────────────────────────────────┤
│  Aulas disponíveis para 1º Ano (EF1):   │
│                                          │
│  🔢 Introdução aos Algoritmos            │
│  Disciplina: Algoritmos | 5 blocos       │
│  Pontos totais: 50                       │
│  [Iniciar com esta Aula]                 │
│                                          │
│  🧠 O Despertar do Pensamento            │
│  Disciplina: Raciocínio Lógico | 4 blocos│
│  Pontos totais: 40                       │
│  [Iniciar com esta Aula]                 │
│                                          │
│  [← Voltar]                              │
└──────────────────────────────────────────┘
```

**Backend: Filtrar aulas por `ano_escolar_id`:**
```typescript
// Buscar ano_escolar_id da turma
const turma = await supabase
  .from('turmas')
  .select('ano_escolar_id')
  .eq('id', turmaId)
  .single()

// Buscar aulas compatíveis
const { data: aulas } = await supabase
  .from('aulas')
  .select(`
    id, titulo, descricao,
    disciplina_id,
    disciplinas(nome, codigo, cor_hex),
    ano_escolar_id
  `)
  .eq('ano_escolar_id', turma.ano_escolar_id)
```

**Passo 3: Sessão Criada**
```
┌──────────────────────────────────────────┐
│  ✅ Sessão Criada!                       │
├──────────────────────────────────────────┤
│  Turma: 1º Ano A                         │
│  Aula: Introdução aos Algoritmos         │
│                                          │
│  Alunos Conectados: 0/25                 │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │         [QR CODE GRANDE]           │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Código da Sessão: AB-94                 │
│                                          │
│  [Ver Lista de Alunos e PINs]            │
│                                          │
│  [Aguardando alunos...]                  │
│                                          │
│  [Iniciar Aula Agora]                    │
└──────────────────────────────────────────┘
```

**Modal: Lista de Alunos com PINs** (Ajuda para Login)
```
┌──────────────────────────────────────────┐
│  Alunos da Turma 1º Ano A                │
├──────────────────────────────────────────┤
│  📸 🐕 João Silva      PIN: 1234         │
│  📸 🐱 Maria Santos    PIN: 5678         │
│  📸 🍎 Pedro Costa     PIN: 9012         │
│  📸 🌸 Ana Oliveira    PIN: 3456         │
│  📸 🐕 Lucas Ferreira  PIN: 7890         │
│  ...                                     │
│                                          │
│  💡 Use esta lista para ajudar os alunos │
│     a fazer login na sessão.             │
│                                          │
│  [Imprimir Lista]  [Fechar]              │
└──────────────────────────────────────────┘
```

---

### **5.4 Relatório de Sessão**

**Exibido após encerrar:**
```
┌──────────────────────────────────────────┐
│  📊 Relatório da Sessão                  │
├──────────────────────────────────────────┤
│  Dados Gerais:                           │
│  ├─ Data/Hora Início: 18/10/2025 14:30  │
│  ├─ Data/Hora Fim: 18/10/2025 15:15     │
│  ├─ Duração Total: 45 minutos            │
│  ├─ Turma: 1º Ano A                      │
│  ├─ Aula: Introdução aos Algoritmos      │
│  └─ Disciplina: Algoritmos               │
│                                          │
│  Participação:                           │
│  ├─ Total de Alunos: 25                 │
│  ├─ Conectados: 23 (92%)                │
│  └─ Ausentes: 2                         │
│                                          │
│  Desempenho por Bloco:                   │
│  ├─ Bloco 1: O Que É um Algoritmo?      │
│  │   ├─ Respostas: 23/23 (100%)         │
│  │   ├─ Acertos: 20 (87%)               │
│  │   ├─ Pontos: 200                     │
│  │   └─ Tempo médio: 3m 20s             │
│  └─ ...                                  │
│                                          │
│  Top 3 Alunos:                           │
│  ├─ 1º - João Silva: 50 pts             │
│  ├─ 2º - Maria Santos: 48 pts           │
│  └─ 3º - Pedro Costa: 45 pts            │
│                                          │
│  [Exportar PDF]  [Voltar ao Dashboard]   │
└──────────────────────────────────────────┘
```

---

## 6. FAMÍLIA - PERFIL DO ALUNO

**Rota:** `/familia/perfil-aluno/{aluno_id}`

```
┌──────────────────────────────────────────────────────────┐
│  Perfil do Aluno                                         │
├──────────────────────────────────────────────────────────┤
│  ┌──────────┐                                            │
│  │  [FOTO]  │  João Silva                                │
│  └──────────┘  Turma: 1º Ano A | Escola Piloto          │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Resumo de Desempenho                              │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  Pontos Totais: 1.250                              │  │
│  │  Nível: 5 (Explorador) [████████░░] 80%            │  │
│  │  Badges: 12                                        │  │
│  │  Ranking: 3º na Turma, 15º na Escola              │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Badges Conquistados                               │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  🏆 Primeiro Passo      🎯 10 Quizzes Perfeitos   │  │
│  │  🔥 Sequência de 5 Dias 🧠 Mestre da Lógica       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Histórico de Sessões (últimas 10)                │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  Data       | Aula      | Disciplina | Pts | %   │  │
│  │  18/10/2025 | Algoritmos| ALG        | 50  | 100%│  │
│  │  17/10/2025 | Lógica    | LOG        | 45  | 90% │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [Voltar]                                                │
└──────────────────────────────────────────────────────────┘
```

**Funcionalidades Futuras:**
- Home Works (tarefas extras)
- Projetos Extras (desafios temáticos)
- Jogos Educativos (standalone)

---

## 7. SISTEMA DE GAMIFICAÇÃO

### **7.1 Sistema de Pontuação**

**Tabela `pontos_config`:**
```sql
CREATE TABLE pontos_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  base_pontos INTEGER NOT NULL,
  multiplicador DECIMAL(3,2) DEFAULT 1.0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

INSERT INTO pontos_config (tipo, nome, base_pontos, multiplicador) VALUES
  ('quiz_primeira_tentativa', 'Acerto na 1ª Tentativa', 10, 1.0),
  ('quiz_segunda_tentativa', 'Acerto na 2ª Tentativa', 10, 0.7),
  ('quiz_terceira_tentativa', 'Acerto na 3ª Tentativa', 10, 0.5),
  ('resposta_rapida', 'Resposta Rápida (< 5s)', 5, 1.2),
  ('sequencia_3_acertos', 'Sequência de 3 Acertos', 15, 1.5);
```

**Lógica de Cálculo:**
```typescript
async function calcularPontos(response: QuizResponse, quiz: Quiz): Promise<number> {
  if (!response.correct) return 0
  
  // 1. Pontos base por tentativa
  let pontos = quiz.pontos_max
  if (response.tentativa === 2) pontos *= 0.7
  if (response.tentativa === 3) pontos *= 0.5
  
  // 2. Bônus por resposta rápida
  if (response.tempo_resposta_seg < 5) {
    pontos += 5
  }
  
  // 3. Multiplicador de sequência
  const sequenciaAtual = await getSequenciaAcertos(response.aluno_id)
  if (sequenciaAtual >= 3) {
    pontos *= 1.5
  }
  
  return Math.round(pontos)
}
```

---

### **7.2 Sistema de Badges**

**Tabela `badges_templates`:**
```sql
CREATE TABLE badges_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  icone VARCHAR(255),  -- Emoji ou URL
  cor_hex VARCHAR(7) DEFAULT '#FFD700',
  categoria VARCHAR(50),  -- "pontuacao", "participacao", "disciplina", "especial"
  criterio JSONB NOT NULL,
  pontos_requeridos INTEGER,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Exemplos:
INSERT INTO badges_templates (nome, descricao, icone, categoria, criterio) VALUES
  ('Primeiro Passo', 'Completou 1 aula', '🎓', 'participacao', '{"tipo":"aulas_completadas","valor":1}'),
  ('Explorador', 'Alcançou 1000 pts', '🏆', 'pontuacao', '{"tipo":"pontos_totais","valor":1000}'),
  ('Mestre da Lógica', '20 acertos em LOG', '🧠', 'disciplina', '{"tipo":"acertos_disciplina","disciplina":"LOG","valor":20}');
```

**Tabela `alunos_badges`:**
```sql
CREATE TABLE alunos_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges_templates(id),
  conquistado_em TIMESTAMP DEFAULT now(),
  sessao_id UUID REFERENCES sessions(id),
  UNIQUE(aluno_id, badge_id)
);
```

---

### **7.3 Sistema de Níveis**

```typescript
const NIVEIS = [
  { nivel: 1, nome: 'Iniciante', pontos_min: 0, cor: '#94a3b8' },
  { nivel: 2, nome: 'Aprendiz', pontos_min: 100, cor: '#3b82f6' },
  { nivel: 3, nome: 'Explorador', pontos_min: 500, cor: '#10b981' },
  { nivel: 4, nome: 'Aventureiro', pontos_min: 1000, cor: '#eab308' },
  { nivel: 5, nome: 'Mestre', pontos_min: 2500, cor: '#f97316' },
  { nivel: 6, nome: 'Lenda', pontos_min: 5000, cor: '#ef4444' },
  { nivel: 7, nome: 'Herói', pontos_min: 10000, cor: '#a855f7' },
]
```

---

### **7.4 Sistema de Ranking**

```sql
CREATE MATERIALIZED VIEW rankings_turma AS
SELECT 
  a.id AS aluno_id,
  a.full_name,
  a.turma_id,
  a.pontos_totais,
  RANK() OVER (PARTITION BY a.turma_id ORDER BY a.pontos_totais DESC) AS posicao_turma
FROM alunos a
WHERE a.active = true;
```

---

## 8. PLAYER SEQUENCIAL DE AULAS

**Rota:** `/dashboard/professor/sessao/{sessionId}`

```
┌──────────────────────────────────────────────────────────┐
│  Header: ← Voltar | 1º Ano A | Algoritmos | ⏱️ 00:15:32  │
├──────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────────────┐│
│  │  Sidebar    │  │  Player Principal                   ││
│  │             │  │                                     ││
│  │ ✅ Bloco 1  │  │  [MÍDIA ou QUIZ ATIVO]              ││
│  │ 🟢 Bloco 2  │  │                                     ││
│  │ ⚪ Bloco 3  │  │                                     ││
│  │ ⚪ Bloco 4  │  │                                     ││
│  └─────────────┘  └─────────────────────────────────────┘│
│                                                          │
│  Controles: [◀ Anterior] [▶ Próximo] [⏸] [⏹]            │
│                                                          │
│  Status Alunos: ✅ João (50) ✅ Maria (48) ⏳ Pedro (45) │
└──────────────────────────────────────────────────────────┘
```

**Sincronização Real-Time:**
```typescript
// Professor avança bloco
await supabase
  .from('sessions')
  .update({ bloco_ativo_numero: proximoIndex })
  .eq('id', sessionId)

// Alunos escutam
supabase
  .channel(`session:${sessionId}`)
  .on('postgres_changes', { ... }, (payload) => {
    setBlocoAtual(payload.new.bloco_ativo_numero)
  })
```

---

## 9. ROADMAP DE IMPLEMENTAÇÃO

### **Fase 1: Fundação** ⏰ **2 semanas**
- [x] Admin Escola: Dashboard
- [x] Admin Escola: CRUD Professores
- [ ] **Admin Escola: CRUD Turmas** ⭐ **(PRÓXIMO)**
- [ ] **Admin Escola: CRUD Alunos** ⭐
- [ ] Admin Escola: Importar CSV
- [ ] Admin Escola: Convidar Família

### **Fase 2: Professor e Sessão** ⏰ **2 semanas**
- [ ] **Professor: Dashboard Simplificado** ⭐
- [ ] **Professor: Iniciar Sessão** ⭐
- [ ] **Player Sequencial** ⭐
- [ ] Professor: Relatório de Sessão

### **Fase 3: Gamificação** ⏰ **2 semanas**
- [ ] Sistema de Pontuação ⭐
- [ ] Sistema de Badges ⭐
- [ ] Sistema de Níveis
- [ ] Ranking

### **Fase 4: Família** ⏰ **1 semana**
- [ ] Convite e Cadastro
- [ ] Perfil do Aluno
- [ ] Histórico de Sessões

### **Fase 5: Relatórios** ⏰ **1 semana**
- [ ] Admin MKTECH: Analytics
- [ ] Admin Escola: Relatórios
- [ ] Exportação PDF/CSV

---

## ✅ VALIDAÇÃO FINAL

**Conceitos Confirmados:**
- ✅ Turma = Ano (MKTECH) + Designação (Escola)
- ✅ Aluno: Ícone + PIN 4 dígitos
- ✅ Professor: Apenas conduz sessões, não cria nada ⚠️ **CORRIGIDO**
- ✅ Admin Escola: Gerencia tudo (professores, turmas, alunos, família)
- ✅ Família: Visualiza perfil, futuro home works

**Próxima Ação:**
🚀 **Implementar CRUD de Turmas** (Fase 1, Prioridade 1)

---

**Status:** ✅ **COMPLETO E APROVADO**  
**Última atualização:** 2025-10-18  
**Pronto para implementação!** 🎯
