import Phaser from 'phaser';

export default class SkillTree {
  constructor(owner, config = {}) {
    // 所有者（キャラクター）
    this.owner = owner;
    
    // スキルノード
    this.nodes = new Map();
    
    // スキルカテゴリ
    this.categories = new Map();
    
    // 習得済みスキル
    this.acquiredSkills = new Set();
    
    // 利用可能なスキルポイント
    this.availablePoints = config.initialPoints || 0;
    
    // 総使用スキルポイント
    this.usedPoints = 0;
    
    // スキルツリー変更イベント
    this.events = new Phaser.Events.EventEmitter();
    
    // キャラクタークラスタイプ
    this.classType = owner ? owner.classType : null;
    
    // 初期化
    if (config.data) {
      this.loadTreeData(config.data);
    }
  }
  
  // スキルツリーデータの読み込み
  loadTreeData(data) {
    if (!data) return false;
    
    // カテゴリの読み込み
    if (data.categories && Array.isArray(data.categories)) {
      for (const category of data.categories) {
        this.addCategory(category.id, category.name, category.description);
      }
    }
    
    // ノードの読み込み
    if (data.nodes && Array.isArray(data.nodes)) {
      for (const nodeData of data.nodes) {
        this.addNode(nodeData);
      }
    }
    
    // エッジ（前提条件）の設定
    if (data.edges && Array.isArray(data.edges)) {
      for (const edge of data.edges) {
        this.addEdge(edge.from, edge.to, edge.requiredLevel);
      }
    }
    
    // 習得済みスキルの復元
    if (data.acquired && Array.isArray(data.acquired)) {
      for (const skillId of data.acquired) {
        this.acquiredSkills.add(skillId);
      }
    }
    
    // スキルポイントの復元
    if (data.points) {
      this.availablePoints = data.points.available || 0;
      this.usedPoints = data.points.used || 0;
    }
    
    // 変更イベント発火
    this.events.emit('tree-loaded');
    
    return true;
  }
  
  // クラスに基づくツリーデータの読み込み
  loadTreeForClass(classType) {
    if (!classType) return false;
    
    // クラスタイプを保存
    this.classType = classType;
    
    // 外部ファイルからの読み込みをシミュレート
    // 実際の実装では、fetch APIやファイル読み込みを使用します
    const treeDataUrl = `data/skill_trees/${classType.name.toLowerCase()}_skills.json`;
    
    // JSONデータを読み込む処理
    // 実際はこの部分を非同期処理にします
    // 例: return fetch(treeDataUrl).then(res => res.json()).then(data => this.loadTreeData(data));
    
    console.log(`Skill tree data for ${classType.name} would be loaded from ${treeDataUrl}`);
    
    // 変更イベント発火
    this.events.emit('tree-loaded');
    
    return true;
  }
  
  // カテゴリの追加
  addCategory(id, name, description) {
    if (!id || this.categories.has(id)) return false;
    
    this.categories.set(id, {
      id,
      name: name || id,
      description: description || '',
      nodes: []
    });
    
    return true;
  }
  
  // スキルノードの追加
  addNode(nodeData) {
    if (!nodeData || !nodeData.id || this.nodes.has(nodeData.id)) return false;
    
    // ノードデータの構築
    const node = {
      id: nodeData.id,
      name: nodeData.name || nodeData.id,
      description: nodeData.description || '',
      type: nodeData.type || 'passive', // passive または skill
      position: nodeData.position || { x: 0, y: 0 },
      categoryId: nodeData.categoryId,
      cost: nodeData.cost || 1,
      maxLevel: nodeData.maxLevel || 1,
      currentLevel: 0,
      prerequisites: nodeData.prerequisites || [],
      requiredLevel: nodeData.requiredLevel || 1,
      effects: nodeData.effects || [],
      skillData: nodeData.skillData || null,
      icon: nodeData.icon
    };
    
    // ノードをマップに追加
    this.nodes.set(node.id, node);
    
    // カテゴリに追加
    if (node.categoryId && this.categories.has(node.categoryId)) {
      this.categories.get(node.categoryId).nodes.push(node.id);
    }
    
    return true;
  }
  
  // エッジ（前提条件）の追加
  addEdge(fromNodeId, toNodeId, requiredLevel = 1) {
    if (!fromNodeId || !toNodeId) return false;
    
    // ノードの存在確認
    const toNode = this.nodes.get(toNodeId);
    if (!toNode) return false;
    
    // 前提条件の追加
    if (!toNode.prerequisites.some(pre => pre.nodeId === fromNodeId)) {
      toNode.prerequisites.push({
        nodeId: fromNodeId,
        requiredLevel: requiredLevel
      });
    }
    
    return true;
  }
  
  // スキルの習得
  acquireSkill(skillId) {
    // ノードの存在確認
    const node = this.nodes.get(skillId);
    if (!node) return false;
    
    // すでに最大レベルの場合
    if (node.currentLevel >= node.maxLevel) return false;
    
    // 習得要件の確認
    if (!this.canAcquireSkill(skillId)) return false;
    
    // スキルポイントの消費
    if (this.availablePoints < node.cost) return false;
    
    // スキルレベルの増加
    node.currentLevel++;
    
    // スキルポイントの調整
    this.availablePoints -= node.cost;
    this.usedPoints += node.cost;
    
    // 習得済みセットに追加
    if (node.currentLevel === 1) {
      this.acquiredSkills.add(skillId);
    }
    
    // キャラクターにスキルを追加
    this.applySkillToCharacter(node);
    
    // 変更イベント発火
    this.events.emit('skill-acquired', node);
    
    return true;
  }
  
  // スキルを習得可能か確認
  canAcquireSkill(skillId) {
    // ノードの存在確認
    const node = this.nodes.get(skillId);
    if (!node) return false;
    
    // すでに最大レベルの場合
    if (node.currentLevel >= node.maxLevel) return false;
    
    // キャラクターレベル要件
    if (this.owner && this.owner.level < node.requiredLevel) return false;
    
    // 前提条件の確認
    for (const prerequisite of node.prerequisites) {
      const preNode = this.nodes.get(prerequisite.nodeId);
      if (!preNode || preNode.currentLevel < prerequisite.requiredLevel) {
        return false;
      }
    }
    
    // スキルポイントの確認
    if (this.availablePoints < node.cost) return false;
    
    return true;
  }
  
  // スキルのリセット
  resetSkill(skillId) {
    // ノードの存在確認
    const node = this.nodes.get(skillId);
    if (!node || node.currentLevel === 0) return false;
    
    // このスキルに依存する他のスキルがないか確認
    for (const [id, otherNode] of this.nodes.entries()) {
      for (const pre of otherNode.prerequisites) {
        if (pre.nodeId === skillId && otherNode.currentLevel > 0) {
          // このスキルを前提とする他のスキルが習得されている
          return false;
        }
      }
    }
    
    // 消費したポイントの回収
    const refundPoints = node.cost * node.currentLevel;
    this.availablePoints += refundPoints;
    this.usedPoints -= refundPoints;
    
    // スキルレベルのリセット
    const oldLevel = node.currentLevel;
    node.currentLevel = 0;
    
    // 習得済みセットから削除
    this.acquiredSkills.delete(skillId);
    
    // キャラクターからスキルを削除
    this.removeSkillFromCharacter(node);
    
    // 変更イベント発火
    this.events.emit('skill-reset', { node, oldLevel });
    
    return true;
  }
  
  // 全スキルのリセット
  resetAllSkills() {
    // スキルリセットの順番を考慮
    // 依存関係のあるスキルから順にリセット
    
    // 依存関係の逆順でスキルをソート
    const sortedNodes = this.getSortedNodesForReset();
    
    // 各ノードをリセット
    for (const node of sortedNodes) {
      if (node.currentLevel > 0) {
        // ポイント回収
        const refundPoints = node.cost * node.currentLevel;
        this.availablePoints += refundPoints;
        this.usedPoints -= refundPoints;
        
        // スキルレベルのリセット
        node.currentLevel = 0;
        
        // 習得済みセットから削除
        this.acquiredSkills.delete(node.id);
        
        // キャラクターからスキルを削除
        this.removeSkillFromCharacter(node);
      }
    }
    
    // 変更イベント発火
    this.events.emit('all-skills-reset');
    
    return true;
  }
  
  // リセット用にソートされたノード配列を取得
  getSortedNodesForReset() {
    const nodeList = Array.from(this.nodes.values()).filter(node => node.currentLevel > 0);
    
    // 依存関係マップの構築
    const dependencyMap = new Map();
    
    for (const node of nodeList) {
      dependencyMap.set(node.id, []);
    }
    
    for (const node of nodeList) {
      for (const pre of node.prerequisites) {
        if (dependencyMap.has(pre.nodeId)) {
          dependencyMap.get(pre.nodeId).push(node.id);
        }
      }
    }
    
    // 依存されていないノードから順にリセットするためのソート
    return nodeList.sort((a, b) => {
      const aDependencies = dependencyMap.get(a.id) || [];
      const bDependencies = dependencyMap.get(b.id) || [];
      return bDependencies.length - aDependencies.length;
    });
  }
  
  // スキルポイントの追加
  addSkillPoints(points) {
    if (points <= 0) return false;
    
    this.availablePoints += points;
    
    // 変更イベント発火
    this.events.emit('points-added', points);
    
    return true;
  }
  
  // スキルポイントの設定
  setSkillPoints(points) {
    if (points < 0) return false;
    
    this.availablePoints = points;
    
    // 変更イベント発火
    this.events.emit('points-updated', points);
    
    return true;
  }
  
  // 特定のスキルの取得
  getSkill(skillId) {
    return this.nodes.get(skillId) || null;
  }
  
  // 習得済みのスキルを取得
  getAcquiredSkills() {
    return Array.from(this.acquiredSkills)
      .map(id => this.nodes.get(id))
      .filter(Boolean);
  }
  
  // カテゴリに属するスキルを取得
  getSkillsByCategory(categoryId) {
    const category = this.categories.get(categoryId);
    if (!category) return [];
    
    return category.nodes
      .map(id => this.nodes.get(id))
      .filter(Boolean);
  }
  
  // 全カテゴリの取得
  getAllCategories() {
    return Array.from(this.categories.values());
  }
  
  // 習得可能なスキルの取得
  getAvailableSkills() {
    return Array.from(this.nodes.values())
      .filter(node => this.canAcquireSkill(node.id));
  }
  
  // キャラクターにスキルを適用
  applySkillToCharacter(node) {
    if (!this.owner) return;
    
    // パッシブスキルの場合は効果を適用
    if (node.type === 'passive') {
      this.applyPassiveEffects(node);
    }
    // アクティブスキルの場合はスキルリストに追加
    else if (node.type === 'skill' && node.skillData) {
      this.addActiveSkill(node);
    }
  }
  
  // パッシブ効果の適用
  applyPassiveEffects(node) {
    if (!this.owner || !node.effects) return;
    
    for (const effect of node.effects) {
      const statName = effect.stat;
      const value = effect.value * node.currentLevel;
      
      // 加算効果
      if (effect.type === 'add' && this.owner[statName] !== undefined) {
        this.owner[statName] += value;
      }
      // 乗算効果
      else if (effect.type === 'multiply' && this.owner[statName] !== undefined) {
        this.owner[statName] *= (1 + value / 100);
      }
    }
    
    // ステータスの再計算
    if (this.owner.recalculateStats) {
      this.owner.recalculateStats();
    }
  }
  
  // アクティブスキルの追加
  addActiveSkill(node) {
    if (!this.owner || !node.skillData) return;
    
    // スキルデータの作成
    const skillData = {
      ...node.skillData,
      name: node.name,
      description: node.description,
      icon: node.icon,
      level: node.currentLevel
    };
    
    // キャラクターのスキルリストに追加
    if (!this.owner.skills) {
      this.owner.skills = [];
    }
    
    // 既存のスキルか確認
    const existingIndex = this.owner.skills.findIndex(skill => skill.id === node.id);
    
    if (existingIndex !== -1) {
      // 既存のスキルを更新
      this.owner.skills[existingIndex] = {
        ...this.owner.skills[existingIndex],
        ...skillData
      };
    } else {
      // 新しいスキルを追加
      this.owner.skills.push(skillData);
    }
  }
  
  // キャラクターからスキルを削除
  removeSkillFromCharacter(node) {
    if (!this.owner) return;
    
    // パッシブスキルの場合は効果を取り消し
    if (node.type === 'passive') {
      this.removePassiveEffects(node);
    }
    // アクティブスキルの場合はスキルリストから削除
    else if (node.type === 'skill' && this.owner.skills) {
      const index = this.owner.skills.findIndex(skill => skill.id === node.id);
      if (index !== -1) {
        this.owner.skills.splice(index, 1);
      }
    }
  }
  
  // パッシブ効果の取り消し
  removePassiveEffects(node) {
    if (!this.owner || !node.effects) return;
    
    // パッシブ効果の取り消しは複雑なので、完全に再計算する
    // 実際のゲームではもっと精密な方法を使うべき
    
    // ステータスをリセットして再計算
    if (this.owner.recalculateStats) {
      this.owner.recalculateStats();
    }
  }
  
  // スキルツリーデータの取得（保存用）
  getData() {
    // カテゴリデータ
    const categories = Array.from(this.categories.values()).map(category => ({
      id: category.id,
      name: category.name,
      description: category.description
    }));
    
    // ノードデータ
    const nodes = Array.from(this.nodes.values()).map(node => ({
      id: node.id,
      name: node.name,
      description: node.description,
      type: node.type,
      position: node.position,
      categoryId: node.categoryId,
      cost: node.cost,
      maxLevel: node.maxLevel,
      currentLevel: node.currentLevel,
      requiredLevel: node.requiredLevel,
      effects: node.effects,
      skillData: node.skillData,
      icon: node.icon
    }));
    
    // エッジデータ
    const edges = [];
    for (const node of this.nodes.values()) {
      for (const pre of node.prerequisites) {
        edges.push({
          from: pre.nodeId,
          to: node.id,
          requiredLevel: pre.requiredLevel
        });
      }
    }
    
    // 習得済みスキル
    const acquired = Array.from(this.acquiredSkills);
    
    // スキルポイント
    const points = {
      available: this.availablePoints,
      used: this.usedPoints
    };
    
    return {
      classType: this.classType ? this.classType.name : 'unknown',
      categories,
      nodes,
      edges,
      acquired,
      points
    };
  }
  
  // スキルツリーデータの設定（読み込み用）
  setData(data) {
    if (!data) return false;
    
    // 一度クリア
    this.nodes.clear();
    this.categories.clear();
    this.acquiredSkills.clear();
    
    // データの読み込み
    return this.loadTreeData(data);
  }
}