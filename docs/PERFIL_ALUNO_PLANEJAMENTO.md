# 🎨 PERFIL DO ALUNO - PLANEJAMENTO COMPLETO

## 📋 STATUS DO DOCUMENTO
- **Versão:** 1.0
- **Data Criação:** 24/10/2024
- **Última Atualização:** 24/10/2024
- **Status:** 🟡 EM PLANEJAMENTO

---

## 🎯 VISÃO GERAL

### **Objetivo**
Criar uma página de perfil do aluno com design **lúdico, divertido e engajador** que:
- Mostre o progresso do aluno de forma visual e motivadora
- Seja acessível por **Admin da Escola**, **Aluno** e **Pais**
- Incentive o aprendizado através de gamificação
- Seja responsiva e mobile-friendly

### **Rotas**
- **Aluno:** `/meu-perfil` (já existe, será reformulada)
- **Admin Escola:** `/dashboard/admin-escola/alunos/[id]/perfil` (nova)
- **Pais:** `/perfil-aluno/[codigo]` (nova - acesso com código)

---

## 🎨 DESIGN LÚDICO - ESPECIFICAÇÕES

### **1. Paleta de Cores Divertidas**
```css
:root {
  /* Cores Primárias */
  --primary-fun: #FF6B6B;        /* Vermelho coral vibrante */
  --secondary-fun: #4ECDC4;      /* Turquesa alegre */
  --accent-fun: #FFE66D;         /* Amarelo ensolarado */
  
  /* Cores de Gamificação */
  --gold-trophy: #FFD700;        /* Ouro para troféus */
  --silver-trophy: #C0C0C0;      /* Prata */
  --bronze-trophy: #CD7F32;      /* Bronze */
  
  /* Cores de Status */
  --success-playful: #96CEB4;    /* Verde suave */
  --warning-playful: #FFEAA7;    /* Amarelo claro */
  --danger-playful: #FF7675;     /* Vermelho suave */
  
  /* Gradientes */
  --gradient-hero: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-card: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --gradient-achievement: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}
```

### **2. Tipografia**
```css
/* Fontes Divertidas e Legíveis */
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@300;400;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

/* Uso sugerido */
font-family-heading: 'Fredoka', sans-serif;  /* Títulos */
font-family-body: 'Nunito', sans-serif;      /* Corpo de texto */
font-family-special: 'Comic Neue', cursive;  /* Destaques especiais */
```

### **3. Ícones e Avatares**
- **Avatar do Aluno:** Grande, circular, com borda colorida animada
- **Ícones de Afinidade:** Emojis grandes (3x o tamanho normal)
- **Badges/Troféus:** Com animações de brilho e bounce
- **Ícones de Estatísticas:** Lucide Icons coloridos e grandes

### **4. Componentes Especiais Necessários**

#### **A. Avatar Animado**
```typescript
// src/components/aluno/AnimatedAvatar.tsx
interface AnimatedAvatarProps {
  nome: string
  iconeAfinidade: string
  nivel: number
  pontos: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLevel?: boolean
  animated?: boolean
}
```
**Características:**
- Borda com gradiente animado
- Pulso suave ao passar o mouse
- Badge de nível flutuante
- Efeito de confete ao subir de nível

#### **B. Card de Estatística Lúdica**
```typescript
// src/components/aluno/PlayfulStatCard.tsx
interface PlayfulStatCardProps {
  icon: LucideIcon
  value: number
  label: string
  color: string
  trend?: 'up' | 'down' | 'neutral'
  animated?: boolean
}
```
**Características:**
- Ícone grande e colorido
- Número com animação de contagem
- Gradiente de fundo suave
- Hover effect com escala

#### **C. Timeline de Progresso**
```typescript
// src/components/aluno/ProgressTimeline.tsx
interface ProgressTimelineProps {
  atividades: Array<{
    id: string
    tipo: 'aula' | 'quiz' | 'conquista'
    titulo: string
    data: string
    pontos: number
    icone: string
  }>
}
```
**Características:**
- Linha do tempo vertical colorida
- Ícones animados
- Cards expansíveis
- Micro-animações ao scroll

#### **D. Galeria de Badges**
```typescript
// src/components/aluno/BadgeGallery.tsx
interface BadgeGalleryProps {
  badges: Array<{
    id: string
    nome: string
    descricao: string
    icone: string
    conquistada: boolean
    dataConquista?: string
    raridade: 'comum' | 'rara' | 'epica' | 'lendaria'
  }>
}
```
**Características:**
- Grid responsivo
- Badges não conquistadas em escala de cinza
- Modal com detalhes ao clicar
- Animação de "conquista" (confete/estrelas)

#### **E. Gráfico de Progresso Circular**
```typescript
// src/components/aluno/CircularProgress.tsx
interface CircularProgressProps {
  progress: number
  label: string
  color: string
  size?: number
  showPercentage?: boolean
  animated?: boolean
}
```
**Características:**
- Animação suave de preenchimento
- Gradiente na borda
- Label centralizado
- Efeito de brilho ao completar 100%

#### **F. Ranking Card Divertido**
```typescript
// src/components/aluno/FunRankingCard.tsx
interface FunRankingCardProps {
  posicao: number
  totalAlunos: number
  pontos: number
  proximoPosicao?: {
    nome: string
    pontos: number
  }
}
```
**Características:**
- Troféu/medalha animada
- Indicador de proximidade do próximo
- Mensagem motivacional
- Confete se for top 3

---

## 📊 ESTRUTURA DE DADOS

### **1. Dados do Aluno**
```typescript
interface PerfilAluno {
  // Informações Básicas
  id: string
  full_name: string
  icone_afinidade: string
  pin_code: string
  email_pais?: string
  turma: {
    id: string
    name: string
    ano_escolar: string
  }
  escola: {
    id: string
    name: string
  }
  
  // Estatísticas
  estatisticas: {
    pontos_totais: number
    nivel: number
    aulas_completadas: number
    quizzes_completados: number
    taxa_acerto: number
    tempo_total_estudo: number // em minutos
    sequencia_dias: number // streak
    ultima_atividade: string
  }
  
  // Badges e Conquistas
  badges: Array<{
    id: string
    nome: string
    descricao: string
    icone: string
    raridade: 'comum' | 'rara' | 'epica' | 'lendaria'
    conquistada: boolean
    data_conquista?: string
    progresso?: number // 0-100 para badges em progresso
  }>
  
  // Ranking
  ranking: {
    posicao_turma: number
    total_turma: number
    posicao_escola: number
    total_escola: number
    top_3_turma: Array<{
      nome: string
      pontos: number
      avatar: string
    }>
  }
  
  // Atividades Recentes
  atividades_recentes: Array<{
    id: string
    tipo: 'aula' | 'quiz' | 'conquista' | 'badge'
    titulo: string
    descricao: string
    data: string
    pontos: number
    icone: string
  }>
  
  // Progresso por Disciplina
  disciplinas: Array<{
    codigo: string
    nome: string
    aulas_totais: number
    aulas_completadas: number
    pontos_ganhos: number
    ultima_aula: string
  }>
}
```

---

## 🎭 LAYOUT DA PÁGINA

### **Seção 1: Hero com Avatar (Topo)**
```
┌─────────────────────────────────────────┐
│     [Gradiente de Fundo Animado]        │
│                                         │
│        🎭 [Avatar Grande Animado]       │
│                                         │
│         Nome do Aluno                   │
│      Turma | Escola | Nível X          │
│                                         │
│   [Barra de Progresso de Nível]        │
│      X/1000 pts até próximo nível      │
│                                         │
└─────────────────────────────────────────┘
```

### **Seção 2: Estatísticas Rápidas (Cards)**
```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ 🏆 1234 │ │ 📚 15   │ │ ⭐ 95%  │ │ 🔥 7    │
│ Pontos  │ │ Aulas   │ │ Acerto  │ │ Dias    │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### **Seção 3: Grid Principal (2 Colunas)**
```
┌──────────────────────┐  ┌──────────────────┐
│   🏅 Conquistas      │  │  📊 Ranking      │
│                      │  │                  │
│  [Badge Gallery]     │  │  Posição: 3/25   │
│                      │  │  [Top 3 Cards]   │
│  10/25 conquistadas  │  │                  │
└──────────────────────┘  └──────────────────┘

┌──────────────────────┐  ┌──────────────────┐
│ 📈 Progresso         │  │ 🎯 Disciplinas   │
│                      │  │                  │
│ [Circular Progress]  │  │  [Lista Cards]   │
│                      │  │                  │
└──────────────────────┘  └──────────────────┘

┌─────────────────────────────────────────┐
│         📅 Atividades Recentes          │
│                                         │
│         [Timeline Vertical]             │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔐 CONTROLE DE ACESSO

### **1. Aluno (Próprio Perfil)**
- ✅ Ver todas as informações
- ✅ Ver ranking completo
- ✅ Ver histórico de atividades
- ❌ Editar informações (apenas visualização)

### **2. Admin da Escola**
- ✅ Ver todas as informações
- ✅ Ver ranking
- ✅ Ver histórico completo
- ✅ Exportar relatório PDF
- ✅ Editar informações do aluno
- ✅ Resetar progresso (com confirmação)

### **3. Pais**
- ✅ Ver informações básicas
- ✅ Ver estatísticas
- ✅ Ver atividades recentes (últimos 30 dias)
- ❌ Ver ranking (opcional, pode ser configurável)
- ❌ Editar informações
- **Acesso:** Código único por aluno (6 dígitos) enviado por email

---

## 🎁 ELEMENTOS DE GAMIFICAÇÃO

### **1. Sistema de Níveis**
```typescript
const NIVEIS = {
  1: { pontos_necessarios: 0, titulo: 'Iniciante' },
  2: { pontos_necessarios: 100, titulo: 'Aprendiz' },
  3: { pontos_necessarios: 250, titulo: 'Estudante' },
  4: { pontos_necessarios: 500, titulo: 'Explorador' },
  5: { pontos_necessarios: 1000, titulo: 'Mestre' },
  // ... até nível 50
}
```

### **2. Badges Automáticas**
```typescript
const BADGES_AUTOMATICAS = [
  {
    id: 'primeira_aula',
    nome: 'Primeira Aula',
    descricao: 'Complete sua primeira aula',
    icone: '🎓',
    raridade: 'comum'
  },
  {
    id: 'streak_7',
    nome: 'Uma Semana!',
    descricao: 'Estude por 7 dias seguidos',
    icone: '🔥',
    raridade: 'rara'
  },
  {
    id: 'pontos_1000',
    nome: 'Milionário',
    descricao: 'Alcance 1000 pontos',
    icone: '💎',
    raridade: 'epica'
  },
  // ... mais badges
]
```

### **3. Mensagens Motivacionais**
```typescript
const MENSAGENS_MOTIVACIONAIS = {
  top_1: 'Você é o número 1! 🏆',
  top_3: 'Incrível! Você está no top 3! 🥈',
  top_10: 'Muito bem! Continue assim! ⭐',
  subiu_posicao: 'Você subiu no ranking! 📈',
  nova_badge: 'Nova conquista desbloqueada! 🎉',
  subiu_nivel: 'Parabéns! Você subiu de nível! 🎊',
  streak: 'Sequência de ${dias} dias! Continue! 🔥'
}
```

---

## 📱 ANIMAÇÕES NECESSÁRIAS

### **1. Animações de Entrada**
- **Fade In + Slide Up:** Para cards ao carregar
- **Scale In:** Para badges e troféus
- **Number Counter:** Para estatísticas (contagem animada)

### **2. Animações de Hover**
- **Scale + Shadow:** Cards crescem levemente
- **Bounce:** Badges pulam ao passar o mouse
- **Rotate + Glow:** Troféus brilham e giram

### **3. Animações de Conquista**
```typescript
// src/components/animations/ConquestAnimation.tsx
interface ConquestAnimationProps {
  tipo: 'badge' | 'nivel' | 'ranking'
  titulo: string
  descricao: string
  icone: string
  onComplete: () => void
}
```
**Efeitos:**
- Confete caindo
- Som de comemoração (opcional)
- Modal centralizado com animação
- Botão "Compartilhar conquista"

---

## 🛠️ ASSETS NECESSÁRIOS (O QUE VOCÊ PRECISA PROVIDENCIAR)

### **1. Animações Lottie (JSON)**
📦 **Arquivos necessários em `/public/animations/perfil/`:**

- [ ] `celebration.json` - Animação de comemoração (confete)
- [ ] `trophy-shine.json` - Troféu brilhando
- [ ] `level-up.json` - Subir de nível
- [ ] `badge-unlock.json` - Desbloquear badge
- [ ] `star-sparkle.json` - Estrelas brilhando
- [ ] `fire-streak.json` - Chama para streak
- [ ] `rocket-progress.json` - Foguete para progresso

**Onde encontrar:**
- https://lottiefiles.com (gratuito)
- Buscar por: "celebration", "trophy", "level up", "achievement"

### **2. Ícones de Badges**
📦 **Arquivos SVG/PNG em `/public/icons/badges/`:**

- [ ] `first-lesson.svg` - Primeira aula
- [ ] `streak-7.svg` - 7 dias seguidos
- [ ] `streak-30.svg` - 30 dias seguidos
- [ ] `points-100.svg` - 100 pontos
- [ ] `points-500.svg` - 500 pontos
- [ ] `points-1000.svg` - 1000 pontos
- [ ] `perfect-quiz.svg` - Quiz perfeito
- [ ] `speed-demon.svg` - Completar rápido
- [ ] `top-student.svg` - Melhor aluno
- [ ] `explorer.svg` - Explorar tudo

**Sugestões de Design:**
- Estilo cartoon/flat
- Cores vibrantes
- Fundo transparente
- Tamanho: 256x256px

### **3. Sons (Opcional)**
📦 **Arquivos MP3/OGG em `/public/sounds/`:**

- [ ] `achievement.mp3` - Som de conquista
- [ ] `level-up.mp3` - Som de subir de nível
- [ ] `badge-unlock.mp3` - Som de desbloquear badge
- [ ] `click.mp3` - Som de clique
- [ ] `success.mp3` - Som de sucesso

**Onde encontrar:**
- https://freesound.org
- https://mixkit.co/free-sound-effects/
- Buscar por: "achievement", "level up", "success"

### **4. Imagens de Background**
📦 **Imagens em `/public/images/perfil/`:**

- [ ] `hero-gradient.png` - Background do hero (1920x600px)
- [ ] `pattern-dots.svg` - Padrão de bolinhas
- [ ] `pattern-waves.svg` - Padrão de ondas

---

## 📚 BIBLIOTECAS A INSTALAR

```bash
# Animações Lottie
pnpm add lottie-react

# Gráficos e Charts
pnpm add recharts

# Confete
pnpm add canvas-confetti
pnpm add @types/canvas-confetti -D

# Animações
pnpm add framer-motion

# Sons (opcional)
pnpm add use-sound
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Fase 1: Preparação**
- [ ] Coletar todos os assets (animações, ícones, sons)
- [ ] Instalar bibliotecas necessárias
- [ ] Criar estrutura de pastas
- [ ] Definir paleta de cores no globals.css
- [ ] Importar fontes

### **Fase 2: Componentes Base**
- [ ] AnimatedAvatar.tsx
- [ ] PlayfulStatCard.tsx
- [ ] BadgeGallery.tsx
- [ ] CircularProgress.tsx
- [ ] FunRankingCard.tsx
- [ ] ProgressTimeline.tsx

### **Fase 3: Backend**
- [ ] RPC: get_perfil_aluno_completo
- [ ] RPC: get_badges_aluno
- [ ] RPC: get_ranking_turma
- [ ] RPC: get_atividades_recentes
- [ ] RPC: gerar_codigo_acesso_pais
- [ ] Tabela: alunos_badges
- [ ] Tabela: alunos_atividades

### **Fase 4: Páginas**
- [ ] /meu-perfil (redesign completo)
- [ ] /dashboard/admin-escola/alunos/[id]/perfil
- [ ] /perfil-aluno/[codigo] (para pais)

### **Fase 5: Funcionalidades**
- [ ] Sistema de níveis
- [ ] Sistema de badges automáticas
- [ ] Cálculo de ranking
- [ ] Timeline de atividades
- [ ] Exportar PDF (admin)
- [ ] Gerar código para pais

### **Fase 6: Animações**
- [ ] Animação de conquista
- [ ] Confete ao subir de nível
- [ ] Contador animado de pontos
- [ ] Hover effects
- [ ] Loading states

### **Fase 7: Testes**
- [ ] Testar como aluno
- [ ] Testar como admin
- [ ] Testar como pais
- [ ] Testar responsividade
- [ ] Testar animações
- [ ] Testar performance

---

## 📝 NOTAS TÉCNICAS

### **Performance**
- Lazy load de animações Lottie
- Virtualização da lista de atividades (se > 50 itens)
- Otimizar imagens com Next.js Image
- Cache de RPCs por 5 minutos

### **Acessibilidade**
- Alt text em todas as imagens
- ARIA labels em componentes interativos
- Contraste adequado (WCAG AA)
- Navegação por teclado

### **Responsividade**
- Mobile First
- Breakpoints: 640px, 768px, 1024px, 1280px
- Grid adaptativo
- Fonte fluida (clamp)

---

## 🚀 PRÓXIMOS PASSOS

1. **Você providencia:** Assets (animações, ícones, sons)
2. **Eu implemento:** Componentes base
3. **Você valida:** Design e UX
4. **Eu implemento:** Backend e RPCs
5. **Você testa:** Funcionalidades
6. **Eu implemento:** Animações finais
7. **Você valida:** Versão final

---

## 📞 DÚVIDAS E SUGESTÕES

Use este espaço para adicionar notas, dúvidas ou sugestões durante a implementação:

```
[ADICIONAR NOTAS AQUI]
```

---

**Última atualização:** 24/10/2024
**Próxima revisão:** Após coleta de assets

