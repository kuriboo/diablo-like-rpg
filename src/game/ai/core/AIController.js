// src/game/ai/core/AIController.js
import { generateUUID } from '../../../utils/uuid';

/**
 * AIコントローラーの基本クラス
 * キャラクターのAI動作を制御する基盤
 */
export default class AIController {
  constructor(owner) {
    this.uuid = generateUUID();
    this.owner = owner;
    this.active = true;
    this.behaviors = [];
    this.currentBehavior = null;
    this.blackboard = {}; // AI内部の状態データ
    
    // 知覚システム
    this.perceptionSystem = null;
    
    // 状態更新時間間隔（ms）
    this.updateInterval = 200;
    this.lastUpdateTime = 0;
  }
  
  /**
   * AIの初期化
   */
  initialize() {
    // サブクラスでオーバーライド
  }
  
  /**
   * 行動を追加
   * @param {Behavior} behavior - 追加する行動
   */
  addBehavior(behavior) {
    if (behavior) {
      behavior.controller = this;
      this.behaviors.push(behavior);
    }
  }
  
  /**
   * 更新処理
   * @param {number} time - 現在時間
   * @param {number} delta - 前フレームからの経過時間
   */
  update(time, delta) {
    if (!this.active || !this.owner) return;
    
    // 更新間隔ごとに行動決定
    if (time - this.lastUpdateTime >= this.updateInterval) {
      this.lastUpdateTime = time;
      this.decideBehavior();
    }
    
    // 現在の行動を実行
    if (this.currentBehavior) {
      this.currentBehavior.execute(delta);
    }
  }
  
  /**
   * 行動を決定
   */
  decideBehavior() {
    // サブクラスでオーバーライド
  }
  
  /**
   * 行動を切り替え
   * @param {Behavior} newBehavior - 新しい行動
   */
  changeBehavior(newBehavior) {
    if (this.currentBehavior === newBehavior) return;
    
    // 現在の行動を終了
    if (this.currentBehavior) {
      this.currentBehavior.exit();
    }
    
    // 新しい行動を開始
    this.currentBehavior = newBehavior;
    
    if (this.currentBehavior) {
      this.currentBehavior.enter();
    }
  }
  
  /**
   * 周囲の対象を検知
   * @param {number} range - 検知範囲
   * @returns {Array} - 検知した対象の配列
   */
  detectTargets(range) {
    // 知覚システムがあれば利用
    if (this.perceptionSystem) {
      return this.perceptionSystem.detectTargets(range);
    }
    
    // 基本的な実装（オーナーがいるシーンのキャラクターを検出）
    return this._basicDetection(range);
  }
  
  /**
   * 基本的な対象検出処理
   * @private
   */
  _basicDetection(range) {
    if (!this.owner || !this.owner.scene) return [];
    
    const scene = this.owner.scene;
    const targets = [];
    
    // 検出対象の決定（敵対関係に基づく）
    let potentialTargets = [];
    
    if (this.owner.constructor.name === 'Enemy') {
      // 敵AIの場合はプレイヤーとコンパニオンが対象
      potentialTargets = [scene.player, ...(scene.companions || [])];
    } else if (this.owner.constructor.name === 'Companion') {
      // コンパニオンAIの場合は敵が対象
      potentialTargets = scene.enemies || [];
    }
    
    // 範囲内の対象を抽出
    for (const target of potentialTargets) {
      if (!target || target.isDead) continue;
      
      const distance = Phaser.Math.Distance.Between(
        this.owner.x, this.owner.y,
        target.x, target.y
      );
      
      if (distance <= range) {
        targets.push({
          object: target,
          distance: distance
        });
      }
    }
    
    // 距離でソート
    return targets.sort((a, b) => a.distance - b.distance);
  }
  
  /**
   * AIをアクティブ/非アクティブに設定
   */
  setActive(active) {
    this.active = active;
    
    // 非アクティブ化時は現在の行動を終了
    if (!active && this.currentBehavior) {
      this.currentBehavior.exit();
      this.currentBehavior = null;
    }
  }
}