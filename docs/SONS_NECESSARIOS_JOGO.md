# 🎵 Sons Necessários para o Adventure Runner

## 📁 Localização
Todos os sons devem ser colocados em: `public/games/assets/sounds/`

## 🎼 Lista de Sons Necessários

### 1. **coin.mp3** 💰
- **Descrição**: Som ao coletar moeda
- **Duração**: 0.5s - 1s
- **Tom**: Agudo, alegre
- **Exemplo**: "Ding!", "Plink!"
- **Sites para baixar grátis**:
  - https://mixkit.co/free-sound-effects/coin/
  - https://freesound.org/search/?q=coin
  - https://pixabay.com/sound-effects/search/coin/

### 2. **chest.mp3** 📦
- **Descrição**: Som ao abrir baú
- **Duração**: 1s - 2s
- **Tom**: Misterioso, recompensador
- **Exemplo**: Som de baú abrindo com chiado
- **Sites para baixar grátis**:
  - https://mixkit.co/free-sound-effects/treasure/
  - https://freesound.org/search/?q=chest+open
  - https://pixabay.com/sound-effects/search/chest/

### 3. **jump.mp3** 🦘
- **Descrição**: Som ao pular
- **Duração**: 0.3s - 0.5s
- **Tom**: Leve, "boing"
- **Exemplo**: Som de pulo estilo Mario
- **Sites para baixar grátis**:
  - https://mixkit.co/free-sound-effects/jump/
  - https://freesound.org/search/?q=jump
  - https://pixabay.com/sound-effects/search/jump/

### 4. **correct.mp3** ✅
- **Descrição**: Som ao acertar pergunta
- **Duração**: 1s - 2s
- **Tom**: Positivo, celebrativo
- **Exemplo**: "Ta-dá!", fanfarra curta
- **Sites para baixar grátis**:
  - https://mixkit.co/free-sound-effects/success/
  - https://freesound.org/search/?q=correct+answer
  - https://pixabay.com/sound-effects/search/success/

### 5. **wrong.mp3** ❌
- **Descrição**: Som ao errar pergunta
- **Duração**: 0.5s - 1s
- **Tom**: Negativo mas educativo (não assustador)
- **Exemplo**: "Ohh...", "Buzz"
- **Sites para baixar grátis**:
  - https://mixkit.co/free-sound-effects/wrong/
  - https://freesound.org/search/?q=wrong+answer
  - https://pixabay.com/sound-effects/search/wrong/

## ✅ Música de Fundo (Já existe)
- **Arquivo**: `public/games/assets/music/Fluffing a Duck.mp3`
- **Status**: ✅ Já está configurado no código

## 🎛️ Configuração Atual (Volumes)

```typescript
// Volumes configurados no código:
bgMusic: 0.3 (30%)      // Música de fundo
coinSound: 0.5 (50%)    // Som de moeda
chestSound: 0.6 (60%)   // Som de baú
jumpSound: 0.4 (40%)    // Som de pulo
correctSound: 0.7 (70%) // Som de acerto
wrongSound: 0.6 (60%)   // Som de erro
```

## 📥 Como Adicionar os Sons

### Opção 1: Download Manual
1. Acesse os sites listados acima
2. Baixe os arquivos em formato **MP3**
3. Renomeie para os nomes exatos: `coin.mp3`, `chest.mp3`, etc.
4. Coloque em `public/games/assets/sounds/`

### Opção 2: Usar Sons Temporários (Placeholder)
Por enquanto, o jogo vai funcionar normalmente mesmo sem os sons. Apenas aparecerá um warning no console:
```
⚠️ Erro ao carregar sons: [erro]
```

## 🎮 Quando os Sons Tocam

- **coin.mp3**: A cada moeda coletada
- **chest.mp3**: Ao abrir um baú (coletar)
- **jump.mp3**: A cada pulo do personagem
- **correct.mp3**: Ao responder pergunta corretamente
- **wrong.mp3**: Ao responder pergunta incorretamente
- **bg-music** (Fluffing a Duck): Durante todo o jogo (loop)

## ✅ Status Atual

✅ Código implementado e pronto
✅ Música de fundo presente
⏳ **Faltam 5 efeitos sonoros** (coin, chest, jump, correct, wrong)

## 🚀 Próximo Passo

**Baixe os 5 sons e coloque na pasta `public/games/assets/sounds/`**

Ou deixe assim temporariamente - o jogo funcionará normalmente!

---

**Data**: 26/10/2025

