/**
 * DebugUtils.js - デバッグ用ユーティリティと高品質なダミーデータ生成
 * 
 * ゲーム開発中の検証・デバッグ作業を効率化するためのユーティリティを提供する
 * デバッグモードでは各種ショートカットキーやステータス表示、ダミーデータ生成が可能
 */

// デバッグモードフラグ（環境変数に基づく）
const DEBUG_MODE = process.env.NODE_ENV !== 'production';

/**
 * デバッグユーティリティのシングルトンクラス
 */
class DebugUtils {
  constructor() {
    this.isEnabled = DEBUG_MODE; // デバッグモード有効フラグ
    this.debugElements = {}; // デバッグ要素格納オブジェクト
    this.keyBindings = {}; // キーバインディング
  }

  /**
   * メインシーンにデバッグモードを初期化
   * @param {Phaser.Scene} scene - 適用するシーン
   */
  initDebugMode(scene) {
    if (!this.isEnabled) return false;

    console.log('🐞 Debug mode initialized');
    
    // デバッグテキスト表示
    this.debugElements.title = scene.add.text(10, 10, 'DEBUG MODE', {
      font: '16px Arial',
      fill: '#ffff00',
      backgroundColor: '#000000',
      padding: { x: 5, y: 2 }
    }).setScrollFactor(0).setDepth(1000);
    
    // プレイヤー座標表示
    this.debugElements.position = scene.add.text(10, 36, '', {
      font: '12px Courier New',
      fill: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 5, y: 2 }
    }).setScrollFactor(0).setDepth(1000);
    
    // FPS表示
    this.debugElements.fps = scene.add.text(10, 58, '', {
      font: '12px Courier New',
      fill: '#00ff00',
      backgroundColor: '#333333',
      padding: { x: 5, y: 2 }
    }).setScrollFactor(0).setDepth(1000);
    
    // マップ情報表示
    this.debugElements.mapInfo = scene.add.text(10, 80, '', {
      font: '12px Courier New',
      fill: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 5, y: 2 }
    }).setScrollFactor(0).setDepth(1000);
    
    // ヘルプテキスト
    this.debugElements.help = scene.add.text(scene.cameras.main.width - 220, 10, 
      '[H]ealth refill\n[G]old add\n[L]evel up\n[T]eleport\n[R]egenerate map\n[D]ump nearby entities', {
      font: '12px Courier New',
      fill: '#ffff99',
      backgroundColor: '#333333',
      padding: { x: 5, y: 3 },
      align: 'left'
    }).setScrollFactor(0).setDepth(1000);
    
    // キーバインディングの設定
    this.setupKeyBindings(scene);
    
    // 更新関数をオーバーライド
    const originalUpdate = scene.update;
    scene.update = function(time, delta) {
      // 元のupdate関数を呼び出し
      if (originalUpdate) {
        originalUpdate.call(this, time, delta);
      }
      
      // デバッグ情報の更新
      DebugUtils.getInstance().updateDebugInfo(this, time, delta);
    };
    
    return true;
  }
  
  /**
   * デバッグキーバインディングの設定
   * @param {Phaser.Scene} scene - 適用するシーン
   */
  setupKeyBindings(scene) {
    if (!scene || !scene.input || !scene.input.keyboard) return;
    
    // Hキー: 体力とマナを全回復
    scene.input.keyboard.on('keydown-H', () => {
      if (scene.player) {
        scene.player.life = scene.player.maxLife;
        scene.player.mana = scene.player.maxMana;
        
        // UI更新
        const uiScene = scene.scene.get('UIScene');
        if (uiScene && uiScene.updateHealthBar) {
          uiScene.updateHealthBar();
          uiScene.updateManaBar();
        }
        
        console.log('🩸 体力とマナを全回復しました');
      }
    });
    
    // Gキー: ゴールド追加
    scene.input.keyboard.on('keydown-G', () => {
      if (scene.player) {
        scene.player.gold = (scene.player.gold || 0) + 100;
        console.log(`💰 ゴールドを追加しました。現在の所持金: ${scene.player.gold}G`);
      }
    });
    
    // Lキー: レベルアップ
    scene.input.keyboard.on('keydown-L', () => {
      if (scene.player && scene.playerLevelUp) {
        scene.playerLevelUp();
        console.log(`🌟 レベルアップしました。現在のレベル: ${scene.player.level}`);
      }
    });
    
    // Tキー: テレポート
    scene.input.keyboard.on('keydown-T', () => {
      if (scene.player && scene.topDownMap) {
        const pos = scene.topDownMap.getRandomWalkablePosition();
        const worldPos = scene.topDownMap.tileToWorldXY(pos.x, pos.y);
        scene.player.setPosition(worldPos.x, worldPos.y);
        console.log(`⚡ テレポートしました: (${pos.x}, ${pos.y})`);
      }
    });
    
    // Rキー: マップ再生成
    scene.input.keyboard.on('keydown-R', async () => {
      if (scene.generateMap) {
        await scene.generateMap();
        
        // プレイヤーの位置をリセット
        if (scene.player && scene.topDownMap) {
          const startPosition = scene.topDownMap.getRandomWalkablePosition();
          const worldPos = scene.topDownMap.tileToWorldXY(startPosition.x, startPosition.y);
          scene.player.setPosition(worldPos.x, worldPos.y);
          console.log('🗺️ マップを再生成しました');
        }
      }
    });
    
    // Dキー: 近くのエンティティ情報出力
    scene.input.keyboard.on('keydown-D', () => {
      if (scene.player) {
        this.dumpNearbyEntities(scene);
      }
    });
    
    // Fキー: FPS制限の切り替え（開発用）
    scene.input.keyboard.on('keydown-F', () => {
      const fps = scene.game.loop.targetFps;
      if (fps === 60) {
        scene.game.loop.targetFps = 30;
        console.log('⏱️ FPS制限: 30fps');
      } else {
        scene.game.loop.targetFps = 60;
        console.log('⏱️ FPS制限: 60fps');
      }
    });
    
    // Oキー: プレイヤーの無敵モード切り替え
    scene.input.keyboard.on('keydown-O', () => {
      if (scene.player) {
        scene.player.isInvincible = !scene.player.isInvincible;
        console.log(`🛡️ 無敵モード: ${scene.player.isInvincible ? 'ON' : 'OFF'}`);
      }
    });
  }
  
  /**
   * デバッグ情報の更新
   * @param {Phaser.Scene} scene - シーン
   * @param {number} time - 経過時間
   * @param {number} delta - 前フレームからの経過時間
   */
  updateDebugInfo(scene, time, delta) {
    // プレイヤーの位置情報
    if (scene.player && this.debugElements.position) {
      const playerX = Math.floor(scene.player.x);
      const playerY = Math.floor(scene.player.y);
      
      let tilePos = { x: 0, y: 0 };
      if (scene.topDownMap && scene.topDownMap.worldToTileXY) {
        tilePos = scene.topDownMap.worldToTileXY(scene.player.x, scene.player.y);
      }
      
      this.debugElements.position.setText(
        `位置: (${playerX}, ${playerY}) | タイル: (${tilePos.x}, ${tilePos.y})`
      );
    }
    
    // FPS
    if (this.debugElements.fps) {
      const fps = Math.round(1000 / delta);
      this.debugElements.fps.setText(`FPS: ${fps}`);
    }
    
    // マップ情報
    if (scene.topDownMap && this.debugElements.mapInfo) {
      const mapInfo = {
        type: scene.currentMapType || 'unknown',
        width: scene.topDownMap.width || 0,
        height: scene.topDownMap.height || 0,
        entities: (scene.enemies?.length || 0) + (scene.npcs?.length || 0) + (scene.items?.length || 0)
      };
      
      this.debugElements.mapInfo.setText(
        `マップ: ${mapInfo.type} (${mapInfo.width}x${mapInfo.height}) エンティティ: ${mapInfo.entities}`
      );
    }
  }
  
  /**
   * 近くのエンティティ情報をコンソールに出力
   * @param {Phaser.Scene} scene - シーン
   */
  dumpNearbyEntities(scene) {
    const player = scene.player;
    if (!player) return;
    
    const entities = [];
    const range = 5 * 32; // 5タイル分の検知範囲
    
    // 敵の検知
    if (scene.enemies) {
      scene.enemies.forEach(enemy => {
        const distance = Phaser.Math.Distance.Between(
          player.x, player.y, enemy.x, enemy.y
        );
        if (distance < range) {
          entities.push({
            type: 'enemy',
            subtype: enemy.type || '不明',
            health: `${Math.floor(enemy.life || 0)}/${Math.floor(enemy.maxLife || 0)}`,
            position: `(${Math.floor(enemy.x)}, ${Math.floor(enemy.y)})`,
            distance: Math.floor(distance)
          });
        }
      });
    }
    
    // NPCの検知
    if (scene.npcs) {
      scene.npcs.forEach(npc => {
        const distance = Phaser.Math.Distance.Between(
          player.x, player.y, npc.x, npc.y
        );
        if (distance < range) {
          entities.push({
            type: 'npc',
            subtype: npc.type || '不明',
            isShop: npc.isShop ? 'Yes' : 'No',
            position: `(${Math.floor(npc.x)}, ${Math.floor(npc.y)})`,
            distance: Math.floor(distance)
          });
        }
      });
    }
    
    // アイテムの検知
    if (scene.items) {
      scene.items.forEach(item => {
        const distance = Phaser.Math.Distance.Between(
          player.x, player.y, item.x, item.y
        );
        if (distance < range) {
          entities.push({
            type: 'item',
            subtype: item.type || '不明',
            position: `(${Math.floor(item.x)}, ${Math.floor(item.y)})`,
            distance: Math.floor(distance)
          });
        }
      });
    }
    
    // 検出結果を表示
    if (entities.length > 0) {
      console.table(entities);
      console.log(`🔍 プレイヤー周辺の${entities.length}個のエンティティを検出しました`);
    } else {
      console.log('🔍 プレイヤー周辺にエンティティは見つかりませんでした');
    }
  }
  
  /**
   * プレイヤーのダミーステータスデータを生成
   * @param {string} classType - プレイヤークラス ('warrior', 'rogue', 'sorcerer')
   * @param {number} level - レベル
   * @param {string} name - 名前
   * @returns {Object} プレイヤーのダミーステータス
   */
  generatePlayerStats(classType = 'warrior', level = 1, name = 'プレイヤー') {
    // クラスごとの基本ステータス
    const baseStats = {
      warrior: { strength: 10, dexterity: 6, intelligence: 4, vitality: 8 },
      rogue: { strength: 6, dexterity: 10, intelligence: 6, vitality: 6 },
      sorcerer: { strength: 4, dexterity: 6, intelligence: 10, vitality: 4 }
    };
    
    // 選択されたクラスのステータス取得（存在しない場合はwarrior）
    const stats = baseStats[classType] || baseStats.warrior;
    
    // レベルに応じたステータス補正
    const levelMultiplier = 1 + (level - 1) * 0.2;
    const scaledStats = {
      strength: Math.floor(stats.strength * levelMultiplier),
      dexterity: Math.floor(stats.dexterity * levelMultiplier),
      intelligence: Math.floor(stats.intelligence * levelMultiplier),
      vitality: Math.floor(stats.vitality * levelMultiplier)
    };
    
    // 経験値計算
    const expToNextLevel = 100 * Math.pow(1.5, level - 1);
    
    // 実レベルの計算
    const actualLevel = level > 10 ? level : Math.max(1, Math.floor(level));
    
    // キャラクター設定
    return {
      name: name,
      classType: classType,
      level: actualLevel,
      exp: 0,
      expToNextLevel: Math.floor(expToNextLevel),
      gold: 100 * actualLevel,
      
      // 基本ステータス
      strength: scaledStats.strength,
      dexterity: scaledStats.dexterity,
      intelligence: scaledStats.intelligence,
      vitality: scaledStats.vitality,
      
      // 派生ステータス
      maxLife: scaledStats.vitality * 10,
      life: scaledStats.vitality * 10,
      maxMana: scaledStats.intelligence * 10,
      mana: scaledStats.intelligence * 10,
      attackPower: scaledStats.strength * 2,
      defencePower: scaledStats.vitality + Math.floor(scaledStats.strength / 2),
      criticalRate: scaledStats.dexterity * 0.5,
      
      // 装備枠
      equipment: {
        helm: null,
        armour: null,
        glove: null,
        belt: null,
        ring1: null,
        ring2: null,
        weapon: null,
        shield: null,
        amulet: null
      },
      
      // アイテム
      inventory: [],
      potions: {
        health: 5,
        mana: 5
      },
      
      // スキルポイント
      skillPoints: actualLevel - 1,
      
      // ステータス異常
      buffs: [],
      debuffs: []
    };
  }
  
  /**
   * 敵のダミーステータスデータを生成
   * @param {string} type - 敵タイプ
   * @param {number} level - レベル
   * @returns {Object} 敵のダミーステータス
   */
  generateEnemyStats(type = 'skeleton', level = 1) {
    // 敵タイプごとの基本ステータス
    const baseStats = {
      skeleton: { 
        strength: 5, 
        dexterity: 3, 
        intelligence: 1, 
        vitality: 4, 
        experienceValue: 10,
        attackRange: 100
      },
      zombie: { 
        strength: 7, 
        dexterity: 2, 
        intelligence: 1, 
        vitality: 6, 
        experienceValue: 15,
        attackRange: 80
      },
      ghost: { 
        strength: 3, 
        dexterity: 5, 
        intelligence: 7, 
        vitality: 3, 
        experienceValue: 20,
        attackRange: 150
      },
      spider: { 
        strength: 4, 
        dexterity: 8, 
        intelligence: 2, 
        vitality: 3, 
        experienceValue: 12,
        attackRange: 90
      },
      slime: { 
        strength: 4, 
        dexterity: 4, 
        intelligence: 2, 
        vitality: 5, 
        experienceValue: 8,
        attackRange: 70
      },
      wolf: { 
        strength: 6, 
        dexterity: 7, 
        intelligence: 2, 
        vitality: 4, 
        experienceValue: 18,
        attackRange: 120
      },
      boss: { 
        strength: 12, 
        dexterity: 8, 
        intelligence: 8, 
        vitality: 15, 
        experienceValue: 100,
        attackRange: 200
      }
    };
    
    // 選択された敵タイプのステータス取得
    const stats = baseStats[type] || baseStats.skeleton;
    
    // レベルに応じたステータス補正
    const levelMultiplier = 1 + (level - 1) * 0.5;
    
    // ダミー敵ステータス
    return {
      type: type,
      level: level,
      maxLife: Math.floor(stats.vitality * 5 * levelMultiplier),
      life: Math.floor(stats.vitality * 5 * levelMultiplier),
      maxMana: Math.floor(stats.intelligence * 5 * levelMultiplier),
      mana: Math.floor(stats.intelligence * 5 * levelMultiplier),
      strength: Math.floor(stats.strength * levelMultiplier),
      dexterity: Math.floor(stats.dexterity * levelMultiplier),
      intelligence: Math.floor(stats.intelligence * levelMultiplier),
      vitality: Math.floor(stats.vitality * levelMultiplier),
      attackPower: Math.floor(stats.strength * 1.5 * levelMultiplier),
      defencePower: Math.floor((stats.vitality + stats.strength / 2) * levelMultiplier),
      experienceValue: Math.floor(stats.experienceValue * levelMultiplier),
      goldValue: Math.floor(stats.experienceValue * levelMultiplier * 1.5),
      attackRange: stats.attackRange,
      
      // 敵の行動AI設定
      ai: {
        aggroRange: Math.floor(200 + (stats.intelligence * 10)),
        attackRange: stats.attackRange,
        movementSpeed: 50 + Math.floor(stats.dexterity * 2),
        attackDelay: 1000 - Math.floor(stats.dexterity * 50),
        fleeHealthPercentage: type === 'boss' ? 0 : 20
      }
    };
  }
  
  /**
   * NPCのダミーデータを生成
   * @param {string} type - NPCタイプ
   * @param {boolean} isShop - ショップかどうか
   * @returns {Object} NPCのダミーデータ
   */
  generateNPCData(type = 'villager', isShop = false) {
    // NPCタイプごとの基本設定
    const npcTemplates = {
      villager: {
        name: '村人',
        dialogues: [
          'こんにちは、冒険者さん。今日はいい天気ですね。',
          'この辺りは最近、モンスターが増えてきて危険になってきました。',
          'あなたのような冒険者が来てくれて助かります。'
        ],
        shopType: 'general'
      },
      guard: {
        name: '衛兵',
        dialogues: [
          '通行証を見せてもらおうか。...ああ、冒険者ギルドの者か。通っていいぞ。',
          '最近この辺りでモンスターの出没が増えている。気をつけるんだな。',
          '町の治安は我々が守る。安心して滞在してくれ。'
        ],
        shopType: 'weapon'
      },
      blacksmith: {
        name: '鍛冶屋',
        dialogues: [
          'いらっしゃい。良い武具をお求めかな？',
          '私の作る装備は町一番の品質だ。自信を持っておすすめする。',
          '材料があれば特別な装備も作れるんだが...'
        ],
        shopType: 'weapon'
      },
      merchant: {
        name: '商人',
        dialogues: [
          'いらっしゃいませ！何かお探しですか？',
          '珍しい品も取り揃えておりますよ。ごゆっくりどうぞ。',
          '最近の流行りはこの辺の商品ですね。'
        ],
        shopType: 'general'
      },
      alchemist: {
        name: '錬金術師',
        dialogues: [
          'ふむ、ポーションが必要かね？',
          '良質な素材があれば、もっと効果の高いものも作れるのだが...',
          '私の作るポーションは効果が違うぞ。一度試してみるといい。'
        ],
        shopType: 'potion'
      }
    };
    
    // 選択されたNPCタイプの設定
    const template = npcTemplates[type] || npcTemplates.villager;
    
    // ショップ設定
    const shopData = isShop ? {
      isShop: true,
      shopType: template.shopType,
      items: this.generateShopItems(template.shopType, 10)
    } : {
      isShop: false,
      shopType: '',
      items: []
    };
    
    // NPCの基本データとショップデータを結合
    return {
      type: type,
      name: template.name,
      dialogues: template.dialogues,
      ...shopData
    };
  }
  
  /**
   * ショップアイテムのダミーデータを生成
   * @param {string} shopType - ショップタイプ
   * @param {number} count - 生成するアイテム数
   * @returns {Array} ショップアイテムの配列
   */
  generateShopItems(shopType = 'general', count = 10) {
    const items = [];
    
    // ショップタイプに応じたアイテム生成
    switch (shopType) {
      case 'weapon':
        // 武器屋のアイテム
        items.push(
          { id: 'sword_1', name: 'ショートソード', type: 'equipment', equipType: 'oneHandMeleeWeapon', rarity: 'common', level: 1, price: 100, basicPerformance: { attackPower: 5 } },
          { id: 'axe_1', name: 'ハンドアックス', type: 'equipment', equipType: 'oneHandMeleeWeapon', rarity: 'common', level: 1, price: 120, basicPerformance: { attackPower: 6 } },
          { id: 'dagger_1', name: 'ダガー', type: 'equipment', equipType: 'oneHandMeleeWeapon', rarity: 'common', level: 1, price: 80, basicPerformance: { attackPower: 3, criticalRate: 5 } },
          { id: 'bow_1', name: 'ショートボウ', type: 'equipment', equipType: 'oneHandLongRangeWeapon', rarity: 'common', level: 1, price: 150, basicPerformance: { attackPower: 4, range: 200 } },
          { id: 'staff_1', name: '木の杖', type: 'equipment', equipType: 'twoHandLongRangeWeapon', rarity: 'common', level: 1, price: 120, basicPerformance: { attackPower: 3, magicPower: 5 } },
          { id: 'shield_1', name: '木の盾', type: 'equipment', equipType: 'shield', rarity: 'common', level: 1, price: 90, basicPerformance: { defencePower: 4 } },
          { id: 'helm_1', name: 'レザーキャップ', type: 'equipment', equipType: 'helm', rarity: 'common', level: 1, price: 70, basicPerformance: { defencePower: 2 } },
          { id: 'armour_1', name: 'レザーアーマー', type: 'equipment', equipType: 'armour', rarity: 'common', level: 1, price: 120, basicPerformance: { defencePower: 5 } },
          { id: 'glove_1', name: 'レザーグローブ', type: 'equipment', equipType: 'glove', rarity: 'common', level: 1, price: 60, basicPerformance: { defencePower: 1 } },
          { id: 'boots_1', name: 'レザーブーツ', type: 'equipment', equipType: 'boots', rarity: 'common', level: 1, price: 60, basicPerformance: { defencePower: 1, movementSpeed: 5 } }
        );
        break;
      
      case 'armor':
        // 防具屋のアイテム
        items.push(
          { id: 'helm_2', name: 'アイアンヘルム', type: 'equipment', equipType: 'helm', rarity: 'uncommon', level: 2, price: 150, basicPerformance: { defencePower: 4 } },
          { id: 'armour_2', name: 'アイアンアーマー', type: 'equipment', equipType: 'armour', rarity: 'uncommon', level: 2, price: 250, basicPerformance: { defencePower: 10 } },
          { id: 'glove_2', name: 'アイアングローブ', type: 'equipment', equipType: 'glove', rarity: 'uncommon', level: 2, price: 120, basicPerformance: { defencePower: 3 } },
          { id: 'boots_2', name: 'アイアンブーツ', type: 'equipment', equipType: 'boots', rarity: 'uncommon', level: 2, price: 120, basicPerformance: { defencePower: 3 } },
          { id: 'belt_1', name: 'レザーベルト', type: 'equipment', equipType: 'belt', rarity: 'common', level: 1, price: 80, basicPerformance: { defencePower: 1, itemSlots: 2 } },
          { id: 'ring_1', name: '銅の指輪', type: 'equipment', equipType: 'ring', rarity: 'common', level: 1, price: 100, basicPerformance: { magicResistance: 2 } },
          { id: 'amulet_1', name: '守りのお守り', type: 'equipment', equipType: 'amulet', rarity: 'uncommon', level: 1, price: 180, basicPerformance: { defencePower: 2, healthRegen: 1 } },
          { id: 'shield_2', name: 'アイアンシールド', type: 'equipment', equipType: 'shield', rarity: 'uncommon', level: 2, price: 180, basicPerformance: { defencePower: 8 } }
        );
        break;
      
      case 'potion':
        // 薬屋のアイテム
        items.push(
          { id: 'health_potion_small', name: '小さな回復ポーション', type: 'potion', potionType: 'health', effectValue: 30, price: 20 },
          { id: 'health_potion_medium', name: '回復ポーション', type: 'potion', potionType: 'health', effectValue: 80, price: 50 },
          { id: 'health_potion_large', name: '大きな回復ポーション', type: 'potion', potionType: 'health', effectValue: 150, price: 100 },
          { id: 'mana_potion_small', name: '小さなマナポーション', type: 'potion', potionType: 'mana', effectValue: 30, price: 25 },
          { id: 'mana_potion_medium', name: 'マナポーション', type: 'potion', potionType: 'mana', effectValue: 80, price: 60 },
          { id: 'mana_potion_large', name: '大きなマナポーション', type: 'potion', potionType: 'mana', effectValue: 150, price: 120 },
          { id: 'rejuvenation_potion', name: 'リジュベネーションポーション', type: 'potion', potionType: 'rejuvenation', effectValue: 50, price: 80 },
          { id: 'antidote', name: '解毒薬', type: 'potion', potionType: 'antidote', effectValue: 1, price: 40 },
          { id: 'strength_potion', name: '力のポーション', type: 'potion', potionType: 'strength', effectValue: 5, duration: 60000, price: 100 },
          { id: 'speed_potion', name: '素早さのポーション', type: 'potion', potionType: 'speed', effectValue: 20, duration: 60000, price: 100 }
        );
        break;
      
      case 'general':
      default:
        // 一般店のアイテム（ポーションと基本装備のミックス）
        items.push(
          { id: 'health_potion_small', name: '小さな回復ポーション', type: 'potion', potionType: 'health', effectValue: 30, price: 20 },
          { id: 'mana_potion_small', name: '小さなマナポーション', type: 'potion', potionType: 'mana', effectValue: 30, price: 25 },
          { id: 'sword_1', name: 'ショートソード', type: 'equipment', equipType: 'oneHandMeleeWeapon', rarity: 'common', level: 1, price: 100, basicPerformance: { attackPower: 5 } },
          { id: 'dagger_1', name: 'ダガー', type: 'equipment', equipType: 'oneHandMeleeWeapon', rarity: 'common', level: 1, price: 80, basicPerformance: { attackPower: 3, criticalRate: 5 } },
          { id: 'helm_1', name: 'レザーキャップ', type: 'equipment', equipType: 'helm', rarity: 'common', level: 1, price: 70, basicPerformance: { defencePower: 2 } },
          { id: 'armour_1', name: 'レザーアーマー', type: 'equipment', equipType: 'armour', rarity: 'common', level: 1, price: 120, basicPerformance: { defencePower: 5 } },
          { id: 'antidote', name: '解毒薬', type: 'potion', potionType: 'antidote', effectValue: 1, price: 40 },
          { id: 'torch', name: 'トーチ', type: 'item', itemType: 'consumable', effectValue: 1, price: 15 },
          { id: 'bandage', name: '包帯', type: 'item', itemType: 'consumable', effectValue: 10, price: 10 },
          { id: 'rope', name: 'ロープ', type: 'item', itemType: 'tool', price: 25 }
        );
        break;
    }
    
    // 指定数に調整
    return items.slice(0, count);
  }
  
  /**
   * ダンジョンマップのダミーデータを生成
   * @param {number} width - マップの幅
   * @param {number} height - マップの高さ
   * @param {string} type - マップタイプ ('dungeon', 'field', 'town', 'arena')
   * @returns {Object} ダンジョンマップのダミーデータ
   */
  generateMapData(width = 40, height = 40, type = 'dungeon') {
    const mapData = {
      width: width,
      height: height,
      type: type,
      heightMap: [],
      objectPlacement: [],
      enemyPlacement: [],
      npcPlacement: []
    };
    
    // マップタイプごとの設定
    const mapSettings = {
      dungeon: {
        wallDensity: 0.15,
        waterDensity: 0.05,
        itemDensity: 0.01,
        enemyDensity: 0.03,
        npcDensity: 0.005,
        heightScale: { min: 0.3, max: 0.8 }
      },
      field: {
        wallDensity: 0.08,
        waterDensity: 0.1,
        itemDensity: 0.01,
        enemyDensity: 0.025,
        npcDensity: 0.01,
        heightScale: { min: 0.2, max: 0.9 }
      },
      town: {
        wallDensity: 0.2,
        waterDensity: 0.03,
        itemDensity: 0.005,
        enemyDensity: 0.0,
        npcDensity: 0.03,
        heightScale: { min: 0.4, max: 0.6 }
      },
      arena: {
        wallDensity: 0.08,
        waterDensity: 0.0,
        itemDensity: 0.0,
        enemyDensity: 0.04,
        npcDensity: 0.0,
        heightScale: { min: 0.3, max: 0.7 }
      }
    };
    
    const settings = mapSettings[type] || mapSettings.dungeon;
    
    // 高さマップの生成（単純なノイズベース）
    for (let y = 0; y < height; y++) {
      mapData.heightMap[y] = [];
      mapData.objectPlacement[y] = [];
      
      for (let x = 0; x < width; x++) {
        // マップ端は水に
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
          mapData.heightMap[y][x] = 0.2; // 水
          mapData.objectPlacement[y][x] = 0; // 何も置かない
        } else {
          // 単純なノイズ生成
          const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 + 0.5;
          const height = settings.heightScale.min + noise * (settings.heightScale.max - settings.heightScale.min);
          mapData.heightMap[y][x] = height;
          
          // オブジェクト配置
          if (Math.random() < settings.wallDensity) {
            mapData.objectPlacement[y][x] = 3; // 壁
          } else if (height < 0.3 && Math.random() < settings.waterDensity) {
            mapData.objectPlacement[y][x] = 0; // 水
          } else if (Math.random() < settings.itemDensity) {
            mapData.objectPlacement[y][x] = 2; // アイテム/宝箱
          } else {
            mapData.objectPlacement[y][x] = 1; // 通常の床
          }
        }
      }
    }
    
    // 敵の配置
    const enemyCount = Math.floor(width * height * settings.enemyDensity);
    for (let i = 0; i < enemyCount; i++) {
      // 配置する場所をランダムに探す
      let x, y, attempts = 0;
      do {
        x = Math.floor(Math.random() * (width - 4)) + 2;
        y = Math.floor(Math.random() * (height - 4)) + 2;
        attempts++;
      } while (mapData.objectPlacement[y][x] !== 1 && attempts < 50); // 床の上にのみ配置
      
      if (attempts < 50) {
        // 敵タイプをランダムに選択
        const enemyTypes = ['skeleton', 'zombie', 'ghost', 'spider', 'slime', 'wolf'];
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        // 敵をマップに追加
        mapData.enemyPlacement.push({
          x: x,
          y: y,
          type: enemyType,
          level: Math.floor(Math.random() * 3) + 1 // レベル1-3
        });
      }
    }
    
    // ボス敵の配置（arenaのみ）
    if (type === 'arena') {
      mapData.enemyPlacement.push({
        x: Math.floor(width / 2),
        y: Math.floor(height / 2),
        type: 'boss',
        level: Math.floor(Math.random() * 3) + 3 // レベル3-5
      });
    }
    
    // NPCの配置
    const npcCount = Math.floor(width * height * settings.npcDensity);
    for (let i = 0; i < npcCount; i++) {
      // 配置する場所をランダムに探す
      let x, y, attempts = 0;
      do {
        x = Math.floor(Math.random() * (width - 4)) + 2;
        y = Math.floor(Math.random() * (height - 4)) + 2;
        attempts++;
      } while (mapData.objectPlacement[y][x] !== 1 && attempts < 50); // 床の上にのみ配置
      
      if (attempts < 50) {
        // NPCタイプをランダムに選択
        const npcTypes = ['villager', 'guard', 'blacksmith', 'merchant', 'alchemist'];
        const npcType = npcTypes[Math.floor(Math.random() * npcTypes.length)];
        
        // townではショップNPCを多めに
        const isShop = type === 'town' ? Math.random() < 0.7 : Math.random() < 0.3;
        const shopType = isShop ? ['weapon', 'armor', 'potion', 'general'][Math.floor(Math.random() * 4)] : '';
        
        // NPCをマップに追加
        mapData.npcPlacement.push({
          x: x,
          y: y,
          type: npcType,
          isShop: isShop,
          shopType: shopType,
          dialogues: []
        });
      }
    }
    
    return mapData;
  }

  /**
  * デバッグヘルプ画面の表示
  * @param {Phaser.Scene} scene - Phaserシーン
  */
  showDebugHelp(scene) {
    if (!this.isEnabled) return;
    
    // 既存のヘルプ画面があれば削除
    if (this.helpPanel) {
      this.helpPanel.destroy();
      this.helpPanel = null;
      return;
    }
    
    // ヘルプパネルの作成
    this.helpPanel = scene.add.container(0, 0);
    this.helpPanel.setDepth(9999);
    
    // 背景
    const bg = scene.add.rectangle(
      scene.cameras.main.width / 2,
      scene.cameras.main.height / 2,
      scene.cameras.main.width - 100,
      scene.cameras.main.height - 100,
      0x000000,
      0.9
    );
    
    // タイトル
    const title = scene.add.text(
      scene.cameras.main.width / 2,
      50,
      'デバッグモードヘルプ',
      { font: '24px Arial', fill: '#ffffff' }
    ).setOrigin(0.5);
    
    // キー一覧
    const keyHelp = [
      { key: 'ESC', desc: 'メニュー表示' },
      { key: 'H', desc: '体力・マナ全回復' },
      { key: 'G', desc: 'ゴールド追加 (+100)' },
      { key: 'L', desc: 'レベルアップ' },
      { key: 'T', desc: 'ランダムな場所にテレポート' },
      { key: 'R', desc: 'マップ再生成' },
      { key: 'D', desc: '周辺エンティティ情報表示' },
      { key: 'N', desc: 'デバッグNPC追加' },
      { key: 'B', desc: 'デバッグボス追加' },
      { key: 'F', desc: 'FPS制限切替' },
      { key: 'O', desc: '無敵モード切替' },
      { key: 'F1', desc: 'このヘルプを表示/非表示' }
    ];
    
    // キー一覧のテキスト作成
    const keyTexts = [];
    keyHelp.forEach((item, index) => {
      const y = 100 + index * 30;
      
      // キー名
      const keyText = scene.add.text(
        scene.cameras.main.width / 2 - 150,
        y,
        `[${item.key}]`,
        { font: '18px Arial', fill: '#ffff00' }
      );
      
      // 説明
      const descText = scene.add.text(
        scene.cameras.main.width / 2 - 70,
        y,
        item.desc,
        { font: '18px Arial', fill: '#ffffff' }
      );
      
      keyTexts.push(keyText, descText);
    });
    
    // 閉じるボタン
    const closeButton = scene.add.text(
      scene.cameras.main.width / 2,
      scene.cameras.main.height - 50,
      '閉じる (F1)',
      { font: '18px Arial', fill: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
    ).setOrigin(0.5);
    
    closeButton.setInteractive();
    closeButton.on('pointerdown', () => {
      this.helpPanel.destroy();
      this.helpPanel = null;
    });
    
    // コンテナに追加
    this.helpPanel.add([bg, title, closeButton, ...keyTexts]);
  }
  
  // シングルトンインスタンスを取得
  static getInstance() {
    if (!this.instance) {
      this.instance = new DebugUtils();
    }
    return this.instance;
  }
}

// デフォルトエクスポートとしてシングルトンインスタンスをエクスポート
export default DebugUtils.getInstance();

// 個別の関数としてもエクスポート
export const generatePlayerStats = DebugUtils.getInstance().generatePlayerStats;
export const generateEnemyStats = DebugUtils.getInstance().generateEnemyStats;
export const generateNPCData = DebugUtils.getInstance().generateNPCData;
export const generateShopItems = DebugUtils.getInstance().generateShopItems;
export const generateMapData = DebugUtils.getInstance().generateMapData;
export const initDebugMode = DebugUtils.getInstance().initDebugMode.bind(DebugUtils.getInstance());