import Phaser from 'phaser';
import React from 'react';
import ReactDOM from 'react-dom';
import SkillTree from '../../../components/ui/SkillTree';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
    
    // UI要素
    this.healthBar = null;
    this.manaBar = null;
    this.expBar = null;
    this.skillBar = null;
    this.statusTexts = {};
    this.buffIcons = [];
    this.minimap = null;
    
    // メニュー関連
    this.menuOpen = false;
    this.menuGroup = null;
    
    // メッセージ表示
    this.messageText = null;
    this.messageTimer = null;
    
    // React UI関連
    this.reactUIContainer = null;
    this.reactUIRoot = null;
    this.currentReactComponent = null;

    //各種コンテナ
    this.dialogueContainer = null;
    this.shopContainer = null;

    //通知テキスト
    this.notificationText = null;
  }
  
  init(data) {
    // MainSceneへの参照を保持
    this.mainScene = data.mainScene || this.scene.get('MainScene');
  }
  
  create() {
    // UI要素の作成
    this.createBars();
    this.createStatusTexts();
    this.createSkillBar();
    this.createMinimap();
    this.createMenuGroup();
    this.createMessageText();
    
    // イベントリスナーの設定
    this.setupEventListeners();
    
    // React UI用のコンテナ準備
    this.prepareReactUIContainer();
  }
  
  update(time, delta) {
    // プレイヤー参照の更新
    this.player = this.mainScene.player;
    
    if (this.player) {
      // UIの更新
      this.updateBars();
      this.updateStatusTexts();
      this.updateBuffIcons();
      this.updateSkillBar();
      this.updateMinimap();
    }
  }
  
  createBars() {
    // HPバー
    this.healthBar = this.add.graphics();
    this.healthBarBg = this.add.graphics();
    this.healthBarBg.fillStyle(0x000000, 0.5);
    this.healthBarBg.fillRect(10, 10, 200, 20);
    
    // MPバー
    this.manaBar = this.add.graphics();
    this.manaBarBg = this.add.graphics();
    this.manaBarBg.fillStyle(0x000000, 0.5);
    this.manaBarBg.fillRect(10, 40, 200, 20);
    
    // 経験値バー
    this.expBar = this.add.graphics();
    this.expBarBg = this.add.graphics();
    this.expBarBg.fillStyle(0x000000, 0.5);
    this.expBarBg.fillRect(10, this.scale.height - 30, this.scale.width - 20, 20);
  }
  
  createStatusTexts() {
    // ステータステキスト
    this.statusTexts.level = this.add.text(10, 70, 'Lv: 1', {
      fontSize: '16px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    this.statusTexts.health = this.add.text(220, 10, '100/100', {
      fontSize: '16px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    this.statusTexts.mana = this.add.text(220, 40, '100/100', {
      fontSize: '16px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
  }
  
  createSkillBar() {
    // スキルバー背景
    this.skillBarBg = this.add.graphics();
    this.skillBarBg.fillStyle(0x000000, 0.5);
    this.skillBarBg.fillRect(
      this.scale.width / 2 - 150, 
      this.scale.height - 80, 
      300, 
      60
    );
    
    // スキルスロット
    this.skillSlots = [];
    
    for (let i = 0; i < 5; i++) {
      const x = this.scale.width / 2 - 125 + i * 50;
      const y = this.scale.height - 70;
      
      // スロット背景
      const slotBg = this.add.graphics();
      slotBg.fillStyle(0x333333, 0.8);
      slotBg.fillRect(x, y, 40, 40);
      
      // スロットボーダー
      const slotBorder = this.add.graphics();
      slotBorder.lineStyle(2, 0xffffff, 1);
      slotBorder.strokeRect(x, y, 40, 40);
      
      // スキルアイコン（プレースホルダー）
      const skillIcon = this.add.image(x + 20, y + 20, 'skill_placeholder');
      skillIcon.setDisplaySize(36, 36);
      
      // クールダウンオーバーレイ
      const cooldownOverlay = this.add.graphics();
      
      // スロット番号テキスト
      const slotText = this.add.text(x + 5, y + 5, (i + 1).toString(), {
        fontSize: '12px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      });
      
      // スロット情報をオブジェクトとして保存
      this.skillSlots.push({
        bg: slotBg,
        border: slotBorder,
        icon: skillIcon,
        cooldown: cooldownOverlay,
        text: slotText,
        skillId: null,
        cooldownEnd: 0
      });
    }
  }
  
  createMinimap() {
    // ミニマップ
    const minimapSize = 150;
    this.minimap = this.add.graphics();
    this.minimapBg = this.add.graphics();
    this.minimapBg.fillStyle(0x000000, 0.5);
    this.minimapBg.fillRect(
      this.scale.width - minimapSize - 10, 
      10, 
      minimapSize, 
      minimapSize
    );
    
    // ミニマップボーダー
    this.minimapBorder = this.add.graphics();
    this.minimapBorder.lineStyle(2, 0xffffff, 1);
    this.minimapBorder.strokeRect(
      this.scale.width - minimapSize - 10, 
      10, 
      minimapSize, 
      minimapSize
    );
  }
  
  createMenuGroup() {
    // メニューグループ
    this.menuGroup = this.add.group();
    this.menuGroup.visible = false;
    
    // メニュー背景
    const menuBg = this.add.graphics();
    menuBg.fillStyle(0x000000, 0.8);
    menuBg.fillRect(
      this.scale.width / 2 - 150,
      this.scale.height / 2 - 200,
      300,
      400
    );
    
    // メニューボーダー
    const menuBorder = this.add.graphics();
    menuBorder.lineStyle(2, 0xffffff, 1);
    menuBorder.strokeRect(
      this.scale.width / 2 - 150,
      this.scale.height / 2 - 200,
      300,
      400
    );
    
    // メニュータイトル
    const menuTitle = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 - 180,
      'Menu',
      {
        fontSize: '24px',
        fill: '#ffffff'
      }
    ).setOrigin(0.5, 0.5);
    
    // メニューボタン
    const buttonY = this.scale.height / 2 - 130;
    const buttonHeight = 40;
    const buttonGap = 10;
    
    // インベントリボタン
    const inventoryButton = this.createMenuButton(
      this.scale.width / 2,
      buttonY,
      'Inventory',
      () => this.showInventory()
    );
    
    // スキルツリーボタン
    const skillTreeButton = this.createMenuButton(
      this.scale.width / 2,
      buttonY + buttonHeight + buttonGap,
      'Skill Tree',
      () => this.showSkillTree()
    );
    
    // キャラクター情報ボタン
    const characterButton = this.createMenuButton(
      this.scale.width / 2,
      buttonY + (buttonHeight + buttonGap) * 2,
      'Character Info',
      () => this.showCharacterInfo()
    );
    
    // 設定ボタン
    const settingsButton = this.createMenuButton(
      this.scale.width / 2,
      buttonY + (buttonHeight + buttonGap) * 3,
      'Settings',
      () => this.showSettings()
    );
    
    // 戻るボタン
    const backButton = this.createMenuButton(
      this.scale.width / 2,
      buttonY + (buttonHeight + buttonGap) * 4,
      'Back',
      () => this.toggleMenu()
    );
    
    // メニューグループに追加
    this.menuGroup.add(menuBg);
    this.menuGroup.add(menuBorder);
    this.menuGroup.add(menuTitle);
    this.menuGroup.add(inventoryButton);
    this.menuGroup.add(skillTreeButton);
    this.menuGroup.add(characterButton);
    this.menuGroup.add(settingsButton);
    this.menuGroup.add(backButton);
  }
  
  createMenuButton(x, y, text, callback) {
    // ボタン背景
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x333333, 1);
    buttonBg.fillRect(x - 100, y - 20, 200, 40);
    
    // ボタンボーダー
    const buttonBorder = this.add.graphics();
    buttonBorder.lineStyle(2, 0xffffff, 1);
    buttonBorder.strokeRect(x - 100, y - 20, 200, 40);
    
    // ボタンテキスト
    const buttonText = this.add.text(x, y, text, {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);
    
    // クリック可能な領域
    const buttonZone = this.add.zone(x - 100, y - 20, 200, 40);
    buttonZone.setInteractive();
    buttonZone.on('pointerdown', callback);
    
    // ホバー効果
    buttonZone.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x555555, 1);
      buttonBg.fillRect(x - 100, y - 20, 200, 40);
    });
    
    buttonZone.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x333333, 1);
      buttonBg.fillRect(x - 100, y - 20, 200, 40);
    });
    
    // グループとして返す
    const buttonGroup = this.add.group();
    buttonGroup.add(buttonBg);
    buttonGroup.add(buttonBorder);
    buttonGroup.add(buttonText);
    buttonGroup.add(buttonZone);
    
    return buttonGroup;
  }
  
  createMessageText() {
    // メッセージテキスト
    this.messageText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 4,
      '',
      {
        fontSize: '20px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        backgroundColor: '#00000080',
        padding: {
          x: 10,
          y: 5
        }
      }
    ).setOrigin(0.5, 0.5);
    
    this.messageText.setVisible(false);
  }
  
  setupEventListeners() {
    // キーボードイベント
    this.input.keyboard.on('keydown-ESC', () => {
      this.toggleMenu();
    });
    
    this.input.keyboard.on('keydown-I', () => {
      this.showInventory();
    });
    
    this.input.keyboard.on('keydown-K', () => {
      this.showSkillTree();
    });
    
    this.input.keyboard.on('keydown-C', () => {
      this.showCharacterInfo();
    });
  }
  
  prepareReactUIContainer() {
    // React UIコンテナの準備
    this.reactUIContainer = document.getElementById('react-ui');
    
    if (!this.reactUIContainer) {
      // コンテナがなければ作成
      this.reactUIContainer = document.createElement('div');
      this.reactUIContainer.id = 'react-ui';
      document.body.appendChild(this.reactUIContainer);
      
      // スタイル設定
      this.reactUIContainer.style.position = 'absolute';
      this.reactUIContainer.style.top = '0';
      this.reactUIContainer.style.left = '0';
      this.reactUIContainer.style.width = '100%';
      this.reactUIContainer.style.height = '100%';
      this.reactUIContainer.style.pointerEvents = 'none';
      this.reactUIContainer.style.zIndex = '10';
      this.reactUIContainer.style.display = 'none';
    }
    
    // React UIルート要素の作成
    this.reactUIRoot = document.createElement('div');
    this.reactUIRoot.style.width = '100%';
    this.reactUIRoot.style.height = '100%';
    this.reactUIRoot.style.pointerEvents = 'auto';
    
    this.reactUIContainer.appendChild(this.reactUIRoot);
  }
  
  updateBars() {
    if (!this.player) return;
    
    // HPバー更新
    const healthRatio = this.player.life / this.player.maxLife;
    this.healthBar.clear();
    this.healthBar.fillStyle(0xff0000, 1);
    this.healthBar.fillRect(10, 10, 200 * healthRatio, 20);
    
    // MPバー更新
    const manaRatio = this.player.mana / this.player.maxMana;
    this.manaBar.clear();
    this.manaBar.fillStyle(0x0000ff, 1);
    this.manaBar.fillRect(10, 40, 200 * manaRatio, 20);
    
    // 経験値バー更新
    const expRatio = this.player.exp / this.player.expToNextLevel;
    this.expBar.clear();
    this.expBar.fillStyle(0xffff00, 1);
    this.expBar.fillRect(10, this.scale.height - 30, (this.scale.width - 20) * expRatio, 20);
  }
  
  updateStatusTexts() {
    if (!this.player) return;
    
    // テキスト更新
    this.statusTexts.level.setText(`Lv: ${this.player.level}`);
    this.statusTexts.health.setText(`${Math.floor(this.player.life)}/${this.player.maxLife}`);
    this.statusTexts.mana.setText(`${Math.floor(this.player.mana)}/${this.player.maxMana}`);
  }
  
  updateBuffIcons() {
    if (!this.player) return;
    
    // バフアイコンのクリア
    this.buffIcons.forEach(icon => icon.destroy());
    this.buffIcons = [];
    
    // プレイヤーのバフ/デバフを表示
    const buffs = this.player.buffs || [];
    const debuffs = this.player.debuffs || [];
    
    // バフアイコンの表示
    let iconIndex = 0;
    const iconSize = 30;
    const iconGap = 5;
    const startX = 10;
    const startY = 100;
    
    // バフアイコン
    buffs.forEach(buff => {
      const x = startX + (iconIndex % 5) * (iconSize + iconGap);
      const y = startY + Math.floor(iconIndex / 5) * (iconSize + iconGap);
      
      const icon = this.add.image(x + iconSize / 2, y + iconSize / 2, buff.icon || 'buff_icon');
      icon.setDisplaySize(iconSize, iconSize);
      
      // 残り時間表示
      const timeLeft = buff.duration - (Date.now() - buff.startTime);
      const seconds = Math.ceil(timeLeft / 1000);
      
      const timeText = this.add.text(x + iconSize / 2, y + iconSize - 5, seconds.toString(), {
        fontSize: '10px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5, 0.5);
      
      this.buffIcons.push(icon);
      this.buffIcons.push(timeText);
      
      iconIndex++;
    });
    
    // デバフアイコン
    debuffs.forEach(debuff => {
      const x = startX + (iconIndex % 5) * (iconSize + iconGap);
      const y = startY + Math.floor(iconIndex / 5) * (iconSize + iconGap);
      
      const icon = this.add.image(x + iconSize / 2, y + iconSize / 2, debuff.icon || 'debuff_icon');
      icon.setDisplaySize(iconSize, iconSize);
      
      // 残り時間表示
      const timeLeft = debuff.duration - (Date.now() - debuff.startTime);
      const seconds = Math.ceil(timeLeft / 1000);
      
      const timeText = this.add.text(x + iconSize / 2, y + iconSize - 5, seconds.toString(), {
        fontSize: '10px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5, 0.5);
      
      this.buffIcons.push(icon);
      this.buffIcons.push(timeText);
      
      iconIndex++;
    });
  }
  
  updateSkillBar() {
    if (!this.player) return;
    
    // プレイヤーのスキルを取得
    const specialActions = this.player.specialActions || new Map();
    const skillKeys = Array.from(specialActions.keys());
    
    // スキルスロットの更新
    for (let i = 0; i < this.skillSlots.length; i++) {
      const slot = this.skillSlots[i];
      const skillKey = skillKeys[i];
      
      if (skillKey) {
        const action = specialActions.get(skillKey);
        
        // スキルアイコンの更新
        if (action && action.icon) {
          slot.icon.setTexture(action.icon);
        } else {
          slot.icon.setTexture('skill_placeholder');
        }
        
        // スキルIDの保存
        slot.skillId = skillKey;
        
        // クールダウンの更新
        if (action && action.skill && action.skill.lastUsed) {
          const cooldownTime = action.cooldown || 10000;
          const timeSinceLastUse = Date.now() - action.skill.lastUsed;
          const cooldownRemaining = cooldownTime - timeSinceLastUse;
          
          if (cooldownRemaining > 0) {
            slot.cooldownEnd = Date.now() + cooldownRemaining;
            
            // クールダウンオーバーレイの描画
            const ratio = cooldownRemaining / cooldownTime;
            const x = slot.bg.x;
            const y = slot.bg.y;
            
            slot.cooldown.clear();
            slot.cooldown.fillStyle(0x000000, 0.7);
            slot.cooldown.fillRect(x, y, 40, 40 * ratio);
            
            // 残り時間表示
            const seconds = Math.ceil(cooldownRemaining / 1000);
            slot.text.setText(seconds.toString());
          } else {
            slot.cooldown.clear();
            slot.text.setText((i + 1).toString());
          }
        } else {
          slot.cooldown.clear();
          slot.text.setText((i + 1).toString());
        }
      } else {
        // スキルがない場合はプレースホルダー
        slot.icon.setTexture('skill_placeholder');
        slot.skillId = null;
        slot.cooldown.clear();
        slot.text.setText((i + 1).toString());
      }
    }
  }
  
  updateMinimap() {
    if (!this.player || !this.mainScene.topDownMap) return;
    
    // ミニマップのクリア
    this.minimap.clear();
    
    // マップデータの取得
    const mapData = this.mainScene.topDownMap.mapData;
    const mapWidth = mapData ? mapData.width : 50;
    const mapHeight = mapData ? mapData.height : 50;
    
    // ミニマップの描画サイズ
    const minimapSize = 150;
    const tileSize = minimapSize / Math.max(mapWidth, mapHeight);
    
    // マップタイルの描画
    if (mapData && mapData.heightMap) {
      for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
          // 高さデータに基づくタイル色の決定
          const heightValue = mapData.heightMap[y][x];
          let color = this.getColorFromHeight(heightValue);
          
          // 障害物チェック
          if (mapData.objectPlacement && mapData.objectPlacement[y][x] === 3) {
            color = 0x222222; // 障害物/壁
          }
          
          // タイルの描画
          this.minimap.fillStyle(color, 1);
          this.minimap.fillRect(
            this.scale.width - minimapSize - 10 + x * tileSize,
            10 + y * tileSize,
            tileSize,
            tileSize
          );
        }
      }
    }
    
    // プレイヤーの位置を描画
    if (this.player) {
      const playerTile = this.mainScene.topDownMap.worldToTileXY(this.player.x, this.player.y);
      const playerX = playerTile.x / mapWidth;
      const playerY = playerTile.y / mapHeight;
      
      this.minimap.fillStyle(0x00ff00, 1);
      this.minimap.fillRect(
        this.scale.width - minimapSize - 10 + playerX * minimapSize - 2,
        10 + playerY * minimapSize - 2,
        4,
        4
      );
    }
    
    // 敵の位置を描画
    if (this.mainScene.enemies) {
      this.mainScene.enemies.forEach(enemy => {
        if (!enemy.isDead) {
          const enemyTile = this.mainScene.topDownMap.worldToTileXY(enemy.x, enemy.y);
          const enemyX = enemyTile.x / mapWidth;
          const enemyY = enemyTile.y / mapHeight;
          
          this.minimap.fillStyle(0xff0000, 1);
          this.minimap.fillRect(
            this.scale.width - minimapSize - 10 + enemyX * minimapSize - 1,
            10 + enemyY * minimapSize - 1,
            3,
            3
          );
        }
      });
    }
    
    // NPCの位置を描画
    if (this.mainScene.npcs) {
      this.mainScene.npcs.forEach(npc => {
        const npcTile = this.mainScene.topDownMap.worldToTileXY(npc.x, npc.y);
        const npcX = npcTile.x / mapWidth;
        const npcY = npcTile.y / mapHeight;
        
        this.minimap.fillStyle(0xffff00, 1);
        this.minimap.fillRect(
          this.scale.width - minimapSize - 10 + npcX * minimapSize - 1,
          10 + npcY * minimapSize - 1,
          3,
          3
        );
      });
    }
  }
  
  // 高さ値から色を取得
  getColorFromHeight(height) {
    if (height < 0.3) {
      return 0x0000ff; // 水
    } else if (height < 0.5) {
      return 0x00aa00; // 草
    } else if (height < 0.7) {
      return 0x8b4513; // 土
    } else if (height < 0.85) {
      return 0x888888; // 石
    } else {
      return 0xffffff; // 雪
    }
  }
  
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    this.menuGroup.setVisible(this.menuOpen);
    
    // ゲームの一時停止/再開
    if (this.menuOpen) {
      this.scene.pause('MainScene');
    } else {
      this.scene.resume('MainScene');
    }
  }
  
  showInventory() {
    // React UIを使用してインベントリを表示
    this.hideReactUI();
    // TODO: インベントリUIコンポーネントの表示
    console.log('Show inventory');
  }
  
  showSkillTree(character = null) {
    // 引数がない場合はプレイヤーを使用
    character = character || this.mainScene.player;
    
    if (!character) {
      console.error('Character not found for skill tree');
      return;
    }
    
    try {
      // メインシーンを一時停止
      this.scene.pause('MainScene');
      
      // React UIを表示
      this.showReactUI();
      
      // スキルツリーコンポーネントをレンダリング
      ReactDOM.render(
        React.createElement(SkillTree, {
          character: character,
          onClose: () => this.hideSkillTree()
        }),
        this.reactUIRoot
      );
    } catch (error) {
      console.error('Error rendering skill tree:', error);
      this.hideReactUI();
      this.scene.resume('MainScene');
    }
  }
  
  hideSkillTree() {
    // メインシーンを再開
    this.scene.resume('MainScene');
    
    // React UIを非表示
    this.hideReactUI();
  }
  
  showCharacterInfo() {
    // React UIを使用してキャラクター情報を表示
    this.hideReactUI();
    // TODO: キャラクター情報UIコンポーネントの表示
    console.log('Show character info');
  }
  
  showSettings() {
    // React UIを使用して設定画面を表示
    this.hideReactUI();
    // TODO: 設定UIコンポーネントの表示
    console.log('Show settings');
  }
  
  showMessage(message, duration = 3000) {
    // メッセージ表示
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }
    
    this.messageText.setText(message);
    this.messageText.setVisible(true);
    
    this.messageTimer = setTimeout(() => {
      this.messageText.setVisible(false);
    }, duration);
  }
  
  showLevelUpNotification() {
    this.showMessage('Level Up!', 5000);
    
    // レベルアップエフェクト
    const levelUpText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      'LEVEL UP!',
      {
        fontSize: '48px',
        fill: '#ffff00',
        stroke: '#000000',
        strokeThickness: 6
      }
    ).setOrigin(0.5, 0.5);
    
    // アニメーション
    this.tweens.add({
      targets: levelUpText,
      scale: { from: 0.5, to: 2 },
      alpha: { from: 1, to: 0 },
      ease: 'Power2',
      duration: 2000,
      onComplete: () => {
        levelUpText.destroy();
      }
    });
  }
  
  showReactUI() {
    if (this.reactUIContainer) {
      this.reactUIContainer.style.display = 'block';
    }
  }
  
  hideReactUI() {
    if (this.reactUIContainer) {
      this.reactUIContainer.style.display = 'none';
      
      // React要素のアンマウント
      if (this.reactUIRoot) {
        ReactDOM.unmountComponentAtNode(this.reactUIRoot);
      }
    }
  }
  
  updateHealthBar() {
    // HPバーの更新（外部からも呼び出せるように）
    if (this.player) {
      const healthRatio = this.player.life / this.player.maxLife;
      this.healthBar.clear();
      this.healthBar.fillStyle(0xff0000, 1);
      this.healthBar.fillRect(10, 10, 200 * healthRatio, 20);
      
      this.statusTexts.health.setText(`${Math.floor(this.player.life)}/${this.player.maxLife}`);
    }
  }
  
  updateManaBar() {
    // MPバーの更新（外部からも呼び出せるように）
    if (this.player) {
      const manaRatio = this.player.mana / this.player.maxMana;
      this.manaBar.clear();
      this.manaBar.fillStyle(0x0000ff, 1);
      this.manaBar.fillRect(10, 40, 200 * manaRatio, 20);
      
      this.statusTexts.mana.setText(`${Math.floor(this.player.mana)}/${this.player.maxMana}`);
    }
  }
  
  updateSkillCooldown(skill) {
    // 指定したスキルのクールダウン更新
    if (!skill || !skill.id) return;
    
    for (const slot of this.skillSlots) {
      if (slot.skillId === skill.id) {
        // クールダウン更新
        const cooldownTime = skill.cooldown || 10000;
        slot.cooldownEnd = Date.now() + cooldownTime;
        
        // 表示を更新
        this.updateSkillBar();
        break;
      }
    }
  }

  /**
   * NPC対話UIを表示
   * @param {NPC} npc - 対話するNPC
   */
  showDialogue(npc) {
    if (!npc) return;
    
    // プレイヤーとNPCの対話を開始
    const dialogueData = npc.interact(this.mainScene.player);
    
    // 対話タイプに応じて処理を分岐
    if (dialogueData.type === 'shop') {
      this.showShopUI(dialogueData);
    } else {
      this.showDialogueUI(dialogueData);
    }
  }

  /**
   * 対話UIを表示
   * @param {object} dialogueData - 対話データ
   */
  showDialogueUI(dialogueData) {
    // 既存の対話UIがあれば削除
    this.closeDialogueUI();
    
    // 対話UIコンテナを作成
    this.dialogueContainer = this.add.container(0, 0);
    
    // 背景パネル
    const bg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height - 150,
      this.cameras.main.width - 100,
      200,
      0x000000
    );
    bg.setAlpha(0.8);
    bg.setStrokeStyle(2, 0xffffff);
    
    // NPC名テキスト
    const npcName = this.add.text(
      bg.x - bg.width / 2 + 20,
      bg.y - bg.height / 2 + 20,
      dialogueData.npc.type.charAt(0).toUpperCase() + dialogueData.npc.type.slice(1),
      { font: '24px Arial', fill: '#ffff00' }
    );
    
    // 対話テキスト
    const dialogueText = this.add.text(
      bg.x - bg.width / 2 + 20,
      npcName.y + npcName.height + 10,
      dialogueData.dialogue,
      { font: '18px Arial', fill: '#ffffff', wordWrap: { width: bg.width - 40 } }
    );
    
    // 続けるボタン
    const continueButton = this.add.text(
      bg.x + bg.width / 2 - 100,
      bg.y + bg.height / 2 - 30,
      '続ける',
      { font: '18px Arial', fill: '#ffff00' }
    );
    continueButton.setInteractive();
    continueButton.on('pointerdown', () => {
      // 次の対話を表示
      const nextDialogue = dialogueData.npc.getDialogue();
      dialogueText.setText(nextDialogue);
    });
    
    // 閉じるボタン
    const closeButton = this.add.text(
      bg.x + bg.width / 2 - 50,
      bg.y + bg.height / 2 - 30,
      '閉じる',
      { font: '18px Arial', fill: '#ffff00' }
    );
    closeButton.setInteractive();
    closeButton.on('pointerdown', () => {
      // 対話終了
      dialogueData.npc.endInteraction();
      this.closeDialogueUI();
    });
    
    // コンテナに追加
    this.dialogueContainer.add([bg, npcName, dialogueText, continueButton, closeButton]);
    
    // 固定表示（カメラの動きに影響されない）
    this.dialogueContainer.setDepth(100);
    this.dialogueContainer.setScrollFactor(0);
  }

  /**
   * 対話UIを閉じる
   */
  closeDialogueUI() {
    if (this.dialogueContainer) {
      this.dialogueContainer.destroy();
      this.dialogueContainer = null;
    }
  }

  /**
   * ショップUIを表示
   * @param {object} shopData - ショップデータ
   */
  showShopUI(shopData) {
    // 既存のショップUIがあれば削除
    this.closeShopUI();
    
    // ショップUIコンテナを作成
    this.shopContainer = this.add.container(0, 0);
    
    // 背景パネル
    const bg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width - 200,
      this.cameras.main.height - 200,
      0x000000
    );
    bg.setAlpha(0.8);
    bg.setStrokeStyle(2, 0xffffff);
    
    // ショップ名テキスト
    const shopType = shopData.shopType.charAt(0).toUpperCase() + shopData.shopType.slice(1);
    const shopName = this.add.text(
      bg.x - bg.width / 2 + 20,
      bg.y - bg.height / 2 + 20,
      `${shopData.npc.type.charAt(0).toUpperCase() + shopData.npc.type.slice(1)}の${shopType}ショップ`,
      { font: '24px Arial', fill: '#ffff00' }
    );
    
    // 対話テキスト
    const dialogueText = this.add.text(
      bg.x - bg.width / 2 + 20,
      shopName.y + shopName.height + 10,
      shopData.dialogue,
      { font: '18px Arial', fill: '#ffffff', wordWrap: { width: bg.width - 40 } }
    );
    
    // プレイヤーの所持金表示
    const goldText = this.add.text(
      bg.x - bg.width / 2 + 20,
      bg.y - bg.height / 2 + 60,
      `所持金: ${this.mainScene.player.gold} G`,
      { font: '18px Arial', fill: '#ffff00' }
    );
    
    // アイテムリスト背景
    const itemListBg = this.add.rectangle(
      bg.x,
      bg.y + 50,
      bg.width - 40,
      bg.height - 200,
      0x222222
    );
    itemListBg.setAlpha(0.6);
    
    // アイテムリストタイトル
    const buyTitle = this.add.text(
      itemListBg.x - itemListBg.width / 2 + 20,
      itemListBg.y - itemListBg.height / 2 - 20,
      '商品リスト',
      { font: '20px Arial', fill: '#ffffff' }
    );
    
    // アイテムリスト作成
    const itemList = [];
    const itemButtons = [];
    const itemStartY = itemListBg.y - itemListBg.height / 2 + 20;
    const itemHeight = 30;
    const itemsPerPage = 10;
    let currentPage = 0;
    const totalPages = Math.ceil(shopData.shopItems.length / itemsPerPage);
    
    // アイテムリストの表示更新関数
    const updateItemList = (page) => {
      // 既存のアイテムを削除
      itemList.forEach(item => item.destroy());
      itemList.length = 0;
      itemButtons.forEach(button => button.destroy());
      itemButtons.length = 0;
      
      // 表示するアイテムの範囲を計算
      const startIndex = page * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, shopData.shopItems.length);
      
      // アイテムを表示
      for (let i = startIndex; i < endIndex; i++) {
        const item = shopData.shopItems[i];
        const itemY = itemStartY + (i - startIndex) * itemHeight;
        
        // アイテム名と価格
        const itemText = this.add.text(
          itemListBg.x - itemListBg.width / 2 + 20,
          itemY,
          `${item.name} - ${item.price} G ${item.requiredLevel ? `(Lv.${item.requiredLevel})` : ''}`,
          { font: '16px Arial', fill: '#ffffff' }
        );
        
        // 購入ボタン
        const buyButton = this.add.text(
          itemListBg.x + itemListBg.width / 2 - 70,
          itemY,
          '購入',
          { font: '16px Arial', fill: '#00ff00' }
        );
        buyButton.setInteractive();
        buyButton.on('pointerdown', () => {
          this.buyItem(shopData.npc, item);
          // 所持金表示を更新
          goldText.setText(`所持金: ${this.mainScene.player.gold} G`);
        });
        
        // プレイヤーのレベルが足りない場合はボタンを無効化
        if (item.requiredLevel && item.requiredLevel > this.mainScene.player.level) {
          buyButton.setAlpha(0.5);
          buyButton.disableInteractive();
        }
        
        // プレイヤーの所持金が足りない場合もボタンを無効化
        if (item.price > this.mainScene.player.gold) {
          buyButton.setAlpha(0.5);
          buyButton.disableInteractive();
        }
        
        itemList.push(itemText);
        itemButtons.push(buyButton);
      }
      
      // ページ情報を表示
      if (pageText) {
        pageText.setText(`ページ: ${currentPage + 1}/${totalPages}`);
      }
    };
    
    // 初期表示
    updateItemList(currentPage);
    
    // ページングボタン
    let prevButton, nextButton, pageText;
    
    if (totalPages > 1) {
      // 前ページボタン
      prevButton = this.add.text(
        itemListBg.x - 80,
        itemListBg.y + itemListBg.height / 2 + 20,
        '前へ',
        { font: '16px Arial', fill: '#ffffff' }
      );
      prevButton.setInteractive();
      prevButton.on('pointerdown', () => {
        if (currentPage > 0) {
          currentPage--;
          updateItemList(currentPage);
        }
      });
      
      // 次ページボタン
      nextButton = this.add.text(
        itemListBg.x + 80,
        itemListBg.y + itemListBg.height / 2 + 20,
        '次へ',
        { font: '16px Arial', fill: '#ffffff' }
      );
      nextButton.setInteractive();
      nextButton.on('pointerdown', () => {
        if (currentPage < totalPages - 1) {
          currentPage++;
          updateItemList(currentPage);
        }
      });
      
      // ページ表示
      pageText = this.add.text(
        itemListBg.x,
        itemListBg.y + itemListBg.height / 2 + 20,
        `ページ: ${currentPage + 1}/${totalPages}`,
        { font: '16px Arial', fill: '#ffffff' }
      );
      pageText.setOrigin(0.5);
    }
    
    // プレイヤー所持アイテム表示ボタン
    const inventoryButton = this.add.text(
      bg.x,
      bg.y + bg.height / 2 - 60,
      'インベントリを開く',
      { font: '18px Arial', fill: '#ffff00' }
    );
    inventoryButton.setOrigin(0.5);
    inventoryButton.setInteractive();
    inventoryButton.on('pointerdown', () => {
      this.showInventoryForSelling(shopData.npc);
    });
    
    // 閉じるボタン
    const closeButton = this.add.text(
      bg.x,
      bg.y + bg.height / 2 - 30,
      '閉じる',
      { font: '18px Arial', fill: '#ffff00' }
    );
    closeButton.setOrigin(0.5);
    closeButton.setInteractive();
    closeButton.on('pointerdown', () => {
      // ショップを閉じる
      shopData.npc.endInteraction();
      this.closeShopUI();
    });
    
    // コンテナに追加
    this.shopContainer.add([bg, shopName, dialogueText, goldText, itemListBg, buyTitle, closeButton, inventoryButton]);
    
    // ページングボタンがある場合は追加
    if (totalPages > 1) {
      this.shopContainer.add([prevButton, nextButton, pageText]);
    }
    
    // アイテムリストを追加
    itemList.forEach(item => this.shopContainer.add(item));
    itemButtons.forEach(button => this.shopContainer.add(button));
    
    // 固定表示（カメラの動きに影響されない）
    this.shopContainer.setDepth(100);
    this.shopContainer.setScrollFactor(0);
  }

  /**
   * ショップUIを閉じる
   */
  closeShopUI() {
    if (this.shopContainer) {
      this.shopContainer.destroy();
      this.shopContainer = null;
    }
    
    if (this.inventoryContainer) {
      this.inventoryContainer.destroy();
      this.inventoryContainer = null;
    }
  }

  /**
   * アイテム購入処理
   * @param {NPC} npc - ショップNPC
   * @param {object} item - 購入するアイテム
   */
  buyItem(npc, item) {
    if (!npc || !item || !this.mainScene.player) return;
    
    // アイテムファクトリーを使用してアイテムインスタンスを生成
    const itemInstance = this.mainScene.itemFactory.createItemFromData(item);
    
    if (itemInstance) {
      // アイテムの購入
      const success = npc.buyItem(this.mainScene.player, itemInstance);
      
      if (success) {
        // 購入成功メッセージ
        this.showNotification(`${item.name}を購入しました`);
      } else {
        // 購入失敗メッセージ
        this.showNotification('購入に失敗しました');
      }
    }
  }

  /**
   * 売却用インベントリ表示
   * @param {NPC} npc - ショップNPC
   */
  showInventoryForSelling(npc) {
    // 既存のインベントリUIがあれば削除
    if (this.inventoryContainer) {
      this.inventoryContainer.destroy();
      this.inventoryContainer = null;
    }
    
    // インベントリUIコンテナを作成
    this.inventoryContainer = this.add.container(0, 0);
    
    // 背景パネル
    const bg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width - 200,
      this.cameras.main.height - 200,
      0x000000
    );
    bg.setAlpha(0.8);
    bg.setStrokeStyle(2, 0xffffff);
    
    // タイトルテキスト
    const titleText = this.add.text(
      bg.x - bg.width / 2 + 20,
      bg.y - bg.height / 2 + 20,
      'インベントリ（アイテムをクリックで売却）',
      { font: '24px Arial', fill: '#ffff00' }
    );
    
    // プレイヤーの所持金表示
    const goldText = this.add.text(
      bg.x - bg.width / 2 + 20,
      bg.y - bg.height / 2 + 60,
      `所持金: ${this.mainScene.player.gold} G`,
      { font: '18px Arial', fill: '#ffff00' }
    );
    
    // アイテムリスト背景
    const itemListBg = this.add.rectangle(
      bg.x,
      bg.y + 50,
      bg.width - 40,
      bg.height - 200,
      0x222222
    );
    itemListBg.setAlpha(0.6);
    
    // プレイヤーのインベントリを取得
    const inventory = this.mainScene.player.inventory || [];
    
    // アイテムリスト作成
    const itemList = [];
    const itemButtons = [];
    const itemStartY = itemListBg.y - itemListBg.height / 2 + 20;
    const itemHeight = 30;
    const itemsPerPage = 10;
    let currentPage = 0;
    const totalPages = Math.ceil(inventory.length / itemsPerPage);
    
    // アイテムリストの表示更新関数
    const updateItemList = (page) => {
      // 既存のアイテムを削除
      itemList.forEach(item => item.destroy());
      itemList.length = 0;
      itemButtons.forEach(button => button.destroy());
      itemButtons.length = 0;
      
      // 表示するアイテムの範囲を計算
      const startIndex = page * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, inventory.length);
      
      // アイテムを表示
      for (let i = startIndex; i < endIndex; i++) {
        const item = inventory[i];
        const itemY = itemStartY + (i - startIndex) * itemHeight;
        
        // アイテム名と売却価格（購入価格の半分）
        const sellPrice = Math.floor(item.price * 0.5);
        const itemText = this.add.text(
          itemListBg.x - itemListBg.width / 2 + 20,
          itemY,
          `${item.name} - 売却価格: ${sellPrice} G`,
          { font: '16px Arial', fill: '#ffffff' }
        );
        
        // 売却ボタン
        const sellButton = this.add.text(
          itemListBg.x + itemListBg.width / 2 - 70,
          itemY,
          '売却',
          { font: '16px Arial', fill: '#ff9900' }
        );
        sellButton.setInteractive();
        sellButton.on('pointerdown', () => {
          this.sellItem(npc, item);
          // 所持金表示を更新
          goldText.setText(`所持金: ${this.mainScene.player.gold} G`);
          // リストを更新
          updateItemList(currentPage);
        });
        
        // 装備中や特別なアイテムは売却できないように
        if (item.isEquipped || item.isSpecial) {
          sellButton.setAlpha(0.5);
          sellButton.disableInteractive();
        }
        
        itemList.push(itemText);
        itemButtons.push(sellButton);
      }
      
      // ページ情報を表示
      if (pageText) {
        pageText.setText(`ページ: ${currentPage + 1}/${totalPages}`);
      }
    };
    
    // 初期表示
    updateItemList(currentPage);
    
    // ページングボタン
    let prevButton, nextButton, pageText;
    
    if (totalPages > 1) {
      // 前ページボタン
      prevButton = this.add.text(
        itemListBg.x - 80,
        itemListBg.y + itemListBg.height / 2 + 20,
        '前へ',
        { font: '16px Arial', fill: '#ffffff' }
      );
      prevButton.setInteractive();
      prevButton.on('pointerdown', () => {
        if (currentPage > 0) {
          currentPage--;
          updateItemList(currentPage);
        }
      });
      
      // 次ページボタン
      nextButton = this.add.text(
        itemListBg.x + 80,
        itemListBg.y + itemListBg.height / 2 + 20,
        '次へ',
        { font: '16px Arial', fill: '#ffffff' }
      );
      nextButton.setInteractive();
      nextButton.on('pointerdown', () => {
        if (currentPage < totalPages - 1) {
          currentPage++;
          updateItemList(currentPage);
        }
      });
      
      // ページ表示
      pageText = this.add.text(
        itemListBg.x,
        itemListBg.y + itemListBg.height / 2 + 20,
        `ページ: ${currentPage + 1}/${totalPages}`,
        { font: '16px Arial', fill: '#ffffff' }
      );
      pageText.setOrigin(0.5);
    }
    
    // 閉じるボタン
    const closeButton = this.add.text(
      bg.x,
      bg.y + bg.height / 2 - 30,
      'ショップに戻る',
      { font: '18px Arial', fill: '#ffff00' }
    );
    closeButton.setOrigin(0.5);
    closeButton.setInteractive();
    closeButton.on('pointerdown', () => {
      // インベントリを閉じる
      if (this.inventoryContainer) {
        this.inventoryContainer.destroy();
        this.inventoryContainer = null;
      }
    });
    
    // コンテナに追加
    this.inventoryContainer.add([bg, titleText, goldText, itemListBg, closeButton]);
    
    // ページングボタンがある場合は追加
    if (totalPages > 1) {
      this.inventoryContainer.add([prevButton, nextButton, pageText]);
    }
    
    // アイテムリストを追加
    itemList.forEach(item => this.inventoryContainer.add(item));
    itemButtons.forEach(button => this.inventoryContainer.add(button));
    
    // 固定表示（カメラの動きに影響されない）
    this.inventoryContainer.setDepth(101); // ショップUIより上に表示
    this.inventoryContainer.setScrollFactor(0);
  }

  /**
   * アイテム売却処理
   * @param {NPC} npc - ショップNPC
   * @param {object} item - 売却するアイテム
   */
  sellItem(npc, item) {
    if (!npc || !item || !this.mainScene.player) return;
    
    // アイテムの売却
    const success = npc.sellItem(this.mainScene.player, item);
    
    if (success) {
      // 売却成功メッセージ
      this.showNotification(`${item.name}を売却しました`);
    } else {
      // 売却失敗メッセージ
      this.showNotification('売却に失敗しました');
    }
  }

  /**
   * 通知メッセージを表示
   * @param {string} message - 表示するメッセージ
   * @param {number} duration - 表示時間（ミリ秒）
   */
  showNotification(message, duration = 2000) {
    // 既存の通知があれば削除
    if (this.notificationText) {
      this.notificationText.destroy();
    }
    
    // 通知テキスト
    this.notificationText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - 100,
      message,
      { font: '20px Arial', fill: '#ffffff', backgroundColor: '#000000' }
    );
    this.notificationText.setOrigin(0.5);
    this.notificationText.setPadding(10);
    this.notificationText.setDepth(200);
    
    // 一定時間後に通知を削除
    this.time.delayedCall(duration, () => {
      if (this.notificationText) {
        this.notificationText.destroy();
        this.notificationText = null;
      }
    });
  }
}