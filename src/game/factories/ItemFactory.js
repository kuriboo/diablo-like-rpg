import Equipment from '../objects/Equipment';
import Potion from '../objects/Potion';
import Effect from '../objects/Effect';
import { EquipType } from '../../constants/itemTypes';

export default class ItemFactory {
  constructor(scene) {
    this.scene = scene;
  }
  
  // 一般的なアイテム作成メソッド
  createItem(config = {}) {
    const type = config.type || 'equipment';
    
    switch (type) {
      case 'equipment':
        return this.createEquipment(config);
      case 'potion':
        return this.createPotion(config);
      case 'gold':
        return this.createGold(config);
      case 'chest':
        return this.createChest(config);
      default:
        console.error(`Unknown item type: ${type}`);
        return null;
    }
  }
  
  // 装備アイテムの作成
  createEquipment(config = {}) {
    // 基本設定
    const level = config.level || 1;
    const rarity = config.rarity || this.getRandomRarity(level);
    const type = config.equipType || this.getRandomEquipType();
    
    // 座標設定（デフォルトは中央）
    const x = config.x !== undefined ? config.x : (this.scene.cameras.main.width / 2);
    const y = config.y !== undefined ? config.y : (this.scene.cameras.main.height / 2);
    
    // 名前の生成
    const name = config.name || this.generateEquipmentName(type, rarity);
    
    // 装備品のテクスチャ
    const texture = config.texture || `item_${this.getEquipTextureName(type, rarity)}`;
    
    // 装備作成
    const equipment = new Equipment(this.scene, x, y, texture, {
      name: name,
      description: config.description || this.generateEquipmentDescription(type, rarity),
      type: type,
      level: level,
      rarity: rarity
    });
    
    // 基本性能の設定
    if (config.basicPerformance) {
      equipment.basicPerformance = config.basicPerformance;
    }
    
    // オプションの設定
    if (config.optionPerformance) {
      equipment.optionPerformance = config.optionPerformance;
    } else {
      // ランダムなオプションの生成
      equipment.generateRandomOptions(3);
    }
    
    // 特殊効果の設定
    if (config.effect) {
      equipment.effect = config.effect;
    }
    
    return equipment;
  }
  
  // ポーションの作成
  createPotion(config = {}) {
    const potionType = config.potionType || 'health';
    const x = config.x !== undefined ? config.x : (this.scene.cameras.main.width / 2);
    const y = config.y !== undefined ? config.y : (this.scene.cameras.main.height / 2);
    
    // ポーションテクスチャ
    const texture = config.texture || `potion_${potionType}`;
    
    // ポーション名と効果量
    let name = config.name || '';
    let effectValue = config.effectValue || 0;
    let description = config.description || '';
    let duration = config.duration || 0;
    
    switch (potionType) {
      case 'health':
        name = 'ヒールポーション';
        effectValue = 50;
        description = '体力を回復します';
        break;
      case 'mana':
        name = 'マナポーション';
        effectValue = 50;
        description = 'マナを回復します';
        break;
      case 'rejuvenation':
        name = 'リジュベネーションポーション';
        effectValue = 40;
        description = '体力とマナを回復します';
        break;
      case 'special':
        name = '特殊ポーション';
        effectValue = 0;
        description = '特殊な効果を与えます';
        duration = 30000; // 30秒
        break;
    }
    
    return new Potion(this.scene, x, y, texture, {
      name: name,
      description: description,
      potionType: potionType,
      effectValue: effectValue,
      duration: duration
    });
  }
  
  // ゴールドアイテムの作成
  createGold(config = {}) {
    // 基本設定
    const amount = config.amount || 1;
    const x = config.x !== undefined ? config.x : (this.scene.cameras.main.width / 2);
    const y = config.y !== undefined ? config.y : (this.scene.cameras.main.height / 2);
    
    // テクスチャ（金額によって変化）
    let texture;
    if (amount < 10) {
      texture = 'gold_coin_small';
    } else if (amount < 50) {
      texture = 'gold_coin_medium';
    } else {
      texture = 'gold_pile';
    }
    
    // カスタムクラスでゴールドアイテム作成
    class Gold extends Phaser.GameObjects.Sprite {
      constructor(scene, x, y, texture, amount) {
        super(scene, x, y, texture);
        
        this.amount = amount;
        this.canInteract = true;
        this.collected = false;
        
        // 初期設定
        this.setInteractive();
        this.on('pointerdown', this.onClick);
        
        // フロートエフェクト用変数
        this.yOrig = y;
        this.floatHeight = 4;
        this.floatSpeed = 1.5;
        
        // 光るエフェクト
        this.glowAlpha = 0;
        this.glowDirection = 1;
        this.glow = scene.add.sprite(x, y, texture)
          .setOrigin(0.5, 0.5)
          .setScale(1)
          .setTint(0xffff00)
          .setAlpha(0);
        
        // 更新関数を有効化
        scene.events.on('update', this.update, this);
      }
      
      onClick() {
        if (this.canInteract && !this.collected) {
          // プレイヤーとの距離をチェック
          const player = this.scene.player;
          if (player) {
            const distance = Phaser.Math.Distance.Between(
              this.x, this.y, player.x, player.y
            );
            
            // 一定距離内ならゴールド取得
            if (distance < 100) {
              this.onCollect(player);
            }
          }
        }
      }
      
      update(time, delta) {
        // 浮遊アニメーション
        if (!this.collected) {
          this.y = this.yOrig + Math.sin(time / 500 * this.floatSpeed) * this.floatHeight;
          
          // 光るエフェクト
          this.glowAlpha += 0.01 * this.glowDirection;
          if (this.glowAlpha >= 0.3) {
            this.glowDirection = -1;
          } else if (this.glowAlpha <= 0) {
            this.glowDirection = 1;
          }
          
          this.glow.setPosition(this.x, this.y);
          this.glow.setAlpha(this.glowAlpha);
        }
      }
      
      onCollect(player) {
        if (!this.collected && player) {
          this.collected = true;
          
          // 収集エフェクト
          this.scene.tweens.add({
            targets: [this, this.glow],
            y: this.y - 20,
            alpha: 0,
            scale: 0.5,
            duration: 300,
            onComplete: () => {
              // プレイヤーのゴールド追加
              if (player.gainGold) {
                player.gainGold(this.amount);
              }
              
              // オブジェクトの削除
              if (this.glow) this.glow.destroy();
              this.destroy();
            }
          });
          
          // 効果音再生
          if (this.scene.sound) {
            this.scene.sound.play('coin_pickup');
          }
          
          return true;
        }
        
        return false;
      }
      
      destroy() {
        // リソースのクリーンアップ
        if (this.scene) {
          this.scene.events.off('update', this.update, this);
        }
        
        if (this.glow) {
          this.glow.destroy();
        }
        
        super.destroy();
      }
    }
    
    return new Gold(this.scene, x, y, texture, amount);
  }
  
  // 宝箱の作成
  createChest(config = {}) {
    // 基本設定
    const level = config.level || 1;
    const difficulty = config.difficulty || 'normal';
    const x = config.x !== undefined ? config.x : (this.scene.cameras.main.width / 2);
    const y = config.y !== undefined ? config.y : (this.scene.cameras.main.height / 2);
    
    // 宝箱クラス
    class Chest extends Phaser.GameObjects.Sprite {
      constructor(scene, x, y, texture, level, difficulty) {
        super(scene, x, y, texture);
        
        this.level = level;
        this.difficulty = difficulty;
        this.canInteract = true;
        this.opened = false;
        
        // 初期設定
        this.setInteractive();
        this.on('pointerdown', this.onClick);
        
        // 宝箱の内容（開けたときにアイテムを生成）
        this.contents = this.generateContents();
      }
      
      onClick() {
        if (this.canInteract && !this.opened) {
          // プレイヤーとの距離をチェック
          const player = this.scene.player;
          if (player) {
            const distance = Phaser.Math.Distance.Between(
              this.x, this.y, player.x, player.y
            );
            
            // 一定距離内なら宝箱を開ける
            if (distance < 100) {
              this.open();
            }
          }
        }
      }
      
      generateContents() {
        // 難易度と宝箱のレベルに応じた内容を生成
        const contents = [];
        
        // ゴールド（確定）
        const goldAmount = Math.floor(20 * this.level * (1 + Math.random() * 0.5));
        contents.push({
          type: 'gold',
          amount: goldAmount
        });
        
        // アイテム（確率）
        const itemChance = 0.7 + (this.level * 0.02);
        if (Math.random() < itemChance) {
          // 装備品またはポーション
          if (Math.random() < 0.7) {
            // 装備品
            contents.push({
              type: 'equipment',
              level: this.level,
              rarity: this.getRarityBasedOnDifficulty()
            });
          } else {
            // ポーション
            contents.push({
              type: 'potion',
              potionType: this.getRandomPotionType()
            });
          }
        }
        
        return contents;
      }
      
      getRarityBasedOnDifficulty() {
        const rand = Math.random() * 100;
        
        // 難易度別レア度確率
        switch (this.difficulty) {
          case 'nightmare':
            if (rand < 5) return 'legendary';
            if (rand < 20) return 'epic';
            if (rand < 50) return 'rare';
            if (rand < 80) return 'uncommon';
            return 'common';
          
          case 'hell':
            if (rand < 10) return 'legendary';
            if (rand < 30) return 'epic';
            if (rand < 60) return 'rare';
            if (rand < 90) return 'uncommon';
            return 'common';
          
          default: // normal
            if (rand < 2) return 'legendary';
            if (rand < 10) return 'epic';
            if (rand < 30) return 'rare';
            if (rand < 70) return 'uncommon';
            return 'common';
        }
      }
      
      getRandomPotionType() {
        const types = ['health', 'mana', 'rejuvenation', 'special'];
        const weights = [0.4, 0.3, 0.2, 0.1];
        
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
      
      open() {
        if (this.opened) return;
        
        this.opened = true;
        this.canInteract = false;
        
        // 宝箱オープンアニメーション
        this.setTexture('chest_open');
        
        // 効果音
        if (this.scene.sound) {
          this.scene.sound.play('chest_open');
        }
        
        // アイテムのドロップ
        this.dropContents();
      }
      
      dropContents() {
        // アイテムファクトリーの取得
        const itemFactory = this.scene.itemFactory;
        if (!itemFactory) return;
        
        // 内容物をドロップ
        this.contents.forEach((item, index) => {
          // ドロップ位置（少しずらす）
          const dropX = this.x + (Math.random() * 40 - 20);
          const dropY = this.y + (Math.random() * 40 - 20);
          
          // 少し遅延を付けてドロップ
          this.scene.time.delayedCall(index * 200, () => {
            // アイテム生成
            const droppedItem = itemFactory.createItem({
              ...item,
              x: dropX,
              y: dropY
            });
            
            if (droppedItem) {
              this.scene.add.existing(droppedItem);
              
              // アイテムリストに追加
              if (!this.scene.items) this.scene.items = [];
              this.scene.items.push(droppedItem);
              
              // TopDownMapにアイテムを追加
              if (this.scene.topDownMap) {
                this.scene.topDownMap.addEntity(droppedItem);
              }
              
              // ドロップエフェクト
              droppedItem.y -= 20;
              this.scene.tweens.add({
                targets: droppedItem,
                y: droppedItem.y + 20,
                duration: 300,
                ease: 'Bounce'
              });
            }
          });
        });
      }
    }
    
    // 宝箱作成
    return new Chest(this.scene, x, y, 'chest_closed', level, difficulty);
  }
  
  // データからアイテムを作成（ショップ等で使用）
  createItemFromData(itemData) {
    if (!itemData) return null;
    
    // アイテムタイプに応じて作成
    switch (itemData.type) {
      case 'equipment':
        return this.createEquipment({
          ...itemData,
          x: 0,
          y: 0
        });
      
      case 'potion':
        return this.createPotion({
          ...itemData,
          x: 0,
          y: 0
        });
      
      default:
        return null;
    }
  }
  
  // ランダムなレア度を取得
  getRandomRarity(level = 1) {
    // レベルによって確率調整
    const legendaryChance = 0.01 + (level * 0.001); // レベルが上がるほど僅かに上昇
    const epicChance = 0.05 + (level * 0.002);
    const rareChance = 0.2 + (level * 0.003);
    const uncommonChance = 0.4 + (level * 0.005);
    
    const rand = Math.random();
    
    if (rand < legendaryChance) return 'legendary';
    if (rand < legendaryChance + epicChance) return 'epic';
    if (rand < legendaryChance + epicChance + rareChance) return 'rare';
    if (rand < legendaryChance + epicChance + rareChance + uncommonChance) return 'uncommon';
    
    return 'common';
  }
  
  // ランダムな装備タイプを取得
  getRandomEquipType() {
    const types = [
      EquipType.helm,
      EquipType.armour,
      EquipType.glove,
      EquipType.belt,
      EquipType.ring,
      EquipType.oneHandLongRangeWeapon,
      EquipType.oneHandMeleeWeapon,
      EquipType.twoHandLongRangeWeapon,
      EquipType.twoHandMeleeWeapon,
      EquipType.shield,
      EquipType.amulet
    ];
    
    return types[Math.floor(Math.random() * types.length)];
  }
  
  // 装備テクスチャ名の取得
  getEquipTextureName(type, rarity) {
    let prefix = '';
    
    switch (type) {
      case EquipType.helm:
        prefix = 'helm';
        break;
      case EquipType.armour:
        prefix = 'armour';
        break;
      case EquipType.glove:
        prefix = 'glove';
        break;
      case EquipType.belt:
        prefix = 'belt';
        break;
      case EquipType.ring:
        prefix = 'ring';
        break;
      case EquipType.oneHandLongRangeWeapon:
        prefix = 'bow';
        break;
      case EquipType.oneHandMeleeWeapon:
        prefix = 'sword';
        break;
      case EquipType.twoHandLongRangeWeapon:
        prefix = 'crossbow';
        break;
      case EquipType.twoHandMeleeWeapon:
        prefix = 'axe';
        break;
      case EquipType.shield:
        prefix = 'shield';
        break;
      case EquipType.amulet:
        prefix = 'amulet';
        break;
      default:
        prefix = 'item';
    }
    
    return `${prefix}_${rarity}`;
  }
  
  // 装備名の生成
  generateEquipmentName(type, rarity) {
    const rarityPrefix = {
      common: '',
      uncommon: '良質な',
      rare: '希少な',
      epic: '伝説の',
      legendary: '神話の'
    };
    
    const equipNames = {
      [EquipType.helm]: '兜',
      [EquipType.armour]: '鎧',
      [EquipType.glove]: '手袋',
      [EquipType.belt]: 'ベルト',
      [EquipType.ring]: '指輪',
      [EquipType.oneHandLongRangeWeapon]: '弓',
      [EquipType.oneHandMeleeWeapon]: '剣',
      [EquipType.twoHandLongRangeWeapon]: 'クロスボウ',
      [EquipType.twoHandMeleeWeapon]: '斧',
      [EquipType.shield]: '盾',
      [EquipType.amulet]: 'アミュレット'
    };
    
    return `${rarityPrefix[rarity]}${equipNames[type] || '装備'}`;
  }
  
  // 装備説明の生成
  generateEquipmentDescription(type, rarity) {
    const rarityDesc = {
      common: '一般的な',
      uncommon: '珍しい',
      rare: '希少価値のある',
      epic: '伝説に語られる',
      legendary: '神話の力を宿した'
    };
    
    const equipDesc = {
      [EquipType.helm]: '兜',
      [EquipType.armour]: '鎧',
      [EquipType.glove]: '手袋',
      [EquipType.belt]: 'ベルト',
      [EquipType.ring]: '指輪',
      [EquipType.oneHandLongRangeWeapon]: '弓',
      [EquipType.oneHandMeleeWeapon]: '剣',
      [EquipType.twoHandLongRangeWeapon]: 'クロスボウ',
      [EquipType.twoHandMeleeWeapon]: '斧',
      [EquipType.shield]: '盾',
      [EquipType.amulet]: 'アミュレット'
    };
    
    return `${rarityDesc[rarity]}${equipDesc[type] || '装備'}です。`;
  }
  
  // エフェクトの作成
  createEffect(config = {}) {
    return new Effect(config);
  }
}