import Item from './Item';
import { EquipType, EquipPerformanceValueType } from '../../constants/itemTypes';

export default class Equipment extends Item {
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture);
    
    // 基本情報
    this.name = config.name || 'Unknown Equipment';
    this.description = config.description || 'An equipment item';
    this.type = config.type || EquipType.oneHandMeleeWeapon;
    this.level = config.level || 1;
    this.rarity = config.rarity || 'common'; // common, uncommon, rare, epic, legendary
    
    // 装備の基本性能
    this.basicPerformance = null;
    this.setBasicPerformance(config.basicPerformance);
    
    // オプション性能
    this.optionPerformance = config.optionPerformance || [];
    
    // 特殊効果
    this.effect = config.effect || null;
    
    // 見た目の設定
    this.setTint(this.getRarityTint());
    
    // 初期化完了後にツールチップデータを更新
    this.tooltipData = this.generateTooltipData();
  }
  
  setBasicPerformance(basicPerformance) {
    // 装備の基本性能を設定
    if (!basicPerformance) {
      // 武器タイプ
      if (this.isWeaponType()) {
        this.basicPerformance = {
          type: EquipPerformanceValueType.AttackBasic,
          name: "AttackBasic",
          value: this.generateBasicAttackValue()
        };
      } 
      // 防具タイプ
      else {
        this.basicPerformance = {
          type: EquipPerformanceValueType.DefenceBasic,
          name: "DefenceBasic",
          value: this.generateBasicDefenseValue()
        };
      }
    } else {
      this.basicPerformance = basicPerformance;
    }
  }
  
  isWeaponType() {
    // 武器タイプかどうかを判定
    return [
      EquipType.oneHandLongRangeWeapon,
      EquipType.oneHandMeleeWeapon,
      EquipType.twoHandLongRangeWeapon,
      EquipType.twoHandMeleeWeapon
    ].includes(this.type);
  }
  
  generateBasicAttackValue() {
    // 基本攻撃力の生成（レベルと希少度に基づく）
    const baseValue = this.level * 5;
    const rarityMultiplier = this.getRarityMultiplier();
    
    return Math.floor(baseValue * rarityMultiplier);
  }
  
  generateBasicDefenseValue() {
    // 基本防御力の生成（レベルと希少度に基づく）
    const baseValue = this.level * 3;
    const rarityMultiplier = this.getRarityMultiplier();
    
    return Math.floor(baseValue * rarityMultiplier);
  }
  
  getRarityMultiplier() {
    // 希少度に基づく倍率
    const rarityMultipliers = {
      common: 1.0,
      uncommon: 1.2,
      rare: 1.5,
      epic: 2.0,
      legendary: 3.0
    };
    
    return rarityMultipliers[this.rarity] || 1.0;
  }
  
  getRarityTint() {
    // 希少度に基づく色調
    const rarityTints = {
      common: 0xffffff,     // 白
      uncommon: 0x00ff00,   // 緑
      rare: 0x0000ff,       // 青
      epic: 0x800080,       // 紫
      legendary: 0xffa500   // オレンジ
    };
    
    return rarityTints[this.rarity] || 0xffffff;
  }
  
  generateRandomOptions(numOptions = 3) {
    // ランダムなオプション性能を生成
    this.optionPerformance = [];
    
    const availableOptions = this.getAvailableOptions();
    
    // 指定された数だけランダムにオプションを選択
    const selectedOptions = [];
    while (selectedOptions.length < numOptions && availableOptions.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableOptions.length);
      const option = availableOptions.splice(randomIndex, 1)[0];
      selectedOptions.push(option);
    }
    
    // 選択されたオプションに値を設定
    selectedOptions.forEach(option => {
      const min = option.minValue * (1 + (this.level / 100));
      const max = option.maxValue * (1 + (this.level / 50));
      
      let value;
      if (option.isInteger) {
        value = Math.floor(Math.random() * (max - min + 1) + min);
      } else {
        value = parseFloat((Math.random() * (max - min) + min).toFixed(1));
      }
      
      this.optionPerformance.push({
        type: option.type,
        name: option.name,
        value: value
      });
    });
  }
  
  getAvailableOptions() {
    // 装備タイプに基づく利用可能なオプション
    let options = [];
    
    // 武器タイプの場合
    if (this.isWeaponType()) {
      options = [
        { type: EquipPerformanceValueType.Attack, name: "Attack", minValue: 1.0, maxValue: 2.0, isInteger: false },
        { type: EquipPerformanceValueType.AR, name: "AR", minValue: 5, maxValue: 50, isInteger: true },
        { type: EquipPerformanceValueType.CriticalRate, name: "CriticalRate", minValue: 1.0, maxValue: 15.0, isInteger: false },
        { type: EquipPerformanceValueType.CriticalDamage, name: "CriticalDamage", minValue: 1.1, maxValue: 2.0, isInteger: false },
        { type: EquipPerformanceValueType.AttackSpeed, name: "AttackSpeed", minValue: 1, maxValue: 10, isInteger: true },
        { type: EquipPerformanceValueType.PoisonDamage, name: "PoisonDamage", minValue: 1, maxValue: 20, isInteger: true },
        { type: EquipPerformanceValueType.FireDamage, name: "FireDamage", minValue: 1, maxValue: 20, isInteger: true },
        { type: EquipPerformanceValueType.ColdDamage, name: "ColdDamage", minValue: 1, maxValue: 20, isInteger: true },
        { type: EquipPerformanceValueType.ElectricDamage, name: "ElectricDamage", minValue: 1, maxValue: 20, isInteger: true },
        { type: EquipPerformanceValueType.lifeLeech, name: "lifeLeech", minValue: 1.0, maxValue: 5.0, isInteger: false },
        { type: EquipPerformanceValueType.manaLeech, name: "manaLeech", minValue: 1.0, maxValue: 5.0, isInteger: false }
      ];
    }
    // 指輪またはアミュレットの場合
    else if ([EquipType.ring, EquipType.amulet].includes(this.type)) {
      options = [
        { type: EquipPerformanceValueType.Attack, name: "Attack", minValue: 1.0, maxValue: 1.5, isInteger: false },
        { type: EquipPerformanceValueType.AR, name: "AR", minValue: 2, maxValue: 20, isInteger: true },
        { type: EquipPerformanceValueType.Defence, name: "Defence", minValue: 1.0, maxValue: 1.5, isInteger: false },
        { type: EquipPerformanceValueType.CriticalRate, name: "CriticalRate", minValue: 0.5, maxValue: 10.0, isInteger: false },
        { type: EquipPerformanceValueType.MaxLife, name: "MaxLife", minValue: 5, maxValue: 50, isInteger: true },
        { type: EquipPerformanceValueType.MaxMana, name: "MaxMana", minValue: 5, maxValue: 50, isInteger: true },
        { type: EquipPerformanceValueType.AllElementResistance, name: "AllElementResistance", minValue: 1.0, maxValue: 15.0, isInteger: false },
        { type: EquipPerformanceValueType.MoveSpeed, name: "MoveSpeed", minValue: 1.0, maxValue: 1.2, isInteger: false },
        { type: EquipPerformanceValueType.lifeRegeneration, name: "lifeRegeneration", minValue: 0.1, maxValue: 1.0, isInteger: false },
        { type: EquipPerformanceValueType.manaRegeneration, name: "manaRegeneration", minValue: 0.1, maxValue: 1.0, isInteger: false }
      ];
    }
    // その他の防具
    else {
      options = [
        { type: EquipPerformanceValueType.Defence, name: "Defence", minValue: 1.0, maxValue: 2.0, isInteger: false },
        { type: EquipPerformanceValueType.MaxLife, name: "MaxLife", minValue: 5, maxValue: 100, isInteger: true },
        { type: EquipPerformanceValueType.MaxMana, name: "MaxMana", minValue: 5, maxValue: 50, isInteger: true },
        { type: EquipPerformanceValueType.PoisonResistance, name: "PoisonResistance", minValue: 1.0, maxValue: 20.0, isInteger: false },
        { type: EquipPerformanceValueType.FireResistance, name: "FireResistance", minValue: 1.0, maxValue: 20.0, isInteger: false },
        { type: EquipPerformanceValueType.ColdResistance, name: "ColdResistance", minValue: 1.0, maxValue: 20.0, isInteger: false },
        { type: EquipPerformanceValueType.ElectricResistance, name: "ElectricResistance", minValue: 1.0, maxValue: 20.0, isInteger: false },
        { type: EquipPerformanceValueType.PhysicalResistance, name: "PhysicalResistance", minValue: 1.0, maxValue: 15.0, isInteger: false },
        { type: EquipPerformanceValueType.AllElementResistance, name: "AllElementResistance", minValue: 1.0, maxValue: 10.0, isInteger: false },
        { type: EquipPerformanceValueType.BlockRate, name: "BlockRate", minValue: 1.0, maxValue: 10.0, isInteger: false }
      ];
    }
    
    // 希少度に基づいてさらに特別なオプション追加
    if (['rare', 'epic', 'legendary'].includes(this.rarity)) {
      options.push(
        { type: EquipPerformanceValueType.lifeRegeneration, name: "lifeRegeneration", minValue: 0.2, maxValue: 2.0, isInteger: false },
        { type: EquipPerformanceValueType.manaRegeneration, name: "manaRegeneration", minValue: 0.2, maxValue: 2.0, isInteger: false }
      );
    }
    
    return options;
  }
  
  addToPlayerInventory(player) {
    // プレイヤーのインベントリに装備を追加
    if (player && player.inventory) {
      return player.inventory.addItem(this);
    }
    return false;
  }
  
  // 装備を装着
  equip(character) {
    if (!character || !character.characterEquipments) return false;
    
    // 装備スロットを判定
    let slot = '';
    switch (this.type) {
      case EquipType.helm:
        slot = 'head';
        break;
      case EquipType.armour:
        slot = 'body';
        break;
      case EquipType.glove:
        slot = 'glove';
        break;
      case EquipType.belt:
        slot = 'belt';
        break;
      case EquipType.amulet:
        slot = 'amulet';
        break;
      case EquipType.ring:
        // 左右の指輪スロットを確認
        if (!character.characterEquipments.leftRing) {
          slot = 'leftRing';
        } else if (!character.characterEquipments.rightRing) {
          slot = 'rightRing';
        } else {
          // 両方埋まっている場合は左を入れ替え
          slot = 'leftRing';
        }
        break;
      case EquipType.shield:
        slot = 'leftHand';
        // 両手武器装備中は装備不可
        if (character.characterEquipments.rightHand && 
            [EquipType.twoHandLongRangeWeapon, EquipType.twoHandMeleeWeapon]
            .includes(character.characterEquipments.rightHand.type)) {
          return false;
        }
        break;
      case EquipType.oneHandLongRangeWeapon:
      case EquipType.oneHandMeleeWeapon:
      case EquipType.twoHandLongRangeWeapon:
      case EquipType.twoHandMeleeWeapon:
        slot = 'rightHand';
        // 両手武器の場合は左手も空ける
        if ([EquipType.twoHandLongRangeWeapon, EquipType.twoHandMeleeWeapon]
            .includes(this.type)) {
          character.characterEquipments.leftHand = null;
        }
        break;
    }
    
    // 既存の装備を取り外し
    const oldEquipment = character.characterEquipments[slot];
    if (oldEquipment) {
      // インベントリに戻す処理
      if (character.inventory) {
        character.inventory.addItem(oldEquipment);
      }
    }
    
    // 新しい装備をセット
    character.characterEquipments[slot] = this;
    
    // キャラクターのステータス再計算
    character.recalculateStats();
    
    return true;
  }
  
  // 装備を外す
  unequip(character) {
    if (!character || !character.characterEquipments) return false;
    
    // 装備スロットを判定して装備を外す
    for (const [slot, equipment] of Object.entries(character.characterEquipments)) {
      if (equipment && equipment.uuid === this.uuid) {
        // インベントリに戻す
        if (character.inventory) {
          character.inventory.addItem(this);
        }
        
        // スロットをクリア
        character.characterEquipments[slot] = null;
        
        // キャラクターのステータス再計算
        character.recalculateStats();
        
        return true;
      }
    }
    
    return false;
  }
  
  generateTooltipData() {
    // ツールチップに表示するデータの生成
    const data = {
      name: this.name,
      rarity: this.rarity,
      type: this.getTypeName(),
      level: this.level,
      basicPerformance: this.basicPerformance,
      optionPerformance: this.optionPerformance,
      effect: this.effect ? this.effect.description : null
    };
    
    return data;
  }
  
  getTypeName() {
    // 装備タイプの名前を取得
    const typeNames = {
      [EquipType.helm]: 'ヘルム',
      [EquipType.armour]: '鎧',
      [EquipType.glove]: '手袋',
      [EquipType.belt]: 'ベルト',
      [EquipType.ring]: '指輪',
      [EquipType.oneHandLongRangeWeapon]: '片手射程武器',
      [EquipType.oneHandMeleeWeapon]: '片手近接武器',
      [EquipType.twoHandLongRangeWeapon]: '両手射程武器',
      [EquipType.twoHandMeleeWeapon]: '両手近接武器',
      [EquipType.shield]: '盾',
      [EquipType.amulet]: 'アミュレット'
    };
    
    return typeNames[this.type] || '不明';
  }
  
  getTooltipData() {
    // ツールチップデータを返す
    return this.tooltipData;
  }
  
  getDisplayData() {
    // UI表示用のデータを返す
    const data = {
      ...this.tooltipData,
      texture: this.texture.key,
      frame: this.frame.name
    };
    
    return data;
  }
}