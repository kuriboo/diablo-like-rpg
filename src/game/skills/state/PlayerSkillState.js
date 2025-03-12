import { v4 as uuidv4 } from 'uuid';

/**
 * プレイヤーのスキル状態を管理するクラス
 */
class PlayerSkillState {
  /**
   * コンストラクタ
   * @param {Object} character - キャラクターオブジェクト
   * @param {Map<string, Object>} classSkillTrees - クラス別スキルツリーデータ
   */
  constructor(character, classSkillTrees) {
    this.uuid = uuidv4();
    this.character = character;
    this.classSkillTrees = classSkillTrees;
    this.characterClass = character.ClassType?.name || 'warrior'; // デフォルトはwarrior
    
    // スキルポイント
    this.totalSkillPoints = 0;
    this.spentSkillPoints = 0;
    
    // 解放済みノード
    this.unlockedNodes = new Map();
    
    // 利用可能ノード（解放可能だが未解放）
    this.availableNodes = new Set();
    
    // 初期化
    this._initializeState();
  }

  /**
   * スキル状態を初期化
   * @private
   */
  _initializeState() {
    // 初期スキルポイントを計算（レベルに基づく）
    this.totalSkillPoints = Math.max(0, this.character.Level - 1);
    
    // キャラクタークラスに基づいて適切なスキルツリーを取得
    this.skillTree = this._getSkillTreeForClass(this.characterClass);
    
    if (!this.skillTree) {
      console.error(`No skill tree found for class: ${this.characterClass}`);
      return;
    }
    
    // ルートノードを解放
    const rootNodes = this._getRootNodes();
    for (const rootNode of rootNodes) {
      this.unlockedNodes.set(rootNode.id, true);
    }
    
    // 利用可能ノードを更新
    this._updateAvailableNodes();
  }

  /**
   * キャラクタークラスに基づいて適切なスキルツリーを取得
   * @param {string} className - キャラクタークラス名
   * @returns {Object|null} - スキルツリーデータ
   * @private
   */
  _getSkillTreeForClass(className) {
    // クラス固有のスキルツリーを取得
    const classTree = this.classSkillTrees.get(className.toLowerCase());
    
    // 共通スキルツリーを取得
    const commonTree = this.classSkillTrees.get('common');
    
    // クラス固有ツリーがない場合は共通ツリーのみを返す
    if (!classTree) return commonTree;
    
    // 共通ツリーがない場合はクラス固有ツリーのみを返す
    if (!commonTree) return classTree;
    
    // クラス固有ツリーと共通ツリーをマージ
    return {
      metadata: classTree.metadata,
      nodes: new Map([...classTree.nodes.entries(), ...commonTree.nodes.entries()])
    };
  }

  /**
   * ルートノードを取得
   * @returns {Array} - ルートノードの配列
   * @private
   */
  _getRootNodes() {
    const rootNodes = [];
    
    for (const [id, node] of this.skillTree.nodes.entries()) {
      if (node.type === 'root') {
        rootNodes.push(node);
      }
    }
    
    return rootNodes;
  }

  /**
   * 利用可能なノードを更新
   * @private
   */
  _updateAvailableNodes() {
    this.availableNodes.clear();
    
    for (const [id, node] of this.skillTree.nodes.entries()) {
      // 既に解放されている場合はスキップ
      if (this.unlockedNodes.has(id)) continue;
      
      // 利用可能かチェック
      const isAvailable = node.checkAvailability(this.unlockedNodes, this.character.Level);
      
      if (isAvailable) {
        this.availableNodes.add(id);
      }
    }
  }

  /**
   * スキルポイントを割り当てる
   * @param {string} nodeId - スキルノードのID
   * @returns {boolean} - 割り当て成功したかどうか
   */
  allocatePoint(nodeId) {
    // ノードが存在するか確認
    if (!this.skillTree.nodes.has(nodeId)) {
      console.error(`Skill node not found: ${nodeId}`);
      return false;
    }
    
    const node = this.skillTree.nodes.get(nodeId);
    
    // ノードが利用可能か確認
    if (!this.availableNodes.has(nodeId)) {
      console.warn(`Skill node is not available: ${nodeId}`);
      return false;
    }
    
    // 十分なスキルポイントがあるか確認
    const remainingPoints = this.totalSkillPoints - this.spentSkillPoints;
    if (remainingPoints < node.requiredPoints) {
      console.warn(`Not enough skill points: ${remainingPoints}/${node.requiredPoints}`);
      return false;
    }
    
    // アクティブスキルノードの場合、ActionFactoryが必要
    let actionFactory = null;
    if (node.type === 'skill') {
      // ActionFactoryを動的にインポート
      try {
        actionFactory = require('../../factories/ActionFactory').default;
      } catch (e) {
        console.error('Failed to import ActionFactory:', e);
      }
    }
    
    // ノードを解放
    const success = node.unlock(this.character);
    
    if (success) {
      // ノードの効果を適用
      node.applyEffects(this.character, actionFactory);
      
      // 解放済みリストに追加
      this.unlockedNodes.set(nodeId, true);
      
      // スキルポイント消費
      this.spentSkillPoints += node.requiredPoints;
      
      // 利用可能ノードを更新
      this._updateAvailableNodes();
      
      console.log(`Allocated skill point to ${node.name}`);
      return true;
    }
    
    return false;
  }

  /**
   * スキルポイント割り当てをリセット
   * @returns {boolean} - リセット成功したかどうか
   */
  resetSkillPoints() {
    // すべての解放済みノードを解放解除（ルートノードを除く）
    for (const [id, isUnlocked] of this.unlockedNodes.entries()) {
      if (isUnlocked) {
        const node = this.skillTree.nodes.get(id);
        
        // ルートノードはスキップ
        if (node.type === 'root') continue;
        
        // ノードの効果を解除
        node.removeEffects(this.character);
      }
    }
    
    // 解放済みノードをリセット（ルートノードのみ残す）
    const newUnlockedNodes = new Map();
    for (const [id, node] of this.skillTree.nodes.entries()) {
      if (node.type === 'root') {
        newUnlockedNodes.set(id, true);
      }
    }
    
    this.unlockedNodes = newUnlockedNodes;
    this.spentSkillPoints = 0;
    
    // 利用可能ノードを更新
    this._updateAvailableNodes();
    
    return true;
  }

  /**
   * スキルポイントを追加
   * @param {number} points - 追加するポイント数
   */
  addSkillPoints(points = 1) {
    if (points <= 0) return;
    
    this.totalSkillPoints += points;
    console.log(`Added ${points} skill points. Total: ${this.totalSkillPoints}`);
    
    // 利用可能ノードを更新
    this._updateAvailableNodes();
  }

  /**
   * 残りのスキルポイント数を取得
   * @returns {number} - 残りのスキルポイント数
   */
  getRemainingPoints() {
    return this.totalSkillPoints - this.spentSkillPoints;
  }

  /**
   * スキルツリーグラフデータを取得（reactflow用）
   * @returns {Object} - ノードとエッジの配列
   */
  getGraphData() {
    const nodes = [];
    const edges = [];
    
    // ノードデータの作成
    for (const [id, node] of this.skillTree.nodes.entries()) {
      const isUnlocked = this.unlockedNodes.has(id);
      const isAvailable = this.availableNodes.has(id);
      
      nodes.push(node.getNodeData(isUnlocked, isAvailable));
    }
    
    // エッジデータの作成
    for (const [id, node] of this.skillTree.nodes.entries()) {
      if (node.connections && node.connections.length > 0) {
        for (const targetId of node.connections) {
          edges.push({
            id: `e-${id}-${targetId}`,
            source: id,
            target: targetId,
            // どちらかのノードが解放済みの場合は接続を活性化
            animated: this.unlockedNodes.has(id) || this.unlockedNodes.has(targetId),
            style: {
              stroke: this.unlockedNodes.has(id) && this.unlockedNodes.has(targetId) 
                ? '#00ff00' // 両方解放済み
                : this.unlockedNodes.has(id) || this.unlockedNodes.has(targetId)
                  ? '#ffcc00' // 片方解放済み
                  : '#999999' // 両方未解放
            }
          });
        }
      }
    }
    
    return { nodes, edges };
  }

  /**
   * 指定したスキルを持っているかを確認
   * @param {string} skillId - スキルID
   * @returns {boolean} - スキルを持っているかどうか
   */
  hasSkill(skillId) {
    return this.unlockedNodes.has(skillId) && this.unlockedNodes.get(skillId);
  }

  /**
   * 解放済みスキルの一覧を取得
   * @returns {Array} - スキルオブジェクトの配列
   */
  getUnlockedSkills() {
    const unlockedSkills = [];
    
    for (const [id, isUnlocked] of this.unlockedNodes.entries()) {
      if (isUnlocked) {
        const node = this.skillTree.nodes.get(id);
        if (node && node.type !== 'root') {
          unlockedSkills.push(node);
        }
      }
    }
    
    return unlockedSkills;
  }
}

export default PlayerSkillState;