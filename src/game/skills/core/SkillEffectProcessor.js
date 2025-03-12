import { v4 as uuidv4 } from 'uuid';

/**
 * スキル効果の処理を担当するクラス
 * キャラクターへのスキル効果の適用と解除を一元管理
 */
class SkillEffectProcessor {
  constructor() {
    this.uuid = uuidv4();
    this.effectHandlers = new Map();
    this._registerDefaultHandlers();
  }

  /**
   * デフォルトの効果ハンドラを登録
   * @private
   */
  _registerDefaultHandlers() {
    // 属性修正ハンドラ
    this.registerEffectHandler('attributeModifier', {
      apply: (character, effect, source) => {
        const { attribute, value } = effect;
        
        if (character[attribute] === undefined) {
          console.warn(`Character does not have attribute: ${attribute}`);
          return false;
        }
        
        // 効果を記録
        this._recordEffect(character, source, effect);
        
        // 属性値を修正
        character[attribute] += value;
        return true;
      },
      
      remove: (character, effect, source) => {
        const { attribute, value } = effect;
        
        if (character[attribute] === undefined) {
          console.warn(`Character does not have attribute: ${attribute}`);
          return false;
        }
        
        // 属性値を元に戻す
        character[attribute] -= value;
        
        // 効果記録を削除
        this._removeEffectRecord(character, source, effect);
        return true;
      }
    });
    
    // 耐性修正ハンドラ
    this.registerEffectHandler('resistanceModifier', {
      apply: (character, effect, source) => {
        const { resistance, value } = effect;
        const resistanceProp = `${resistance}Resistance`;
        
        if (character[resistanceProp] === undefined) {
          console.warn(`Character does not have resistance: ${resistanceProp}`);
          return false;
        }
        
        // 効果を記録
        this._recordEffect(character, source, effect);
        
        // 最大値を超えないように注意
        const maxResistance = 75.0;
        const newValue = Math.min(character[resistanceProp] + value, maxResistance);
        character[resistanceProp] = newValue;
        return true;
      },
      
      remove: (character, effect, source) => {
        const { resistance, value } = effect;
        const resistanceProp = `${resistance}Resistance`;
        
        if (character[resistanceProp] === undefined) {
          console.warn(`Character does not have resistance: ${resistanceProp}`);
          return false;
        }
        
        // 耐性値を元に戻す（最低値は0を下回らないようにする）
        character[resistanceProp] = Math.max(character[resistanceProp] - value, 0);
        
        // 効果記録を削除
        this._removeEffectRecord(character, source, effect);
        return true;
      }
    });
    
    // ダメージ修正ハンドラ
    this.registerEffectHandler('damageModifier', {
      apply: (character, effect, source) => {
        const { damageType, value, isPercentage } = effect;
        
        // 効果を記録
        this._recordEffect(character, source, effect);
        
        // キャラクターのダメージ修正リストに追加
        if (!character.damageModifiers) {
          character.damageModifiers = [];
        }
        
        character.damageModifiers.push({
          source,
          damageType,
          value,
          isPercentage
        });
        return true;
      },
      
      remove: (character, effect, source) => {
        const { damageType, value, isPercentage } = effect;
        
        // キャラクターのダメージ修正リストから削除
        if (character.damageModifiers && character.damageModifiers.length > 0) {
          const index = character.damageModifiers.findIndex(mod => 
            mod.source === source && 
            mod.damageType === damageType && 
            mod.value === value &&
            mod.isPercentage === isPercentage
          );
          
          if (index !== -1) {
            character.damageModifiers.splice(index, 1);
          }
        }
        
        // 効果記録を削除
        this._removeEffectRecord(character, source, effect);
        return true;
      }
    });
    
    // 特殊効果ハンドラ
    this.registerEffectHandler('specialEffect', {
      apply: (character, effect, source) => {
        const { effectId, params } = effect;
        
        // 効果を記録
        this._recordEffect(character, source, effect);
        
        // キャラクターの特殊効果リストに追加
        if (!character.specialEffects) {
          character.specialEffects = [];
        }
        
        character.specialEffects.push({
          source,
          effectId,
          params
        });
        return true;
      },
      
      remove: (character, effect, source) => {
        const { effectId } = effect;
        
        // キャラクターの特殊効果リストから削除
        if (character.specialEffects && character.specialEffects.length > 0) {
          const index = character.specialEffects.findIndex(e => 
            e.source === source && e.effectId === effectId
          );
          
          if (index !== -1) {
            character.specialEffects.splice(index, 1);
          }
        }
        
        // 効果記録を削除
        this._removeEffectRecord(character, source, effect);
        return true;
      }
    });
  }

  /**
   * 効果ハンドラを登録
   * @param {string} effectType - 効果タイプ
   * @param {Object} handler - 効果ハンドラオブジェクト（apply, removeメソッドを持つ）
   */
  registerEffectHandler(effectType, handler) {
    if (!handler.apply || !handler.remove) {
      console.error(`Invalid effect handler for type: ${effectType}`);
      return;
    }
    
    this.effectHandlers.set(effectType, handler);
  }

  /**
   * 効果をキャラクターに適用
   * @param {Object} character - 効果を適用するキャラクター
   * @param {Object} effect - 適用する効果
   * @param {string} source - 効果の出所（スキルIDなど）
   * @returns {boolean} - 適用成功したかどうか
   */
  applyEffect(character, effect, source) {
    if (!character || !effect || !effect.type) {
      console.error('Invalid parameters for applyEffect');
      return false;
    }
    
    const handler = this.effectHandlers.get(effect.type);
    
    if (!handler) {
      console.warn(`No handler registered for effect type: ${effect.type}`);
      return false;
    }
    
    return handler.apply(character, effect, source);
  }

  /**
   * 効果をキャラクターから解除
   * @param {Object} character - 効果を解除するキャラクター
   * @param {Object} effect - 解除する効果
   * @param {string} source - 効果の出所（スキルIDなど）
   * @returns {boolean} - 解除成功したかどうか
   */
  removeEffect(character, effect, source) {
    if (!character || !effect || !effect.type) {
      console.error('Invalid parameters for removeEffect');
      return false;
    }
    
    const handler = this.effectHandlers.get(effect.type);
    
    if (!handler) {
      console.warn(`No handler registered for effect type: ${effect.type}`);
      return false;
    }
    
    return handler.remove(character, effect, source);
  }

  /**
   * 複数の効果をキャラクターに適用
   * @param {Object} character - 効果を適用するキャラクター
   * @param {Array} effects - 適用する効果の配列
   * @param {string} source - 効果の出所（スキルIDなど）
   * @returns {boolean} - すべての効果の適用に成功したかどうか
   */
  applyEffects(character, effects, source) {
    if (!Array.isArray(effects)) {
      return this.applyEffect(character, effects, source);
    }
    
    let allSucceeded = true;
    
    for (const effect of effects) {
      const success = this.applyEffect(character, effect, source);
      if (!success) allSucceeded = false;
    }
    
    return allSucceeded;
  }

  /**
   * 複数の効果をキャラクターから解除
   * @param {Object} character - 効果を解除するキャラクター
   * @param {Array} effects - 解除する効果の配列
   * @param {string} source - 効果の出所（スキルIDなど）
   * @returns {boolean} - すべての効果の解除に成功したかどうか
   */
  removeEffects(character, effects, source) {
    if (!Array.isArray(effects)) {
      return this.removeEffect(character, effects, source);
    }
    
    let allSucceeded = true;
    
    for (const effect of effects) {
      const success = this.removeEffect(character, effect, source);
      if (!success) allSucceeded = false;
    }
    
    return allSucceeded;
  }

  /**
   * 特定の出所からの全ての効果を解除
   * @param {Object} character - 効果を解除するキャラクター
   * @param {string} source - 効果の出所（スキルIDなど）
   */
  removeAllEffectsFromSource(character, source) {
    if (!character || !source || !character._skillEffects) {
      return;
    }
    
    const effects = character._skillEffects[source];
    
    if (!effects) {
      return;
    }
    
    // 配列のコピーを作成（removeEffect内でspliceされるため）
    const effectsCopy = [...effects];
    
    for (const effect of effectsCopy) {
      this.removeEffect(character, effect, source);
    }
    
    // 確実に削除
    delete character._skillEffects[source];
  }

  /**
   * 効果をキャラクターに記録
   * @param {Object} character - キャラクター
   * @param {string} source - 効果の出所
   * @param {Object} effect - 効果オブジェクト
   * @private
   */
  _recordEffect(character, source, effect) {
    if (!character._skillEffects) {
      character._skillEffects = {};
    }
    
    if (!character._skillEffects[source]) {
      character._skillEffects[source] = [];
    }
    
    character._skillEffects[source].push({ ...effect });
  }

  /**
   * 効果記録を削除
   * @param {Object} character - キャラクター
   * @param {string} source - 効果の出所
   * @param {Object} effect - 効果オブジェクト
   * @private
   */
  _removeEffectRecord(character, source, effect) {
    if (!character._skillEffects || !character._skillEffects[source]) {
      return;
    }
    
    const index = character._skillEffects[source].findIndex(e => 
      e.type === effect.type &&
      JSON.stringify(e) === JSON.stringify(effect)
    );
    
    if (index !== -1) {
      character._skillEffects[source].splice(index, 1);
    }
    
    // 効果が空になったらエントリを削除
    if (character._skillEffects[source].length === 0) {
      delete character._skillEffects[source];
    }
  }
}

// シングルトンとしてエクスポート
const skillEffectProcessor = new SkillEffectProcessor();
export default skillEffectProcessor;