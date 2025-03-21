import { v4 as uuidv4 } from 'uuid';

/**
 * キャラクターのスキルツリー状態を管理するクラス
 */
export default class PlayerSkillState {
  /**
   * PlayerSkillStateのコンストラクタ
   * @param {Object} character - キャラクターオブジェクト
   * @param {Map} classSkillTrees - クラス別スキルツリーデータのマップ
   */
  constructor(character, classSkillTrees) {
    this.uuid = uuidv4();
    this.characterId = character.uuid;
    this.classType = character.classType?.name?.toLowerCase() || 'warrior';
    this.remainingPoints = character.skillPoints || 0;
    
    // スキルツリーデータの参照
    this.classSkillTrees = classSkillTrees;
    
    // 解放済みスキルIDの集合
    this.unlockedSkills = new Set();
    
    // プレイヤーが持っている既存スキルを初期化
    this._initializeExistingSkills(character);
  }
  
  /**
   * 既存のスキルを初期化
   * @param {Object} character - キャラクターオブジェクト
   * @private
   */
  _initializeExistingSkills(character) {
    // キャラクターがすでに持っているスキルを解放済みとしてマーク
    if (character.skills && Array.isArray(character.skills)) {
      character.skills.forEach(skill => {
        if (skill.id) {
          this.unlockedSkills.add(skill.id);
        } else if (skill.type) {
          // IDがない場合はtypeを使用（バックワードコンパチビリティ）
          this.unlockedSkills.add(skill.type);
        }
      });
    }
    
    // ルートノードは最初から解放
    this._unlockRootNodes();
  }
  
  /**
   * ルートノードを解放する
   * @private
   */
  _unlockRootNodes() {
    // すべてのクラスのルートノードを解放
    for (const [classType, treeData] of this.classSkillTrees.entries()) {
      for (const [nodeId, node] of treeData.nodes.entries()) {
        if (node.type === 'root') {
          this.unlockedSkills.add(nodeId);
        }
      }
    }
  }
  
  /**
   * 指定したスキルノードにスキルポイントを割り当てる
   * @param {string} nodeId - スキルノードのID
   * @returns {boolean} - 割り当て成功したかどうか
   */
  allocatePoint(nodeId) {
    // スキルポイントがあるか確認
    if (this.remainingPoints <= 0) {
      console.warn('No skill points remaining');
      return false;
    }
    
    // すでに解放済みかどうか確認
    if (this.unlockedSkills.has(nodeId)) {
      console.warn(`Skill ${nodeId} is already unlocked`);
      return false;
    }
    
    // ノードを見つける
    let targetNode = null;
    let parentTreeData = null;
    
    for (const [classType, treeData] of this.classSkillTrees.entries()) {
      const node = treeData.nodes.get(nodeId);
      if (node) {
        targetNode = node;
        parentTreeData = treeData;
        break;
      }
    }
    
    if (!targetNode) {
      console.error(`Skill node ${nodeId} not found in any skill tree`);
      return false;
    }
    
    // 前提条件（必要レベル）を満たしているか確認
    // TODO: キャラクターレベルの確認を実装
    
    // 前提条件（親ノードの解放）を満たしているか確認
    const isConnectedToUnlocked = this._isConnectedToUnlocked(nodeId, parentTreeData);
    if (!isConnectedToUnlocked) {
      console.warn(`Cannot unlock ${nodeId}: not connected to any unlocked node`);
      return false;
    }
    
    // スキルを解放
    this.unlockedSkills.add(nodeId);
    this.remainingPoints--;
    
    console.log(`Skill ${nodeId} unlocked successfully`);
    return true;
  }
  
  /**
   * ノードが解放済みノードに接続されているかを確認
   * @param {string} nodeId - チェックするノードID
   * @param {Object} treeData - スキルツリーデータ
   * @returns {boolean} - 接続されているかどうか
   * @private
   */
  _isConnectedToUnlocked(nodeId, treeData) {
    // ツリー内のすべてのノードをチェック
    for (const [id, node] of treeData.nodes.entries()) {
      // このノードが解放済みかつ、対象ノードに接続されているか
      if (this.unlockedSkills.has(id) && node.connections && node.connections.includes(nodeId)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * ReactFlow用のグラフデータを生成
   * @returns {Object} - ノードとエッジの配列
   */
  getGraphData() {
    const nodes = [];
    const edges = [];
    
    // 自分のクラスと共通のスキルツリーを結合
    const relevantTrees = ['common', this.classType];
    
    for (const treeType of relevantTrees) {
      if (!this.classSkillTrees.has(treeType)) continue;
      
      const treeData = this.classSkillTrees.get(treeType);
      
      // ノードの追加
      for (const [nodeId, node] of treeData.nodes.entries()) {
        const unlocked = this.unlockedSkills.has(nodeId);
        
        // ノードデータの作成
        let nodeData;
        if (typeof node.getNodeData === 'function') {
          // カスタムノードクラスの場合
          const isAvailable = !unlocked && this._checkNodeAvailability(nodeId, treeData);
          nodeData = node.getNodeData(unlocked, isAvailable);
        } else {
          // 通常のJSONオブジェクトの場合
          nodeData = {
            id: nodeId,
            type: 'skillNode',
            position: node.position || { x: 0, y: 0 },
            data: {
              ...node,
              isUnlocked: unlocked,
              isAvailable: !unlocked && this._checkNodeAvailability(nodeId, treeData)
            }
          };
        }
        
        nodes.push(nodeData);
        
        // エッジの追加（接続情報）
        if (node.connections) {
          for (const targetId of node.connections) {
            edges.push({
              id: `${nodeId}->${targetId}`,
              source: nodeId,
              target: targetId,
              animated: this.unlockedSkills.has(nodeId) && this.unlockedSkills.has(targetId)
            });
          }
        }
      }
    }
    
    return { nodes, edges };
  }
  
  /**
   * ノードが利用可能（解放条件を満たしている）かチェック
   * @param {string} nodeId - ノードID
   * @param {Object} treeData - スキルツリーデータ
   * @returns {boolean} - 利用可能かどうか
   * @private
   */
  _checkNodeAvailability(nodeId, treeData) {
    const node = treeData.nodes.get(nodeId);
    if (!node) return false;
    
    // ルートノードまたは接続のないノードは常に利用可能
    if (!node.connections || node.connections.length === 0) {
      return true;
    }
    
    // 接続元の少なくとも1つが解放済みかチェック
    for (const [id, connectedNode] of treeData.nodes.entries()) {
      if (connectedNode.connections && connectedNode.connections.includes(nodeId) && this.unlockedSkills.has(id)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 指定したスキルが解放されているかをチェック
   * @param {string} skillId - スキルID
   * @returns {boolean} - 解放されているかどうか
   */
  hasSkill(skillId) {
    return this.unlockedSkills.has(skillId);
  }
  
  /**
   * 残りスキルポイント数を取得
   * @returns {number} - 残りスキルポイント数
   */
  getRemainingPoints() {
    return this.remainingPoints;
  }
  
  /**
   * スキルポイントを追加
   * @param {number} points - 追加するポイント数
   */
  addSkillPoints(points) {
    this.remainingPoints += points;
  }
  
  /**
   * 解放済みスキルIDのリストを取得
   * @returns {Array} - 解放済みスキルIDの配列
   */
  getUnlockedSkillIds() {
    return Array.from(this.unlockedSkills);
  }
}