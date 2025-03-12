import { NodeState } from '../core/BehaviorTree';

/**
 * IdleBehavior - キャラクターの待機行動を制御
 */
class IdleBehavior {
  /**
   * 新しい待機行動を作成
   * @param {object} options - 設定オプション
   */
  constructor(options = {}) {
    this.options = {
      minIdleTime: 1000, // 最小待機時間（ミリ秒）
      maxIdleTime: 3000, // 最大待機時間（ミリ秒）
      idleAnimations: ['idle', 'lookAround', 'scratch'], // 待機中のアニメーション
      randomMovement: false, // 待機中にランダムに少し動くかどうか
      movementRadius: 50, // ランダム移動の最大半径
      ...options
    };
    
    this.idleStartTime = 0;
    this.currentIdleTime = 0;
    this.idleEndTime = 0;
    this.isIdle = false;
    this.currentAnimation = null;
    this.movementTarget = null;
    this.state = NodeState.FAILURE;
  }

  /**
   * 待機行動を実行
   * @param {AIController} controller - AIコントローラー
   * @param {number} delta - 前回の更新からの経過時間
   * @returns {string} 実行結果の状態
   */
  execute(controller, delta) {
    const owner = controller.owner;
    
    // 所有者の検証
    if (!owner) {
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // ターゲットがある場合は待機終了
    const target = controller.target;
    if (target && target.Life > 0) {
      this.stopIdle();
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // 待機開始
    if (!this.isIdle) {
      this.startIdle();
    }
    
    // 待機時間が終了したかチェック
    const currentTime = Date.now();
    if (currentTime >= this.idleEndTime) {
      this.stopIdle();
      this.state = NodeState.SUCCESS;
      return this.state;
    }
    
    // ランダム移動が有効な場合
    if (this.options.randomMovement) {
      // 移動ターゲットがなければ新しいターゲットを作成
      if (!this.movementTarget) {
        this.createMovementTarget(owner);
      }
      
      // ターゲットに向かって移動
      if (this.movementTarget) {
        const distance = this.calculateDistance(owner.position, this.movementTarget);
        
        // ターゲットに到達したら新しいターゲットを作成
        if (distance < 5) {
          this.movementTarget = null;
          // たまにじっとする時間を作る
          if (Math.random() < 0.3) {
            this.movementTarget = null;
            setTimeout(() => {
              if (this.isIdle) {
                this.createMovementTarget(owner);
              }
            }, 1000 + Math.random() * 1000);
          } else {
            this.createMovementTarget(owner);
          }
        } else {
          // ターゲットに向かってゆっくり移動
          this.moveTowards(owner, this.movementTarget, delta, 0.3);
        }
      }
    }
    
    // アニメーションの更新/切り替え
    this.updateAnimation(owner, currentTime);
    
    this.state = NodeState.RUNNING;
    return this.state;
  }

  /**
   * 待機開始
   */
  startIdle() {
    const currentTime = Date.now();
    this.idleStartTime = currentTime;
    this.currentIdleTime = this.options.minIdleTime + Math.random() * (this.options.maxIdleTime - this.options.minIdleTime);
    this.idleEndTime = currentTime + this.currentIdleTime;
    this.isIdle = true;
    this.currentAnimation = null;
    this.movementTarget = null;
  }

  /**
   * 待機終了
   */
  stopIdle() {
    this.isIdle = false;
    this.currentAnimation = null;
    this.movementTarget = null;
    
    // アニメーションを停止/リセット
    const owner = this.owner;
    if (owner && owner.setAnimation) {
      owner.setAnimation('idle');
    }
  }

  /**
   * ランダムな移動ターゲットを作成
   * @param {Character} character - キャラクター
   */
  createMovementTarget(character) {
    // ランダムな角度と距離を生成
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.options.movementRadius;
    
    // 新しい位置を計算
    const x = character.position.x + Math.cos(angle) * distance;
    const y = character.position.y + Math.sin(angle) * distance;
    
    // ナビゲーションメッシュに安全ポイントを投影（実装があれば）
    const controller = character.controller;
    if (controller) {
      const navMesh = controller.getBlackboardValue('navMesh');
      if (navMesh) {
        const projectedPoint = navMesh.projectPoint({ x, y });
        if (projectedPoint) {
          this.movementTarget = projectedPoint;
          return;
        }
      }
    }
    
    this.movementTarget = { x, y };
  }

  /**
   * アニメーションを更新
   * @param {Character} character - キャラクター
   * @param {number} currentTime - 現在の時間
   */
  updateAnimation(character, currentTime) {
    // アニメーションが設定されていない、または時間が経過したら新しいアニメーションを選択
    if (!this.currentAnimation || currentTime - this.lastAnimationChange > 3000) {
      // ランダムなアニメーションを選択
      if (this.options.idleAnimations.length > 0) {
        const randomIndex = Math.floor(Math.random() * this.options.idleAnimations.length);
        this.currentAnimation = this.options.idleAnimations[randomIndex];
        this.lastAnimationChange = currentTime;
        
        // キャラクターにアニメーションを設定
        if (character.setAnimation) {
          character.setAnimation(this.currentAnimation);
        }
      }
    }
  }

  /**
   * 指定された位置に向かって移動
   * @param {Character} character - キャラクター
   * @param {object} position - 目標位置
   * @param {number} delta - 前回の更新からの経過時間
   * @param {number} speedMultiplier - 速度倍率
   */
  moveTowards(character, position, delta, speedMultiplier = 1.0) {
    // 方向ベクトルを計算
    const dx = position.x - character.position.x;
    const dy = position.y - character.position.y;
    
    // 方向を正規化
    const length = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / length;
    const dirY = dy / length;
    
    // 移動距離を計算
    const speed = character.MoveSpeed * speedMultiplier;
    const moveDistance = speed * delta / 1000; // 秒単位に変換
    
    // 新しい位置を計算
    const newX = character.position.x + dirX * moveDistance;
    const newY = character.position.y + dirY * moveDistance;
    
    // キャラクターの位置を更新
    if (character.move) {
      character.move(newX, newY);
    } else {
      character.position.x = newX;
      character.position.y = newY;
    }
    
    // 移動方向を向く
    if (character.setDirection) {
      const angle = Math.atan2(dy, dx);
      character.setDirection(angle);
    }
  }

  /**
   * 2つの位置間の距離を計算
   * @param {object} pos1 - 最初の位置
   * @param {object} pos2 - 2番目の位置
   * @returns {number} 位置間の距離
   */
  calculateDistance(pos1, pos2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 行動の状態をリセット
   */
  reset() {
    this.state = NodeState.FAILURE;
    this.isIdle = false;
    this.currentAnimation = null;
    this.movementTarget = null;
  }
}

export default IdleBehavior;