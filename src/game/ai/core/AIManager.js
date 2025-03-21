/**
 * ゲーム内の複数のAIコントローラーを管理・更新します
 * 一元的な制御とパフォーマンス最適化を提供します
 */
import { getDistance } from '../../utils/mathUtils';

class AIManager {
    constructor() {
      this.controllers = new Map();
      this.enabled = true;
      this.globalBlackboard = new Map(); // 全AIで共有されるデータ
    }
  
    /**
     * AIコントローラーをマネージャーに登録します
     * @param {string} id - このコントローラーの一意の識別子
     * @param {AIController} controller - 登録するコントローラー
     */
    register(id, controller) {
      if (this.controllers.has(id)) {
        console.warn(`ID ${id} のAIコントローラーは既に存在します。置き換えます。`);
      }
      this.controllers.set(id, controller);
    }
  
    /**
     * AIコントローラーの登録を解除します
     * @param {string} id - 削除するコントローラーのID
     */
    unregister(id) {
      this.controllers.delete(id);
    }
  
    /**
     * 登録されたAIコントローラーを取得します
     * @param {string} id - 取得するコントローラーのID
     * @returns {AIController|undefined} 要求されたコントローラーまたはundefined
     */
    getController(id) {
      return this.controllers.get(id);
    }
  
    /**
     * 登録されたすべてのAIコントローラーを更新します
     * @param {number} time - 現在のゲーム時間
     * @param {number} delta - 前回の更新からの経過時間
     */
    update(time, delta) {
      if (!this.enabled) return;
      
      // すべてのコントローラーを更新
      for (const controller of this.controllers.values()) {
        controller.update(time, delta);
      }
    }
  
    /**
     * すべてのAIコントローラーを有効または無効にします
     * @param {boolean} value - 有効にするかどうか
     */
    setEnabled(value) {
      this.enabled = value;
      
      // すべてのコントローラーに適用
      for (const controller of this.controllers.values()) {
        controller.setEnabled(value);
      }
    }
  
    /**
     * グローバルブラックボードに値を保存します
     * @param {string} key - 値を保存するキー
     * @param {any} value - 保存する値
     */
    setGlobalBlackboardValue(key, value) {
      this.globalBlackboard.set(key, value);
    }
  
    /**
     * グローバルブラックボードから値を取得します
     * @param {string} key - 取得するキー
     * @param {any} defaultValue - キーが存在しない場合のデフォルト値
     * @returns {any} 保存された値またはデフォルト値
     */
    getGlobalBlackboardValue(key, defaultValue = null) {
      return this.globalBlackboard.has(key) ? this.globalBlackboard.get(key) : defaultValue;
    }
  
    /**
     * 指定した位置から一定の半径内にあるすべてのAIコントローラーを取得します
     * @param {object} position - 中心位置
     * @param {number} radius - 検索する半径
     * @returns {Array} 半径内のAIコントローラーの配列
     */
    getControllersInRadius(position, radius) {
      const result = [];
      
      for (const controller of this.controllers.values()) {
        if (controller.owner) {
          const distance = getDistance(position.x, position.y, controller.owner.x, controller.owner.y);
          if (distance <= radius) {
            result.push(controller);
          }
        }
      }
      
      return result;
    }
}
  
export default AIManager;