import Action from '../actions/Action';
import BasicAction from '../actions/BasicAction';
import SpecialAction from '../actions/SpecialAction';
import { ActionType } from '../../constants/actionTypes';

export default class ActionFactory {
  constructor(scene) {
    this.scene = scene;
  }
  
  // 基本アクションの作成
  createBasicAction(config = {}) {
    // アクションタイプを取得
    const type = config.type || ActionType.NONE;
    
    // アクション所有者
    const owner = config.owner || null;
    
    // アクション設定
    const actionConfig = {
      ...config,
      type: type,
      owner: owner,
      scene: this.scene
    };
    
    // アクション名の設定（デフォルト）
    if (!actionConfig.name) {
      actionConfig.name = this.getDefaultActionName(type);
    }
    
    // アクション説明の設定（デフォルト）
    if (!actionConfig.description) {
      actionConfig.description = this.getDefaultActionDescription(type);
    }
    
    // エフェクトキーの設定（デフォルト）
    if (!actionConfig.effectKey) {
      actionConfig.effectKey = this.getDefaultEffectKey(type);
    }
    
    // サウンドキーの設定（デフォルト）
    if (!actionConfig.soundKey) {
      actionConfig.soundKey = this.getDefaultSoundKey(type);
    }
    
    // アニメーションキーの設定（デフォルト）
    if (!actionConfig.animationKey) {
      actionConfig.animationKey = this.getDefaultAnimationKey(type, owner);
    }
    
    // アクションタイプに応じた処理
    switch (type) {
      case ActionType.MOVE:
        return this.createMoveAction(actionConfig);
      case ActionType.ATTACK:
        return this.createAttackAction(actionConfig);
      case ActionType.CAST:
        return this.createCastAction(actionConfig);
      case ActionType.HEAL:
        return this.createHealAction(actionConfig);
      case ActionType.USE_ITEM:
        return this.createUseItemAction(actionConfig);
      case ActionType.INTERACT:
        return this.createInteractAction(actionConfig);
      default:
        return new BasicAction(actionConfig);
    }
  }
  
  // 特殊アクションの作成
  createSpecialAction(config = {}) {
    // スキル情報の取得
    const skill = config.skill || null;
    
    // アクションタイプを取得
    const type = config.type || (skill ? skill.type : ActionType.NONE);
    
    // アクション所有者
    const owner = config.owner || null;
    
    // アクション設定
    const actionConfig = {
      ...config,
      type: this.getSpecialActionType(type),
      owner: owner,
      scene: this.scene,
      skill: skill
    };
    
    // アクション名の設定（デフォルト）
    if (!actionConfig.name && skill) {
      actionConfig.name = skill.name;
    } else if (!actionConfig.name) {
      actionConfig.name = this.getDefaultSpecialActionName(type);
    }
    
    // アクション説明の設定（デフォルト）
    if (!actionConfig.description && skill) {
      actionConfig.description = skill.description;
    } else if (!actionConfig.description) {
      actionConfig.description = this.getDefaultSpecialActionDescription(type);
    }
    
    // アイコンの設定
    if (!actionConfig.icon && skill) {
      actionConfig.icon = skill.icon;
    }
    
    // 特殊アクションの作成
    return new SpecialAction(actionConfig);
  }
  
  // 移動アクションの作成
  createMoveAction(config) {
    // 移動特有の設定
    const moveConfig = {
      ...config,
      duration: config.duration || this.calculateMoveDuration(config)
    };
    
    return new BasicAction(moveConfig);
  }
  
  // 攻撃アクションの作成
  createAttackAction(config) {
    // 攻撃特有の設定
    const attackConfig = {
      ...config,
      value: config.value !== undefined ? config.value : this.calculateAttackDamage(config.owner),
      range: config.range || this.getAttackRange(config.owner),
      element: config.element || 'physical',
      duration: config.duration || 500
    };
    
    return new BasicAction(attackConfig);
  }
  
  // 魔法詠唱アクションの作成
  createCastAction(config) {
    // 詠唱特有の設定
    const castConfig = {
      ...config,
      value: config.value !== undefined ? config.value : this.calculateSpellDamage(config.owner, config.element),
      element: config.element || 'fire',
      areaOfEffect: config.areaOfEffect !== undefined ? config.areaOfEffect : false,
      areaRadius: config.areaRadius || 150,
      duration: config.duration || 800
    };
    
    return new BasicAction(castConfig);
  }
  
  // 回復アクションの作成
  createHealAction(config) {
    // 回復特有の設定
    const healConfig = {
      ...config,
      value: config.value !== undefined ? config.value : this.calculateHealAmount(config.owner),
      areaOfEffect: config.areaOfEffect !== undefined ? config.areaOfEffect : false,
      areaRadius: config.areaRadius || 150,
      duration: config.duration || 500
    };
    
    return new BasicAction(healConfig);
  }
  
  // アイテム使用アクションの作成
  createUseItemAction(config) {
    // アイテム使用特有の設定
    const useItemConfig = {
      ...config,
      duration: config.duration || 500
    };
    
    return new BasicAction(useItemConfig);
  }
  
  // インタラクションアクションの作成
  createInteractAction(config) {
    // インタラクション特有の設定
    const interactConfig = {
      ...config,
      duration: config.duration || 300
    };
    
    return new BasicAction(interactConfig);
  }
  
  // 移動時間の計算
  calculateMoveDuration(config) {
    if (!config.owner || !config.position) return 500;
    
    // 移動距離と速度に基づく時間計算
    const distance = Phaser.Math.Distance.Between(
      config.owner.x, config.owner.y,
      config.position.x, config.position.y
    );
    
    const speed = config.owner.getMoveSpeed ? 
                 config.owner.getMoveSpeed() : 2;
    
    return Math.max(100, distance / speed * 100);
  }
  
  // 攻撃ダメージの計算
  calculateAttackDamage(owner) {
    if (!owner) return 10;
    
    // キャラクターの基本攻撃力
    let damage = owner.basicAttack || 10;
    
    // クラスや武器の補正を適用
    if (owner.characterEquipments && owner.characterEquipments.rightHand) {
      // 武器による追加ダメージ
      if (owner.bonusAttack) {
        damage *= (1 + owner.bonusAttack);
      }
    }
    
    return Math.floor(damage);
  }
  
  // 魔法ダメージの計算
  calculateSpellDamage(owner, element) {
    if (!owner) return 15;
    
    // 基本魔法ダメージ
    let damage = 15;
    
    // エネルギーによる補正
    if (owner.energy) {
      damage += Math.floor(owner.energy * 0.5);
    }
    
    // 属性ダメージの追加
    if (element === 'fire' && owner.fireDamage) {
      damage += owner.fireDamage;
    } else if (element === 'cold' && owner.coldDamage) {
      damage += owner.coldDamage;
    } else if (element === 'poison' && owner.poisonDamage) {
      damage += owner.poisonDamage;
    } else if (element === 'electric' && owner.electricDamage) {
      damage += owner.electricDamage;
    }
    
    return Math.floor(damage);
  }
  
  // 回復量の計算
  calculateHealAmount(owner) {
    if (!owner) return 30;
    
    // 基本回復量
    let amount = 30;
    
    // エネルギーによる補正
    if (owner.energy) {
      amount += Math.floor(owner.energy * 0.3);
    }
    
    // 回復力補正
    if (owner.healingPower) {
      amount *= (1 + owner.healingPower / 100);
    }
    
    return Math.floor(amount);
  }
  
  // 攻撃範囲の取得
  getAttackRange(owner) {
    if (!owner) return 1;
    
    // デフォルトは近接攻撃
    let range = 1;
    
    // 装備に基づく範囲
    if (owner.characterEquipments && owner.characterEquipments.rightHand) {
      const weapon = owner.characterEquipments.rightHand;
      
      // 遠距離武器の場合
      if (weapon.type === 'oneHandLongRangeWeapon' || 
          weapon.type === 'twoHandLongRangeWeapon') {
        range = 5; // 遠距離
      }
    }
    
    return range;
  }
  
  // 特殊アクションタイプの取得
  getSpecialActionType(type) {
    switch (type) {
      case 'bash':
      case 'slash':
      case 'pierce':
      case 'vital_strike':
        return ActionType.SKILL_ATTACK;
      
      case 'fireball':
      case 'ice_spike':
      case 'lightning_bolt':
      case 'poison_cloud':
        return ActionType.SKILL_AREA_ATTACK;
      
      case 'battle_cry':
      case 'bless':
      case 'haste':
      case 'shadow_hide':
        return ActionType.SKILL_BUFF;
      
      case 'weaken':
      case 'curse':
      case 'slow':
      case 'blind':
        return ActionType.SKILL_DEBUFF;
      
      case 'heal':
      case 'regeneration':
      case 'cure':
        return ActionType.SKILL_HEAL;
      
      case 'summon_wolf':
      case 'summon_golem':
      case 'summon_familiar':
        return ActionType.SKILL_SUMMON;
      
      case 'dash':
      case 'teleport':
      case 'charge':
      case 'jump':
        return ActionType.SKILL_MOVEMENT;
      
      case 'combo_attack':
      case 'skill_sequence':
        return ActionType.SKILL_COMBO;
      
      default:
        return ActionType.SKILL_ATTACK; // デフォルト
    }
  }
  
  // デフォルトのアクション名
  getDefaultActionName(type) {
    switch (type) {
      case ActionType.MOVE:
        return '移動';
      case ActionType.ATTACK:
        return '攻撃';
      case ActionType.CAST:
        return '魔法詠唱';
      case ActionType.HEAL:
        return '回復';
      case ActionType.USE_ITEM:
        return 'アイテム使用';
      case ActionType.INTERACT:
        return '相互作用';
      default:
        return 'アクション';
    }
  }
  
  // デフォルトのアクション説明
  getDefaultActionDescription(type) {
    switch (type) {
      case ActionType.MOVE:
        return '指定した位置まで移動します。';
      case ActionType.ATTACK:
        return '対象に攻撃を行います。';
      case ActionType.CAST:
        return '魔法を詠唱して発動します。';
      case ActionType.HEAL:
        return '対象を回復します。';
      case ActionType.USE_ITEM:
        return 'アイテムを使用します。';
      case ActionType.INTERACT:
        return '対象と相互作用します。';
      default:
        return 'アクションを実行します。';
    }
  }
  
  // デフォルトの特殊アクション名
  getDefaultSpecialActionName(type) {
    switch (type) {
      case ActionType.SKILL_ATTACK:
        return '特殊攻撃';
      case ActionType.SKILL_AREA_ATTACK:
        return '範囲攻撃';
      case ActionType.SKILL_BUFF:
        return '強化魔法';
      case ActionType.SKILL_DEBUFF:
        return '弱体化魔法';
      case ActionType.SKILL_HEAL:
        return '回復魔法';
      case ActionType.SKILL_SUMMON:
        return '召喚魔法';
      case ActionType.SKILL_MOVEMENT:
        return '移動技';
      case ActionType.SKILL_COMBO:
        return 'コンボ攻撃';
      default:
        return '特殊技';
    }
  }
  
  // デフォルトの特殊アクション説明
  getDefaultSpecialActionDescription(type) {
    switch (type) {
      case ActionType.SKILL_ATTACK:
        return '対象に特殊な攻撃を行います。';
      case ActionType.SKILL_AREA_ATTACK:
        return '範囲内の敵に攻撃を行います。';
      case ActionType.SKILL_BUFF:
        return '対象を強化する魔法を掛けます。';
      case ActionType.SKILL_DEBUFF:
        return '対象を弱体化する魔法を掛けます。';
      case ActionType.SKILL_HEAL:
        return '対象を回復する魔法を掛けます。';
      case ActionType.SKILL_SUMMON:
        return '援軍を召喚します。';
      case ActionType.SKILL_MOVEMENT:
        return '素早い移動を行います。';
      case ActionType.SKILL_COMBO:
        return '連続した攻撃を行います。';
      default:
        return '特殊な技を使用します。';
    }
  }
  
  // デフォルトのエフェクトキー
  getDefaultEffectKey(type) {
    switch (type) {
      case ActionType.MOVE:
        return 'move_effect';
      case ActionType.ATTACK:
        return 'attack_effect';
      case ActionType.CAST:
        return 'cast_effect';
      case ActionType.HEAL:
        return 'heal_effect';
      case ActionType.USE_ITEM:
        return 'use_item_effect';
      case ActionType.INTERACT:
        return 'interact_effect';
      default:
        return 'default_effect';
    }
  }
  
  // デフォルトのサウンドキー
  getDefaultSoundKey(type) {
    switch (type) {
      case ActionType.MOVE:
        return 'footstep_sound';
      case ActionType.ATTACK:
        return 'attack_sound';
      case ActionType.CAST:
        return 'cast_sound';
      case ActionType.HEAL:
        return 'heal_sound';
      case ActionType.USE_ITEM:
        return 'use_item_sound';
      case ActionType.INTERACT:
        return 'interact_sound';
      default:
        return 'default_sound';
    }
  }
  
  // デフォルトのアニメーションキー
  getDefaultAnimationKey(type, owner) {
    if (!owner) return '';
    
    // キャラクタータイプを取得
    const characterType = owner.constructor.name.toLowerCase();
    
    switch (type) {
      case ActionType.MOVE:
        return `${characterType}_walk`;
      case ActionType.ATTACK:
        return `${characterType}_attack`;
      case ActionType.CAST:
        return `${characterType}_cast`;
      case ActionType.HEAL:
        return `${characterType}_cast`;
      case ActionType.USE_ITEM:
        return `${characterType}_use`;
      case ActionType.INTERACT:
        return `${characterType}_interact`;
      default:
        return `${characterType}_idle`;
    }
  }
}