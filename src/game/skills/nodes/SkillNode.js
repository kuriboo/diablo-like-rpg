import { v4 as uuidv4 } from 'uuid';

/**
 * スキルノードの基本クラス
 * パッシブノードとアクティブスキルノードの共通機能を提供
 */
class SkillNode {
  /**
   * スキルノードコンストラクタ
   * @param {Object} nodeData - ノードの初期データ
   */
  constructor(nodeData) {
    this.uuid = uuidv4();
    this.id = nodeData.id;
    this.type = nodeData.type || 'base';
    this.name = nodeData.name || 'Unnamed Skill';
    this.description = nodeData.description || '';
    this.icon = nodeData.icon || 'default_skill.png';
    this.position = nodeData.position || { x: 0, y: 0 };
    this.requiredLevel = nodeData.requiredLevel || 1;
    this.requiredPoints = nodeData.requiredPoints || 1;
    this.connections = nodeData.connections || [];
    this.connectedNodes = []; // 実際のノードオブジェクトへの参照（初期化後に設定）
    this.isUnlocked = false;
    this.isAvailable = false; // 取得可能かどうか（前提条件を満たしているか）
  }

  /**
   * ノードが利用可能かどうかを確認（前提ノードが解放されているか）
   * @param {Map<string, boolean>} unlockedNodes - 解放済みノードのマップ
   * @param {number} characterLevel - キャラクターのレベル
   * @returns {boolean} - 利用可能かどうか
   */
  checkAvailability(unlockedNodes, characterLevel) {
    // レベル要件を満たしているか確認
    if (characterLevel < this.requiredLevel) {
      return false;
    }
    
    // ルートノードの場合は常に利用可能
    if (this.type === 'root') {
      return true;
    }

    // このノードが既に解放されている場合
    if (unlockedNodes.has(this.id) && unlockedNodes.get(this.id)) {
      return false; // 既に取得済みなので再度取得はできない
    }

    // 接続されたノードのいずれかが解放されているか確認
    // （スキルツリーの線がつながっている必要がある）
    let hasUnlockedConnection = false;
    
    for (const connId of this.connections) {
      if (unlockedNodes.has(connId) && unlockedNodes.get(connId)) {
        hasUnlockedConnection = true;
        break;
      }
    }
    
    return hasUnlockedConnection;
  }

  /**
   * ノードの解放処理
   * @param {Object} character - 対象キャラクター
   * @returns {boolean} - 解放に成功したかどうか
   */
  unlock(character) {
    if (this.isUnlocked) {
      console.warn(`Skill node ${this.id} is already unlocked`);
      return false;
    }
    
    this.isUnlocked = true;
    return true;
  }

  /**
   * ノードの効果を適用
   * @param {Object} character - 効果を適用するキャラクター
   */
  applyEffects(character) {
    // 基本クラスでは何もしない、サブクラスでオーバーライド
    console.log(`Applied effects of skill node ${this.name} to ${character.name}`);
  }

  /**
   * ノードの効果を解除
   * @param {Object} character - 効果を解除するキャラクター
   */
  removeEffects(character) {
    // 基本クラスでは何もしない、サブクラスでオーバーライド
    console.log(`Removed effects of skill node ${this.name} from ${character.name}`);
  }

  /**
   * reactflow用のノードデータを取得
   * @param {boolean} isUnlocked - ノードが解放されているかどうか
   * @param {boolean} isAvailable - ノードが利用可能かどうか
   * @returns {Object} - reactflow用のノードデータ
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