import Action from './Action';
import { ActionType } from '../../constants/actionTypes';
import { getDistance } from '../../utils/mathUtils';
import AssetManager from '../core/AssetManager';

/**
 * 基本的なアクションクラス
 * キャラクターの移動、攻撃、待機などの基本的な行動を扱います
 */
export default class BasicAction extends Action {
  /**
   * 基本アクションを作成
   * @param {string} type - アクションタイプ
   * @param {object} config - 設定オブジェクト
   */
  constructor(type, config = {}) {
    // Action親クラスのコンストラクタを呼び出し
    super({
      ...config,
      type: type || ActionType.BASIC
    });
    
    // アクション特有のプロパティ
    this.actionType = type; // 'move', 'attack', 'idle', 'patrol', 'flee', 'return', 'chase'
    
    // パス関連のプロパティ
    this.path = config.path || [];
    this.pathIndex = 0;
    this.topDownMap = config.topDownMap || (this.scene ? this.scene.topDownMap : null);
    
    // 移動関連のプロパティ
    this.moveSpeed = config.moveSpeed || (this.owner ? this.owner.moveSpeed : 1);
    this.maxDistance = config.maxDistance || 0;
    this.minDistance = config.minDistance || 0;
    
    // パトロール関連のプロパティ
    this.patrolPoints = config.patrolPoints || [];
    this.patrolIndex = 0;
    this.waitTimeAtPoints = config.waitTimeAtPoints || 0;
    this.isWaiting = false;
    this.waitUntilTime = 0;
    
    // 攻撃関連のプロパティ
    this.attackRange = config.attackRange || (this.owner ? this.owner.attackRange : 50);
    this.attackCooldown = config.attackCooldown || 0;
    this.lastAttackTime = 0;
    this.damage = config.damage || 0;
    this.damageType = config.damageType || 'physical';
    
    // アクション特有の設定
    this.setupAction();
  }

  /**
   * アクションタイプに応じた初期設定
   */
  setupAction() {
    switch (this.actionType) {
      case 'move':
        this.setupMoveAction();
        break;
        
      case 'attack':
        this.setupAttackAction();
        break;
        
      case 'idle':
        this.setupIdleAction();
        break;
        
      case 'patrol':
        this.setupPatrolAction();
        break;
        
      case 'flee':
        this.setupFleeAction();
        break;
        
      case 'return':
        this.setupReturnAction();
        break;
        
      case 'chase':
        this.setupChaseAction();
        break;
    }
  }

  /**
   * 移動アクションの設定
   */
  setupMoveAction() {
    // 移動アクション特有の初期化
    this.duration = this.path.length * 300; // パスの長さに応じたデフォルト時間
  }

  /**
   * 攻撃アクションの設定
   */
  setupAttackAction() {
    // 攻撃アクション特有の初期化
    this.duration = this.attackCooldown || 800; // 攻撃モーションの時間
    
    // 当たり判定時間
    this.hitTime = this.duration * 0.6; // 攻撃動作の60%時点で当たり判定
    
    // ダメージ計算
    if (this.owner && !this.damage) {
      this.damage = this.owner.basicAttack || 10;
    }
    
    // 攻撃範囲を設定
    if (this.owner && !this.attackRange) {
      this.attackRange = this.owner.attackRange || 50;
    }
    
    // 条件追加: 範囲内にいるか
    if (this.target) {
      this.conditions.push({
        type: 'range',
        value: this.attackRange / 32 // タイル単位に変換
      });
    }
  }

  /**
   * 待機アクションの設定
   */
  setupIdleAction() {
    // 待機アクション特有の初期化
    this.duration = 2000; // デフォルトの待機時間
    this.randomMovement = this.randomMovement !== undefined ? this.randomMovement : false;
    this.movementRadius = this.movementRadius || 50;
    this.movementTarget = null;
  }

  /**
   * 巡回アクションの設定
   */
  setupPatrolAction() {
    // 巡回アクション特有の初期化
    this.duration = 30000; // 巡回の最大時間
    
    // パトロールポイントがなく、生成フラグがある場合
    if (this.patrolPoints.length === 0 && this.owner && this.topDownMap) {
      this.generateRandomPatrolPoints();
    }
  }

  /**
   * 逃走アクションの設定
   */
  setupFleeAction() {
    // 逃走アクション特有の初期化
    this.duration = 5000; // 逃走の最大時間
    this.fleeDistance = this.fleeDistance || 300;
    this.safeDistance = this.safeDistance || 400;
    this.fleeSpeed = this.fleeSpeed || 1.7;
    this.safePoint = null;
  }

  /**
   * 帰還アクションの設定
   */
  setupReturnAction() {
    // 帰還アクション特有の初期化
    this.duration = 10000; // 帰還の最大時間
    this.homePoint = this.homePoint || null;
    this.returnSpeed = this.returnSpeed || 1.2;
    
    // ホームポイントの取得（ない場合）
    if (!this.homePoint && this.owner && this.scene) {
      this.homePoint = this.scene.getBlackboardValue
        ? this.scene.getBlackboardValue('homePoint')
        : null;
      
      // それでもない場合はオリジナル位置を使用
      if (!this.homePoint) {
        this.homePoint = this.scene.getBlackboardValue
          ? this.scene.getBlackboardValue('originalPosition')
          : null;
      }
    }
  }

  /**
   * 追跡アクションの設定
   */
  setupChaseAction() {
    // 追跡アクション特有の初期化
    this.duration = 10000; // 追跡の最大時間
    this.maxChaseDistance = this.maxChaseDistance || 400;
    this.minDistance = this.minDistance || 30;
    this.chaseSpeed = this.chaseSpeed || 1.5;
    this.updatePathInterval = this.updatePathInterval || 500;
    this.lastPathUpdateTime = 0;
  }

  /**
   * アクション固有の実行処理
   */
  execute() {
    switch (this.actionType) {
      case 'move':
        this.executeMove();
        break;
        
      case 'attack':
        this.executeAttack();
        break;
        
      case 'idle':
        this.executeIdle();
        break;
        
      case 'patrol':
        this.executePatrol();
        break;
        
      case 'flee':
        this.executeFlee();
        break;
        
      case 'return':
        this.executeReturn();
        break;
        
      case 'chase':
        this.executeChase();
        break;
        
      default:
        super.execute();
    }
  }

  /**
   * 移動アクションの実行
   */
  executeMove() {
    if (!this.owner || !this.path || this.path.length === 0) {
      this.complete();
      return;
    }
    
    // 移動アニメーション開始
    if (this.owner.setAnimation) {
      this.owner.setAnimation('walk');
    } else if (this.owner.animationState) {
      this.owner.animationState = 'walk';
      if (this.owner.playAnimation) {
        this.owner.playAnimation();
      }
    }
    
    // 継続的な更新は update() で行われる
  }

  /**
   * 攻撃アクションの実行
   */
  executeAttack() {
    if (!this.owner) {
      this.complete();
      return;
    }
    
    // ターゲットの方向を向く
    if (this.target) {
      this.faceTarget();
    }
    
    // 攻撃アニメーション開始
    if (this.owner.setAnimation) {
      this.owner.setAnimation('attack');
    } else if (this.owner.animationState) {
      this.owner.animationState = 'attack';
      if (this.owner.playAnimation) {
        this.owner.playAnimation();
      }
    }
    
    // 攻撃時間の記録
    this.lastAttackTime = Date.now();
    
    // 効果音再生 - AssetManagerの修正版メソッドを使用
    if (this.scene) {
      // オーナーの攻撃音が指定されていれば使用、なければデフォルトの攻撃音を使用
      const soundType = this.owner.attackSoundType || 'attack';
      
      try {
        // AssetManagerのplaySFXメソッドを使用
        // - 通常再生（キャッシュに存在する場合）
        // - Web Audio API 直接再生（キャッシュに存在しない場合）
        const result = AssetManager.playSFX(soundType, {
          volume: 0.8,
          rate: 1.0
        });
        
        // 再生に失敗した場合はバックアップとしてWeb Audio APIで直接ビープ音を生成
        if (!result) {
          this.playDirectAttackSound();
        }
      } catch (error) {
        console.warn('攻撃音の再生に失敗しました:', error);
        // Web Audio APIで直接ビープ音を生成
        this.playDirectAttackSound();
      }
    }
    
    // 攻撃エフェクト
    this.showAttackEffect();
    
    // 当たり判定は updateAction で行われる
  }

  /**
   * 待機アクションの実行
   */
  executeIdle() {
    if (!this.owner) {
      this.complete();
      return;
    }
    
    // 待機アニメーション開始
    if (this.owner.setAnimation) {
      this.owner.setAnimation('idle');
    } else if (this.owner.animationState) {
      this.owner.animationState = 'idle';
      if (this.owner.playAnimation) {
        this.owner.playAnimation();
      }
    }
    
    // ランダム移動が有効な場合は移動ターゲットを生成
    if (this.randomMovement) {
      this.createMovementTarget();
    }
  }

  /**
   * 巡回アクションの実行
   */
  executePatrol() {
    if (!this.owner || this.patrolPoints.length === 0) {
      this.complete();
      return;
    }
    
    // 最初のパトロールポイントへ移動開始
    this.moveToPatrolPoint();
  }

  /**
   * 逃走アクションの実行
   */
  executeFlee() {
    if (!this.owner || !this.target) {
      this.complete();
      return;
    }
    
    // 逃走アニメーション開始
    if (this.owner.setAnimation) {
      this.owner.setAnimation('run');
    } else if (this.owner.animationState) {
      this.owner.animationState = 'run';
      if (this.owner.playAnimation) {
        this.owner.playAnimation();
      }
    }
    
    // 安全ポイントを探す
    this.findSafePoint();
  }

  /**
   * 帰還アクションの実行
   */
  executeReturn() {
    if (!this.owner || !this.homePoint) {
      this.complete();
      return;
    }
    
    // 帰還アニメーション開始
    if (this.owner.setAnimation) {
      this.owner.setAnimation('walk');
    } else if (this.owner.animationState) {
      this.owner.animationState = 'walk';
      if (this.owner.playAnimation) {
        this.owner.playAnimation();
      }
    }
    
    // パスがあれば経路探索を行う
    if (this.topDownMap && this.topDownMap.findPath) {
      this.updateReturnPath();
    }
  }

  /**
   * 追跡アクションの実行
   */
  executeChase() {
    if (!this.owner || !this.target) {
      this.complete();
      return;
    }
    
    // 追跡アニメーション開始
    if (this.owner.setAnimation) {
      this.owner.setAnimation('run');
    } else if (this.owner.animationState) {
      this.owner.animationState = 'run';
      if (this.owner.playAnimation) {
        this.owner.playAnimation();
      }
    }
    
    // パスがあれば経路探索を行う
    if (this.topDownMap && this.topDownMap.findPath) {
      this.updateChasePath();
    }
  }

  /**
   * アクション固有の更新処理
   * @param {number} time - 現在時間
   * @param {number} delta - 前回更新からの経過時間
   */
  updateAction(time, delta) {
    switch (this.actionType) {
      case 'move':
        this.updateMove(delta);
        break;
        
      case 'attack':
        this.updateAttack(time);
        break;
        
      case 'idle':
        this.updateIdle(delta);
        break;
        
      case 'patrol':
        this.updatePatrol(time, delta);
        break;
        
      case 'flee':
        this.updateFlee(delta);
        break;
        
      case 'return':
        this.updateReturn(time, delta);
        break;
        
      case 'chase':
        this.updateChase(time, delta);
        break;
    }
  }

  /**
   * 移動アクションの更新
   * @param {number} delta - 前回更新からの経過時間
   */
  updateMove(delta) {
    if (!this.owner || !this.path || this.pathIndex >= this.path.length) {
      this.complete();
      return;
    }
    
    // 現在のウェイポイント
    const currentPoint = this.path[this.pathIndex];
    
    // ウェイポイントとの距離を計算
    const distance = getDistance(
      this.owner.x, this.owner.y,
      currentPoint.x, currentPoint.y
    );
    
    // ウェイポイントに到達した場合
    if (distance < 5) {
      this.pathIndex++;
      
      // 全ウェイポイントを移動し終えた場合
      if (this.pathIndex >= this.path.length) {
        this.complete();
        return;
      }
    }
    
    // 次のウェイポイントへ移動
    this.moveTowards(currentPoint, delta);
  }

  /**
   * 攻撃アクションの更新
   * @param {number} time - 現在時間
   */
  updateAttack(time) {
    // 攻撃開始から一定時間後に当たり判定
    const elapsed = time - this.startTime;
    
    if (elapsed >= this.hitTime && !this.hitProcessed) {
      this.processAttackHit();
      this.hitProcessed = true;
    }
  }

  /**
   * 待機アクションの更新
   * @param {number} delta - 前回更新からの経過時間
   */
  updateIdle(delta) {
    // ランダム移動が有効な場合
    if (this.randomMovement && this.movementTarget) {
      // 移動目標への距離計算
      const distance = getDistance(
        this.owner.x, this.owner.y,
        this.movementTarget.x, this.movementTarget.y
      );
      
      // 目標に到達した場合
      if (distance < 5) {
        this.movementTarget = null;
        
        // 一定確率で別の移動目標を作成
        if (Math.random() < 0.3) {
          setTimeout(() => {
            if (this.isRunning) {
              this.createMovementTarget();
            }
          }, 1000 + Math.random() * 1000);
        } else {
          this.createMovementTarget();
        }
      } else {
        // 目標に向かってゆっくり移動
        this.moveTowards(this.movementTarget, delta, 0.3);
      }
    }
  }

  /**
   * 巡回アクションの更新
   * @param {number} time - 現在時間
   * @param {number} delta - 前回更新からの経過時間
   */
  updatePatrol(time, delta) {
    if (!this.owner || this.patrolPoints.length === 0) {
      this.complete();
      return;
    }
    
    // 待機中の場合
    if (this.isWaiting) {
      if (time >= this.waitUntilTime) {
        // 待機終了、次のポイントへ
        this.isWaiting = false;
        this.patrolIndex = (this.patrolIndex + 1) % this.patrolPoints.length;
        this.moveToPatrolPoint();
      }
      return;
    }
    
    // 現在のパトロールポイント
    const currentPoint = this.patrolPoints[this.patrolIndex];
    
    // ポイントとの距離を計算
    const distance = getDistance(
      this.owner.x, this.owner.y,
      currentPoint.x, currentPoint.y
    );
    
    // ポイントに到達した場合
    if (distance < 10) {
      // ポイントで待機
      this.isWaiting = true;
      this.waitUntilTime = time + this.waitTimeAtPoints;
      return;
    }
    
    // ポイントに向かって移動
    this.moveTowards(currentPoint, delta, 0.8);
  }

  /**
   * 逃走アクションの更新
   * @param {number} delta - 前回更新からの経過時間
   */
  updateFlee(delta) {
    if (!this.owner || !this.target) {
      this.complete();
      return;
    }
    
    // ターゲットとの距離を計算
    const distance = getDistance(
      this.owner.x, this.owner.y,
      this.target.x, this.target.y
    );
    
    // 安全な距離まで逃げた場合
    if (distance >= this.safeDistance) {
      this.complete();
      return;
    }
    
    // 逃走方向に移動
    if (this.safePoint) {
      this.moveTowards(this.safePoint, delta, this.fleeSpeed);
    } else {
      this.fleeFromTarget(delta);
    }
  }

  /**
   * 帰還アクションの更新
   * @param {number} time - 現在時間
   * @param {number} delta - 前回更新からの経過時間
   */
  updateReturn(time, delta) {
    if (!this.owner || !this.homePoint) {
      this.complete();
      return;
    }
    
    // ホームポイントとの距離を計算
    const distance = getDistance(
      this.owner.x, this.owner.y,
      this.homePoint.x, this.homePoint.y
    );
    
    // ホームポイントに到達した場合
    if (distance < 20) {
      this.complete();
      return;
    }
    
    // 経路探索が有効な場合
    if (this.path && this.path.length > 0) {
      // パスに沿って移動
      this.followPath(delta);
    } else {
      // 直接ホームポイントに向かって移動
      this.moveTowards(this.homePoint, delta, this.returnSpeed);
    }
    
    // 一定間隔でパスを更新
    if (time - this.lastPathUpdateTime > 1000) {
      this.updateReturnPath();
      this.lastPathUpdateTime = time;
    }
  }

  /**
   * 追跡アクションの更新
   * @param {number} time - 現在時間
   * @param {number} delta - 前回更新からの経過時間
   */
  updateChase(time, delta) {
    if (!this.owner || !this.target) {
      this.complete();
      return;
    }
    
    // ターゲットの生存確認
    if (this.target.life <= 0) {
      this.complete();
      return;
    }
    
    // ターゲットとの距離を計算
    const distance = getDistance(
      this.owner.x, this.owner.y,
      this.target.x, this.target.y
    );
    
    // 最大追跡距離を超えた場合
    if (distance > this.maxChaseDistance) {
      this.complete();
      return;
    }
    
    // 最小距離以下になった場合
    if (distance <= this.minDistance) {
      this.complete();
      return;
    }
    
    // 経路探索が有効な場合
    if (this.path && this.path.length > 0) {
      // パスに沿って移動
      this.followPath(delta);
    } else {
      // 直接ターゲットに向かって移動
      this.moveTowards(this.target, delta, this.chaseSpeed);
    }
    
    // 一定間隔でパスを更新
    if (time - this.lastPathUpdateTime > this.updatePathInterval) {
      this.updateChasePath();
      this.lastPathUpdateTime = time;
    }
  }

  /**
   * 攻撃の当たり判定処理
   */
  processAttackHit() {
    if (!this.owner || !this.target) return;
    
    // 攻撃範囲内にいるか確認
    const distance = getDistance(
      this.owner.x, this.owner.y,
      this.target.x, this.target.y
    );
    
    if (distance <= this.attackRange) {
      // ダメージ適用
      if (this.target.takeDamage) {
        this.target.takeDamage(this.damage, this.damageType, false, this.owner);
      }
      
      // 攻撃ヒットエフェクト
      this.showHitEffect();
    }
  }

  /**
   * 攻撃エフェクトの表示
   */
  showAttackEffect() {
    if (!this.scene || !this.owner) return;
    
    // 攻撃方向
    const direction = this.getDirectionToTarget() || this.owner.direction || 'down';
    
    // 攻撃タイプに応じたエフェクト
    let effectType = 'slash';
    
    // 武器タイプに応じて変更
    if (this.owner.isUsingRangedWeapon && this.owner.isUsingRangedWeapon()) {
      effectType = 'bullet';
    } else if (!this.owner.isUsingMeleeWeapon || !this.owner.isUsingMeleeWeapon()) {
      effectType = 'punch';
    }
    
    // AssetManagerからエフェクトのテクスチャキーを取得
    const effectKey = AssetManager.getTextureKey('effect', effectType);
    
    // エフェクト位置
    let effectX = this.owner.x;
    let effectY = this.owner.y;
    
    // 方向に応じてオフセット
    const offset = 40;
    switch (direction) {
      case 'right':
        effectX += offset;
        break;
      case 'left':
        effectX -= offset;
        break;
      case 'down':
        effectY += offset;
        break;
      case 'up':
        effectY -= offset;
        break;
    }
    
    // エフェクト表示
    if (this.scene.add && effectKey) {
      const effect = this.scene.add.sprite(effectX, effectY, effectKey);
      effect.setScale(0.5);
      effect.setDepth(50);
      
      // アニメーション再生 - AssetManagerからアニメーションキーを取得
      const animKey = AssetManager.getAnimationKey('effect', effectType, 'default') || `${effectType}_anim`;
      if (effect.play) {
        effect.play(animKey);
      }
      
      // 範囲攻撃の場合は大きくする
      if (this.isAreaAttack) {
        effect.setScale(1.5);
      }
      
      // アニメーション終了時に削除
      effect.once('animationcomplete', () => {
        effect.destroy();
      });
      
      // エフェクトをリストに追加
      this.addEffect(effect);
    }
  }

  /**
   * 攻撃ヒットエフェクトの表示
   */
  showHitEffect() {
    if (!this.scene || !this.target) return;
    
    // ヒットエフェクト位置
    const effectX = this.target.x;
    const effectY = this.target.y;
    
    // AssetManagerからエフェクトのテクスチャキーを取得
    const effectKey = AssetManager.getTextureKey('effect', 'impact');
    
    // エフェクト表示
    if (this.scene.add && effectKey) {
      const effect = this.scene.add.sprite(effectX, effectY, effectKey);
      effect.setScale(0.5);
      effect.setDepth(50);
      
      // アニメーション再生 - AssetManagerからアニメーションキーを取得
      const animKey = AssetManager.getAnimationKey('effect', 'impact', 'default') || 'impact_anim';
      if (effect.play) {
        effect.play(animKey);
      }
      
      // アニメーション終了時に削除
      effect.once('animationcomplete', () => {
        effect.destroy();
      });
      
      // エフェクトをリストに追加
      this.addEffect(effect);
    }
  }

  /**
   * 指定された位置に向かって移動
   * @param {object} position - 目標位置
   * @param {number} delta - 前回更新からの経過時間
   * @param {number} speedMultiplier - 速度倍率
   */
  moveTowards(position, delta, speedMultiplier = 1.0) {
    if (!this.owner || !position) return;
    
    // 方向ベクトルを計算
    const dx = position.x - this.owner.x;
    const dy = position.y - this.owner.y;
    
    // 方向を正規化
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return;
    
    const dirX = dx / length;
    const dirY = dy / length;
    
    // 移動速度
    const speed = this.moveSpeed * speedMultiplier;
    
    // 移動距離を計算
    const moveDistance = speed * delta / 1000; // 秒単位に変換
    
    // 新しい位置を計算
    const newX = this.owner.x + dirX * moveDistance;
    const newY = this.owner.y + dirY * moveDistance;
    
    // キャラクターの位置を更新
    if (this.owner.move) {
      this.owner.move(newX, newY);
    } else {
      this.owner.x = newX;
      this.owner.y = newY;
    }
    
    // 移動方向を向く
    if (this.owner.setDirection) {
      const angle = Math.atan2(dy, dx);
      this.owner.setDirection(angle);
    } else if (this.owner.direction !== undefined) {
      // トップダウン向けに4方向に単純化
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
  }

  /**
   * 計算された経路に沿って移動
   * @param {number} delta - 前回更新からの経過時間
   */
  followPath(delta) {
    if (!this.owner || !this.path || this.pathIndex >= this.path.length) return;
    
    // 現在のウェイポイント
    const waypoint = this.path[this.pathIndex];
    
    // ウェイポイントとの距離を計算
    const distance = getDistance(
      this.owner.x, this.owner.y,
      waypoint.x, waypoint.y
    );
    
    // ウェイポイントに到達した場合
    if (distance < 5) {
      this.pathIndex++;
      
      // 全ウェイポイントを移動し終えた場合
      if (this.pathIndex >= this.path.length) {
        return;
      }
    }
    
    // 次のウェイポイントへ移動
    const speedMultiplier = this.actionType === 'chase' ? this.chaseSpeed :
                           this.actionType === 'return' ? this.returnSpeed : 1.0;
    this.moveTowards(waypoint, delta, speedMultiplier);
  }

  /**
   * ターゲットから逃げる
   * @param {number} delta - 前回更新からの経過時間
   */
  fleeFromTarget(delta) {
    if (!this.owner || !this.target) return;
    
    // 逃走方向を計算
    const dx = this.owner.x - this.target.x;
    const dy = this.owner.y - this.target.y;
    
    // 方向を正規化
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return;
    
    const dirX = dx / length;
    const dirY = dy / length;
    
    // 移動速度
    const speed = this.moveSpeed * this.fleeSpeed;
    
    // 移動距離を計算
    const moveDistance = speed * delta / 1000; // 秒単位に変換
    
    // 新しい位置を計算
    const newX = this.owner.x + dirX * moveDistance;
    const newY = this.owner.y + dirY * moveDistance;
    
    // キャラクターの位置を更新
    if (this.owner.move) {
      this.owner.move(newX, newY);
    } else {
      this.owner.x = newX;
      this.owner.y = newY;
    }
    
    // 移動方向を向く
    if (this.owner.setDirection) {
      // 逆方向を向く（逃げるので）
      const angle = Math.atan2(-dy, -dx);
      this.owner.setDirection(angle);
    } else if (this.owner.direction !== undefined) {
      // トップダウン向けに4方向に単純化
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
  }

  /**
   * 安全ポイントを見つける
   */
  findSafePoint() {
    if (!this.owner || !this.target) return;
    
    // ターゲットから逃げる方向ベクトルを計算
    const dx = this.owner.x - this.target.x;
    const dy = this.owner.y - this.target.y;
    
    // 方向を正規化
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return;
    
    const dirX = dx / length;
    const dirY = dy / length;
    
    // 逃走距離で安全ポイントを計算
    const safeX = this.owner.x + dirX * this.fleeDistance;
    const safeY = this.owner.y + dirY * this.fleeDistance;
    
    // ナビゲーションメッシュに安全ポイントを投影（実装があれば）
    if (this.topDownMap && this.topDownMap.projectPoint) {
      const tilePos = this.topDownMap.worldToTileXY(safeX, safeY);
      
      // 移動可能かチェック
      if (this.topDownMap.isWalkableAt && this.topDownMap.isWalkableAt(tilePos.x, tilePos.y)) {
        const worldPos = this.topDownMap.tileToWorldXY(tilePos.x, tilePos.y);
        this.safePoint = worldPos;
        return;
      }
    }
    
    // ナビゲーションメッシュがない場合はそのままポイントを設定
    this.safePoint = { x: safeX, y: safeY };
  }

  /**
   * 帰還経路の更新
   */
  updateReturnPath() {
    if (!this.owner || !this.homePoint || !this.topDownMap) return;
    
    // 現在位置をタイル座標に変換
    const ownerTile = this.topDownMap.worldToTileXY(this.owner.x, this.owner.y);
    
    // ホームポイントをタイル座標に変換
    const homeTile = this.topDownMap.worldToTileXY(this.homePoint.x, this.homePoint.y);
    
    // 経路探索
    const tilePath = this.topDownMap.findPath(
      ownerTile.x, ownerTile.y,
      homeTile.x, homeTile.y
    );
    
    // 経路が見つかった場合
    if (tilePath && tilePath.length > 0) {
      // タイル座標をワールド座標に変換
      this.path = tilePath.map(point => {
        const worldPos = this.topDownMap.tileToWorldXY(point.x, point.y);
        return { x: worldPos.x, y: worldPos.y };
      });
      
      // パスインデックスをリセット
      this.pathIndex = 0;
    } else {
      // 経路が見つからない場合は直接移動
      this.path = [];
    }
  }

  /**
   * 追跡経路の更新
   */
  updateChasePath() {
    if (!this.owner || !this.target || !this.topDownMap) return;
    
    // 現在位置をタイル座標に変換
    const ownerTile = this.topDownMap.worldToTileXY(this.owner.x, this.owner.y);
    
    // ターゲット位置をタイル座標に変換
    const targetTile = this.topDownMap.worldToTileXY(this.target.x, this.target.y);
    
    // 経路探索
    const tilePath = this.topDownMap.findPath(
      ownerTile.x, ownerTile.y,
      targetTile.x, targetTile.y
    );
    
    // 経路が見つかった場合
    if (tilePath && tilePath.length > 0) {
      // タイル座標をワールド座標に変換
      this.path = tilePath.map(point => {
        const worldPos = this.topDownMap.tileToWorldXY(point.x, point.y);
        return { x: worldPos.x, y: worldPos.y };
      });
      
      // パスインデックスをリセット
      this.pathIndex = 0;
    } else {
      // 経路が見つからない場合は直接移動
      this.path = [];
    }
  }

  /**
   * ランダムな移動目標を生成
   */
  createMovementTarget() {
    if (!this.owner) return;
    
    // ランダムな角度と距離を生成
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.movementRadius;
    
    // 新しい位置を計算
    const x = this.owner.x + Math.cos(angle) * distance;
    const y = this.owner.y + Math.sin(angle) * distance;
    
    // ナビゲーションメッシュで移動可能かチェック
    if (this.topDownMap && this.topDownMap.worldToTileXY) {
      const tilePos = this.topDownMap.worldToTileXY(x, y);
      
      // 移動可能かチェック
      if (this.topDownMap.isWalkableAt && this.topDownMap.isWalkableAt(tilePos.x, tilePos.y)) {
        const worldPos = this.topDownMap.tileToWorldXY(tilePos.x, tilePos.y);
        this.movementTarget = worldPos;
        return;
      }
    }
    
    // ナビゲーションメッシュがない場合はそのままポイントを設定
    this.movementTarget = { x, y };
  }

  /**
   * ランダムなパトロールポイントを生成
   */
  generateRandomPatrolPoints() {
    if (!this.owner || !this.topDownMap) return;
    
    this.patrolPoints = [];
    
    // キャラクターの現在位置を開始点として使用
    const startX = this.owner.x;
    const startY = this.owner.y;
    
    // ランダムポイント生成半径 - デフォルト値
    const radius = this.randomPointRadius || 200;
    
    // ランダムポイント数 - デフォルト値
    const count = this.randomPointCount || 5;
    
    // 指定数のランダムポイントを生成
    for (let i = 0; i < count; i++) {
      // ランダムな角度と距離を生成
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      
      // 新しい位置を計算
      const x = startX + Math.cos(angle) * distance;
      const y = startY + Math.sin(angle) * distance;
      
      // タイル座標に変換
      const tilePos = this.topDownMap.worldToTileXY(x, y);
      
      // 移動可能かチェック
      if (this.topDownMap.isWalkableAt && this.topDownMap.isWalkableAt(tilePos.x, tilePos.y)) {
        const worldPos = this.topDownMap.tileToWorldXY(tilePos.x, tilePos.y);
        this.patrolPoints.push(worldPos);
      }
    }
    
    // 最初のポイントをキャラクターの現在位置に設定
    if (this.patrolPoints.length > 0) {
      this.patrolPoints[0] = { x: startX, y: startY };
    } else {
      // ポイントが見つからなかった場合は現在位置を追加
      this.patrolPoints.push({ x: startX, y: startY });
    }
    
    // パトロールインデックスをリセット
    this.patrolIndex = 0;
  }

  /**
   * パトロールポイントへの移動
   */
  moveToPatrolPoint() {
    if (!this.owner || this.patrolPoints.length === 0) return;
    
    // 現在のパトロールポイント
    const currentPoint = this.patrolPoints[this.patrolIndex];
    
    // 経路探索が有効な場合
    if (this.topDownMap && this.topDownMap.findPath) {
      // 現在位置をタイル座標に変換
      const ownerTile = this.topDownMap.worldToTileXY(this.owner.x, this.owner.y);
      
      // ポイント位置をタイル座標に変換
      const pointTile = this.topDownMap.worldToTileXY(currentPoint.x, currentPoint.y);
      
      // 経路探索
      const tilePath = this.topDownMap.findPath(
        ownerTile.x, ownerTile.y,
        pointTile.x, pointTile.y
      );
      
      // 経路が見つかった場合
      if (tilePath && tilePath.length > 0) {
        // タイル座標をワールド座標に変換
        this.path = tilePath.map(point => {
          const worldPos = this.topDownMap.tileToWorldXY(point.x, point.y);
          return { x: worldPos.x, y: worldPos.y };
        });
        
        // パスインデックスをリセット
        this.pathIndex = 0;
      }
    }
  }

  /**
   * Web Audio APIを使って直接攻撃音を生成・再生する
   * @returns {boolean} 成功した場合はtrue
   */
  playDirectAttackSound() {
    try {
      // Web Audio APIを使用して一時的なビープ音を作成
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // 攻撃音の周波数設定
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.3);
      
      // 音量エンベロープ
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      // 接続
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // 再生
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
      
      // 終了後にコンテキストを閉じる
      setTimeout(() => {
        audioContext.close();
      }, 500);
      
      return true;
    } catch (e) {
      console.error('直接攻撃音生成エラー:', e);
      return false;
    }
  }

  /**
   * アクションタイプに応じた完了処理
   */
  handleActionCompletion() {
    // アクションタイプごとの特別な完了処理
    switch (this.actionType) {
      case 'move':
        // 移動完了
        if (this.owner) {
          // 移動アニメーション停止
          if (this.owner.setAnimation) {
            this.owner.setAnimation('idle');
          } else if (this.owner.animationState) {
            this.owner.animationState = 'idle';
            if (this.owner.playAnimation) {
              this.owner.playAnimation();
            }
          }
          
          // 移動完了イベント
          if (this.scene) {
            this.scene.events.emit('move-completed', this.owner);
          }
        }
        break;
        
      case 'attack':
        // 攻撃完了
        if (this.owner) {
          // 攻撃アニメーション停止
          if (this.owner.setAnimation) {
            this.owner.setAnimation('idle');
          } else if (this.owner.animationState) {
            this.owner.animationState = 'idle';
            if (this.owner.playAnimation) {
              this.owner.playAnimation();
            }
          }
          
          // 攻撃完了イベント
          if (this.scene) {
            this.scene.events.emit('attack-completed', {
              owner: this.owner,
              target: this.target,
              damage: this.damage,
              damageType: this.damageType
            });
          }
        }
        break;
        
      // 他のアクションタイプの完了処理
      default:
        // イベント発行
        if (this.scene) {
          this.scene.events.emit(`${this.actionType}-completed`, this.owner);
        }
    }
    
    super.handleActionCompletion();
  }
}