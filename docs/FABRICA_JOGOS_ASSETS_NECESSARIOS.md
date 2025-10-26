# 🎨 Assets Necessários para Fábrica de Jogos

**Objetivo:** Adventure Runner - Jogo educacional onde o personagem percorre um caminho respondendo perguntas

## 📁 Estrutura de Diretórios

```
public/
  games/
    assets/
      characters/       # Personagens mascote (5 níveis)
      backgrounds/      # Cenários de fundo
      items/            # Ítens colecionáveis
      ui/               # Interface do jogo
      sounds/           # Efeitos sonoros
      music/            # Música de fundo
```

---

## 🎮 1. PERSONAGENS MASCOTE (5 Níveis de Evolução)

### Sistema de Progresso:
- **Aprendiz**: 0-49 acertos totais
- **Estudante**: 50-149 acertos
- **Mestre**: 150-299 acertos
- **Sábio**: 300-499 acertos
- **Lenda**: 500+ acertos

### Especificações Técnicas:
- **Formato:** PNG com transparência
- **Tamanho:** 128x128 pixels (sprite individual)
- **Resolução:** 72 DPI
- **Spritesheet:** 512x128 pixels (4 frames de animação)
- **Fundo:** Transparente
- **Estilo:** Cartoon, colorido, amigável para crianças

### Animações Necessárias (4 frames cada):
1. **Idle** (parado): 4 frames
2. **Walk** (andando): 4 frames
3. **Jump** (pulando): 4 frames
4. **Celebrate** (comemoração): 4 frames

### Arquivos Necessários (20 no total):
```
characters/
  aprendiz-idle.png       (512x128 - 4 frames)
  aprendiz-walk.png       (512x128 - 4 frames)
  aprendiz-jump.png       (512x128 - 4 frames)
  aprendiz-celebrate.png  (512x128 - 4 frames)
  
  estudante-idle.png
  estudante-walk.png
  estudante-jump.png
  estudante-celebrate.png
  
  mestre-idle.png
  mestre-walk.png
  mestre-jump.png
  mestre-celebrate.png
  
  sabio-idle.png
  sabio-walk.png
  sabio-jump.png
  sabio-celebrate.png
  
  lenda-idle.png
  lenda-walk.png
  lenda-jump.png
  lenda-celebrate.png
```

---

## 🌄 2. CENÁRIOS DE FUNDO (3 Temas)

### Especificações Técnicas:
- **Formato:** PNG ou JPEG
- **Tamanho:** 1920x1080 pixels (Full HD)
- **Resolução:** 72 DPI
- **Estilo:** Parallax (3 camadas)
- **Paleta:** Colorida, vibrante

### Temas e Arquivos (9 no total):
```
backgrounds/
  floresta/
    floresta-camada1-ceu.png       (1920x1080 - céu/nuvens)
    floresta-camada2-arvores.png   (1920x1080 - árvores distantes)
    floresta-camada3-chao.png      (1920x1080 - chão/grama)
  
  espacial/
    espacial-camada1-estrelas.png
    espacial-camada2-planetas.png
    espacial-camada3-plataforma.png
  
  subaquatico/
    subaquatico-camada1-oceano.png
    subaquatico-camada2-corais.png
    subaquatico-camada3-fundo.png
```

---

## 💎 3. ÍTENS COLECIONÁVEIS (3 Tipos)

### Especificações Técnicas:
- **Formato:** PNG com transparência
- **Tamanho:** 64x64 pixels (sprite individual)
- **Resolução:** 72 DPI
- **Animação:** 4 frames (256x64 spritesheet)
- **Brilho/Pulse:** Sim (efeito visual)

### Tipos e Arquivos (6 no total):
```
items/
  bau-fechado.png         (64x64 - estático)
  bau-abrindo.png         (256x64 - 4 frames de animação)
  
  moeda-girar.png         (256x64 - 4 frames de rotação)
  moeda-coleta.png        (256x64 - 4 frames de coleta)
  
  estrela-girar.png       (256x64 - 4 frames de rotação)
  estrela-coleta.png      (256x64 - 4 frames de coleta)
```

### Valores:
- **Baú:** 10 moedas (se responder certo)
- **Moeda solta:** 1 moeda
- **Estrela:** 5 moedas (bônus especial)

---

## 🎨 4. ELEMENTOS DE UI (Interface)

### Especificações Técnicas:
- **Formato:** PNG com transparência
- **Tamanho:** Variável (listado abaixo)
- **Resolução:** 72 DPI
- **Estilo:** Cartoon, legível, colorido

### Arquivos (12 no total):
```
ui/
  hud-barra-superior.png      (1920x100 - barra de HUD)
  hud-icone-moeda.png         (48x48 - ícone de moeda)
  hud-icone-relogio.png       (48x48 - ícone de tempo)
  hud-icone-pergunta.png      (48x48 - ícone de pergunta)
  
  modal-pergunta-bg.png       (800x600 - fundo do modal)
  botao-resposta-normal.png   (700x80 - botão normal)
  botao-resposta-hover.png    (700x80 - botão hover)
  botao-resposta-correto.png  (700x80 - botão correto)
  botao-resposta-errado.png   (700x80 - botão errado)
  
  tela-parabens-bg.png        (1920x1080 - tela final)
  tela-parabens-estrelas.png  (512x512 - estrelas de celebração)
  tela-parabens-confete.png   (1920x1080 - confete animado)
```

---

## 🔊 5. EFEITOS SONOROS (8 Arquivos)

### Especificações Técnicas:
- **Formato:** MP3 (compatível com web)
- **Taxa de bits:** 128 kbps
- **Duração:** 0.5s - 3s
- **Volume:** Normalizado (-6dB)

### Arquivos:
```
sounds/
  passo-1.mp3           (0.3s - som de passo no chão)
  passo-2.mp3           (0.3s - variação)
  
  coleta-moeda.mp3      (0.5s - "bling" alegre)
  coleta-estrela.mp3    (0.8s - "bling" especial)
  
  abrir-bau.mp3         (1.0s - som de baú abrindo)
  
  resposta-correta.mp3  (1.5s - som de acerto)
  resposta-errada.mp3   (1.0s - som de erro suave)
  
  vitoria.mp3           (3.0s - fanfarra de vitória)
```

---

## 🎵 6. MÚSICA DE FUNDO (3 Trilhas)

### Especificações Técnicas:
- **Formato:** MP3 (compatível com web)
- **Taxa de bits:** 128 kbps
- **Duração:** 2-3 minutos (loop)
- **BPM:** 120-140 (alegre, dinâmico)
- **Volume:** Normalizado (-12dB para não sobrepor sons)
- **Loop:** Deve loopar perfeitamente

### Arquivos:
```
music/
  gameplay-floresta.mp3     (2min - tema alegre com flautas)
  gameplay-espacial.mp3     (2min - tema eletrônico futurista)
  gameplay-subaquatico.mp3  (2min - tema calmo com bolhas)
```

---

## 📊 RESUMO QUANTITATIVO

| Categoria | Quantidade | Total de Arquivos |
|-----------|------------|-------------------|
| Personagens | 5 níveis × 4 animações | 20 |
| Cenários | 3 temas × 3 camadas | 9 |
| Ítens | 3 tipos × 2 estados | 6 |
| UI | Elementos diversos | 12 |
| Sons | Efeitos variados | 8 |
| Música | 3 trilhas | 3 |
| **TOTAL** | | **58 arquivos** |

---

## 🎯 PRIORIDADES DE IMPLEMENTAÇÃO

### FASE 3A: Assets Essenciais (MVP)
1. **1 Personagem completo** (Aprendiz - 4 animações)
2. **1 Cenário completo** (Floresta - 3 camadas)
3. **1 Ítem** (Baú - 2 estados)
4. **UI básica** (6 arquivos essenciais)
5. **Sons essenciais** (4 arquivos: passo, moeda, correto, errado)
6. **1 Música** (gameplay-floresta)

**Total MVP:** ~20 arquivos

### FASE 3B: Expansão (Pós-MVP)
- Adicionar os outros 4 níveis de personagem
- Adicionar os outros 2 cenários
- Adicionar os outros 2 ítens
- Completar UI
- Completar sons
- Adicionar as outras 2 músicas

---

## 🔗 FONTES RECOMENDADAS

### Assets Gratuitos:
1. **OpenGameArt.org** - https://opengameart.org/
2. **Itch.io Assets** - https://itch.io/game-assets/free
3. **Kenney.nl** - https://kenney.nl/assets (pixel art e cartoon)
4. **CraftPix.net** - https://craftpix.net/freebies/
5. **GameArt2D.com** - https://www.gameart2d.com/freebies.html

### Sons Gratuitos:
1. **Freesound.org** - https://freesound.org/
2. **ZapSplat** - https://www.zapsplat.com/
3. **Mixkit** - https://mixkit.co/free-sound-effects/

### Música Gratuita:
1. **Incompetech** - https://incompetech.com/music/
2. **Bensound** - https://www.bensound.com/
3. **Purple Planet** - https://www.purple-planet.com/

---

## ✅ CHECKLIST DE QUALIDADE

Antes de usar qualquer asset, verificar:
- [ ] Licença permite uso comercial
- [ ] Tamanho/resolução adequados
- [ ] Formato correto (PNG/MP3)
- [ ] Fundo transparente (quando aplicável)
- [ ] Paleta de cores consistente
- [ ] Otimizado para web (tamanho de arquivo)
- [ ] Testado em navegador
- [ ] Nomes de arquivo padronizados

---

**Próximo Passo:** Decidir se vamos buscar assets prontos ou encomendar personalizados.

**Última Atualização:** 26/10/2025

