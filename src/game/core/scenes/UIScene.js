import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
    
    this.player = null;
    this.mainScene = null;
    
    // UI要素
    this.healthBar = null;
    this.manaBar = null;
    this.potionCounter = null;
    this.levelText = null;
    this.minimap = null;
    this.buffIcons = [];
    this.skillIcons = [];
    
    // UI設定
    this.barWidth = 200;
    this.barHeight = 20;
    this.barPadding = 5;
    this.iconSize = 32;
  }

  init() {
    // メインシーンへの参照を取得
    this.mainScene = this.scene.get('MainScene');
    
    // メインシーンからのイベントリスナー設定
    this.mainScene.events.on('scene-ready', this.setupUI, this);
    this.mainScene.events.on('player-health-changed', this.updateHealthBar, this);
    this.mainScene.events.on('player-mana-changed', this.updateManaBar, this);
    this.mainScene.events.on('player-potions-changed', this.updatePotionCounter, this);
    this.mainScene.events.on('player-buff-added', this.addBuffIcon, this);
    this.mainScene.events.on('player-buff-removed', this.removeBuffIcon, this);
    this.mainScene.events.on('player-level-up', this.updateLevelText, this);
    this.mainScene.events.on('minimap-update', this.updateMinimap, this);
  }

  preload() {
    // UIアセットのロード
    this.load.image('ui_frame', 'assets/images/ui/frame.png');
    this.load.image('health_bar', 'assets/images/ui/health_bar.png');
    this.load.image('mana_bar', 'assets/images/ui/mana_bar.png');
    this.load.image('potion_icon', 'assets/images/ui/potion_icon.png');
    this.load.image('skill_frame', 'assets/images/ui/skill_frame.png');
    this.load.image('buff_frame', 'assets/images/ui/buff_frame.png');
    this.load.image('minimap_frame', 'assets/images/ui/minimap_frame.png');
    
    // スキルアイコン
    for (let i = 1; i <= 9; i++) {
      this.load.image(`skill_icon_${i}`, `assets/images/ui/skill_${i}.png`);
    }
  }

  create() {
    // UIの基本要素を作成
    this.createUIBase();
    
    // スキルバーの作成
    this.createSkillBar();
    
    // ミニマップの作成
    this.createMinimap();
    
    // プレイヤーステータス領域の作成
    this.createPlayerStatus();
    
    // 一時メッセージ表示用テキスト
    this.messageText = this.add.text(
      this.cameras.main.width / 2,
      100,
      '',
      { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' }
    ).setOrigin(0.5, 0.5).setDepth(100).setVisible(false);
  }

  setupUI(mainScene) {
    // メインシーンが準備完了したらUIをセットアップ
    this.player = mainScene.player;
    
    if (this.player) {
      // 初期UI更新
      this.updateHealthBar();
      this.updateManaBar();
      this.updatePotionCounter();
      this.updateLevelText();
    }
  }

  createUIBase() {
    // 背景フレーム（下部）
    this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height - 50,
      'ui_frame'
    ).setOrigin(0.5, 0.5).setDisplaySize(this.cameras.main.width, 100);
    
    // ミニマップ用フレーム（右上）
    this.add.image(
      this.cameras.main.width - 100,
      100,
      'minimap_frame'
    ).setOrigin(0.5, 0.5).setDisplaySize(180, 180);
    
    // プレイヤーステータス用フレーム（左上）
    this.add.image(
      100,
      60,
      'ui_frame'
    ).setOrigin(0.5, 0.5).setDisplaySize(180, 100);
  }

  createSkillBar() {
    // スキルアイコンバー（画面下部）
    this.skillIcons = [];
    
    const startX = this.cameras.main.width / 2 - (this.iconSize * 4.5);
    const y = this.cameras.main.height - 50;
    
    for (let i = 0; i < 9; i++) {
      // スキルフレーム
      const frame = this.add.image(
        startX + (i * (this.iconSize + 10)),
        y,
        'skill_frame'
      ).setOrigin(0.5, 0.5).setDisplaySize(this.iconSize + 10, this.iconSize + 10);
      
      // スキルアイコン
      const icon = this.add.image(
        frame.x,
        frame.y,
        `skill_icon_${i+1}`
      ).setOrigin(0.5, 0.5).setDisplaySize(this.iconSize, this.iconSize);
      
      // キー番号テキスト
      const keyText = this.add.text(
        frame.x,
        frame.y + this.iconSize/2 + 10,
        (i+1).toString(),
        { fontFamily: 'Arial', fontSize: 12, color: '#ffffff' }
      ).setOrigin(0.5, 0.5);
      
      // クリックイベント
      frame.setInteractive();
      frame.on('pointerdown', () => {
        this.useSkill(i);
      });
      
      this.skillIcons.push({ frame, icon, keyText });
    }
  }

  createMinimap() {
    // ミニマップの作成（右上）
    const x = this.cameras.main.width - 100;
    const y = 100;
    const size = 150;
    
    this.minimap = this.add.graphics();
    this.minimap.fillStyle(0x000000, 0.5);
    this.minimap.fillRect(x - size/2, y - size/2, size, size);
    
    // プレイヤー位置表示用ドット
    this.playerDot = this.add.graphics();
    this.playerDot.fillStyle(0xff0000, 1);
    this.playerDot.fillCircle(x, y, 3);
  }

  createPlayerStatus() {
    // HPバー
    const healthBarBg = this.add.graphics();
    healthBarBg.fillStyle(0x000000, 0.5);
    healthBarBg.fillRect(20, 40, this.barWidth, this.barHeight);
    
    this.healthBar = this.add.graphics();
    this.healthBar.fillStyle(0xff0000, 1);
    
    // マナバー
    const manaBarBg = this.add.graphics();
    manaBarBg.fillStyle(0x000000, 0.5);
    manaBarBg.fillRect(20, 40 + this.barHeight + this.barPadding, this.barWidth, this.barHeight);
    
    this.manaBar = this.add.graphics();
    this.manaBar.fillStyle(0x0000ff, 1);
    
    // レベルテキスト
    this.levelText = this.add.text(
      20,
      20,
      'Level: 1',
      { fontFamily: 'Arial', fontSize: 16, color: '#ffffff' }
    );
    
    // ポーションカウンター
    this.add.image(20 + this.iconSize/2, 100, 'potion_icon')
      .setOrigin(0.5, 0.5)
      .setDisplaySize(this.iconSize, this.iconSize);
    
    this.potionCounter = this.add.text(
      20 + this.iconSize + 5,
      100,
      '0/0',
      { fontFamily: 'Arial', fontSize: 16, color: '#ffffff' }
    ).setOrigin(0, 0.5);
  }

  updateHealthBar() {
    if (!this.player) return;
    
    const ratio = this.player.life / this.player.maxLife;
    this.healthBar.clear();
    this.healthBar.fillStyle(0xff0000, 1);
    this.healthBar.fillRect(20, 40, this.barWidth * ratio, this.barHeight);
  }

  updateManaBar() {
    if (!this.player) return;
    
    const ratio = this.player.mana / this.player.maxMana;
    this.manaBar.clear();
    this.manaBar.fillStyle(0x0000ff, 1);
    this.manaBar.fillRect(20, 40 + this.barHeight + this.barPadding, this.barWidth * ratio, this.barHeight);
  }

  updatePotionCounter() {
    if (!this.player) return;
    
    this.potionCounter.setText(`${this.player.potionCount}/${this.player.maxPotion}`);
  }

  updateLevelText() {
    if (!this.player) return;
    
    this.levelText.setText(`Level: ${this.player.level}`);
  }

  addBuffIcon(buff) {
    // バフアイコンの追加
    const x = 20 + (this.buffIcons.length * (this.iconSize + 5));
    const y = 140;
    
    const frame = this.add.image(
      x,
      y,
      'buff_frame'
    ).setOrigin(0, 0.5).setDisplaySize(this.iconSize, this.iconSize);
    
    const icon = this.add.image(
      x + this.iconSize/2,
      y,
      buff.image
    ).setOrigin(0.5, 0.5).setDisplaySize(this.iconSize - 4, this.iconSize - 4);
    
    // バフ残り時間表示用テキスト
    const timeText = this.add.text(
      x + this.iconSize/2,
      y + this.iconSize/2 - 2,
      '',
      { fontFamily: 'Arial', fontSize: 10, color: '#ffffff' }
    ).setOrigin(0.5, 0.5);
    
    this.buffIcons.push({ id: buff.uuid, frame, icon, timeText });
    
    // バフ残り時間更新用タイマー
    this.time.addEvent({
      delay: 1000,
      repeat: buff.duration,
      callback: () => {
        const remaining = buff.duration - (buff.duration - this.time.now + buff.startTime) / 1000;
        if (remaining > 0) {
          timeText.setText(Math.ceil(remaining).toString());
        } else {
          this.removeBuffIcon(buff.uuid);
        }
      }
    });
  }

  removeBuffIcon(buffId) {
    // バフアイコンの削除
    const index = this.buffIcons.findIndex(b => b.id === buffId);
    if (index !== -1) {
      const buff = this.buffIcons[index];
      buff.frame.destroy();
      buff.icon.destroy();
      buff.timeText.destroy();
      this.buffIcons.splice(index, 1);
      
      // 残りのアイコンを再配置
      this.buffIcons.forEach((b, i) => {
        b.frame.x = 20 + (i * (this.iconSize + 5));
        b.icon.x = b.frame.x + this.iconSize/2;
        b.timeText.x = b.icon.x;
      });
    }
  }

  updateMinimap() {
    if (!this.player || !this.mainScene) return;
    
    // ミニマップの更新
    const minimapX = this.cameras.main.width - 100;
    const minimapY = 100;
    const minimapSize = 150;
    
    // プレイヤーの位置をミニマップ上の座標に変換
    const mapWidth = this.mainScene.mapSize.width;
    const mapHeight = this.mainScene.mapSize.height;
    
    const playerMapX = this.player.x / (mapWidth * this.mainScene.tileSize.width);
    const playerMapY = this.player.y / (mapHeight * this.mainScene.tileSize.height);
    
    const dotX = minimapX - minimapSize/2 + (playerMapX * minimapSize);
    const dotY = minimapY - minimapSize/2 + (playerMapY * minimapSize);
    
    // プレイヤードットの位置更新
    this.playerDot.clear();
    this.playerDot.fillStyle(0xff0000, 1);
    this.playerDot.fillCircle(dotX, dotY, 3);
  }

  useSkill(index) {
    // スキルアイコンクリック時の処理
    if (this.mainScene && this.mainScene.usePlayerSkill) {
      this.mainScene.usePlayerSkill(index);
    }
  }

  showMessage(message, duration = 2000) {
    // 一時メッセージの表示
    this.messageText.setText(message);
    this.messageText.setVisible(true);
    
    this.time.delayedCall(duration, () => {
      this.messageText.setVisible(false);
    });
  }

  update(time, delta) {
    // UI要素の更新
    this.updateMinimap();
  }
}