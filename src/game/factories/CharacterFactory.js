import Player from '../characters/Player';
import Enemy from '../characters/Enemy';
import Companion from '../characters/Companion';
import NPC from '../characters/NPC';
import { CharacterClassType } from '../../constants/characterTypes';
import AssetManager from '../core/AssetManager';

export default class CharacterFactory {
  constructor(scene) {
    this.scene = scene;
    
    // AssetManagerの初期化確認
    if (!AssetManager.initialized) {
      AssetManager.initialize(scene);
    }
  }
  
  // プレイヤー作成
  createPlayer(config = {}) {
    // プレイヤーの位置
    const x = config.x !== undefined ? config.x : (this.scene.cameras.main.width / 2);
    const y = config.y !== undefined ? config.y : (this.scene.cameras.main.height / 2);
    
    // プレイヤーのクラスタイプ
    const classType = config.classType || CharacterClassType.warrior;
    
    // プレイヤーの追加設定 - トップダウン用のパラメータを追加
    const playerConfig = {
      // 既存の設定
      name: config.name || 'プレイヤー',
      classType: classType,
      level: config.level || 1,
      // ステータス
      strength: config.strength || this.getClassBaseStats(classType).strength,
      dexterity: config.dexterity || this.getClassBaseStats(classType).dexterity,
      vitality: config.vitality || this.getClassBaseStats(classType).vitality,
      energy: config.energy || this.getClassBaseStats(classType).energy,
      
      // トップダウン用の追加設定
      direction: config.direction || 'down', // 初期方向
      moveSpeed: config.moveSpeed || 150,   // 移動速度
      isTopDown: true,                      // トップダウンモードフラグ
      
      // 残りの設定
      maxPotion: config.maxPotion || 10,
      potionCount: config.potionCount || 5,
      experience: config.experience || 0,
      gold: config.gold || 0,
      skillPoints: config.skillPoints || 0
    };
    
    // AssetManagerを介してキャラクターアニメーションを生成
    const characterType = 'player';
    const subtype = AssetManager.getClassTextureName(classType);
    
    // アニメーションとスプライトシートの生成
    const animations = AssetManager.createCharacterAnimations({
      type: characterType,
      subtype: subtype,
      actions: ['idle', 'walk', 'attack', 'hurt', 'death'],
      directions: ['down', 'left', 'right', 'up']
    });
    
    // テクスチャキーの設定（アニメーションに基づいて）
    const texture = animations && animations.spritesheets ? 
                    animations.spritesheets['idle_down'] : 
                    AssetManager.getTextureKey('player', subtype);
    
    // プレイヤーの作成
    const player = new Player(this.scene, x, y, texture, playerConfig);
    
    // キャラクター情報を設定
    player.setCharacterType(characterType, subtype);
    player.setAnimationState('idle', 'down');
    
    // トップダウン対応の移動コントロールをセットアップ
    this.setupTopDownControls(player);
    
    // 初期装備の設定
    if (config.initialEquipment) {
      this.setupInitialEquipment(player, config.initialEquipment);
    } else {
      this.setupClassDefaultEquipment(player, classType);
    }
    
    return player;
  }

  // 敵作成
  createEnemy(config = {}) {
    // 敵の位置
    const x = config.x !== undefined ? config.x : (this.scene.cameras.main.width / 2);
    const y = config.y !== undefined ? config.y : (this.scene.cameras.main.height / 2);
    
    // 敵のタイプとレベル
    const enemyType = config.enemyType || this.getRandomEnemyType(config.difficulty);
    const level = config.level || 1;
    
    // 敵の設定
    const enemyConfig = {
      // 基本情報
      name: config.name || this.generateEnemyName(enemyType),
      level: level,
      enemyType: config.isBoss ? 'boss' : (config.isElite ? 'elite' : 'normal'),
      
      // トップダウン用の設定
      direction: config.direction || 'down',
      moveSpeed: config.moveSpeed || 100,
      isTopDown: true,
      
      // ステータス
      strength: config.strength || 10 + Math.floor(level * 0.8),
      dexterity: config.dexterity || 10 + Math.floor(level * 0.6),
      vitality: config.vitality || 10 + Math.floor(level),
      energy: config.energy || 10 + Math.floor(level * 0.4),
      
      // AI設定
      aggroRange: config.aggroRange || 200,
      leashRange: config.leashRange || 400,
      attackRange: config.attackRange || 1.5,
      aggressiveness: config.aggressiveness || 0.7,
      intelligence: config.intelligence || 0.5,
      
      // 難易度
      difficulty: config.difficulty || 'normal'
    };
    
    // AssetManagerを介してキャラクターアニメーションを生成
    const characterType = 'enemy';
    const subtype = enemyType;
    
    // アニメーションとスプライトシートの生成
    const animations = AssetManager.createCharacterAnimations({
      type: characterType,
      subtype: subtype,
      actions: ['idle', 'walk', 'attack', 'hurt', 'death'],
      directions: ['down', 'left', 'right', 'up']
    });
    
    // テクスチャキーの設定（アニメーションに基づいて）
    const texture = animations && animations.spritesheets ? 
                    animations.spritesheets['idle_down'] : 
                    AssetManager.getTextureKey('enemy', subtype);
    
    // 敵の作成
    const enemy = new Enemy(this.scene, x, y, texture, enemyConfig);
    
    // キャラクター情報を設定
    enemy.setCharacterType(characterType, subtype);
    enemy.setAnimationState('idle', 'down');
    
    // ドロップアイテムの設定
    this.setupEnemyDrops(enemy, enemyConfig);
    
    return enemy;
  }

  // コンパニオン作成
  createCompanion(config = {}) {
    // コンパニオンの位置
    const x = config.x !== undefined ? config.x : (this.scene.cameras.main.width / 2);
    const y = config.y !== undefined ? config.y : (this.scene.cameras.main.height / 2);
    
    // コンパニオンのクラスタイプ
    const classType = config.classType || CharacterClassType.rogue;
    
    // プレイヤーのレベルに基づくレベル設定
    const playerLevel = this.scene.player ? this.scene.player.level : 1;
    const level = config.level || Math.max(1, playerLevel - 1);
    
    // コンパニオンの設定
    const companionConfig = {
      name: config.name || this.generateCompanionName(classType),
      classType: classType,
      level: level,
      // ステータス
      strength: config.strength || this.getClassBaseStats(classType).strength,
      dexterity: config.dexterity || this.getClassBaseStats(classType).dexterity,
      vitality: config.vitality || this.getClassBaseStats(classType).vitality,
      energy: config.energy || this.getClassBaseStats(classType).energy,
      // コンパニオン固有
      tacticsMode: config.tacticsMode || 'balanced',
      duration: config.duration || 0, // 0は永続
      
      // 方向
      direction: config.direction || 'down'
    };
    
    // AssetManagerを介してキャラクターアニメーションを生成
    const characterType = 'companion';
    const subtype = AssetManager.getClassTextureName(classType);
    
    // アニメーションとスプライトシートの生成
    const animations = AssetManager.createCharacterAnimations({
      type: characterType,
      subtype: subtype,
      actions: ['idle', 'walk', 'attack', 'hurt', 'death'],
      directions: ['down', 'left', 'right', 'up']
    });
    
    // テクスチャキーの設定（アニメーションに基づいて）
    const texture = animations && animations.spritesheets ? 
                    animations.spritesheets['idle_down'] : 
                    AssetManager.getTextureKey('companion', subtype);
    
    // コンパニオンの作成
    const companion = new Companion(this.scene, x, y, texture, companionConfig);
    
    // キャラクター情報を設定
    companion.setCharacterType(characterType, subtype);
    companion.setAnimationState('idle', 'down');
    
    // 装備の設定
    this.setupClassDefaultEquipment(companion, classType);
    
    return companion;
  }
  
  /**
   * NPCを作成するメソッド
   * @param {object} config - NPC設定
   * @returns {NPC} 生成されたNPCインスタンス
   */
  createNPC(config) {
    // NPC設定のデフォルト値
    const npcConfig = {
      scene: this.scene,
      x: config.x || 0,
      y: config.y || 0,
      isShop: config.isShop || false,
      type: config.type || 'villager',
      shopType: config.shopType || 'general',
      shopItems: config.shopItems || [],
      dialogues: config.dialogues || this.getDefaultDialogues(config.type, config.isShop),
      
      // トップダウン用の追加設定
      direction: config.direction || 'down',   // 初期方向
      isTopDown: true,                         // トップダウンモードフラグ
      interactionDistance: config.interactionDistance || 
        (this.scene.topDownMap ? this.scene.topDownMap.tileSize * 1.5 : 48) // 相互作用距離
    };

    // AssetManagerを介してキャラクターアニメーションを生成
    const characterType = 'npc';
    const subtype = npcConfig.type;
    
    // アニメーションとスプライトシートの生成
    const animations = AssetManager.createCharacterAnimations({
      type: characterType,
      subtype: subtype,
      actions: ['idle', 'walk'], // NPCは基本的にidleとwalkだけで十分
      directions: ['down', 'left', 'right', 'up']
    });
    
    // テクスチャキーの設定（アニメーションに基づいて）
    const texture = animations && animations.spritesheets ? 
                    animations.spritesheets['idle_down'] : 
                    AssetManager.getTextureKey('npc', subtype);
    
    // NPCインスタンス生成
    const npc = new NPC(this.scene, npcConfig.x, npcConfig.y, texture, npcConfig);
    
    // キャラクター情報を設定
    npc.setCharacterType(characterType, subtype);
    npc.setAnimationState('idle', 'down');

    // NPCタイプ別に追加設定
    switch (npc.type) {
      case 'blacksmith':
        npc.setShopType('weapon');
        if (!config.shopItems || config.shopItems.length === 0) {
          npc.setShopItems(this.generateWeaponShopItems());
        }
        break;
      case 'merchant':
        npc.setShopType('general');
        if (!config.shopItems || config.shopItems.length === 0) {
          npc.setShopItems(this.generateGeneralShopItems());
        }
        break;
      case 'alchemist':
        npc.setShopType('potion');
        if (!config.shopItems || config.shopItems.length === 0) {
          npc.setShopItems(this.generatePotionShopItems());
        }
        break;
      case 'jeweler':
        npc.setShopType('jewelry');
        if (!config.shopItems || config.shopItems.length === 0) {
          npc.setShopItems(this.generateJewelryShopItems());
        }
        break;
      case 'armorer':
        npc.setShopType('armor');
        if (!config.shopItems || config.shopItems.length === 0) {
          npc.setShopItems(this.generateArmorShopItems());
        }
        break;
      // 他のNPCタイプのケース
      default:
        // デフォルトは一般市民
        break;
    }

    return npc;
  }

  // トップダウン用コントロールのセットアップ
  setupTopDownControls(player) {
    if (!player || !this.scene.input || !this.scene.input.keyboard) return;
    
    // カーソルキーのセットアップ
    const cursors = this.scene.input.keyboard.createCursorKeys();
    player.cursors = cursors;
    
    // WASDキーのセットアップ（オプション）
    player.keys = {
      up: this.scene.input.keyboard.addKey('W'),
      down: this.scene.input.keyboard.addKey('S'),
      left: this.scene.input.keyboard.addKey('A'),
      right: this.scene.input.keyboard.addKey('D')
    };
    
    // 移動ハンドラを追加（プレイヤークラス側で使用）
    player.handleTopDownMovement = (time, delta) => {
      // プレイヤーが行動不可状態の場合
      if (player.isStunned || player.isRooted || player.isDead || player.isPerformingAction) {
        return;
      }
      
      // 移動フラグと速度
      let isMoving = false;
      const speed = player.getMoveSpeed ? player.getMoveSpeed() : 150;
      const normalizedSpeed = speed * (delta / 1000);
      
      // 方向と速度をリセット
      let dx = 0;
      let dy = 0;
      
      // キー入力に基づいて方向を決定
      if (player.cursors.up.isDown || player.keys.up.isDown) {
        dy = -normalizedSpeed;
        player.direction = 'up';
        isMoving = true;
      } else if (player.cursors.down.isDown || player.keys.down.isDown) {
        dy = normalizedSpeed;
        player.direction = 'down';
        isMoving = true;
      }
      
      if (player.cursors.left.isDown || player.keys.left.isDown) {
        dx = -normalizedSpeed;
        player.direction = 'left';
        isMoving = true;
      } else if (player.cursors.right.isDown || player.keys.right.isDown) {
        dx = normalizedSpeed;
        player.direction = 'right';
        isMoving = true;
      }
      
      // 移動アニメーションの更新
      if (isMoving) {
        player.animationState = 'walk';
        
        // 移動先の座標
        const newX = player.x + dx;
        const newY = player.y + dy;
        
        // 移動先が歩行可能かチェック
        let canMove = true;
        
        if (this.scene.topDownMap) {
          const tilePos = this.scene.topDownMap.worldToTileXY(newX, newY);
          canMove = this.scene.topDownMap.isWalkableAt(tilePos.x, tilePos.y);
        }
        
        // 移動可能なら位置を更新
        if (canMove) {
          player.x = newX;
          player.y = newY;
        }
        
        // アニメーション更新
        player.playAnimation();
      } else {
        // 移動していない場合はアイドル状態
        if (player.animationState === 'walk') {
          player.animationState = 'idle';
          player.playAnimation();
        }
      }
    };
    
    // updateメソッドにハンドラを追加
    const originalUpdate = player.update || function(){};
    player.update = function(time, delta) {
      originalUpdate.call(this, time, delta);
      
      // トップダウン移動処理
      this.handleTopDownMovement(time, delta);
    };
  }
  
  // クラスのテクスチャ名を取得
  getClassTextureName(classType) {
    return AssetManager.getClassTextureName(classType);
  }
  
  // クラスの基本ステータスを取得
  getClassBaseStats(classType) {
    return AssetManager.getClassBaseStats(classType);
  }
  
  // 初期装備の設定
  setupInitialEquipment(character, equipment) {
    if (!character || !equipment) return;
    
    // 装備アイテムをそれぞれのスロットに設定
    for (const [slot, item] of Object.entries(equipment)) {
      if (item && character.characterEquipments) {
        character.characterEquipments[slot] = item;
      }
    }
    
    // ステータスの再計算
    character.recalculateStats();
  }
  
  // クラスごとのデフォルト装備設定
  setupClassDefaultEquipment(character, classType) {
    if (!character || !this.scene.itemFactory) return;
    
    const itemFactory = this.scene.itemFactory;
    const equipment = {};
    
    // クラスに応じたデフォルト装備を生成
    switch (classType) {
      case CharacterClassType.warrior:
        equipment.head = itemFactory.createEquipment({
          equipType: 'helm',
          rarity: 'common',
          level: character.level
        });
        equipment.body = itemFactory.createEquipment({
          equipType: 'armour',
          rarity: 'common',
          level: character.level
        });
        equipment.rightHand = itemFactory.createEquipment({
          equipType: 'oneHandMeleeWeapon',
          rarity: 'common',
          level: character.level
        });
        equipment.leftHand = itemFactory.createEquipment({
          equipType: 'shield',
          rarity: 'common',
          level: character.level
        });
        break;
      
      case CharacterClassType.rogue:
        equipment.head = itemFactory.createEquipment({
          equipType: 'helm',
          rarity: 'common',
          level: character.level
        });
        equipment.body = itemFactory.createEquipment({
          equipType: 'armour',
          rarity: 'common',
          level: character.level
        });
        equipment.rightHand = itemFactory.createEquipment({
          equipType: 'oneHandLongRangeWeapon',
          rarity: 'common',
          level: character.level
        });
        break;
      
      case CharacterClassType.mage:
        equipment.head = itemFactory.createEquipment({
          equipType: 'helm',
          rarity: 'common',
          level: character.level
        });
        equipment.body = itemFactory.createEquipment({
          equipType: 'armour',
          rarity: 'common',
          level: character.level
        });
        equipment.rightHand = itemFactory.createEquipment({
          equipType: 'twoHandLongRangeWeapon',
          rarity: 'common',
          level: character.level
        });
        equipment.amulet = itemFactory.createEquipment({
          equipType: 'amulet',
          rarity: 'common',
          level: character.level
        });
        break;
    }
    
    // 装備を設定
    this.setupInitialEquipment(character, equipment);
  }
  
  // 敵のドロップアイテム設定
  setupEnemyDrops(enemy, config) {
    if (!enemy) return;
    
    const dropItems = [];
    const totalDropRate = 1.0; // 合計ドロップ率
    let remainingRate = totalDropRate;
    
    // 通常の敵はアイテムをドロップしない確率がある
    if (config.enemyType === 'normal') {
      const noDropRate = 0.3; // 30%の確率で何もドロップしない
      dropItems.push({
        item: null,
        dropRate: noDropRate
      });
      remainingRate -= noDropRate;
    }
    
    // 装備品ドロップ
    const equipmentDropRate = config.enemyType === 'boss' ? 0.6 :
                             config.enemyType === 'elite' ? 0.3 : 0.1;
    
    if (equipmentDropRate > 0 && remainingRate > 0) {
      const actualRate = Math.min(equipmentDropRate, remainingRate);
      dropItems.push({
        itemType: 'equipment',
        level: config.level,
        dropRate: actualRate
      });
      remainingRate -= actualRate;
    }
    
    // ポーションドロップ
    const potionDropRate = config.enemyType === 'boss' ? 0.3 :
                          config.enemyType === 'elite' ? 0.2 : 0.1;
    
    if (potionDropRate > 0 && remainingRate > 0) {
      const actualRate = Math.min(potionDropRate, remainingRate);
      dropItems.push({
        itemType: 'potion',
        potionType: this.getRandomPotionType(),
        dropRate: actualRate
      });
      remainingRate -= actualRate;
    }
    
    // ゴールドドロップ（残りのドロップ率）
    if (remainingRate > 0) {
      const goldAmount = this.calculateGoldAmount(config);
      dropItems.push({
        itemType: 'gold',
        amount: goldAmount,
        dropRate: remainingRate
      });
    }
    
    // 敵にドロップアイテムをセット
    enemy.setDropItems(dropItems);
  }
  
  // ランダムなポーションタイプの取得
  getRandomPotionType() {
    const types = ['health', 'mana', 'rejuvenation', 'special'];
    const weights = [0.5, 0.3, 0.15, 0.05];
    
    // 重み付きランダム選択
    const rand = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulativeWeight += weights[i];
      if (rand < cumulativeWeight) {
        return types[i];
      }
    }
    
    return 'health'; // デフォルト
  }
  
  // ゴールド量の計算
  calculateGoldAmount(config) {
    const baseAmount = config.level * 5;
    
    // 敵タイプによる補正
    const typeMultiplier = config.enemyType === 'boss' ? 5 :
                          config.enemyType === 'elite' ? 2 : 1;
    
    // ランダム要素
    const randomMultiplier = 0.8 + (Math.random() * 0.4); // 0.8-1.2の範囲
    
    return Math.floor(baseAmount * typeMultiplier * randomMultiplier);
  }
  
  // ランダムな敵タイプの取得
  getRandomEnemyType(difficulty = 'normal') {
    const types = {
      normal: ['goblin', 'skeleton', 'zombie', 'rat', 'spider'],
      nightmare: ['demon', 'ghost', 'vampire', 'werewolf', 'golem'],
      hell: ['dragon', 'devil', 'lich', 'demon_lord', 'death_knight']
    };
    
    const availableTypes = types[difficulty] || types.normal;
    return availableTypes[Math.floor(Math.random() * availableTypes.length)];
  }
  
  // 敵の名前生成
  generateEnemyName(enemyType) {
    const prefixes = ['凶暴な', '巨大な', '狂気の', '恐ろしい', '腐敗した'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    
    const names = {
      goblin: 'ゴブリン',
      skeleton: 'スケルトン',
      zombie: 'ゾンビ',
      rat: 'ジャイアントラット',
      spider: 'スパイダー',
      demon: 'デーモン',
      ghost: 'ゴースト',
      vampire: 'ヴァンパイア',
      werewolf: 'ウェアウルフ',
      golem: 'ゴーレム',
      dragon: 'ドラゴン',
      devil: 'デビル',
      lich: 'リッチ',
      demon_lord: 'デーモンロード',
      death_knight: 'デスナイト'
    };
    
    return `${prefix}${names[enemyType] || '敵'}`;
  }
  
  // コンパニオン名の生成
  generateCompanionName(classType) {
    const names = {
      [CharacterClassType.warrior]: ['ロランド', 'ガウェイン', 'アーサー', 'ランスロット', 'ガッツ'],
      [CharacterClassType.rogue]: ['エズリア', 'セリア', 'ロビン', 'レイラ', 'ジャック'],
      [CharacterClassType.mage]: ['メルリン', 'ガンダルフ', 'アルカナ', 'リリス', 'エリオット']
    };
    
    const classNames = names[classType] || names[CharacterClassType.warrior];
    return classNames[Math.floor(Math.random() * classNames.length)];
  }
  
  /**
   * NPCタイプに基づくデフォルト会話を取得
   * @param {string} npcType - NPCタイプ
   * @param {boolean} isShop - ショップNPCかどうか
   * @returns {Array} 会話リスト
   */
  getDefaultDialogues(npcType, isShop) {
    // 共通の挨拶
    const greetings = [
      "こんにちは、冒険者さん。",
      "何かお手伝いできることはありますか？"
    ];

    // ショップNPC用会話
    if (isShop) {
      switch (npcType) {
        case 'blacksmith':
          return [
            ...greetings,
            "最高の武器を取り揃えていますよ。",
            "この武器は特別に鍛えたものです。強さは保証します。",
            "良い刃を手に入れるなら、今がチャンスですぞ。"
          ];
        case 'merchant':
          return [
            ...greetings,
            "いろんな商品を取り扱っています。ごゆっくりどうぞ。",
            "何か探しものはありますか？",
            "旅のお供に必要なものは何でも揃いますよ。"
          ];
        case 'alchemist':
          return [
            ...greetings,
            "私の薬は効き目抜群ですよ。",
            "危険な冒険には良い薬が必要です。",
            "この薬は特殊な素材から作られています。効果は保証しますよ。"
          ];
        case 'jeweler':
          return [
            ...greetings,
            "最高の宝飾品を取り揃えています。",
            "この宝石には不思議な力が宿っていますよ。",
            "良い宝飾品は単なる装飾品以上の価値があります。"
          ];
        case 'armorer':
          return [
            ...greetings,
            "丈夫な防具は命を守りますよ。",
            "この鎧は特殊な金属から作られています。防御力は折り紙付きです。",
            "良い防具なしで冒険に出るなんて無謀ですぞ。"
          ];
        default:
          return [
            ...greetings,
            "いらっしゃいませ。",
            "何かお探しですか？",
            "良い品を取り揃えています。"
          ];
      }
    }
    
    // 一般NPC用会話
    switch (npcType) {
      case 'villager':
        return [
          ...greetings,
          "この辺りは最近物騒ですね。",
          "東の森には近づかない方が良いですよ。怪物が出るという噂です。",
          "あなたのような冒険者が来てくれて心強いです。"
        ];
      case 'guard':
        return [
          ...greetings,
          "町の警備をしています。何か問題はありませんか？",
          "最近、周辺で魔物の目撃情報が増えています。気をつけてください。",
          "あなたも冒険者ですか？困ったことがあればいつでも声をかけてください。"
        ];
      case 'child':
        return [
          "こんにちは！",
          "冒険者さんですか？すごいです！",
          "大きくなったら私も冒険者になりたいです！",
          "お父さんが「森には行くな」って言うんです。なんでだろう？"
        ];
      case 'elder':
        return [
          ...greetings,
          "若い頃は私も冒険をしていたものじゃ。",
          "この地域には古くから伝わる伝説があるのじゃ。",
          "北の山に古代の遺跡があると言われているが、誰も戻ってこなかった…"
        ];
      case 'noble':
        return [
          "おや、冒険者ですか。",
          "この町の治安維持にご協力いただければ幸いです。",
          "私の家の宝物が盗まれてしまったのです。見つけてくれたら報酬を出しますよ。"
        ];
      case 'beggar':
        return [
          "恵んでもらえませんか…",
          "昔は私も立派な戦士だったんですが…",
          "東の洞窟に宝が眠っているという噂を聞いたことがありますよ…"
        ];
      case 'bard':
        return [
          ...greetings,
          "新しい冒険の歌のネタを探しているんです。",
          "あなたの冒険譚を聞かせてくれませんか？",
          "この地方に伝わる英雄の伝説を知っていますか？"
        ];
      default:
        return [
          ...greetings,
          "良い天気ですね。",
          "冒険者さんですか？がんばってくださいね。",
          "何かお困りですか？"
        ];
    }
  }

  /**
   * 武器ショップのアイテムを生成
   * @returns {Array} 武器アイテムリスト
   */
  generateWeaponShopItems() {
    // この部分はItemFactoryと連携して実装するとよい
    // 例として簡易的なアイテムリストを返す
    return [
      {
        id: 'weapon_sword_1',
        name: '鉄の剣',
        type: 'weapon',
        equipType: 'oneHandMeleeWeapon',
        price: 100,
        requiredLevel: 1,
        basicAttack: 10
      },
      {
        id: 'weapon_axe_1',
        name: '戦斧',
        type: 'weapon',
        equipType: 'oneHandMeleeWeapon',
        price: 150,
        requiredLevel: 3,
        basicAttack: 15
      },
      {
        id: 'weapon_bow_1',
        name: '猟弓',
        type: 'weapon',
        equipType: 'twoHandLongRangeWeapon',
        price: 200,
        requiredLevel: 5,
        basicAttack: 12
      }
      // 他の武器アイテム
    ];
  }

  /**
   * 一般ショップのアイテムを生成
   * @returns {Array} 一般アイテムリスト
   */
  generateGeneralShopItems() {
    return [
      {
        id: 'potion_health_1',
        name: '回復薬',
        type: 'potion',
        price: 50,
        requiredLevel: 1,
        effect: { type: 'health', value: 50 }
      },
      {
        id: 'potion_mana_1',
        name: 'マナ薬',
        type: 'potion',
        price: 50,
        requiredLevel: 1,
        effect: { type: 'mana', value: 50 }
      },
      {
        id: 'scroll_identify',
        name: '鑑定の巻物',
        type: 'scroll',
        price: 100,
        requiredLevel: 1,
        effect: { type: 'identify' }
      }
      // 他の一般アイテム
    ];
  }

  /**
   * ポーションショップのアイテムを生成
   * @returns {Array} ポーションアイテムリスト
   */
  generatePotionShopItems() {
    return [
      {
        id: 'potion_health_1',
        name: '回復薬',
        type: 'potion',
        price: 50,
        requiredLevel: 1,
        effect: { type: 'health', value: 50 }
      },
      {
        id: 'potion_health_2',
        name: '大回復薬',
        type: 'potion',
        price: 120,
        requiredLevel: 5,
        effect: { type: 'health', value: 150 }
      },
      {
        id: 'potion_mana_1',
        name: 'マナ薬',
        type: 'potion',
        price: 50,
        requiredLevel: 1,
        effect: { type: 'mana', value: 50 }
      },
      {
        id: 'potion_mana_2',
        name: '大マナ薬',
        type: 'potion',
        price: 120,
        requiredLevel: 5,
        effect: { type: 'mana', value: 150 }
      }
      // 他のポーションアイテム
    ];
  }

  /**
   * 宝飾品ショップのアイテムを生成
   * @returns {Array} 宝飾品アイテムリスト
   */
  generateJewelryShopItems() {
    return [
      {
        id: 'ring_health_1',
        name: '生命の指輪',
        type: 'equipment',
        equipType: 'ring',
        price: 500,
        requiredLevel: 10,
        effects: [{ type: 'maxLife', value: 50 }]
      },
      {
        id: 'amulet_mana_1',
        name: '魔力のアミュレット',
        type: 'equipment',
        equipType: 'amulet',
        price: 600,
        requiredLevel: 12,
        effects: [{ type: 'maxMana', value: 50 }]
      },
      {
        id: 'ring_resist_1',
        name: '炎の抵抗の指輪',
        type: 'equipment',
        equipType: 'ring',
        price: 800,
        requiredLevel: 15,
        effects: [{ type: 'fireResistance', value: 20 }]
      }
      // 他の宝飾品アイテム
    ];
  }

  /**
   * 防具ショップのアイテムを生成
   * @returns {Array} 防具アイテムリスト
   */
  generateArmorShopItems() {
    return [
      {
        id: 'armor_leather_1',
        name: '革の鎧',
        type: 'equipment',
        equipType: 'armour',
        price: 200,
        requiredLevel: 1,
        basicDefence: 15
      },
      {
        id: 'helm_leather_1',
        name: '革のヘルメット',
        type: 'equipment',
        equipType: 'helm',
        price: 100,
        requiredLevel: 1,
        basicDefence: 5
      },
      {
        id: 'glove_leather_1',
        name: '革の手袋',
        type: 'equipment',
        equipType: 'glove',
        price: 80,
        requiredLevel: 1,
        basicDefence: 3
      },
      {
        id: 'shield_wooden_1',
        name: '木の盾',
        type: 'equipment',
        equipType: 'shield',
        price: 150,
        requiredLevel: 1,
        basicDefence: 10
      }
      // 他の防具アイテム
    ];
  }
}