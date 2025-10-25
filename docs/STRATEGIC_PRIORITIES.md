# MKTECH - Prioridades Estratégicas

**Versão:** 1.1  
**Data:** Outubro 2025  
**Status:** Em Desenvolvimento

---

## 🎯 3 PILARES ESTRATÉGICOS

### 1️⃣ FÁBRICA DE BLOCOS (Maior Desafio)
**Objetivo:** Tornar a criação de conteúdo escalável e repetível

**Problema a resolver:**
- Criação manual de blocos é lenta (1 bloco = 2-4h)
- Difícil escalar para múltiplas disciplinas
- Qualidade inconsistente entre blocos

**Solução:** Sistema IA que recebe planejamento + assets → gera bloco completo

### 2️⃣ LANDING PAGE "UAU"
**Objetivo:** Converter escolas e criar demanda de pais

**Elementos-chave:**
- Design moderno (Lottie animations, cores OKLCH)
- Copywriting persuasivo (pain points + benefícios)
- Prova social (future: testimoniais)
- CTA forte ("Agendar Demo")

### 3️⃣ SEQUÊNCIA DEMONSTRATIVA PERFEITA
**Objetivo:** Fechar vendas com demo impecável

**Requisitos:**
- 1 aula completa ("Algoritmos Básicos")
- 3 blocos + quizzes funcionando perfeitamente
- 30 alunos fake + 3 turmas
- Badges desbloqueando em tempo real
- Zero erros, latência < 2s

---

## 📋 ROADMAP ATUALIZADO

### **MVP CORE** (Q1 2025) - FASE 1-5
- Schema completo + Seed data
- Dashboard Professor
- Fluxo Aluno (QR/PIN, player, quiz)
- Gamificação (pontos, badges, ranking)

### **DEMO SEQUENCE** (Q1 2025) - FASE 6
- 1 aula "Algoritmos Básicos" completa
- Trilha "Pensamento Computacional"
- Dados fake para demo

### **LANDING PAGE** (Q1 2025) - FASE 7
- Hero com Lottie
- Seções persuasivas
- Animações suaves
- CTA forte

### **DASHBOARDS** (Q2 2025) - FASE 8-9
- Admin Escola (CRUD completo)
- Dashboard Pais

### **ADMIN MKTECH BÁSICO** (Q2 2025) - FASE 10
- CRUD manual de conteúdo

### **FÁBRICA DE BLOCOS** (Q3 2025) - FASE 11 ⭐
- Sistema IA de geração automática

### **INTEGRAÇÕES** (Q3 2025) - FASE 12
- Phaser 3, H5P, Real-time

### **RLS + SEGURANÇA** (Q4 2025) - FASE 13
- Policies, middleware, rate limiting

### **DEPLOY** (Q4 2025) - FASE 14
- PWA, CI/CD, Production

---

## 🤖 FÁBRICA DE BLOCOS - ESPECIFICAÇÃO DETALHADA

### **Input do Usuário**

1. **Planejamento em Texto:**
   ```
   Objetivo: Ensinar conceito de Loop
   Público: EF2-6
   Duração: 5 minutos
   Disciplinas: Programação, Lógica
   ```

2. **Assets:**
   - Imagens (drag-drop upload)
   - Vídeos (URL ou upload)
   - Áudio (narração ou música de fundo)

3. **Configurações:**
   - Formato: Video | Apresentação | Lottie | Phaser
   - Pontos: 10-50
   - Quiz: MCQ (3-5 perguntas) | V-F | Phaser Game
   - Tentativas: 1-3
   - Tempo: 30s-5min

### **Pipeline de Processamento**

```
┌─────────────────────────────────────────┐
│ 1. ANÁLISE (GPT-4)                     │
│    → Extrair keywords, complexidade     │
│    → Sugerir estrutura pedagógica       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 2. GERAÇÃO POR FORMATO                  │
│                                         │
│ VIDEO:                                  │
│  → Roteiro (início, meio, fim)         │
│  → Timeline de assets                   │
│  → Legendas PT-BR + EN                  │
│                                         │
│ APRESENTAÇÃO:                           │
│  → 3-5 slides JSON                      │
│  → Títulos + bullets + imagens          │
│                                         │
│ LOTTIE:                                 │
│  → Animation description                │
│  → JSON via API                         │
│                                         │
│ PHASER:                                 │
│  → Level JSON (tilemap, baús)           │
│  → Question Pack                        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 3. GERAÇÃO DE QUIZZES                   │
│    → 3-5 perguntas (MCQ ou V-F)        │
│    → Alternativas plausíveis            │
│    → Hints opcionais                    │
│    → Validação Zod                      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 4. PREVIEW & AJUSTES                    │
│    → Renderizar como aluno veria        │
│    → Admin revisa e ajusta              │
│    → Aprovar → Salvar Supabase          │
└─────────────────────────────────────────┘
```

### **Features**

- [ ] Interface wizard multi-step
- [ ] Upload de assets (drag-drop + preview)
- [ ] Editor de planejamento (rich text)
- [ ] Seletor de formato (cards)
- [ ] Botão "Gerar com IA" (loading 10-30s)
- [ ] Preview interativo
- [ ] Edição pós-geração
- [ ] Histórico de versões
- [ ] Templates reutilizáveis
- [ ] Biblioteca de assets compartilhada
- [ ] Validação Zod em todos JSONs

### **Tech Stack**

- OpenAI GPT-4 Turbo (geração de conteúdo)
- Supabase Storage (assets)
- Zod (validação)
- React Hook Form (formulários)
- Monaco Editor (editar JSON)
- Lottie Creator API
- Phaser Level Generator

---

## 📊 MÉTRICAS DE SUCESSO

### Landing Page
- Conversão: ≥ 10% (visitantes → leads)
- Bounce rate: ≤ 40%
- Tempo médio: ≥ 2min

### Demo Sequence
- Taxa de fechamento: ≥ 30% (demos → contratos)
- NPS pós-demo: ≥ 70

### Fábrica de Blocos
- Tempo de criação: < 15min (vs 2-4h manual)
- Qualidade: ≥ 80% aprovação sem ajustes
- Escalabilidade: 10+ blocos/dia

---

**Próximo:** Iniciar FASE 2 (Schema + Seed Data)




