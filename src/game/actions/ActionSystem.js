/**
 * ゲーム内のすべてのアクションを管理するシングルトンクラス
 * AIの行動、プレイヤーの行動、スキルなどを一元管理します
 */
import BasicAction from './BasicAction';
import SpecialAction from './SpecialAction';

export default class ActionSystem {
    constructor() {
      // シングルトンインスタンス
      if (ActionSystem.instance) {
        return ActionSystem.instance;
      }
      
      // アクションキュー
      this.actionQueue = [];
      
      // 現在実行中のアクション
      this.currentActions = new Map();
      
      // シーン参照
      this.scene = null;
      
      // インスタンスを保存
      ActionSystem.instance = this;
    }
  
    /**
     * システムを初期化
     * @param {Scene} scene - メインシーン
     */
    initialize(scene) {
      this.scene = scene;
      this.actionQueue = [];
      this.currentActions.clear();
      
      // 更新イベントをバインド
      if (this.scene) {
        this.scene.events.on('update', this.update, this);
      }
      
      return this;
    }
  
    /**
     * 更新処理 - 各フレームで実行
     * @param {number} time - 現在時間
     * @param {number} delta - 前回更新からの経過時間
     */
    update(time, delta) {
      // 実行中のアクションを更新
      for (const [id, action] of this.currentActions.entries()) {
        if (action.isRunning) {
          action.update(time, delta);
        } else {
          this.currentActions.delete(id);
        }
      }
      
      // キューにアクションがあれば実行
      while (this.actionQueue.length > 0 && this.currentActions.size < 10) {
        const action = this.actionQueue.shift();
        this.executeAction(action);
      }
    }
  
    /**
     * アクションを実行キューに追加
     * @param {Action} action - 実行するアクション
     * @param {boolean} immediate - 即時実行するかどうか
     * @returns {boolean} 追加に成功したかどうか
     */
    queueAction(action, immediate = false) {
      if (!action) return false;
      
      // 即時実行の場合
      if (immediate) {
        return this.executeAction(action);
      }
      
      // キューに追加
      this.actionQueue.push(action);
      return true;
    }
  
    /**
     * アクションを実行
     * @param {Action} action - 実行するアクション
     * @returns {boolean} 実行に成功したかどうか
     */
    executeAction(action) {
      if (!action) return false;
      
      // 既に実行中ならスキップ
      if (action.isRunning) return true;
      
      // 条件チェック
      if (!action.checkConditions()) return false;
      
      // アクションを実行
      const success = action.play();
      
      if (success) {
        // 実行中リストに追加
        this.currentActions.set(action.uuid, action);
      }
      
      return success;
    }
  
    /**
     * 特定のアクションをキャンセル
     * @param {string} actionId - キャンセルするアクションのID
     * @returns {boolean} キャンセルに成功したかどうか
     */
    cancelAction(actionId) {
      // 実行中からキャンセル
      if (this.currentActions.has(actionId)) {
        const action = this.currentActions.get(actionId);
        action.stop();
        this.currentActions.delete(actionId);
        return true;
      }
      
      // キューからキャンセル
      const index = this.actionQueue.findIndex(a => a.uuid === actionId);
      if (index !== -1) {
        this.actionQueue.splice(index, 1);
        return true;
      }
      
      return false;
    }
  
    /**
     * 特定のエンティティのすべてのアクションをキャンセル
     * @param {Character} entity - 対象エンティティ
     * @returns {number} キャンセルしたアクション数
     */
    cancelEntityActions(entity) {
      if (!entity) return 0;
      
      let count = 0;
      
      // 実行中のアクションをキャンセル
      for (const [id, action] of this.currentActions.entries()) {
        if (action.owner === entity) {
          action.stop();
          this.currentActions.delete(id);
          count++;
        }
      }
      
      // キュー内のアクションをキャンセル
      this.actionQueue = this.actionQueue.filter(action => {
        if (action.owner === entity) {
          count++;
          return false;
        }
        return true;
      });
      
      return count;
    }
  
    /**
     * すべてのアクションをキャンセル
     */
    cancelAllActions() {
      // 実行中のアクションをすべて停止
      for (const action of this.currentActions.values()) {
        action.stop();
      }
      
      // 実行中リストとキューをクリア
      this.currentActions.clear();
      this.actionQueue = [];
    }
  
    /**
     * 特定タイプのアクションを作成
     * @param {string} type - アクションタイプ
     * @param {object} config - アクション設定
     * @returns {Action} 作成されたアクション
     */
    createAction(type, config = {}) {
      
      // シーンを設定
      config.scene = this.scene;
      
      // タイプに応じてアクションを作成
      switch (type) {
        case 'move':
        case 'attack':
        case 'idle':
        case 'patrol':
        case 'flee':
        case 'return':
        case 'chase':
          return new BasicAction(type, config);
          
        case 'skill':
        case 'spell':
        case 'ability':
          return new SpecialAction(type, config);
          
        default:
          // 不明タイプはBasicActionを返す
          return new BasicAction('basic', config);
      }
    }

    /**
     * 特定のエンティティが現在行動中かどうかを確認
     * @param {Character} entity - 確認するエンティティ
     * @returns {boolean} エンティティが行動中の場合はtrue
     */
    isEntityActing(entity) {
        if (!entity) return false;
        
        // 実行中のアクションを確認
        for (const action of this.currentActions.values()) {
        if (action.owner === entity) {
            return true;
        }
        }
        
        // キュー内のアクションも確認
        return this.actionQueue.some(action => action.owner === entity);
    }
  
    /**
     * システムのクリーンアップ
     */
    cleanup() {
      this.cancelAllActions();
      
      if (this.scene) {
        this.scene.events.off('update', this.update, this);
      }
      
      this.scene = null;
    }
  
    /**
     * シングルトンインスタンスの取得
     * @returns {ActionSystem} ActionSystemインスタンス
     */
    static getInstance() {
      if (!ActionSystem.instance) {
        ActionSystem.instance = new ActionSystem();
      }
      return ActionSystem.instance;
    }
  }