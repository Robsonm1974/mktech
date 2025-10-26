/**
 * Script para organizar os assets baixados na estrutura correta
 * 
 * Uso: node scripts/organize-assets.js
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 ORGANIZANDO ASSETS DA FÁBRICA DE JOGOS\n');
console.log('='.repeat(60));

// Função para copiar diretório recursivamente
function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) {
    console.log(`⚠️  Fonte não encontrada: ${source}`);
    return false;
  }

  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const files = fs.readdirSync(source);
  let count = 0;

  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);

    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
      count++;
    }
  });

  return count;
}

// Organizar Pixel Adventure
console.log('\n📦 Organizando Pixel Adventure (Personagens)...');
const pixelSource = 'public/games/Pixel Adventure';
const pixelDest = 'public/games/assets/characters/pixel-adventure';

if (fs.existsSync(pixelSource)) {
  const pixelCount = copyDirectory(pixelSource, pixelDest);
  console.log(`   ✅ ${pixelCount} arquivos copiados para assets/characters/`);
} else {
  console.log('   ⚠️  Pixel Adventure não encontrado em public/games/');
}

// Organizar Treasure Hunters
console.log('\n💎 Organizando Treasure Hunters (Itens)...');
const treasureSource = 'public/games/Treasure Hunters';
const treasureDest = 'public/games/assets/items/treasure-hunters';

if (fs.existsSync(treasureSource)) {
  const treasureCount = copyDirectory(treasureSource, treasureDest);
  console.log(`   ✅ ${treasureCount} arquivos copiados para assets/items/`);
} else {
  console.log('   ⚠️  Treasure Hunters não encontrado em public/games/');
}

// Verificar música
console.log('\n🎵 Verificando música...');
const musicPath = 'public/games/assets/music/Fluffing a Duck.mp3';
if (fs.existsSync(musicPath)) {
  const stats = fs.statSync(musicPath);
  console.log(`   ✅ Música encontrada (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
} else {
  console.log('   ⚠️  Música não encontrada');
}

// Criar arquivo de inventário
console.log('\n📋 Criando inventário de assets...');
const inventory = {
  characters: [],
  items: [],
  backgrounds: [],
  music: [],
  sounds: [],
  ui: []
};

// Escanear personagens
if (fs.existsSync(pixelDest)) {
  const scan = (dir, base = '') => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const relativePath = path.join(base, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scan(fullPath, relativePath);
      } else if (file.endsWith('.png')) {
        inventory.characters.push(relativePath);
      }
    });
  };
  scan(pixelDest);
}

// Escanear itens
if (fs.existsSync(treasureDest)) {
  const scan = (dir, base = '') => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const relativePath = path.join(base, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scan(fullPath, relativePath);
      } else if (file.endsWith('.png')) {
        inventory.items.push(relativePath);
      }
    });
  };
  scan(treasureDest);
}

// Música
if (fs.existsSync(musicPath)) {
  inventory.music.push('Fluffing a Duck.mp3');
}

// Salvar inventário
const inventoryPath = 'public/games/assets/inventory.json';
fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
console.log(`   ✅ Inventário salvo em: ${inventoryPath}`);

// Resumo
console.log('\n' + '='.repeat(60));
console.log('\n📊 RESUMO:\n');
console.log(`✅ Personagens: ${inventory.characters.length} arquivos`);
console.log(`✅ Itens: ${inventory.items.length} arquivos`);
console.log(`✅ Música: ${inventory.music.length} arquivo(s)`);
console.log(`⚠️  Backgrounds: 0 (não baixado)`);
console.log(`⚠️  Sons: Pendente (Kenney pack)`);
console.log(`⚠️  UI: Pendente (Kenney pack)`);

console.log('\n💡 PRÓXIMOS PASSOS:');
console.log('1. ✅ Assets organizados com sucesso!');
console.log('2. 🎯 Próximo: FASE 4 - Setup Phaser.js Game Engine');
console.log('3. Execute: node scripts/setup-phaser.js\n');

