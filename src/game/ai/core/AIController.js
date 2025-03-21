/**
 * ゲーム内のAIコントローラーの基本クラス
 * すべてのAI制御エンティティに共通の機能を提供します
 */
import { getDistance } from '../../utils/mathUtils';

class AIController {
    /**
     * 新しいAIコントローラーを作成します
     * @param {Character} owner - このAIが制御するキャラクター
     * @param {object} options - 設定オプション
     */
    constructor(owner, options = {}) {
      this.owner = owner;
      this.options = {
        updateInterval: 200, // AI更新間隔（ミリ秒）
        perceptionRadius: 300, // デフォルトの知覚半径
        ...options
      };
      
      this.enabled = true;
      this.target = null;
      this.lastUpdateTime = 0;
      this.blackboard = new Map(); // AI内部データの共有ストレージ
      this.currentBehavior = null;
    }
  
    /**
     * AIの状態を更新します
     * @param {number} time - 現在のゲーム時間
     * @param {number} delta - 前回の更新からの経過時間
     */
    update(time, delta) {
      if (!this.enabled || !this.owner) return;
      
      // パフォーマンスを節約するため、指定された間隔でのみ更新
      if (time - this.lastUpdateTime < this.options.updateInterval) return;
      this.lastUpdateTime = time;
      
      // 知覚の更新
      this.updatePerception();
      
      // 行動の更新
      if (this.currentBehavior) {
        const result = this.currentBehavior.execute(delta);
        if (result !== 'running') {
          this.selectNextBehavior();
        }
      } else {
        this.selectNextBehavior();
      }
    }
  
    /**
     * ターゲットや脅威を検出するための知覚システムを更新します
     */
    updatePerception() {
      // 基本実装 - 特定のAIタイプでオーバーライドされます
    }
  
    /**
     * 次に実行する行動を選択します
     */
    selectNextBehavior() {
      // 基本実装 - 特定のAIタイプでオーバーライドされます
    }
  
    /**
     * このAIの現在のターゲットを設定または解除します
     * @param {Character|null} target - 新しいターゲット、またはnullで解除
     */
    setTarget(target) {
      this.target = target;
      this.blackboard.set('currentTarget', target);
    }
  
    /**
     * 位置が知覚範囲内にあるかどうかを確認します
     * @param {object} position - 確認する位置
     * @returns {boolean} 位置が範囲内にある場合はtrue
     */
    isInPerceptionRange(position) {
      if (!this.owner || !position) return false;
      
      const distance = getDistance(this.owner.x, this.owner.y, position.x, position.y);
      return distance <= this.options.perceptionRadius;
    }
  
    /**
     * AIコントローラーを有効または無効にします
     * @param {boolean} value - 有効にするかどうか
     */
    setEnabled(value) {
      this.enabled = value;
    }
  
    /**
     * AIのブラックボードに値を保存します
     * @param {string} key - 値を保存するキー
     * @param {any} value - 保存する値
     */
    setBlackboardValue(key, value) {
      this.blackboard.set(key, value);
    }
  
    /**
     * AIのブラックボードから値を取得します
     * @param {string} key - 取得するキー
     * @param {any} defaultValue - キーが存在しない場合のデフォルト値
     * @returns {any} 保存された値またはデフォルト値
     */
    getBlackboardValue(key, defaultValue = null) {
      return this.blackboard.has(key) ? this.blackboard.get(key) : defaultValue;
    }
}
  
export default AIController;