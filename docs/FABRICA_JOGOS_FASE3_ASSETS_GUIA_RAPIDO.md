# 🚀 FASE 3: Assets - Guia Rápido

## ⚡ Opção Rápida (15 minutos)

### 1️⃣ Execute o script automático:
```bash
node scripts/download-game-assets.js
```

Isso vai baixar automaticamente:
- ✅ Kenney UI Pack (botões, ícones)
- ✅ Kenney Digital Audio (sons)
- ✅ Música de fundo (Fluffing a Duck)

### 2️⃣ Downloads manuais (3 itens):

#### A) Pixel Adventure 1 (Personagens)
1. Acesse: https://pixelfrog-assets.itch.io/pixel-adventure-1
2. Clique em "Download Now"
3. Escolha "$0 or pay what you want"
4. Clique em "No thanks, just take me to the downloads"
5. Baixe e extraia em `public/games/assets/characters/`

#### B) Treasure Hunters (Baús e Moedas)
1. Acesse: https://pixelfrog-assets.itch.io/treasure-hunters
2. Mesmo processo acima
3. Extraia em `public/games/assets/items/`

#### C) Mountain Dusk (Cenário)
1. Acesse: https://ansimuz.itch.io/mountain-dusk-parallax-background
2. Mesmo processo
3. Extraia em `public/games/assets/backgrounds/`

---

## 📂 Estrutura Final Esperada

```
public/
  games/
    assets/
      characters/
        Pixel Adventure 1/
          Main Characters/
            Ninja Frog/
              idle.png
              run.png
              jump.png
              ...
      backgrounds/
        mountain-dusk/
          layer1.png
          layer2.png
          layer3.png
      items/
        Treasure Hunters/
          Chest/
            close.png
            open.png
          Gold Coin/
            spin.png
      ui/
        kenney-ui-pack/
          (extraído automaticamente)
      sounds/
        kenney-sounds/
          (extraído automaticamente)
      music/
        fluffing-a-duck.mp3
```

---

## ✅ Checklist

- [ ] Executei `node scripts/download-game-assets.js`
- [ ] Baixei Pixel Adventure 1 manualmente
- [ ] Baixei Treasure Hunters manualmente
- [ ] Baixei Mountain Dusk manualmente
- [ ] Extraí todos os ZIPs
- [ ] Verifiquei que os arquivos estão nas pastas corretas

---

## 🎯 Próximo Passo

Quando concluir, me avise e vamos para:
**FASE 4: Setup Phaser.js Game Engine** 🚀

---

**Tempo estimado:** 15-20 minutos

