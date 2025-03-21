import { NodeState } from '../core/BehaviorTree';
import { getDistance } from '../../utils/mathUtils';

/**
 * PatrolBehavior - キャラクターの巡回行動を制御
 */
class PatrolBehavior {
  /**
   * 新しい巡回行動を作成
   * @param {object} options - 設定オプション
   */
  constructor(options = {}) {
    this.options = {
      patrolPoints: [], // 巡回ポイントの配列
      waypointRadius: 10, // ウェイポイントに到達したとみなす半径
      patrolSpeed: 0.8, // 巡回中の速度倍率
      waitTimeAtPoints: 1000, // 各ポイントでの待機時間（ミリ秒）
      randomizePatrol: false, // 巡回順序をランダム化するかどうか
      generateRandomPoints: false, // ランダムな巡回ポイントを生成するかどうか
      randomPointRadius: 200, // ランダムポイント生成の半径
      randomPointCount: 5, // 生成するランダムポイントの数
      ...options
    };
    
    this.currentPatrolIndex = 0;
    this.waitUntilTime = 0;
    this.isWaiting = false;
    this.patrolPoints = [...this.options.patrolPoints];
    this.state = NodeState.FAILURE;
  }

  /**
   * 巡回行動を実行
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
    
    // ターゲットがある場合は巡回終了
    const target = controller.target;
    if (target && target.life > 0) {
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // 巡回ポイントがなく、ランダム生成が有効な場合
    if (this.patrolPoints.length === 0 && this.options.generateRandomPoints) {
      this.generateRandomPatrolPoints(owner);
    }
    
    // 巡回ポイントがない場合は失敗
    if (this.patrolPoints.length === 0) {
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // 現在のポイントを取得
    const currentPoint = this.patrolPoints[this.currentPatrolIndex];
    
    // 待機中の場合
    const currentTime = Date.now();
    if (this.isWaiting) {
      if (currentTime >= this.waitUntilTime) {
        // 待機終了、次のポイントへ
        this.isWaiting = false;
        this.moveToNextPatrolPoint();
      } else {
        // まだ待機中
        this.state = NodeState.RUNNING;
        return this.state;
      }
    }
    
    // ポイントとの距離を計算
    const distance = getDistance(owner.x, owner.y, currentPoint.x, currentPoint.y);
    
    // ポイントに到達した場合
    if (distance <= this.options.waypointRadius) {
      // ポイントで待機
      this.isWaiting = true;
      this.waitUntilTime = currentTime + this.options.waitTimeAtPoints;
      this.state = NodeState.RUNNING;
      return this.state;
    }
    
    // ポイントに向かって移動
    this.moveTowards(owner, currentPoint, delta);
    
    this.state = NodeState.RUNNING;
    return this.state;
  }

  /**
   * 次の巡回ポイントに移動
   */
  moveToNextPatrolPoint() {
    if (this.options.randomizePatrol) {
      // ランダムな次のポイントを選択
      this.currentPatrolIndex = Math.floor(Math.random() * this.patrolPoints.length);
    } else {
      // 順番に次のポイントへ
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    }
  }

  /**
   * ランダムな巡回ポイントを生成
   * @param {Character} character - キャラクター
   */
  generateRandomPatrolPoints(character) {
    this.patrolPoints = [];
    
    // キャラクターの現在位置を開始点として使用
    const startX = character.x;
    const startY = character.y;
    
    // ナビゲーションメッシュ
    const controller = character.controller;
    const navMesh = controller ? controller.getBlackboardValue('navMesh') : null;
    
    // 指定数のランダムポイントを生成
    for (let i = 0; i < this.options.randomPointCount; i++) {
      // ランダムな角度と距離を生成
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * this.options.randomPointRadius;
      
      // 新しい位置を計算
      const x = startX + Math.cos(angle) * distance;
      const y = startY + Math.sin(angle) * distance;
      
      // ナビゲーションメッシュに位置を投影（実装があれば）
      if (navMesh) {
        const projectedPoint = navMesh.projectPoint({ x, y });
        if (projectedPoint) {
          this.patrolPoints.push(projectedPoint);
          continue;
        }
      }
      
      // ナビゲーションメッシュがない場合はそのままポイントを追加
      this.patrolPoints.push({ x, y });
    }
    
    // 最初のポイントをキャラクターの現在位置に設定
    if (this.patrolPoints.length > 0) {
      this.patrolPoints[0] = { x: startX, y: startY };
    }
    
    // 現在のインデックスをリセット
    this.currentPatrolIndex = 0;
  }

  /**
   * 指定された位置に向かって移動
   * @param {Character} character - キャラクター
   * @param {object} position - 目標位置
   * @param {number} delta - 前回の更新からの経過時間
   */
  moveTowards(character, position, delta) {
    // 方向ベクトルを計算
    const dx = position.x - character.x;
    const dy = position.y - character.y;
    
    // 方向を正規化
    const length = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / length;
    const dirY = dy / length;
    
    // 移動距離を計算
    const speed = character.moveSpeed * this.options.patrolSpeed;
    const moveDistance = speed * delta / 1000; // 秒単位に変換
    
    // 新しい位置を計算
    const newX = character.x + dirX * moveDistance;
    const newY = character.y + dirY * moveDistance;
    
    // キャラクターの位置を更新
    if (character.move) {
      character.move(newX, newY);
    } else {
      character.x = newX;
      character.y = newY;
    }
    
    // 移動方向を向く
    if (character.setDirection) {
      const angle = Math.atan2(dy, dx);
      character.setDirection(angle);
    }
  }

  /**
   * 巡回ポイントを設定
   * @param {Array} points - 新しい巡回ポイントの配列
   */
  setPatrolPoints(points) {
    this.patrolPoints = [...points];
    this.currentPatrolIndex = 0;
    this.isWaiting = false;
  }

  /**
   * 行動の状態をリセット
   */
  reset() {
    this.state = NodeState.FAILURE;
    this.isWaiting = false;
    this.currentPatrolIndex = 0;
  }
}

export default PatrolBehavior;