import * as Phaser from 'phaser'

/**
 * Cena principal do Adventure Runner
 * 
 * O jogador controla um personagem que corre manualmente,
 * encontra baús com perguntas e coleta moedas.
 * 
 * ✅ CORREÇÃO APLICADA (26/10/2025):
 * - Ao coletar baú, pausa APENAS o player (body.enable = false)
 * - Não pausa o mundo inteiro (physics.pause() removido)
 * - Isso evita flags de colisão congeladas que faziam o player ficar no ar
 */
export class AdventureRunnerScene extends Phaser.Scene {
  // Referências
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  
  // Coletáveis
  private chests!: Phaser.Physics.Arcade.Group
  private coins!: Phaser.Physics.Arcade.Group
  private totalChests: number = 0
  private chestsCollected: number = 0
  
  // HUD
  private scoreText!: Phaser.GameObjects.Text
  private timeText!: Phaser.GameObjects.Text
  private chestsText!: Phaser.GameObjects.Text
  private score: number = 0
  private timeRemaining: number = 60 // 1 minuto padrão
  
  // Controle do jogo
  private isGameActive: boolean = true
  private gameDuration: number = 120 // 2 minutos
  
  // Runner automático
  private worldWidth: number = 5000 // Mundo largo para explorar
  private enemies!: Phaser.Physics.Arcade.Group
  
  // 🎵 Sons e Música
  private bgMusic!: Phaser.Sound.BaseSound
  private coinSound!: Phaser.Sound.BaseSound
  private chestSound!: Phaser.Sound.BaseSound
  private jumpSound!: Phaser.Sound.BaseSound
  private correctSound!: Phaser.Sound.BaseSound
  private wrongSound!: Phaser.Sound.BaseSound
  
  // Callbacks para React
  private onQuestionTrigger?: (questionIndex: number) => void
  private onGameComplete?: (finalScore: number, coinsCollected: number) => void
  private mobileRun: boolean = false

  constructor() {
    super({ key: 'AdventureRunnerScene' })
  }

  /**
   * Configurar callbacks antes de iniciar a cena
   */
  init(data: {
    duration?: number
    onQuestionTrigger?: (questionIndex: number) => void
    onGameComplete?: (finalScore: number, coinsCollected: number) => void
  }) {
    this.gameDuration = data.duration || 60
    this.timeRemaining = this.gameDuration
    this.onQuestionTrigger = data.onQuestionTrigger
    this.onGameComplete = data.onGameComplete
    this.score = 0
    this.isGameActive = true
  }

  preload() {
    // Background temporário
    this.load.svg('sky', '/games/assets/backgrounds/temp/sky.svg', { width: 800, height: 600 })
    
    // Personagem (Ninja Frog do Pixel Adventure)
    const characterPath = '/games/assets/characters/pixel-adventure/Main Characters/Ninja Frog'
    this.load.spritesheet('player-idle', `${characterPath}/Idle (32x32).png`, {
      frameWidth: 32,
      frameHeight: 32
    })
    this.load.spritesheet('player-run', `${characterPath}/Run (32x32).png`, {
      frameWidth: 32,
      frameHeight: 32
    })
    this.load.spritesheet('player-jump', `${characterPath}/Jump (32x32).png`, {
      frameWidth: 32,
      frameHeight: 32
    })
    
    // Itens (Treasure Hunters) - Caminhos corretos
    this.load.image('chest', '/games/assets/items/treasure-hunters/Palm Tree Island/Sprites/Objects/Chest/Idle/01.png')
    this.load.image('coin', '/games/assets/items/treasure-hunters/Pirate Treasure/Sprites/Gold Coin/01.png')
    
    // Imagem de fundo decorativa (mão + globo)
    this.load.image('hand-globe', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-iCqMx0z5hmkxSVjZbxhLpwuO1yCm92.png')
    
    // 🎵 SONS E MÚSICA
    this.load.audio('bg-music', '/games/assets/music/Fluffing a Duck.mp3')
    this.load.audio('coin-sound', '/games/assets/sounds/coin.mp3')
    this.load.audio('chest-sound', '/games/assets/sounds/chest.mp3')
    this.load.audio('jump-sound', '/games/assets/sounds/jump.mp3')
    this.load.audio('correct-sound', '/games/assets/sounds/correct.mp3')
    this.load.audio('wrong-sound', '/games/assets/sounds/wrong.mp3')
    
    // Plataforma (criar temporária)
    this.createTemporaryAssets()
  }

  create() {
    // Configurar mundo maior
    this.physics.world.setBounds(0, 0, this.worldWidth, 600)
    
    // Background repetido (céu)
    for (let i = 0; i < Math.ceil(this.worldWidth / 800); i++) {
      this.add.image(400 + (i * 800), 300, 'sky').setScrollFactor(0.5)
    }
    
    // Adicionar imagem de fundo decorativa (mão + globo) espalhada pelo cenário
    const handGlobePositions = [
      { x: 400, y: 200 },
      { x: 1500, y: 250 },
      { x: 2800, y: 180 },
      { x: 4200, y: 220 }
    ]
    
    handGlobePositions.forEach(pos => {
      const bg = this.add.image(pos.x, pos.y, 'hand-globe')
      bg.setScale(0.3) // Ajustar tamanho
      bg.setAlpha(0.3) // Semi-transparente
      bg.setScrollFactor(0.7) // Parallax suave
    })
    
    // Criar plataformas
    this.platforms = this.physics.add.staticGroup()
    
    // Chão contínuo ao longo do mundo
    for (let x = 0; x < this.worldWidth; x += 400) {
      const ground = this.add.rectangle(x + 200, 568, 400, 64, 0x4CAF50)
      this.physics.add.existing(ground, true)
      this.platforms.add(ground)
    }
    
    // Criar jogador
    this.player = this.physics.add.sprite(100, 450, 'player-idle')
    this.player.setBounce(0.1)
    this.player.setCollideWorldBounds(true)
    this.player.setScale(2)
    
    // Câmera segue o jogador
    this.cameras.main.setBounds(0, 0, this.worldWidth, 600)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    
    // Animações do jogador
    this.createPlayerAnimations()
    
    // Física: jogador vs plataformas
    this.physics.add.collider(this.player, this.platforms)
    
    // Criar baús (perguntas) espalhados
    this.chests = this.physics.add.group()
    this.createChests()
    this.physics.add.collider(this.chests, this.platforms)
    this.physics.add.overlap(
      this.player,
      this.chests,
      // Phaser chama com (object1, object2)
      (_object1, object2) => {
        const obj2 = object2 as unknown as Phaser.GameObjects.GameObject
        this.collectChest(this.player as unknown as Phaser.GameObjects.GameObject, obj2)
      },
      undefined,
      this
    )
    
    // Criar moedas espalhadas
    this.coins = this.physics.add.group()
    this.createCoins()
    this.physics.add.collider(this.coins, this.platforms)
    this.physics.add.overlap(
      this.player,
      this.coins,
      (_object1, object2) => {
        this.collectCoin(
          this.player as unknown as Phaser.GameObjects.GameObject,
          object2 as unknown as Phaser.GameObjects.GameObject
        )
      },
      undefined,
      this
    )
    
    // Criar inimigos
    this.enemies = this.physics.add.group()
    this.createEnemies()
    this.physics.add.collider(this.enemies, this.platforms)
    this.physics.add.overlap(
      this.player,
      this.enemies,
      (_object1, object2) => {
        this.hitEnemy(
          this.player as unknown as Phaser.GameObjects.GameObject,
          object2 as unknown as Phaser.GameObjects.GameObject
        )
      },
      undefined,
      this
    )
    
    // Controles teclado
    this.cursors = this.input.keyboard!.createCursorKeys()
    
    // Controles touch (mobile)
    this.createTouchControls()
    
    // HUD
    this.createHUD()
    
    // 🎵 Inicializar Sons
    this.initSounds()
    
    // Timer do jogo
    this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    })
  }

  update() {
    // ✅ MUDANÇA: Remover check de isGameActive - jogo sempre ativo!
    if (!this.isGameActive) return // Apenas para quando o jogo terminar (tempo zerado)
    
    // Movimentação horizontal (teclado OU controle mobile)
    if (this.mobileRun || this.cursors.right.isDown || this.cursors.left.isDown) {
      // Correr para frente quando apertar
      this.player.setVelocityX(250)
      this.player.flipX = false
      this.player.anims.play('run', true)
    } else {
      // Parado quando não apertar nada
      this.player.setVelocityX(0)
      this.player.anims.play('idle', true)
    }
    
    // Pulo (seta cima ou espaço)
    if ((this.cursors.up.isDown || this.cursors.space?.isDown) && this.player.body!.touching.down) {
      this.player.setVelocityY(-400)
      this.player.anims.play('jump', true)
      
      // 🎵 Som de pulo
      if (this.jumpSound) {
        this.jumpSound.play()
      }
    }
  }

  private createPlayerAnimations() {
    // Idle
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('player-idle', { start: 0, end: 10 }),
      frameRate: 10,
      repeat: -1
    })
    
    // Run
    this.anims.create({
      key: 'run',
      frames: this.anims.generateFrameNumbers('player-run', { start: 0, end: 11 }),
      frameRate: 15,
      repeat: -1
    })
    
    // Jump
    this.anims.create({
      key: 'jump',
      frames: this.anims.generateFrameNumbers('player-jump', { start: 0, end: 0 }),
      frameRate: 10
    })
  }

  private createChests() {
    // Criar baús espalhados ao longo do caminho (3 perguntas)
    const chestPositions = [
      { x: 800, y: 500 },
      { x: 2000, y: 500 },
      { x: 3500, y: 500 }
    ]
    
    // Guardar total de baús para controlar o final
    this.totalChests = chestPositions.length
    this.chestsCollected = 0
    
    chestPositions.forEach((pos, index) => {
      const chest = this.chests.create(pos.x, pos.y, 'chest')
      chest.setScale(2)
      chest.setData('questionIndex', index)
      chest.setData('collected', false)
      chest.body.setAllowGravity(false)
      chest.body.setImmovable(true)
    })
    
    console.log(`📦 Total de baús criados: ${this.totalChests}`)
  }

  private createCoins() {
    // Criar moedas ao longo do caminho (mais espalhadas)
    for (let x = 300; x < this.worldWidth; x += 150) {
      // Variar altura
      const y = 450 + (Math.random() > 0.5 ? -50 : 0)
      const coin = this.coins.create(x, y, 'coin')
      coin.setScale(1.5)
      coin.body.setAllowGravity(false)
      coin.body.setImmovable(true)
    }
  }
  
  private createEnemies() {
    // Criar inimigos (obstáculos) ao longo do caminho
    const enemyPositions = [
      { x: 600, y: 500 },
      { x: 1200, y: 500 },
      { x: 1800, y: 500 },
      { x: 2500, y: 500 },
      { x: 3200, y: 500 },
      { x: 4000, y: 500 }
    ]
    
    enemyPositions.forEach(pos => {
      // Usar uma caixa vermelha como inimigo temporário
      const enemy = this.add.rectangle(pos.x, pos.y, 32, 32, 0xFF0000)
      this.physics.add.existing(enemy)
      this.enemies.add(enemy)
      const body = enemy.body as Phaser.Physics.Arcade.Body
      body.setAllowGravity(false)
      body.setImmovable(true)
    })
  }
  
  private createTouchControls() {
    let touching = false
    
    // Controles touch para mobile
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isGameActive) return
      
      touching = true
      const screenWidth = this.cameras.main.width
      
      // Lado esquerdo da tela: correr
      if (pointer.x < screenWidth * 0.7) {
        // Correr será controlado pelo update
      }
      
      // Lado direito da tela ou tap rápido: pular
      if (pointer.x > screenWidth * 0.7 || pointer.y < 300) {
        if (this.player.body!.touching.down) {
          this.player.setVelocityY(-400)
          this.player.anims.play('jump', true)
        }
      }
    })
    
    this.input.on('pointerup', () => {
      touching = false
    })
    
    // No update, verificar se está tocando para correr
    this.events.on('update', () => {
      if ((touching || this.mobileRun) && this.isGameActive) {
        const pointer = this.input.activePointer
        if (pointer.x < this.cameras.main.width * 0.7) {
          this.player.setVelocityX(250)
          this.player.anims.play('run', true)
        }
      }
    })
  }

  /** Controle vindo do overlay React */
  public setMobileRun(active: boolean) {
    this.mobileRun = active
  }

  /** Pular se estiver no chão (para overlay mobile) */
  public jumpIfOnGround() {
    if (this.player && (this.player.body as Phaser.Physics.Arcade.Body)?.touching?.down) {
      this.player.setVelocityY(-400)
      this.player.anims.play('jump', true)
      if (this.jumpSound) this.jumpSound.play()
    }
  }

  private collectChest(
    player: Phaser.GameObjects.GameObject,
    chest: Phaser.GameObjects.GameObject
  ) {
    const chestSprite = chest as Phaser.Physics.Arcade.Sprite
    
    // Verificar se já foi coletado
    if (chestSprite.getData('collected')) {
      console.log('⚠️ Baú já foi coletado, ignorando...')
      return
    }
    
    const questionIndex = chestSprite.getData('questionIndex')
    
    console.log('🎯 Baú coletado na posição:', this.player.x, this.player.y)
    
    // Marcar como coletado IMEDIATAMENTE
    chestSprite.setData('collected', true)
    
    // DESTRUIR o baú (não apenas ocultar)
    chestSprite.destroy()
    
    // Incrementar contador de baús coletados
    this.chestsCollected++
    console.log(`📦 Baús coletados: ${this.chestsCollected}/${this.totalChests}`)
    
    // Atualizar HUD de baús
    this.chestsText.setText(`📦 ${this.chestsCollected}/${this.totalChests}`)
    
    // Efeito visual no contador de baús
    this.tweens.add({
      targets: this.chestsText,
      scale: 1.3,
      duration: 200,
      yoyo: true
    })
    
    // 🎵 Som de baú
    if (this.chestSound) {
      this.chestSound.play()
    }
    
    // ✅ NOVA ABORDAGEM: Não pausar o jogo! Apenas trigger da pergunta
    // O jogo continua rodando, o quiz aparece como overlay
    if (this.onQuestionTrigger) {
      this.onQuestionTrigger(questionIndex)
    }
    
    // 🏁 Verificar se foi o último baú
    if (this.chestsCollected >= this.totalChests) {
      console.log('🏁 Todos os baús coletados! Finalizando jogo em 2 segundos...')
      
      // Aguardar 2 segundos para o player responder a última pergunta
      this.time.delayedCall(2000, () => {
        this.endGame()
      })
    }
  }

  private collectCoin(
    player: Phaser.GameObjects.GameObject,
    coin: Phaser.GameObjects.GameObject
  ) {
    const coinSprite = coin as Phaser.Physics.Arcade.Sprite
    coinSprite.destroy()
    
    this.score += 1
    this.scoreText.setText(`Moedas: ${this.score}`)
    
    // 🎵 Som de moeda
    if (this.coinSound) {
      this.coinSound.play()
    }
  }
  
  private hitEnemy(
    player: Phaser.GameObjects.GameObject,
    enemy: Phaser.GameObjects.GameObject
  ) {
    // Apenas empurra o player para trás (não mata)
    const playerSprite = player as Phaser.Physics.Arcade.Sprite
    playerSprite.setVelocityX(-100)
    playerSprite.setVelocityY(-200)
    
    // Piscar o player
    this.tweens.add({
      targets: playerSprite,
      alpha: 0.3,
      duration: 100,
      repeat: 3,
      yoyo: true
    })
  }

  private createHUD() {
    // Fundo do HUD
    const hudBg = this.add.rectangle(400, 30, 780, 50, 0x000000, 0.7)
    
    // Texto de pontuação
    this.scoreText = this.add.text(20, 16, 'Moedas: 0', {
      fontSize: '24px',
      color: '#FFD700',
      fontStyle: 'bold'
    })
    
    // Texto de baús coletados
    this.chestsText = this.add.text(300, 16, '📦 0/3', {
      fontSize: '24px',
      color: '#FF6B6B',
      fontStyle: 'bold'
    })
    
    // Texto de tempo
    this.timeText = this.add.text(680, 16, `Tempo: ${this.timeRemaining}s`, {
      fontSize: '24px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    })
    
    // Fixar HUD
    this.scoreText.setScrollFactor(0)
    this.chestsText.setScrollFactor(0)
    this.timeText.setScrollFactor(0)
    hudBg.setScrollFactor(0)
  }

  /**
   * 🎵 Inicializar sons e música de fundo
   */
  private initSounds() {
    try {
      // Música de fundo (loop)
      this.bgMusic = this.sound.add('bg-music', { volume: 0.3, loop: true })
      this.bgMusic.play()
      
      // Sons de efeitos
      this.coinSound = this.sound.add('coin-sound', { volume: 0.5 })
      this.chestSound = this.sound.add('chest-sound', { volume: 0.6 })
      this.jumpSound = this.sound.add('jump-sound', { volume: 0.4 })
      this.correctSound = this.sound.add('correct-sound', { volume: 0.7 })
      this.wrongSound = this.sound.add('wrong-sound', { volume: 0.6 })
      
      console.log('🎵 Sons inicializados com sucesso!')
    } catch (error) {
      console.warn('⚠️ Erro ao carregar sons:', error)
    }
  }

  private updateTimer() {
    if (!this.isGameActive) return
    
    this.timeRemaining--
    this.timeText.setText(`Tempo: ${this.timeRemaining}s`)
    
    if (this.timeRemaining <= 0) {
      this.endGame()
    }
  }

  private endGame() {
    this.isGameActive = false
    this.physics.pause()
    
    // 🎵 Parar música de fundo
    if (this.bgMusic) {
      this.bgMusic.stop()
    }
    
    if (this.onGameComplete) {
      this.onGameComplete(this.score * 10, this.score)
    }
  }

  /**
   * Método público: adicionar pontos após responder pergunta
   */
  public resumeGame(answeredCorrectly: boolean) {
    console.log('✅ Resposta processada:', answeredCorrectly)
    
    if (answeredCorrectly) {
      this.score += 10 // Bônus por acertar
      this.scoreText.setText(`Moedas: ${this.score}`)
      
      // ✅ Som tocado no React (AdventureRunnerPlayer.tsx)
      
      // Efeito visual de acerto
      this.tweens.add({
        targets: this.scoreText,
        scale: 1.2,
        duration: 200,
        yoyo: true
      })
    }
    
    console.log('📊 Score atual:', this.score)
  }

  /**
   * Criar assets temporários (plataforma)
   */
  private createTemporaryAssets() {
    // Criar textura de plataforma programaticamente
    const graphics = this.make.graphics({ x: 0, y: 0 })
    graphics.fillStyle(0x4CAF50, 1)
    graphics.fillRect(0, 0, 32, 32)
    graphics.generateTexture('platform', 32, 32)
    graphics.destroy()
  }
}

