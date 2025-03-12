import { v4 as uuidv4 } from 'uuid';
import Action from '../actions/Action';
import BasicAction from '../actions/BasicAction';
import SpecialAction from '../actions/SpecialAction';
import { ActionType } from '../../constants/actionTypes';
import skillTreeManager from '../skills/core/SkillTreeManager';

/**
 * アクションファクトリークラス
 * ゲーム内で使用される各種アクションを生成する責務を持つ
 */
class ActionFactory {
  constructor() {
    this.uuid = uuidv4();
    this.actionTemplates = new Map(); // テンプレートアクションのマップ
    this._initializeTemplates();
  }

  /**
   * 基本的なアクションテンプレートを初期化
   * @private
   */
  _initializeTemplates() {
    // 基本アクションテンプレートの登録
    this._registerBasicActions();
    
    // 特殊アクションテンプレートの登録
    this._registerSpecialActions();
  }

  /**
   * 基本アクションテンプレートを登録
   * @private
   */
  _registerBasicActions() {
    // 移動アクション
    this.actionTemplates.set('move', {
      type: ActionType.MOVE,
      name: '移動',
      description: '指定した位置に移動します',
      duration: 500
    });
    
    // 攻撃アクション
    this.actionTemplates.set('attack', {
      type: ActionType.ATTACK,
      name: '攻撃',
      description: '近接攻撃を行います',
      duration: 500
    });
    
    // 範囲攻撃アクション
    this.actionTemplates.set('area_attack', {
      type: ActionType.ATTACK,
      name: '範囲攻撃',
      description: '範囲内の敵に攻撃を行います',
      duration: 800,
      areaOfEffect: true,
      areaRadius: 100
    });
    
    // 魔法攻撃アクション
    this.actionTemplates.set('cast_attack', {
      type: ActionType.CAST,
      name: '魔法攻撃',
      description: '魔法攻撃を行います',
      duration: 800,
      element: 'fire'
    });
    
    // 回復アクション
    this.actionTemplates.set('heal', {
      type: ActionType.HEAL,
      name: '回復',
      description: 'HPを回復します',
      duration: 500
    });
    
    // アイテム使用アクション
    this.actionTemplates.set('use_item', {
      type: ActionType.USE_ITEM,
      name: 'アイテム使用',
      description: 'アイテムを使用します',
      duration: 500
    });
    
    // インタラクションアクション
    this.actionTemplates.set('interact', {
      type: ActionType.INTERACT,
      name: '相互作用',
      description: 'オブジェクトと相互作用します',
      duration: 300
    });
  }

  /**
   * 特殊アクションテンプレートを登録
   * @private
   */
  _registerSpecialActions() {
    // 単体攻撃スキル
    this.actionTemplates.set('skill_slash', {
      type: ActionType.SKILL_ATTACK,
      name: 'スラッシュ',
      description: '敵に強力な一撃を与えます',
      cooldown: 8000,
      manaCost: 10,
      skill: {
        damage: 20,
        element: 'physical',
        range: 1,
        castTime: 500
      }
    });
    
    // 範囲攻撃スキル
    this.actionTemplates.set('skill_fire_nova', {
      type: ActionType.SKILL_AREA_ATTACK,
      name: 'ファイアノヴァ',
      description: '周囲の敵に炎のダメージを与えます',
      cooldown: 15000,
      manaCost: 25,
      skill: {
        damage: 15,
        element: 'fire',
        areaOfEffect: true,
        radius: 150,
        castTime: 800
      }
    });
    
    // バフスキル
    this.actionTemplates.set('skill_battle_shout', {
      type: ActionType.SKILL_BUFF,
      name: 'バトルシャウト',
      description: '味方の攻撃力を一時的に上昇させます',
      cooldown: 30000,
      manaCost: 20,
      skill: {
        duration: 10000,
        targetSelf: false,
        areaOfEffect: true,
        radius: 200,
        effects: {
          attackBonus: 20 // 攻撃力20%上昇
        }
      }
    });
    
    // デバフスキル
    this.actionTemplates.set('skill_weaken', {
      type: ActionType.SKILL_DEBUFF,
      name: 'ウィークン',
      description: '敵の防御力を一時的に下げます',
      cooldown: 20000,
      manaCost: 15,
      skill: {
        duration: 8000,
        element: 'physical',
        effects: {
          defenceReduction: 30 // 防御力30%減少
        }
      }
    });
    
    // 回復スキル
    this.actionTemplates.set('skill_heal', {
      type: ActionType.SKILL_HEAL,
      name: 'ヒール',
      description: '味方のHPを回復します',
      cooldown: 15000,
      manaCost: 30,
      skill: {
        healAmount: 50,
        targetSelf: false,
        castTime: 800
      }
    });
    
    // 召喚スキル
    this.actionTemplates.set('skill_summon', {
      type: ActionType.SKILL_SUMMON,
      name: 'サモン',
      description: '一定時間戦闘を助けるコンパニオンを召喚します',
      cooldown: 60000,
      manaCost: 50,
      skill: {
        summonType: 'skeleton',
        summonDuration: 30000,
        castTime: 1500
      }
    });
    
    // 移動/位置操作系スキル
    this.actionTemplates.set('skill_dash', {
      type: ActionType.SKILL_MOVEMENT,
      name: 'ダッシュ',
      description: '素早く前方に移動します',
      cooldown: 5000,
      manaCost: 5,
      skill: {
        moveDistance: 200,
        moveSpeed: 8,
        castTime: 300
      }
    });
    
    // 複合スキル
    this.actionTemplates.set('skill_combo_attack', {
      type: ActionType.SKILL_COMBO,
      name: 'コンボアタック',
      description: '3連続の攻撃を行います',
      cooldown: 20000,
      manaCost: 25,
      skill: {
        actions: [
          { type: 'attack', damage: 15, duration: 300 },
          { type: 'move', dx: 50, dy: 0, duration: 200 },
          { type: 'attack', damage: 20, duration: 300 }
        ]
      }
    });
  }

  /**
   * 基本アクションを作成
   * @param {string} actionKey - アクションのキー
   * @param {Object} config - 追加設定
   * @returns {BasicAction} - 作成された基本アクション
   */
  createBasicAction(actionKey, config = {}) {
    // テンプレートが存在するか確認
    if (!this.actionTemplates.has(actionKey)) {
      console.error(`Action template not found: ${actionKey}`);
      return null;
    }
    
    // テンプレートを取得
    const template = this.actionTemplates.get(actionKey);
    
    // 設定をマージ
    const actionConfig = {
      ...template,
      ...config
    };
    
    // アクションを作成して返す
    return new BasicAction(actionConfig);
  }

  /**
   * 特殊アクション（スキル）を作成
   * @param {string} actionKey - スキルのキー
   * @param {Object} config - 追加設定
   * @returns {SpecialAction} - 作成された特殊アクション
   */
  createSpecialAction(actionKey, config = {}) {
    // アクションキーがスキルIDの場合、ロードする
    if (actionKey.startsWith('skill_')) {
      // テンプレートが存在するか確認
      if (!this.actionTemplates.has(actionKey)) {
        console.error(`Skill template not found: ${actionKey}`);
        return null;
      }
      
      // テンプレートを取得
      const template = this.actionTemplates.get(actionKey);
      
      // 設定をマージ
      const actionConfig = {
        ...template,
        ...config
      };
      
      // スキルアクションを作成して返す
      return new SpecialAction(actionConfig);
    }
    // スキルツリーからスキルを取得する場合
    else {
      return this._createSpecialActionFromSkillTree(actionKey, config);
    }
  }

  /**
   * スキルツリーからスキルを取得して特殊アクションを作成
   * @param {string} skillId - スキルID
   * @param {Object} config - 追加設定
   * @returns {SpecialAction} - 作成された特殊アクション
   * @private
   */
  _createSpecialActionFromSkillTree(skillId, config = {}) {
    // スキルツリーマネージャーからスキルノードデータを取得
    const skillData = skillTreeManager.getSkillNodeById(skillId);
    
    if (!skillData) {
      console.error(`Skill not found in skill tree: ${skillId}`);
      return null;
    }
    
    // スキルタイプに応じたアクションタイプを決定
    let actionType = ActionType.SKILL_ATTACK;
    if (skillData.isAreaAttack) {
      actionType = ActionType.SKILL_AREA_ATTACK;
    } else if (skillData.isMovement) {
      actionType = ActionType.SKILL_MOVEMENT;
    } else if (skillData.isHeal) {
      actionType = ActionType.SKILL_HEAL;
    } else if (skillData.isBuff) {
      actionType = ActionType.SKILL_BUFF;
    } else if (skillData.isDebuff) {
      actionType = ActionType.SKILL_DEBUFF;
    } else if (skillData.isSummon) {
      actionType = ActionType.SKILL_SUMMON;
    } else if (skillData.isCombo) {
      actionType = ActionType.SKILL_COMBO;
    }
    
    // スキルの現在の効果を取得（レベルに応じた効果）
    const currentEffects = skillData.getCurrentEffects ? 
                          skillData.getCurrentEffects() : {};
    
    // スキル設定を構築
    const skillConfig = {
      type: actionType,
      name: skillData.name,
      description: skillData.description,
      cooldown: currentEffects.cooldown || skillData.cooldown || 10000,
      manaCost: currentEffects.manaCost || skillData.manaCost || 10,
      skill: {
        damage: currentEffects.damage || skillData.damage || 10,
        element: skillData.element || 'physical',
        range: skillData.range || 1,
        areaOfEffect: skillData.isAreaAttack,
        radius: currentEffects.areaBonus ? 
               (skillData.radius + currentEffects.areaBonus) : skillData.radius,
        duration: skillData.duration || 5000,
        healAmount: currentEffects.healAmount || skillData.healAmount || 0,
        castTime: skillData.castTime || 500,
        targetSelf: skillData.targetSelf || false,
        effects: skillData.effects || {},
        level: skillData.level || 1,
        // 追加効果
        ...currentEffects.additionalEffects
      },
      // 追加の設定をマージ
      ...config
    };
    
    // スキルアクションを作成して返す
    return new SpecialAction(skillConfig);
  }

  /**
   * スキルIDからスキルアクションを直接生成
   * UIやスキルツリーから呼び出される際に使用
   * @param {string} skillId - スキルID
   * @param {Object} character - キャラクターオブジェクト
   * @returns {SpecialAction} - 作成された特殊アクション
   */
  createActionFromSkillId(skillId, character) {
    return this.createSpecialAction(skillId, {
      owner: character,
      scene: character.scene
    });
  }
}

// シングルトンとしてエクスポート
const actionFactory = new ActionFactory();
export default actionFactory;