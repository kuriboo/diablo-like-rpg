import SkillNode from './SkillNode';

/**
 * パッシブスキルノードクラス
 * 属性値修正や特殊効果を持つパッシブスキルを表現
 */
class PassiveNode extends SkillNode {
  /**
   * パッシブノードコンストラクタ
   * @param {Object} nodeData - ノードの初期データ
   */
  constructor(nodeData) {
    super(nodeData);
    this.effects = nodeData.effects || [];
    this.isStackable = nodeData.isStackable || false; // スキルが重複取得可能か
    this.currentStack = 0; // 現在のスタック数（重複取得可能なスキルの場合）
  }

  /**
   * パッシブスキルの効果をキャラクターに適用
   * @param {Object} character - 効果を適用するキャラクター
   * @override
   */
  applyEffects(character) {
    if (!character) return;
    
    this.currentStack++;
    
    this.effects.forEach(effect => {
      switch (effect.type) {
        case 'attributeModifier':
          // 属性値（Strength, Dexterity等）の修正
          this._applyAttributeModifier(character, effect);
          break;
          
        case 'resistanceModifier':
          // 耐性値の修正
          this._applyResistanceModifier(character, effect);
          break;
          
        case 'damageModifier':
          // ダメージ修正
          this._applyDamageModifier(character, effect);
          break;
          
        case 'specialEffect':
          // 特殊効果
          this._applySpecialEffect(character, effect);
          break;
          
        default:
          console.warn(`Unknown effect type: ${effect.type}`);
      }
    });
    
    console.log(`Applied passive skill ${this.name} to ${character.name}`);
  }

  /**
   * パッシブスキルの効果を解除
   * @param {Object} character - 効果を解除するキャラクター
   * @override
   */
  removeEffects(character) {
    if (!character || this.currentStack <= 0) return;
    
    this.currentStack--;
    
    // スタックが残っている場合は効果を残す
    if (this.currentStack > 0) return;
    
    this.effects.forEach(effect => {
      switch (effect.type) {
        case 'attributeModifier':
          this._removeAttributeModifier(character, effect);
          break;
          
        case 'resistanceModifier':
          this._removeResistanceModifier(character, effect);
          break;
          
        case 'damageModifier':
          this._removeDamageModifier(character, effect);
          break;
          
        case 'specialEffect':
          this._removeSpecialEffect(character, effect);
          break;
          
        default:
          console.warn(`Unknown effect type: ${effect.type}`);
      }
    });
    
    console.log(`Removed passive skill ${this.name} from ${character.name}`);
  }

  /**
   * 属性修正を適用
   * @param {Object} character - キャラクター
   * @param {Object} effect - 効果データ
   * @private
   */
  _applyAttributeModifier(character, effect) {
    const { attribute, value } = effect;
    
    if (!character[attribute] && character[attribute] !== 0) {
      console.warn(`Character does not have attribute: ${attribute}`);
      return;
    }
    
    // 効果を適用する前に一時保存
    if (!character._skillEffects) {
      character._skillEffects = {};
    }
    
    if (!character._skillEffects[this.id]) {
      character._skillEffects[this.id] = [];
    }
    
    // 効果を保存
    character._skillEffects[this.id].push({
      type: 'attributeModifier',
      attribute,
      value
    });
    
    // 属性値を修正
    character[attribute] += value;
  }

  /**
   * 属性修正を解除
   * @param {Object} character - キャラクター
   * @param {Object} effect - 効果データ
   * @private
   */
  _removeAttributeModifier(character, effect) {
    const { attribute, value } = effect;
    
    if (!character[attribute] && character[attribute] !== 0) {
      console.warn(`Character does not have attribute: ${attribute}`);
      return;
    }
    
    // 効果記録が存在しない場合
    if (!character._skillEffects || !character._skillEffects[this.id]) {
      return;
    }
    
    // 属性値を元に戻す
    character[attribute] -= value;
    
    // 効果記録を削除
    const index = character._skillEffects[this.id].findIndex(e => 
      e.type === 'attributeModifier' && e.attribute === attribute && e.value === value
    );
    
    if (index !== -1) {
      character._skillEffects[this.id].splice(index, 1);
    }
    
    // 効果が空になったらエントリを削除
    if (character._skillEffects[this.id].length === 0) {
      delete character._skillEffects[this.id];
    }
  }

  /**
   * 耐性修正を適用
   * @param {Object} character - キャラクター
   * @param {Object} effect - 効果データ
   * @private
   */
  _applyResistanceModifier(character, effect) {
    const { resistance, value } = effect;
    const resistanceProp = `${resistance}Resistance`;
    
    if (!character[resistanceProp] && character[resistanceProp] !== 0) {
      console.warn(`Character does not have resistance: ${resistanceProp}`);
      return;
    }
    
    // 効果を適用する前に一時保存
    if (!character._skillEffects) {
      character._skillEffects = {};
    }
    
    if (!character._skillEffects[this.id]) {
      character._skillEffects[this.id] = [];
    }
    
    // 効果を保存
    character._skillEffects[this.id].push({
      type: 'resistanceModifier',
      resistance: resistanceProp,
      value
    });
    
    // 最大値を超えないように注意
    const maxResistance = 75.0;
    const newValue = Math.min(character[resistanceProp] + value, maxResistance);
    character[resistanceProp] = newValue;
  }

  /**
   * 耐性修正を解除
   * @param {Object} character - キャラクター
   * @param {Object} effect - 効果データ
   * @private
   */
  _removeResistanceModifier(character, effect) {
    const { resistance, value } = effect;
    const resistanceProp = `${resistance}Resistance`;
    
    if (!character[resistanceProp] && character[resistanceProp] !== 0) {
      console.warn(`Character does not have resistance: ${resistanceProp}`);
      return;
    }
    
    // 効果記録が存在しない場合
    if (!character._skillEffects || !character._skillEffects[this.id]) {
      return;
    }
    
    // 耐性値を元に戻す（最低値は0を下回らないようにする）
    character[resistanceProp] = Math.max(character[resistanceProp] - value, 0);
    
    // 効果記録を削除
    const index = character._skillEffects[this.id].findIndex(e => 
      e.type === 'resistanceModifier' && e.resistance === resistanceProp && e.value === value
    );
    
    if (index !== -1) {
      character._skillEffects[this.id].splice(index, 1);
    }
    
    // 効果が空になったらエントリを削除
    if (character._skillEffects[this.id].length === 0) {
      delete character._skillEffects[this.id];
    }
  }

  /**
   * ダメージ修正を適用
   * @param {Object} character - キャラクター
   * @param {Object} effect - 効果データ
   * @private
   */
  _applyDamageModifier(character, effect) {
    const { damageType, value, isPercentage } = effect;
    
    // ダメージ修正情報を保存
    if (!character._skillEffects) {
      character._skillEffects = {};
    }
    
    if (!character._skillEffects[this.id]) {
      character._skillEffects[this.id] = [];
    }
    
    // 効果を保存
    character._skillEffects[this.id].push({
      type: 'damageModifier',
      damageType,
      value,
      isPercentage
    });
    
    // キャラクターのダメージ修正リストに追加
    if (!character.damageModifiers) {
      character.damageModifiers = [];
    }
    
    character.damageModifiers.push({
      source: this.id,
      damageType,
      value,
      isPercentage
    });
  }

  /**
   * ダメージ修正を解除
   * @param {Object} character - キャラクター
   * @param {Object} effect - 効果データ
   * @private
   */
  _removeDamageModifier(character, effect) {
    const { damageType, value, isPercentage } = effect;
    
    // 効果記録が存在しない場合
    if (!character._skillEffects || !character._skillEffects[this.id]) {
      return;
    }
    
    // キャラクターのダメージ修正リストから削除
    if (character.damageModifiers && character.damageModifiers.length > 0) {
      const index = character.damageModifiers.findIndex(mod => 
        mod.source === this.id && 
        mod.damageType === damageType && 
        mod.value === value &&
        mod.isPercentage === isPercentage
      );
      
      if (index !== -1) {
        character.damageModifiers.splice(index, 1);
      }
    }
    
    // 効果記録を削除
    const recordIndex = character._skillEffects[this.id].findIndex(e => 
      e.type === 'damageModifier' && 
      e.damageType === damageType && 
      e.value === value &&
      e.isPercentage === isPercentage
    );
    
    if (recordIndex !== -1) {
      character._skillEffects[this.id].splice(recordIndex, 1);
    }
    
    // 効果が空になったらエントリを削除
    if (character._skillEffects[this.id].length === 0) {
      delete character._skillEffects[this.id];
    }
  }

  /**
   * 特殊効果を適用
   * @param {Object} character - キャラクター
   * @param {Object} effect - 効果データ
   * @private
   */
  _applySpecialEffect(character, effect) {
    const { effectId, params } = effect;
    
    // 効果を保存
    if (!character._skillEffects) {
      character._skillEffects = {};
    }
    
    if (!character._skillEffects[this.id]) {
      character._skillEffects[this.id] = [];
    }
    
    character._skillEffects[this.id].push({
      type: 'specialEffect',
      effectId,
      params
    });
    
    // キャラクターの特殊効果リストに追加
    if (!character.specialEffects) {
      character.specialEffects = [];
    }
    
    character.specialEffects.push({
      source: this.id,
      effectId,
      params
    });
  }

  /**
   * 特殊効果を解除
   * @param {Object} character - キャラクター
   * @param {Object} effect - 効果データ
   * @private
   */
  _removeSpecialEffect(character, effect) {
    const { effectId, params } = effect;
    
    // 効果記録が存在しない場合
    if (!character._skillEffects || !character._skillEffects[this.id]) {
      return;
    }
    
    // キャラクターの特殊効果リストから削除
    if (character.specialEffects && character.specialEffects.length > 0) {
      const index = character.specialEffects.findIndex(e => 
        e.source === this.id && e.effectId === effectId
      );
      
      if (index !== -1) {
        character.specialEffects.splice(index, 1);
      }
    }
    
    // 効果記録を削除
    const recordIndex = character._skillEffects[this.id].findIndex(e => 
      e.type === 'specialEffect' && e.effectId === effectId
    );
    
    if (recordIndex !== -1) {
      character._skillEffects[this.id].splice(recordIndex, 1);
    }
    
    // 効果が空になったらエントリを削除
    if (character._skillEffects[this.id].length === 0) {
      delete character._skillEffects[this.id];
    }
  }
}

export default PassiveNode;