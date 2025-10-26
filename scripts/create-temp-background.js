/**
 * Criar background temporário usando Canvas
 * (Até encontrarmos um melhor)
 */

const fs = require('fs');
const { createCanvas } = require('canvas');

console.log('🎨 Criando background temporário...\n');

try {
  // Criar canvas
  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext('2d');

  // Camada 1: Céu com gradiente
  const gradient1 = ctx.createLinearGradient(0, 0, 0, 1080);
  gradient1.addColorStop(0, '#87CEEB');
  gradient1.addColorStop(1, '#E0F6FF');
  ctx.fillStyle = gradient1;
  ctx.fillRect(0, 0, 1920, 1080);

  // Salvar
  const buffer = canvas.toBuffer('image/png');
  const destDir = 'public/games/assets/backgrounds/temp';
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.writeFileSync(`${destDir}/sky.png`, buffer);

  console.log('✅ Background temporário criado!');
  console.log('   Localização: public/games/assets/backgrounds/temp/sky.png\n');
} catch (error) {
  console.log('⚠️  Canvas não disponível, criando placeholder SVG...\n');
  
  // Criar SVG simples como fallback
  const svg = `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#E0F6FF;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#sky)"/>
</svg>`;

  const destDir = 'public/games/assets/backgrounds/temp';
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.writeFileSync(`${destDir}/sky.svg`, svg);
  
  console.log('✅ Background SVG criado!');
  console.log('   Localização: public/games/assets/backgrounds/temp/sky.svg\n');
}

