import Player from '../characters/Player';
import Enemy from '../characters/Enemy';
import Companion from '../characters/Companion';
import NPC from '../characters/NPC';
import { CharacterClassType } from '../../constants/characterTypes';

export default class CharacterFactory {
  constructor(scene) {
    this.scene = scene;
  }
  
  // プレイヤー作成
  createPlayer(config = {}) {
    // プレイヤーの位置
    const x = config.x !== undefined ? config.x : (this.scene.cameras.main.width / 2);
    const y = config.y !== undefined ? config.y : (this.scene.cameras.main.height / 2);
    
    // プレイヤーのクラスタイプ
    const classType = config.classType || CharacterClassType.warrior;
    
    // プレイヤーテクスチャ
    const texture = config.texture || `player_${this.getClassTextureName(classType)}`;
    
    // プレイヤーの追加設定
    const playerConfig = {
      name: config.name || 'プレイヤー',
      classType: classType,
      level: config.level || 1,
      // ステータス
      strength: config.strength || this.getClassBaseStats(classType).strength,
      dexterity: config.dexterity || this.getClassBaseStats(classType).dexterity,
      vitality: config.vitality || this.getClassBaseStats(classType).vitality,
      energy: config.energy || this.getClassBaseStats(classType).energy,
      // プレイヤー固有
      maxPotion: config.maxPotion || 10,
      potionCount: config.potionCount || 5,
      experience: config.experience || 0,
      gold: config.gold || 0,
      skillPoints: config.skillPoints || 0
    };
    
    // プレイヤーの作成
    const player = new Player(this.scene, x, y, texture, playerConfig);
    
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
    
    // 敵テクスチャ
    const texture = config.texture || `enemy_${enemyType}`;
    
    // 敵の設定
    const enemyConfig = {
      name: config.name || this.generateEnemyName(enemyType),
      level: level,
      enemyType: config.isBoss ? 'boss' : (config.isElite ? 'elite' : 'normal'),
      // ステータス（レベルに応じて調整）
      strength: config.strength || 10 + Math.floor(level * 0.8),
      dexterity: config.dexterity || 10 + Math.floor(level * 0.6),
      vitality: config.vitality || 10 + Math.floor(level),
      energy: config.energy || 10 + Math.floor(level * 0.4),
      // 難易度
      difficulty: config.difficulty || 'normal'
    };
    
    // 敵の作成
    const enemy = new Enemy(this.scene, x, y, texture, enemyConfig);
    
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
    
    // コンパニオンテクスチャ
    const texture = config.texture || `companion_${this.getClassTextureName(classType)}`;
    
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
      duration: config.duration || 0 // 0は永続
    };
    
    // コンパニオンの作成
    const companion = new Companion(this.scene, x, y, texture, companionConfig);
    
    // 装備の設定
    this.setupClassDefaultEquipment(companion, classType);
    
    return companion;
  }
  
  // NPC作成
  createNPC(config = {}) {
    // NPCの位置
    const x = config.x !== undefined ? config.x : (this.scene.cameras.main.width / 2);
    const y = config.y !== undefined ? config.y : (this.scene.cameras.main.height / 2);
    
    // NPCタイプ
    const npcType = config.npcType || this.getRandomNPCType();
    
    // NPCテクスチャ
    const texture = config.texture || `npc_${npcType}`;
    
    // NPCの設定
    const npcConfig = {
      name: config.name || this.generateNPCName(npcType),
      isShop: config.isShop || false,
      isStationary: config.isStationary !== undefined ? config.isStationary : true,
      hasQuest: config.hasQuest || false
    };
    
    // NPCの会話メッセージ
    if (config.message) {
      npcConfig.message = config.message;
    } else {
      npcConfig.message = this.generateNPCMessages(npcType, npcConfig.isShop);
    }
    
    // ショップNPCの場合は商品を設定
    if (npcConfig.isShop) {
      npcConfig.stock = config.stock || this.generateShopStock(config.shopLevel || 1);
    }
    
    // クエストNPCの場合はクエストを設定
    if (npcConfig.hasQuest) {
      npcConfig.quests = config.quests || this.generateNPCQuests(npcType);
    }
    
    // NPCの作成
    const npc = new NPC(this.scene, x, y, texture, npcConfig);
    
    return npc;
  }
  
  // クラスのテクスチャ名を取得
  getClassTextureName(classType) {
    switch (classType) {
      case CharacterClassType.warrior:
        return 'warrior';
      case CharacterClassType.rogue:
        return 'rogue';
      case CharacterClassType.mage:
        return 'mage';
      default:
        return 'warrior';
    }
  }
  
  // クラスの基本ステータスを取得
  getClassBaseStats(classType) {
    switch (classType) {
      case CharacterClassType.warrior:
        return {
          strength: 20,
          dexterity: 15,
          vitality: 25,
          energy: 10
        };
      case CharacterClassType.rogue:
        return {
          strength: 15,
          dexterity: 25,
          vitality: 15,
          energy: 15
        };
      case CharacterClassType.mage:
        return {
          strength: 10,
          dexterity: 15,
          vitality: 15,
          energy: 30
        };
      default:
        return {
          strength: 15,
          dexterity: 15,
          vitality: 15,
          energy: 15
        };
    }
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
  
  // ランダムなNPCタイプの取得
  getRandomNPCType() {
    const types = ['villager', 'merchant', 'blacksmith', 'healer', 'wizard'];
    return types[Math.floor(Math.random() * types.length)];
  }
  
  // NPC名の生成
  generateNPCName(npcType) {
    const names = {
      villager: ['村人', 'アルド', 'テッド', 'リサ', 'ジョン'],
      merchant: ['商人', 'トーマス', 'エリック', 'アンナ', 'セリン'],
      blacksmith: ['鍛冶屋', 'グリム', 'ガレット', 'ドリアン', 'ヘフェスト'],
      healer: ['癒し手', 'セラ', 'メアリー', 'アリス', 'エリザ'],
      wizard: ['魔術師', 'マルダ', 'ゼフィル', 'エクリプス', 'メロディア']
    };
    
    const npcNames = names[npcType] || names.villager;
    return npcNames[Math.floor(Math.random() * npcNames.length)];
  }
  
  // NPC会話メッセージの生成
  generateNPCMessages(npcType, isShop) {
    const messages = [];
    
    if (isShop) {
      messages.push('いらっしゃい！良い品を取り揃えておりますよ。');
      messages.push('何か気になる物はありますか？');
      messages.push('ここの商品は特別価格ですよ。');
    } else {
      switch (npcType) {
        case 'villager':
          messages.push('この辺りは最近、モンスターが増えて危険になってきました。');
          messages.push('あなたが冒険者なら、ぜひこの村を助けてください。');
          messages.push('村の東にある洞窟には、とても強いモンスターが住んでいるそうです。');
          break;
        case 'blacksmith':
          messages.push('良い武器は冒険の命です。お手入れを忘れずに。');
          messages.push('この辺りの鉱石は特に質が良くてね、丈夫な武器が作れるんだ。');
          messages.push('装備の修理も承っていますよ。必要なら声をかけてください。');
          break;
        case 'healer':
          messages.push('怪我をしていませんか？私の魔法で癒してあげましょう。');
          messages.push('この地域は危険な場所ですので、常に回復アイテムを持っておくといいですよ。');
          messages.push('魔法の力を感じます。あなたには素質がありそうですね。');
          break;
        case 'wizard':
          messages.push('魔法の研究をしているんだ。何か興味あることはある？');
          messages.push('古代の遺跡には強力な魔法のアーティファクトが眠っているらしい。');
          messages.push('この世界の魔法は元素の力を借りているんだ。火、水、風、土…全て繋がっている。');
          break;
        default:
          messages.push('こんにちは、冒険者さん。何かお手伝いできることはありますか？');
          messages.push('この村には色々な職人がいますよ。一度見て回るといいでしょう。');
          messages.push('最近は平和な日々が続いていますが、油断は禁物です。');
      }
    }
    
    return messages;
  }
  
  // ショップの商品生成
  generateShopStock(level = 1) {
    const stock = [];
    
    // 装備品（レベルに応じたアイテム）
    for (let i = 0; i < 5; i++) {
      stock.push({
        item: {
          type: 'equipment',
          level: level,
          rarity: this.getShopItemRarity(level)
        },
        price: this.calculateEquipmentPrice(level, i),
        quantity: 1
      });
    }
    
    // ポーション（常に在庫あり）
    stock.push({
      item: {
        type: 'potion',
        potionType: 'health'
      },
      price: 50,
      quantity: 10
    });
    
    stock.push({
      item: {
        type: 'potion',
        potionType: 'mana'
      },
      price: 50,
      quantity: 10
    });
    
    stock.push({
      item: {
        type: 'potion',
        potionType: 'rejuvenation'
      },
      price: 100,
      quantity: 5
    });
    
    // 特殊ポーション（レアアイテム）
    if (level >= 5) {
      stock.push({
        item: {
          type: 'potion',
          potionType: 'special'
        },
        price: 200,
        quantity: 2
      });
    }
    
    return stock;
  }
  
  // ショップアイテムのレア度決定
  getShopItemRarity(level) {
    const rand = Math.random() * 100;
    
    // レベルが高いほど良いレア度の確率が上がる
    const levelBonus = level * 2; // レベルごとに2%ボーナス
    
    if (rand < 1 + levelBonus * 0.1) return 'legendary';
    if (rand < 5 + levelBonus * 0.2) return 'epic';
    if (rand < 20 + levelBonus * 0.3) return 'rare';
    if (rand < 50 + levelBonus * 0.4) return 'uncommon';
    
    return 'common';
  }
  
  // 装備品の価格計算
  calculateEquipmentPrice(level, index) {
    // 基本価格
    const basePrice = 50 + level * 20;
    
    // インデックスに応じた変動（店内での陳列位置）
    const indexMultiplier = 1 + (index * 0.1);
    
    // ランダム要素
    const randomMultiplier = 0.9 + (Math.random() * 0.2);
    
    return Math.floor(basePrice * indexMultiplier * randomMultiplier);
  }
  
  // NPCクエストの生成
  generateNPCQuests(npcType) {
    const quests = [];
    
    // NPCタイプに応じたクエスト
    switch (npcType) {
      case 'villager':
        quests.push({
          id: `quest_villager_${Date.now()}`,
          name: '作物を荒らすモンスター退治',
          description: '村の周辺で作物を荒らすモンスターを倒してください。',
          objectives: [
            { type: 'kill', target: 'rat', count: 5, current: 0 }
          ],
          rewards: {
            exp: 100,
            gold: 50,
            items: []
          }
        });
        break;
      case 'merchant':
        quests.push({
          id: `quest_merchant_${Date.now()}`,
          name: '失われた荷物',
          description: '盗まれた荷物を取り戻してください。盗賊たちは東の洞窟に隠れていると思われます。',
          objectives: [
            { type: 'kill', target: 'goblin', count: 3, current: 0 },
            { type: 'collect', item: 'merchant_goods', count: 1, current: 0 }
          ],
          rewards: {
            exp: 150,
            gold: 100,
            items: [
              { type: 'equipment', rarity: 'uncommon', level: 5 }
            ]
          }
        });
        break;
      case 'blacksmith':
        quests.push({
          id: `quest_blacksmith_${Date.now()}`,
          name: '鍛冶素材の収集',
          description: '良質な武器を作るための素材を集めてきてください。山の鉱山で見つかるでしょう。',
          objectives: [
            { type: 'collect', item: 'iron_ore', count: 5, current: 0 },
            { type: 'collect', item: 'coal', count: 3, current: 0 }
          ],
          rewards: {
            exp: 120,
            gold: 80,
            items: [
              { type: 'equipment', equipType: 'oneHandMeleeWeapon', rarity: 'rare', level: 5 }
            ]
          }
        });
        break;
      case 'healer':
        quests.push({
          id: `quest_healer_${Date.now()}`,
          name: '薬草採集',
          description: '病人のための薬を作るには特殊な薬草が必要です。森で探してきてください。',
          objectives: [
            { type: 'collect', item: 'herb', count: 10, current: 0 }
          ],
          rewards: {
            exp: 100,
            gold: 50,
            items: [
              { type: 'potion', potionType: 'rejuvenation', count: 3 }
            ]
          }
        });
        break;
      case 'wizard':
        quests.push({
          id: `quest_wizard_${Date.now()}`,
          name: '魔法の研究資料',
          description: '古代遺跡にある魔法の書物を回収してきてください。危険な魔物が守っているかもしれません。',
          objectives: [
            { type: 'kill', target: 'skeleton', count: 5, current: 0 },
            { type: 'collect', item: 'magic_scroll', count: 1, current: 0 }
          ],
          rewards: {
            exp: 200,
            gold: 150,
            items: [
              { type: 'equipment', equipType: 'amulet', rarity: 'rare', level: 5 }
            ]
          }
        });
        break;
      default:
        quests.push({
          id: `quest_default_${Date.now()}`,
          name: '挑戦者の任務',
          description: '近くの洞窟にいるモンスターを倒して、あなたの力を証明してください。',
          objectives: [
            { type: 'kill', target: 'goblin', count: 3, current: 0 }
          ],
          rewards: {
            exp: 100,
            gold: 50,
            items: []
          }
        });
    }
    
    return quests;
  }
}