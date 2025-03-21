/**
 * スキルツリーノードの基底クラス
 */
class SkillNode {
  /**
   * ノードの基本コンストラクタ
   * @param {Object} nodeData - ノードの初期データ
   */
  constructor(nodeData) {
    this.id = nodeData.id || '';
    this.type = nodeData.type || 'unknown';
    this.position = nodeData.position || { x: 0, y: 0 };
    this.name = nodeData.name || 'Unknown Skill';
    this.description = nodeData.description || '';
    this.icon = nodeData.icon || 'default.png';
    this.requiredLevel = nodeData.requiredLevel || 1;
    this.requiredPoints = nodeData.requiredPoints || 1;
    this.connections = nodeData.connections || [];
    this.connectedNodes = []; // 実際のノードオブジェクトへの参照
  }

  /**
   * スキルの効果をキャラクターに適用（サブクラスでオーバーライド）
   * @param {Object} character - 効果を適用するキャラクター
   */
  applyEffects(character) {
    // サブクラスで実装
    console.warn('applyEffects() not implemented');
  }

  /**
   * スキルの効果を解除（サブクラスでオーバーライド）
   * @param {Object} character - 効果を解除するキャラクター
   */
  removeEffects(character) {
    // サブクラスで実装
    console.warn('removeEffects() not implemented');
  }

  /**
   * スキルが解放可能か確認
   * @param {Object} character - キャラクター
   * @param {Set} unlockedSkills - 解放済みスキルのセット
   * @returns {boolean} - 解放可能かどうか
   */
  isAvailable(character, unlockedSkills) {
    // レベル条件
    if (character.level < this.requiredLevel) {
      return false;
    }

    // 前提条件（親ノード）
    if (this.connections.length === 0) {
      return true; // ルートノードか独立したノード
    }

    // 接続されたノードが解放済みかチェック
    for (const connectedNode of this.connectedNodes) {
      if (unlockedSkills.has(connectedNode.id)) {
        return true;
      }
    }

    return false;
  }

  /**
   * ReactFlow用のノードデータを取得
   * @param {boolean} isUnlocked - 解放済みかどうか
   * @param {boolean} isAvailable - 利用可能かどうか
   * @returns {Object} - ReactFlow用のノードデータ
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
        isAvailable: isAvailable
      }
    };
  }
}

export default SkillNode;