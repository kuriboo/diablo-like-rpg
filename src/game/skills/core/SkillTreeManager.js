import { v4 as uuidv4 } from 'uuid';
import SkillLoader from './SkillLoader';
import PlayerSkillState from '../state/PlayerSkillState';
import PassiveNode from '../nodes/PassiveNode';
import ActiveNode from '../nodes/ActiveNode';

/**
 * スキルツリー全体を管理するクラス
 * スキルの読み込み、状態管理、スキルポイントの割り当てなどを担当
 */
class SkillTreeManager {
  // シングルトンインスタンス
  static _instance = null;
  
  /**
   * シングルトンインスタンスを取得
   * @returns {SkillTreeManager} - SkillTreeManagerのインスタンス
   */
  static getInstance() {
    if (!SkillTreeManager._instance) {
      SkillTreeManager._instance = new SkillTreeManager();
    }
    return SkillTreeManager._instance;
  }
  
  /**
   * コンストラクタ - 直接new演算子での呼び出しは避ける
   */
  constructor() {
    // インスタンスが既に存在する場合はそれを返す
    if (SkillTreeManager._instance) {
      return SkillTreeManager._instance;
    }
    
    this.uuid = uuidv4();
    this.skillLoader = new SkillLoader();
    this.classSkillTrees = new Map(); // 各クラスのスキルツリーデータ
    this.playerSkillState = null;
    this.companionSkillState = null;
    this.isInitialized = false;
    
    // このインスタンスをシングルトンインスタンスとして設定
    SkillTreeManager._instance = this;
  }

  /**
   * スキルツリー管理システムを初期化
   * @param {Object} character - キャラクターオブジェクト（プレイヤーまたはコンパニオン）
   * @returns {Promise<void>}
   */
  async initialize(character) {
    if (this.isInitialized) return;

    // スキルデータを読み込み
    await this.loadSkillTrees();
    
    // キャラクタータイプに基づいてスキル状態を初期化
    if (character.isPlayer || character.constructor.name === 'Player') {
      this.playerSkillState = new PlayerSkillState(character, this.classSkillTrees);
    } else if (character.isCompanion || character.constructor.name === 'Companion') {
      this.companionSkillState = new PlayerSkillState(character, this.classSkillTrees);
    }
    
    this.isInitialized = true;
  }

  /**
   * 利用可能なすべてのスキルツリーを読み込む
   * @returns {Promise<void>}
   */
  async loadSkillTrees() {
    try {
      // 共通スキルを読み込み
      const commonSkills = await this.skillLoader.loadSkillTree('common');
      
      // 各クラスのスキルを読み込み
      const warriorSkills = await this.skillLoader.loadSkillTree('warrior');
      const rogueSkills = await this.skillLoader.loadSkillTree('rogue');
      const mageSkills = await this.skillLoader.loadSkillTree('mage');
      
      // スキルツリーをマップに保存
      this.classSkillTrees.set('common', this._processSkillTree(commonSkills));
      this.classSkillTrees.set('warrior', this._processSkillTree(warriorSkills));
      this.classSkillTrees.set('rogue', this._processSkillTree(rogueSkills));
      this.classSkillTrees.set('mage', this._processSkillTree(mageSkills));
      
      console.log('All skill trees loaded successfully');
    } catch (error) {
      console.error('Failed to load skill trees:', error);
      throw error;
    }
  }

  /**
   * スキルツリーデータを処理し、適切なノードオブジェクトに変換
   * @param {Object} treeData - JSONから読み込んだスキルツリーデータ
   * @returns {Object} - 処理済みスキルツリーデータ
   * @private
   */
  _processSkillTree(treeData) {
    const processedNodes = new Map();
    
    // ノードの作成と変換
    treeData.nodes.forEach(nodeData => {
      let node;
      
      if (nodeData.type === 'passive') {
        node = new PassiveNode(nodeData);
      } else if (nodeData.type === 'skill') {
        node = new ActiveNode(nodeData);
      } else {
        // ルートノードなど他のタイプ
        node = { ...nodeData };
      }
      
      processedNodes.set(nodeData.id, node);
    });
    
    // 接続関係の構築
    treeData.nodes.forEach(nodeData => {
      const node = processedNodes.get(nodeData.id);
      if (nodeData.connections && nodeData.connections.length > 0) {
        node.connectedNodes = nodeData.connections.map(id => processedNodes.get(id));
      }
    });
    
    return {
      metadata: treeData.metadata,
      nodes: processedNodes
    };
  }

  /**
   * 指定したスキルノードに対してスキルポイントを割り当てる
   * @param {string} nodeId - スキルノードのID
   * @param {Object} character - キャラクターオブジェクト
   * @returns {boolean} - 割り当て成功したかどうか
   */
  allocateSkillPoint(nodeId, character) {
    // プレイヤーかコンパニオンかに基づいて適切な状態管理を取得
    const skillState = character.isPlayer || character.constructor.name === 'Player' 
      ? this.playerSkillState 
      : this.companionSkillState;
    
    if (!skillState) {
      console.error('Skill state not initialized for character');
      return false;
    }
    
    // スキルポイントの割り当てを試行
    return skillState.allocatePoint(nodeId);
  }

  /**
   * 指定したキャラクターのスキルツリーグラフを取得
   * @param {Object} character - キャラクターオブジェクト
   * @returns {Array} - reactflow用のノードとエッジ配列のオブジェクト
   */
  getSkillTreeGraph(character) {
    const skillState = character.isPlayer || character.constructor.name === 'Player' 
      ? this.playerSkillState 
      : this.companionSkillState;
    
    if (!skillState) {
      console.error('Skill state not initialized for character');
      return { nodes: [], edges: [] };
    }
    
    return skillState.getGraphData();
  }

  /**
   * 指定したキャラクターが特定のスキルを持っているかを確認
   * @param {string} skillId - チェックするスキルID
   * @param {Object} character - チェック対象のキャラクター
   * @returns {boolean} - スキルを持っているかどうか
   */
  hasSkill(skillId, character) {
    const skillState = character.isPlayer || character.constructor.name === 'Player' 
      ? this.playerSkillState 
      : this.companionSkillState;
    
    if (!skillState) return false;
    
    return skillState.hasSkill(skillId);
  }

  /**
   * 指定したキャラクターの残りスキルポイント数を取得
   * @param {Object} character - キャラクターオブジェクト
   * @returns {number} - 残りスキルポイント数
   */
  getRemainingSkillPoints(character) {
    const skillState = character.isPlayer || character.constructor.name === 'Player' 
      ? this.playerSkillState 
      : this.companionSkillState;
    
    if (!skillState) return 0;
    
    return skillState.getRemainingPoints();
  }

  /**
   * キャラクターのスキルポイントを追加（レベルアップ時など）
   * @param {Object} character - キャラクターオブジェクト
   * @param {number} points - 追加するポイント数
   */
  addSkillPoints(character, points = 1) {
    const skillState = character.isPlayer || character.constructor.name === 'Player' 
      ? this.playerSkillState 
      : this.companionSkillState;
    
    if (!skillState) return;
    
    skillState.addSkillPoints(points);
  }

  /**
   * キャラクターがアンロックしているスキルのリストを取得
   * @param {Object} character - キャラクターオブジェクト
   * @returns {Array} - アンロックされているスキルの配列
   */
  getUnlockedSkills(character) {
    const skillState = character.isPlayer || character.constructor.name === 'Player'
      ? this.playerSkillState 
      : this.companionSkillState;
    
    if (!skillState) {
      console.warn('Skill state not initialized for character, returning empty skill list');
      return [];
    }
    
    // PlayerSkillStateから解放済みスキルを取得
    // スキルIDの配列を取得
    const unlockedSkillIds = skillState.getUnlockedSkillIds();
    
    // スキルIDからスキルオブジェクトの配列に変換
    const unlockedSkills = [];
    
    for (const skillId of unlockedSkillIds) {
      // 全スキルツリーから該当スキルを検索
      for (const [classType, treeData] of this.classSkillTrees.entries()) {
        const node = treeData.nodes.get(skillId);
        if (node && (node.type === 'skill' || node.type === 'active')) {
          // スキルオブジェクトをリストに追加
          unlockedSkills.push({
            id: node.id,
            name: node.name,
            description: node.description,
            icon: node.icon,
            manaCost: node.manaCost || 0,
            cooldown: node.cooldown || 0,
            type: node.type,
            actionId: node.actionId || node.id,
            lastUsed: 0
          });
          break;
        }
      }
    }
    
    return unlockedSkills;
  }
}

// デフォルトエクスポートはシングルトンインスタンスを返す
export default SkillTreeManager.getInstance();