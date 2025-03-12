import Effect from '../objects/Effect';

export default class EffectFactory {
  constructor(scene) {
    this.scene = scene;
  }
  
  // エフェクトの作成
  createEffect(config = {}) {
    // 基本情報の設定
    const effectConfig = {
      ...config,
      scene: this.scene
    };
    
    // エフェクト名の設定（デフォルト）
    if (!effectConfig.name) {
      effectConfig.name = this.getDefaultEffectName(config.type);
    }
    
    // エフェクト説明の設定（デフォルト）
    if (!effectConfig.description) {
      effectConfig.description = this.getDefaultEffectDescription(config.type);
    }
    
    // エフェクトタイプに応じた処理
    switch (config.type) {
      case 'visual':
        return this.createVisualEffect(effectConfig);
      case 'stat':
        return this.createStatEffect(effectConfig);
      case 'damage':
        return this.createDamageEffect(effectConfig);
      case 'heal':
        return this.createHealEffect(effectConfig);
      case 'buff':
        return this.createBuffEffect(effectConfig);
      case 'debuff':
        return this.createDebuffEffect(effectConfig);
      default:
        return new Effect(effectConfig);
    }
  }
  
  // 視覚的エフェクトの作成
  createVisualEffect(config) {
    // エフェクト名に応じた設定
    let effectValue = { ...config.value };
    
    // エフェクト名がない場合は引数の名前を使用
    const effectName = config.name;
    
    // エフェクト固有の設定
    switch (effectName) {
      case 'slash_effect':
        effectValue = {
          spriteKey: 'effect_slash',
          animKey: 'slash_anim',
          scale: 1,
          lifespan: 500,
          followTarget: true
        };
        break;
      
      case 'impact_effect':
        effectValue = {
          spriteKey: 'effect_impact',
          animKey: 'impact_anim',
          scale: 1,
          lifespan: 300
        };
        break;
      
      case 'explosion_effect':
        effectValue = {
          particleKey: 'particle',
          tint: 0xff5500,
          lifespan: 1000,
          speed: { min: 50, max: 100 },
          scale: { start: 0.5, end: 0 },
          quantity: 50,
          emitting: false,
          explode: true
        };
        break;
      
      case 'fire_effect':
        effectValue = {
          particleKey: 'particle',
          tint: 0xff3300,
          lifespan: 800,
          speed: { min: 10, max: 30 },
          scale: { start: 0.3, end: 0 },
          quantity: 8,
          emitting: true,
          blendMode: 'ADD'
        };
        break;
      
      case 'ice_effect':
        effectValue = {
          particleKey: 'particle',
          tint: 0x88ccff,
          lifespan: 1200,
          speed: { min: 5, max: 20 },
          scale: { start: 0.4, end: 0 },
          quantity: 6,
          emitting: true,
          blendMode: 'SCREEN'
        };
        break;
      
      case 'poison_effect':
        effectValue = {
          particleKey: 'particle',
          tint: 0x88ff00,
          lifespan: 1500,
          speed: { min: 5, max: 15 },
          scale: { start: 0.3, end: 0 },
          quantity: 4,
          emitting: true,
          blendMode: 'NORMAL'
        };
        break;
      
      case 'electric_effect':
        effectValue = {
          particleKey: 'particle',
          tint: 0xffff00,
          lifespan: 300,
          speed: { min: 40, max: 80 },
          scale: { start: 0.2, end: 0 },
          quantity: 10,
          emitting: false,
          explode: true,
          blendMode: 'SCREEN'
        };
        break;
      
      case 'heal_effect':
        effectValue = {
          particleKey: 'particle',
          tint: 0x00ff00,
          lifespan: 1000,
          speed: { min: 20, max: 40 },
          scale: { start: 0.4, end: 0 },
          quantity: 15,
          emitting: false,
          explode: true,
          blendMode: 'SCREEN'
        };
        break;
      
      case 'buff_effect':
        effectValue = {
          particleKey: 'particle',
          tint: 0xffff00,
          lifespan: 1000,
          speed: { min: 10, max: 30 },
          scale: { start: 0.3, end: 0 },
          quantity: 12,
          emitting: false,
          explode: true,
          blendMode: 'SCREEN'
        };
        break;
      
      case 'debuff_effect':
        effectValue = {
          particleKey: 'particle',
          tint: 0xff00ff,
          lifespan: 1000,
          speed: { min: 10, max: 30 },
          scale: { start: 0.3, end: 0 },
          quantity: 12,
          emitting: false,
          explode: true,
          blendMode: 'SCREEN'
        };
        break;
      
      case 'teleport_effect':
        effectValue = {
          particleKey: 'particle',
          tint: 0x0088ff,
          lifespan: 800,
          speed: { min: 30, max: 60 },
          scale: { start: 0.5, end: 0 },
          quantity: 30,
          emitting: false,
          explode: true,
          blendMode: 'SCREEN'
        };
        break;
      
      case 'level_up_effect':
        effectValue = {
          particleKey: 'particle',
          tint: 0xffdd00,
          lifespan: 2000,
          speed: { min: 30, max: 80 },
          scale: { start: 0.6, end: 0 },
          quantity: 50,
          emitting: false,
          explode: true,
          blendMode: 'SCREEN'
        };
        break;
        
      case 'summon_appear':
        effectValue = {
          particleKey: 'particle',
          tint: 0x8844ff,
          lifespan: 1200,
          speed: { min: 20, max: 50 },
          scale: { start: 0.5, end: 0 },
          quantity: 30,
          emitting: false,
          explode: true,
          blendMode: 'SCREEN'
        };
        break;
        
      case 'summon_disappear':
        effectValue = {
          particleKey: 'particle',
          tint: 0xaaccff,
          lifespan: 1000,
          speed: { min: 30, max: 60 },
          scale: { start: 0.4, end: 0 },
          quantity: 30,
          emitting: false,
          explode: true,
          blendMode: 'SCREEN'
        };
        break;
    }
    
    // エフェクト設定
    const visualConfig = {
      ...config,
      value: effectValue,
      duration: effectValue.lifespan || config.duration || 1000
    };
    
    // エフェクト作成
    return new Effect(visualConfig);
  }
  
  // ステータス効果の作成
  createStatEffect(config) {
    const statConfig = {
      ...config,
      duration: config.duration || 10000
    };
    
    return new Effect(statConfig);
  }
  
  // ダメージ効果の作成
  createDamageEffect(config) {
    // ダメージエフェクトの設定
    const damageConfig = {
      ...config,
      duration: 0  // 即時効果
    };
    
    return new Effect(damageConfig);
  }
  
  // 回復効果の作成
  createHealEffect(config) {
    // 回復エフェクトの設定
    const healConfig = {
      ...config,
      duration: 0  // 即時効果
    };
    
    return new Effect(healConfig);
  }
  
  // バフ効果の作成
  createBuffEffect(config) {
    // バフ効果の設定
    const buffConfig = {
      ...config,
      duration: config.duration || 10000
    };
    
    // バフ固有の効果
    if (!buffConfig.value) {
      buffConfig.value = {};
    }
    
    // バフアイコンの設定
    if (!buffConfig.value.icon) {
      buffConfig.value.icon = `buff_${config.name || 'default'}`;
    }
    
    return new Effect(buffConfig);
  }
  
  // デバフ効果の作成
  createDebuffEffect(config) {
    // デバフ効果の設定
    const debuffConfig = {
      ...config,
      duration: config.duration || 5000
    };
    
    // デバフ固有の効果
    if (!debuffConfig.value) {
      debuffConfig.value = {};
    }
    
    // デバフアイコンの設定
    if (!debuffConfig.value.icon) {
      debuffConfig.value.icon = `debuff_${config.name || 'default'}`;
    }
    
    return new Effect(debuffConfig);
  }
  
  // デフォルトのエフェクト名
  getDefaultEffectName(type) {
    switch (type) {
      case 'visual':
        return 'visual_effect';
      case 'stat':
        return 'stat_effect';
      case 'damage':
        return 'damage_effect';
      case 'heal':
        return 'heal_effect';
      case 'buff':
        return 'buff_effect';
      case 'debuff':
        return 'debuff_effect';
      default:
        return 'effect';
    }
  }
  
  // デフォルトのエフェクト説明
  getDefaultEffectDescription(type) {
    switch (type) {
      case 'visual':
        return '視覚的なエフェクト';
      case 'stat':
        return 'ステータスに影響するエフェクト';
      case 'damage':
        return 'ダメージを与えるエフェクト';
      case 'heal':
        return '回復効果';
      case 'buff':
        return '一時的な強化効果';
      case 'debuff':
        return '一時的な弱体化効果';
      default:
        return 'エフェクト';
    }
  }
  
  // 標準的なエフェクト作成のヘルパーメソッド
  
  // ダメージエフェクト作成ヘルパー
  createDamageEffectHelper(source, target, damage, damageType, options = {}) {
    return this.createEffect({
      type: 'damage',
      name: options.name || `${damageType}_damage`,
      description: options.description || `${damageType}ダメージを与える`,
      source: source,
      target: target,
      value: {
        amount: damage,
        damageType: damageType,
        canCrit: options.canCrit !== undefined ? options.canCrit : true,
        lifeLeech: options.lifeLeech || 0,
        manaLeech: options.manaLeech || 0
      },
      sound: options.sound
    });
  }
  
  // 回復エフェクト作成ヘルパー
  createHealEffectHelper(source, target, amount, healType, options = {}) {
    return this.createEffect({
      type: 'heal',
      name: options.name || `${healType}_heal`,
      description: options.description || `${healType}を回復する`,
      source: source,
      target: target,
      value: {
        amount: amount,
        healType: healType
      },
      sound: options.sound
    });
  }
  
  // バフエフェクト作成ヘルパー
  createBuffEffectHelper(target, buffName, effects, duration, options = {}) {
    return this.createEffect({
      type: 'buff',
      name: buffName,
      description: options.description || `${buffName}の効果`,
      target: target,
      duration: duration,
      value: {
        effects: effects,
        icon: options.icon || `buff_${buffName.toLowerCase().replace(/\s+/g, '_')}`
      },
      sound: options.sound
    });
  }
  
  // デバフエフェクト作成ヘルパー
  createDebuffEffectHelper(source, target, debuffName, effects, duration, options = {}) {
    return this.createEffect({
      type: 'debuff',
      name: debuffName,
      description: options.description || `${debuffName}の効果`,
      source: source,
      target: target,
      duration: duration,
      value: {
        effects: effects,
        type: options.element || 'normal',
        icon: options.icon || `debuff_${debuffName.toLowerCase().replace(/\s+/g, '_')}`
      },
      sound: options.sound
    });
  }
  
  // DoTエフェクト（継続的なダメージ）作成ヘルパー
  createDotEffectHelper(source, target, damage, damageType, duration, options = {}) {
    return this.createEffect({
      type: 'debuff',
      name: options.name || `${damageType}_dot`,
      description: options.description || `継続的な${damageType}ダメージ`,
      source: source,
      target: target,
      duration: duration,
      value: {
        effects: {
          dotDamage: damage,
          dotType: damageType
        },
        type: damageType,
        icon: options.icon || `dot_${damageType}`
      },
      sound: options.sound
    });
  }
  
  // スタンエフェクト作成ヘルパー
  createStunEffectHelper(source, target, duration, options = {}) {
    return this.createEffect({
      type: 'debuff',
      name: options.name || 'スタン',
      description: options.description || '行動不能',
      source: source,
      target: target,
      duration: duration,
      value: {
        effects: {
          isStunned: true
        },
        icon: options.icon || 'debuff_stun'
      },
      sound: options.sound || 'stun_sound',
      onStart: () => {
        if (target && target.setStunned) {
          target.setStunned(duration);
        }
      }
    });
  }
  
  // スロウエフェクト作成ヘルパー
  createSlowEffectHelper(source, target, slowAmount, duration, options = {}) {
    return this.createEffect({
      type: 'debuff',
      name: options.name || 'スロウ',
      description: options.description || '移動速度低下',
      source: source,
      target: target,
      duration: duration,
      value: {
        effects: {
          moveSpeedBonus: -slowAmount
        },
        icon: options.icon || 'debuff_slow'
      },
      sound: options.sound
    });
  }
}