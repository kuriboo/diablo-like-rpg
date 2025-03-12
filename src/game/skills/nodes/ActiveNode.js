import SkillNode from './SkillNode';

/**
 * アクティブスキルノードクラス
 * 実行可能なアクションを提供するスキルを表現
 */
class ActiveNode extends SkillNode {
  /**
   * アクティブノードコンストラクタ
   * @param {Object} nodeData - ノードの初期データ
   */
  constructor(nodeData) {
    super(nodeData);
    this.actionId = nodeData.actionId || null; // 関連するSpecialActionのID
    this.manaCost = nodeData.manaCost || 0;
    this.cooldown = nodeData.cooldown || 0;
    this.range = nodeData.range || 1;
    this.area = nodeData.area || null;
    this.effects = nodeData.effects || [];
    this.upgrades = nodeData.upgrades || []; // スキル強化オプション
    this.level = 1; // スキルレベル
    this.maxLevel = nodeData.maxLevel || 1;
  }

  /**
   * アクティブスキルの効果をキャラクターに適用（スキル習得時）
   * @param {Object} character - 効果を適用するキャラクター
   * @param {Object} actionFactory - ActionFactoryのインスタンス
   * @override
   */
  applyEffects(character, actionFactory) {
    if (!character) return;

    if (!this.actionId) {
      console.warn(`Active skill ${this.name} has no associated actionId`);
      return;
    }

    // 対応するSpecialActionをキャラクターに追加
    if (actionFactory) {
      const action = actionFactory.createSpecialAction(this.actionId, {
        owner: character,
        level: this.level,
        manaCost: this.manaCost,
        cooldown: this.cooldown,
        range: this.range,
        area: this.area
      });

      if (action) {
        // キャラクターにアクションを追加
        if (!character.specialActions) {
          character.specialActions = new Map();
        }
        character.specialActions.set(this.actionId, action);
      }
    }

    // スキルの効果を記録
    if (!character._skillEffects) {
      character._skillEffects = {};
    }

    if (!character._skillEffects[this.id]) {
      character._skillEffects[this.id] = [];
    }

    character._skillEffects[this.id].push({
      type: 'activeSkill',
      actionId: this.actionId,
      level: this.level
    });

    console.log(`Applied active skill ${this.name} to ${character.name}`);
  }

  /**
   * アクティブスキルの効果を解除（スキルをリセットする場合）
   * @param {Object} character - 効果を解除するキャラクター
   * @override
   */
  removeEffects(character) {
    if (!character) return;

    // キャラクターからアクションを削除
    if (character.specialActions && character.specialActions.has(this.actionId)) {
      character.specialActions.delete(this.actionId);
    }

    // 効果記録を削除
    if (character._skillEffects && character._skillEffects[this.id]) {
      delete character._skillEffects[this.id];
    }

    console.log(`Removed active skill ${this.name} from ${character.name}`);
  }

  /**
   * スキルをレベルアップ
   * @param {Object} character - 対象キャラクター
   * @param {Object} actionFactory - ActionFactoryのインスタンス
   * @returns {boolean} - レベルアップに成功したかどうか
   */
  levelUp(character, actionFactory) {
    if (this.level >= this.maxLevel) {
      console.warn(`Skill ${this.name} is already at max level`);
      return false;
    }

    this.level += 1;

    // 既存のスキル効果を更新
    this.removeEffects(character);
    this.applyEffects(character, actionFactory);

    console.log(`Leveled up skill ${this.name} to level ${this.level}`);
    return true;
  }

  /**
   * スキルの現在の効果を取得
   * @returns {Object} - スキル効果データ
   */
  getCurrentEffects() {
    // レベルに基づいて効果の計算をする
    const currentEffects = {};

    // 基本効果の計算
    currentEffects.manaCost = Math.round(this.manaCost * (1 - (this.level - 1) * 0.05));
    currentEffects.cooldown = Math.max(1, Math.round(this.cooldown * (1 - (this.level - 1) * 0.03)));

    // アップグレードの適用
    if (this.level > 1 && this.upgrades.length > 0) {
      const applicableUpgrades = this.upgrades.filter(upgrade => upgrade.level <= this.level);
      
      for (const upgrade of applicableUpgrades) {
        if (upgrade.type === 'damage') {
          currentEffects.damageMultiplier = (currentEffects.damageMultiplier || 1) + upgrade.value;
        } else if (upgrade.type === 'range') {
          currentEffects.rangeBonus = (currentEffects.rangeBonus || 0) + upgrade.value;
        } else if (upgrade.type === 'area') {
          currentEffects.areaBonus = (currentEffects.areaBonus || 0) + upgrade.value;
        } else if (upgrade.type === 'effect') {
          if (!currentEffects.additionalEffects) {
            currentEffects.additionalEffects = [];
          }
          currentEffects.additionalEffects.push(upgrade.effect);
        }
      }
    }

    return currentEffects;
  }

  /**
   * reactflow用のノードデータを取得
   * @param {boolean} isUnlocked - ノードが解放されているかどうか
   * @param {boolean} isAvailable - ノードが利用可能かどうか
   * @returns {Object} - reactflow用のノードデータ
   * @override
   */
  getNodeData(isUnlocked, isAvailable) {
    return {
      id: this.id,
      type: 'skillNode',
      position: this.position,
      data: {
        label: this.name,
        nodeType: this.type,
        icon: this.icon,
        description: this.description,
        isUnlocked: isUnlocked,
        isAvailable: isAvailable,
        actionId: this.actionId,
        manaCost: this.manaCost,
        cooldown: this.cooldown,
        level: this.level,
        maxLevel: this.maxLevel
      }
    };
  }
}

export default ActiveNode;