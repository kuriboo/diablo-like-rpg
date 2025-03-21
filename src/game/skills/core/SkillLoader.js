/**
 * JSONファイルからスキルツリーデータを読み込むローダークラス
 */
class SkillLoader {
  constructor() {
    // キャッシュをクリア
    this.skillTreeCache = new Map();
    
    // ダミーデータを用意（JSONファイルが見つからない場合のフォールバック）
    this.dummySkillTrees = {
      common: this.createDummyCommonSkillTree(),
      warrior: this.createDummyWarriorSkillTree(),
      rogue: this.createDummyRogueSkillTree(),
      mage: this.createDummyMageSkillTree()
    };
  }

  /**
   * 指定したクラスのスキルツリーを読み込む
   * @param {string} classType - 読み込むクラスタイプ ('warrior', 'rogue', 'mage', 'common')
   * @returns {Promise<Object>} - スキルツリーデータ
   */
  async loadSkillTree(classType) {
    // すでにキャッシュにあればそれを返す
    if (this.skillTreeCache.has(classType)) {
      return this.skillTreeCache.get(classType);
    }

    try {
      // JSONファイルのパスを構築
      const filePath = `/data/skills/${classType}Skills.json`;
      
      // JSONファイルをフェッチ
      const response = await fetch(filePath);
      
      if (!response.ok) {
        console.warn(`Failed to load skill tree for ${classType}: ${response.statusText}. Using dummy data.`);
        // ダミーデータを使用
        const dummyData = this.dummySkillTrees[classType] || this.createEmptySkillTree(classType);
        this.skillTreeCache.set(classType, dummyData);
        return dummyData;
      }
      
      // JSONをパース
      const skillTreeData = await response.json();
      
      // キャッシュに保存
      this.skillTreeCache.set(classType, skillTreeData);
      
      return skillTreeData;
    } catch (error) {
      console.error(`Error loading skill tree for ${classType}:`, error);
      
      // エラー時にダミーデータを返す
      const dummyData = this.dummySkillTrees[classType] || this.createEmptySkillTree(classType);
      this.skillTreeCache.set(classType, dummyData);
      return dummyData;
    }
  }

  /**
   * 特定のスキルIDに対応するスキルノードデータを取得
   * @param {string} skillId - 取得するスキルのID
   * @returns {Promise<Object|null>} - スキルノードデータまたはnull
   */
  async getSkillNodeById(skillId) {
    // キャッシュにあるすべてのスキルツリーから検索
    for (const [classType, treeData] of this.skillTreeCache.entries()) {
      const node = treeData.nodes.find(node => node.id === skillId);
      if (node) return node;
    }
    
    // キャッシュになければすべてのクラスのスキルツリーを読み込んで検索
    try {
      const classTypes = ['common', 'warrior', 'rogue', 'mage'];
      
      for (const classType of classTypes) {
        if (!this.skillTreeCache.has(classType)) {
          await this.loadSkillTree(classType);
        }
        
        const treeData = this.skillTreeCache.get(classType);
        const node = treeData.nodes.find(node => node.id === skillId);
        if (node) return node;
      }
      
      // 見つからなかった場合
      console.warn(`Skill node with ID ${skillId} not found in any skill tree`);
      return null;
    } catch (error) {
      console.error('Error searching for skill node:', error);
      return null;
    }
  }

  /**
   * キャッシュをクリア
   */
  clearCache() {
    this.skillTreeCache.clear();
  }

  /**
   * 空のスキルツリーを作成（フォールバック用）
   * @param {string} classType - クラスタイプ
   * @returns {Object} - 空のスキルツリーデータ
   */
  createEmptySkillTree(classType) {
    return {
      metadata: {
        classType: classType,
        displayName: classType.charAt(0).toUpperCase() + classType.slice(1),
        description: `${classType} skill tree`
      },
      nodes: []
    };
  }

  /**
   * ダミーの共通スキルツリーを作成
   * @returns {Object} - ダミースキルツリーデータ
   */
  createDummyCommonSkillTree() {
    return {
      metadata: {
        classType: "common",
        displayName: "共通スキル",
        description: "すべてのクラスが習得できる基本的なスキル"
      },
      nodes: [
        {
          id: "common_root",
          type: "root",
          position: { x: 400, y: 100 },
          name: "基本スキル",
          description: "共通スキルツリーの始まり",
          icon: "common_root.png",
          connections: ["common_health_up", "common_mana_up"]
        },
        {
          id: "common_health_up",
          type: "passive",
          position: { x: 300, y: 200 },
          name: "生命力増強",
          description: "最大HPを10%増加させる",
          icon: "health_up.png",
          effects: [
            {
              type: "attributeModifier",
              attribute: "MaxLife",
              value: 10,
              isPercentage: true
            }
          ],
          requiredLevel: 2,
          requiredPoints: 1,
          connections: []
        },
        {
          id: "common_mana_up",
          type: "passive",
          position: { x: 500, y: 200 },
          name: "魔力増強",
          description: "最大MPを10%増加させる",
          icon: "mana_up.png",
          effects: [
            {
              type: "attributeModifier",
              attribute: "MaxMana",
              value: 10,
              isPercentage: true
            }
          ],
          requiredLevel: 2,
          requiredPoints: 1,
          connections: []
        }
      ]
    };
  }

  /**
   * ダミーの戦士スキルツリーを作成
   * @returns {Object} - ダミースキルツリーデータ
   */
  createDummyWarriorSkillTree() {
    return {
      metadata: {
        classType: "warrior",
        displayName: "戦士",
        description: "近接戦闘のスペシャリスト"
      },
      nodes: [
        {
          id: "warrior_root",
          type: "root",
          position: { x: 400, y: 100 },
          name: "戦士の道",
          description: "戦士のスキルツリーの始まり",
          icon: "warrior_root.png",
          connections: ["warrior_bash"]
        },
        {
          id: "warrior_bash",
          type: "skill",
          position: { x: 400, y: 200 },
          name: "バッシュ",
          description: "敵を打ち据え、スタン効果を与える",
          icon: "bash.png",
          actionId: "special_bash",
          manaCost: 10,
          cooldown: 8,
          requiredLevel: 3,
          requiredPoints: 1,
          connections: []
        }
      ]
    };
  }

  /**
   * ダミーの盗賊スキルツリーを作成
   * @returns {Object} - ダミースキルツリーデータ
   */
  createDummyRogueSkillTree() {
    return {
      metadata: {
        classType: "rogue",
        displayName: "盗賊",
        description: "素早い攻撃と隠密行動のスペシャリスト"
      },
      nodes: [
        {
          id: "rogue_root",
          type: "root",
          position: { x: 400, y: 100 },
          name: "盗賊の道",
          description: "盗賊のスキルツリーの始まり",
          icon: "rogue_root.png",
          connections: ["rogue_backstab"]
        },
        {
          id: "rogue_backstab",
          type: "skill",
          position: { x: 400, y: 200 },
          name: "バックスタブ",
          description: "背後から攻撃し、高いダメージを与える",
          icon: "backstab.png",
          actionId: "special_backstab",
          manaCost: 12,
          cooldown: 10,
          requiredLevel: 3,
          requiredPoints: 1,
          connections: []
        }
      ]
    };
  }

  /**
   * ダミーの魔法使いスキルツリーを作成
   * @returns {Object} - ダミースキルツリーデータ
   */
  createDummyMageSkillTree() {
    return {
      metadata: {
        classType: "mage",
        displayName: "魔法使い",
        description: "魔法攻撃のスペシャリスト"
      },
      nodes: [
        {
          id: "mage_root",
          type: "root",
          position: { x: 400, y: 100 },
          name: "魔法使いの道",
          description: "魔法使いのスキルツリーの始まり",
          icon: "mage_root.png",
          connections: ["mage_fireball"]
        },
        {
          id: "mage_fireball",
          type: "skill",
          position: { x: 400, y: 200 },
          name: "ファイアボール",
          description: "炎の球を放ち、範囲ダメージを与える",
          icon: "fireball.png",
          actionId: "special_fireball",
          manaCost: 15,
          cooldown: 8,
          requiredLevel: 3,
          requiredPoints: 1,
          connections: []
        }
      ]
    };
  }
}

export default SkillLoader;