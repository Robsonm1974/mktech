/**
 * Script para baixar assets gratuitos para a Fábrica de Jogos
 * 
 * Uso: node scripts/download-game-assets.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Assets essenciais para MVP
const ASSETS_MVP = [
  {
    name: 'Kenney UI Pack',
    url: 'https://kenney.nl/content/3-assets/ui-pack.zip',
    dest: 'public/games/assets/ui/kenney-ui-pack.zip',
    description: '434 elementos de UI (botões, barras, ícones)'
  },
  {
    name: 'Kenney Digital Audio',
    url: 'https://kenney.nl/content/3-assets/digital-audio.zip',
    dest: 'public/games/assets/sounds/kenney-sounds.zip',
    description: '2570 efeitos sonoros'
  }
];

// Assets que requerem download manual (itch.io exige login)
const MANUAL_DOWNLOADS = [
  {
    name: 'Pixel Adventure 1',
    url: 'https://pixelfrog-assets.itch.io/pixel-adventure-1',
    instructions: [
      '1. Acesse o link acima',
      '2. Clique em "Download Now"',
      '3. Escolha "$0 or pay what you want"',
      '4. Clique em "No thanks, just take me to the downloads"',
      '5. Baixe "Pixel Adventure 1.zip"',
      '6. Extraia em public/games/assets/characters/'
    ]
  },
  {
    name: 'Treasure Hunters',
    url: 'https://pixelfrog-assets.itch.io/treasure-hunters',
    instructions: [
      '1. Acesse o link acima',
      '2. Clique em "Download Now"',
      '3. Escolha "$0 or pay what you want"',
      '4. Clique em "No thanks, just take me to the downloads"',
      '5. Baixe "Treasure Hunters.zip"',
      '6. Extraia em public/games/assets/items/'
    ]
  },
  {
    name: 'Mountain Dusk Background',
    url: 'https://ansimuz.itch.io/mountain-dusk-parallax-background',
    instructions: [
      '1. Acesse o link acima',
      '2. Clique em "Download Now"',
      '3. Baixe o arquivo ZIP',
      '4. Extraia em public/games/assets/backgrounds/'
    ]
  }
];

// Música gratuita (Incompetech)
const MUSIC_DOWNLOADS = [
  {
    name: 'Fluffing a Duck',
    url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fluffing%20a%20Duck.mp3',
    dest: 'public/games/assets/music/fluffing-a-duck.mp3',
    description: 'Música alegre para gameplay'
  }
];

// Função para baixar arquivo
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    
    console.log(`📥 Baixando: ${path.basename(destPath)}`);
    
    protocol.get(url, (response) => {
      // Seguir redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Status: ${response.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloaded = 0;
      
      response.on('data', (chunk) => {
        downloaded += chunk.length;
        const percent = ((downloaded / totalSize) * 100).toFixed(1);
        process.stdout.write(`\r   Progresso: ${percent}% (${(downloaded / 1024 / 1024).toFixed(2)}MB)`);
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\n   ✅ Concluído!\n');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// Função principal
async function main() {
  console.log('🎮 DOWNLOAD DE ASSETS - FÁBRICA DE JOGOS\n');
  console.log('=' .repeat(60));
  
  // Criar diretórios se não existirem
  const dirs = [
    'public/games/assets/characters',
    'public/games/assets/backgrounds',
    'public/games/assets/items',
    'public/games/assets/ui',
    'public/games/assets/sounds',
    'public/games/assets/music'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Criado: ${dir}`);
    }
  });
  
  console.log('\n');
  
  // Downloads automáticos
  console.log('🤖 DOWNLOADS AUTOMÁTICOS:\n');
  
  try {
    // Kenney assets
    for (const asset of ASSETS_MVP) {
      console.log(`📦 ${asset.name}`);
      console.log(`   ${asset.description}`);
      await downloadFile(asset.url, asset.dest);
    }
    
    // Música
    for (const music of MUSIC_DOWNLOADS) {
      console.log(`🎵 ${music.name}`);
      console.log(`   ${music.description}`);
      await downloadFile(music.url, music.dest);
    }
    
    console.log('✅ Downloads automáticos concluídos!\n');
  } catch (error) {
    console.error(`\n❌ Erro no download: ${error.message}\n`);
  }
  
  // Instruções para downloads manuais
  console.log('=' .repeat(60));
  console.log('\n📋 DOWNLOADS MANUAIS NECESSÁRIOS:\n');
  console.log('Os seguintes assets requerem download manual (sites exigem interação):');
  console.log('');
  
  MANUAL_DOWNLOADS.forEach((asset, index) => {
    console.log(`${index + 1}. ${asset.name}`);
    console.log(`   URL: ${asset.url}`);
    console.log('   Instruções:');
    asset.instructions.forEach(instruction => {
      console.log(`   ${instruction}`);
    });
    console.log('');
  });
  
  console.log('=' .repeat(60));
  console.log('\n📊 RESUMO:\n');
  console.log(`✅ Downloads automáticos: ${ASSETS_MVP.length + MUSIC_DOWNLOADS.length}`);
  console.log(`📋 Downloads manuais pendentes: ${MANUAL_DOWNLOADS.length}`);
  console.log('');
  console.log('💡 PRÓXIMOS PASSOS:');
  console.log('1. Complete os downloads manuais seguindo as instruções acima');
  console.log('2. Extraia todos os arquivos ZIP nas respectivas pastas');
  console.log('3. Execute: node scripts/organize-assets.js (para organizar)');
  console.log('4. Execute: node scripts/test-assets.js (para validar)');
  console.log('');
  console.log('🎯 Após concluir, execute: node scripts/setup-phaser.js\n');
}

// Executar
main().catch(console.error);

