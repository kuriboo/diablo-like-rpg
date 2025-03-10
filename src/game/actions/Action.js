import { v4 as uuidv4 } from 'uuid';
import { ActionType } from '../../constants/actionTypes';

export default class Action {
  constructor(config = {}) {
    // 基本情報
    this.uuid = uuidv4();
    this.name = config.name || 'Action';
    this.description = config.description || 'A basic action';
    
    // アクションタイプ
    this.type = config.type || ActionType.NONE;
    
    // アクションを所有するキャラクター
    this.owner = config.owner || null;
    
    // アクションの対象となるキャラクターやアイテムなど
    this.target = config.target || null;
    
    // アクションの発生位置
    this.position = config.position || null;
    
    // アクション実行時のコールバック
    this.onStart = config.onStart || null;
    this.onUpdate = config.onUpdate || null;
    this.onComplete = config.onComplete || null;
    
    // アクションの状態
    this.isRunning = false;
    this.progress = 0; // 0.0 - 1.0
    this.duration = config.duration || 0; // ミリ秒
    this.startTime = 0;
    
    // アクションの制約条件
    this.conditions = config.conditions || [];
    
    // エフェクト参照
    this.effects = [];
    
    // シーン参照
    this.scene = config.scene || (this.owner ? this.owner.scene : null);
  }
  
  // アクションの実行
  play() {
    // 既に実行中の場合は何もしない
    if (this.isRunning) return false;
    
    // 条件チェック
    if (!this.checkConditions()) return false;
    
    // 実行開始
    this.isRunning = true;
    this.progress = 0;
    this.startTime = Date.now();
    
    // 開始コールバックの呼び出し
    if (this.onStart) {
      this.onStart(this);
    }
    
    // アクション固有の実行処理
    this.execute();
    
    // 継続的なアクションの場合は更新処理を設定
    if (this.duration > 0 && this.scene) {
      this.scene.events.on('update', this.update, this);
    } 
    // 瞬時のアクションはすぐに完了
    else {
      this.complete();
    }
    
    return true;
  }
  
  // アクション固有の実行処理（サブクラスでオーバーライド）
  execute() {
    // 基本クラスでは何もしない
    console.log(`Executing action: ${this.name}`);
  }
  
  // アクションの更新処理
  update(time, delta) {
    if (!this.isRunning) return;
    
    // 経過時間に基づく進行度の更新
    const elapsed = Date.now() - this.startTime;
    this.progress = Math.min(elapsed / this.duration, 1);
    
    // 更新コールバックの呼び出し
    if (this.onUpdate) {
      this.onUpdate(this, this.progress);
    }
    
    // アクション固有の更新処理
    this.updateAction(time, delta);
    
    // 完了判定
    if (this.progress >= 1) {
      this.complete();
    }
  }
  
  // アクション固有の更新処理（サブクラスでオーバーライド）
  updateAction(time, delta) {
    // 基本クラスでは何もしない
  }
  
  // アクションの完了処理
  complete() {
    if (!this.isRunning) return;
    
    // 実行状態を終了
    this.isRunning = false;
    this.progress = 1;
    
    // 完了コールバックの呼び出し
    if (this.onComplete) {
      this.onComplete(this);
    }
    
    // アクションタイプに応じた処理
    this.handleActionCompletion();
    
    // 更新イベントの解除
    if (this.scene) {
      this.scene.events.off('update', this.update, this);
    }
    
    // エフェクトをクリーンアップ
    this.cleanupEffects();
  }
  
  // アクションタイプに応じた完了処理（サブクラスでオーバーライド）
  handleActionCompletion() {
    // 基本クラスでは何もしない
  }
  
  // アクションの強制終了
  stop() {
    if (!this.isRunning) return;
    
    // 実行状態を終了
    this.isRunning = false;
    
    // 更新イベントの解除
    if (this.scene) {
      this.scene.events.off('update', this.update, this);
    }
    
    // エフェクトをクリーンアップ
    this.cleanupEffects();
  }
  
  // 条件チェック
  checkConditions() {
    // 条件がなければ常に成功
    if (!this.conditions || this.conditions.length === 0) {
      return true;
    }
    
    // すべての条件をチェック
    for (const condition of this.conditions) {
      if (!this.checkCondition(condition)) {
        return false;
      }
    }
    
    return true;
  }
  
  // 個別の条件チェック
  checkCondition(condition) {
    // オーナーチェック
    if (!this.owner) return false;
    
    switch (condition.type) {
      // マナ消費条件
      case 'manaCost':
        return this.owner.mana >= condition.value;
      
      // 体力条件
      case 'healthPercent':
        return (this.owner.life / this.owner.maxLife) * 100 >= condition.value;
      
      // クールダウン条件
      case 'cooldown':
        return !condition.lastUsed || (Date.now() - condition.lastUsed) >= condition.value;
      
      // レベル条件
      case 'level':
        return this.owner.level >= condition.value;
      
      // アイテム所持条件
      case 'hasItem':
        return this.owner.inventory && this.owner.inventory.hasItem(condition.value);
      
      // 状態条件（スタン中やダメージ中でないなど）
      case 'state':
        return this.owner[condition.property] === condition.value;
      
      // 範囲条件（対象が一定範囲内にいるか）
      case 'range':
        if (!this.target) return false;
        
        const distance = Phaser.Math.Distance.Between(
          this.owner.x, this.owner.y,
          this.target.x, this.target.y
        );
        
        return distance <= condition.value;
      
      // カスタム条件（関数で指定）
      case 'custom':
        return condition.check(this.owner, this.target);
      
      default:
        return true;
    }
  }
  
  // エフェクトの追加
  addEffect(effect) {
    if (effect) {
      this.effects.push(effect);
    }
  }
  
  // エフェクトのクリーンアップ
  cleanupEffects() {
    // 一時的なエフェクトを終了
    for (const effect of this.effects) {
      if (effect && effect.destroy) {
        effect.destroy();
      }
    }
    
    this.effects = [];
  }
  
  // 所有者と対象間の方向を取得
  getDirectionToTarget() {
    if (!this.owner || !this.target) return null;
    
    const dx = this.target.x - this.owner.x;
    const dy = this.target.y - this.owner.y;
    
    // 角度を計算（ラジアン）
    const angle = Math.atan2(dy, dx);
    
    // 8方向に変換
    const directions = ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right'];
    const index = Math.round(angle / (Math.PI * 2 / 8) + 8) % 8;
    
    return directions[index];
  }
  
  // 所有者と位置間の方向を取得
  getDirectionToPosition() {
    if (!this.owner || !this.position) return null;
    
    const dx = this.position.x - this.owner.x;
    const dy = this.position.y - this.owner.y;
    
    // 角度を計算（ラジアン）
    const angle = Math.atan2(dy, dx);
    
    // 8方向に変換
    const directions = ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right'];
    const index = Math.round(angle / (Math.PI * 2 / 8) + 8) % 8;
    
    return directions[index];
  }
  
  // 所有者の向きを対象に向ける
  faceTarget() {
    if (!this.owner || !this.target) return;
    
    // 対象との相対位置
    const dx = this.target.x - this.owner.x;
    const dy = this.target.y - this.owner.y;
    
    // 向きを決定（4方向）
    if (Math.abs(dx) > Math.abs(dy)) {
      this.owner.direction = dx > 0 ? 'right' : 'left';
    } else {
      this.owner.direction = dy > 0 ? 'down' : 'up';
    }
    
    // アニメーション更新
    if (this.owner.playAnimation) {
      this.owner.playAnimation();
    }
  }
  
  // 所有者の向きを位置に向ける
  facePosition() {
    if (!this.owner || !this.position) return;
    
    // 位置との相対位置
    const dx = this.position.x - this.owner.x;
    const dy = this.position.y - this.owner.y;
    
    // 向きを決定（4方向）
    if (Math.abs(dx) > Math.abs(dy)) {
      this.owner.direction = dx > 0 ? 'right' : 'left';
    } else {
      this.owner.direction = dy > 0 ? 'down' : 'up';
    }
    
    // アニメーション更新
    if (this.owner.playAnimation) {
      this.owner.playAnimation();
    }
  }
  
  // アクションデータのシリアライズ
  serialize() {
    return {
      uuid: this.uuid,
      name: this.name,
      type: this.type,
      description: this.description,
      duration: this.duration
    };
  }
  
  // アクションデータのデシリアライズ（静的メソッド）
  static deserialize(data, scene) {
    return new Action({
      ...data,
      scene
    });
  }
}