/**
 * JSONファイルからスキルツリーデータを読み込むローダークラス
 */
class SkillLoader {
    constructor() {
      // キャッシュをクリア
      this.skillTreeCache = new Map();
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
          throw new Error(`Failed to load skill tree for ${classType}: ${response.statusText}`);
        }
        
        // JSONをパース
        const skillTreeData = await response.json();
        
        // キャッシュに保存
        this.skillTreeCache.set(classType, skillTreeData);
        
        return skillTreeData;
      } catch (error) {
        console.error(`Error loading skill tree for ${classType}:`, error);
        throw error;
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
}
  
export default SkillLoader;