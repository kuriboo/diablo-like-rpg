// src/game/ai/behaviors/ChaseBehavior.js
/**
 * ターゲットを追跡する行動
 */
export default class ChaseBehavior {
    constructor(owner) {
      this.owner = owner;
      this.name = "chase";
      this.controller = null; // AIControllerから設定される
      this.isRunning = false;
      this.speed = 1.2; // 通常移動の1.2倍
    }
    
    /**
     * 行動開始時処理
     */
    enter() {
      this.isRunning = true;
      
      // 追跡アニメーション設定
      if (this.owner.animationState !== 'run') {
        this.owner.animationState = 'run';
        if (this.owner.playAnimation) {
          this.owner.playAnimation();
        }
      }
    }
    
    /**
     * 行動実行処理
     */
    execute(delta) {
      if (!this.isRunning || !this.owner || !this.controller) return;
      
      // ブラックボードからターゲットを取得
      const target = this.controller.blackboard.target;
      
      if (!target || target.isDead) {
        // ターゲットがいない/死亡した場合は行動終了
        this.controller.blackboard.target = null;
        this.controller.decideBehavior();
        return;
      }
      
      // ターゲットへの移動
      this.moveTowardsTarget(target, delta);
    }
    
    /**
     * ターゲットへ移動
     */
    moveTowardsTarget(target, delta) {
      if (!this.owner || !target) return;
      
      // ターゲットの方向を向く
      this.faceTarget(target);
      
      // 移動速度の計算
      const moveSpeed = this.owner.getMoveSpeed ? 
                       this.owner.getMoveSpeed() * this.speed : 
                       2 * this.speed;
      
      // ターゲットとの距離と方向
      const dx = target.x - this.owner.x;
      const dy = target.y - this.owner.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 方向の正規化
      const normalizedDx = dx / distance;
      const normalizedDy = dy / distance;
      
      // 移動量の計算
      const moveAmount = moveSpeed * (delta / 16); // 60FPSを想定
      
      // 新しい位置
      const newX = this.owner.x + normalizedDx * moveAmount;
      const newY = this.owner.y + normalizedDy * moveAmount;
      
      // 移動可能かチェック
      const canMove = !this.owner.scene.canMoveToPosition || 
                      this.owner.scene.canMoveToPosition(newX, newY);
      
      if (canMove) {
        this.owner.x = newX;
        this.owner.y = newY;
      }
      
      // 移動アニメーション
      if (this.owner.animationState !== 'run') {
        this.owner.animationState = 'run';
        if (this.owner.playAnimation) {
          this.owner.playAnimation();
        }
      }
    }
    
    /**
     * ターゲットの方向を向く
     */
    faceTarget(target) {
      if (!this.owner || !target) return;
      
      const dx = target.x - this.owner.x;
      const dy = target.y - this.owner.y;
      
      // 向きを決定（4方向）
      if (Math.abs(dx) > Math.abs(dy)) {
        this.owner.direction = dx > 0 ? 'right' : 'left';
      } else {
        this.owner.direction = dy > 0 ? 'down' : 'up';
      }
    }
    
    /**
     * 行動終了時処理
     */
    exit() {
      this.isRunning = false;
      
      // アニメーションをアイドルに戻す
      if (this.owner) {
        this.owner.animationState = 'idle';
        if (this.owner.playAnimation) {
          this.owner.playAnimation();
        }
      }
    }
}