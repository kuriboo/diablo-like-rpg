import { getRandomInt } from '../../utils/mathUtils';

/**
 * 障害物クラス
 * マップ上に配置される破壊可能/不可能な障害物を表現する
 */
export default class Obstacle {
  /**
   * コンストラクタ
   * @param {Phaser.Scene} scene - シーンオブジェクト
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {string} texture - テクスチャキー
   * @param {object} config - 設定オブジェクト
   */
  constructor(scene, x, y, texture, config = {}) {
    this.scene = scene;
    this._x = x;
    this._y = y;
    
    // スプライトをメンバーとして作成
    this.sprite = scene.physics.add.sprite(x, y, texture);
    
    // 基本プロパティ
    this.obstacleType = config.obstacleType || 'generic';
    this.name = config.name || `obstacle_${this.obstacleType}`;
    this.description = config.description || '';
    
    // 物理特性の設定
    this.body = this.sprite.body;
    this.body.immovable = true;
    this.body.moves = false;
    
    // 衝突サイズの調整
    if (config.bodySize) {
      this.body.setSize(config.bodySize.width, config.bodySize.height);
      if (config.bodyOffset) {
        this.body.setOffset(config.bodyOffset.x, config.bodyOffset.y);
      }
    }
    
    // 破壊可能かどうか
    this.breakable = config.breakable || false;
    
    // 破壊可能な場合の耐久値
    this.durability = config.durability || 1;
    this.maxDurability = this.durability;
    
    // 破壊された場合のドロップアイテム設定
    this.dropItems = config.dropItems || [];
    
    // インタラクト可能かどうか
    this.interactive = config.interactive || false;
    
    // インタラクションコールバック
    this.onInteract = config.onInteract || null;
    
    // 表示の初期化
    this.sprite.setOrigin(0.5, 0.5);
    
    // 影の追加（オプション）
    if (config.addShadow) {
      this.addShadow();
    }
    
    // 破壊時のサウンド
    this.breakSound = config.breakSound || 'obstacle_break';
    
    // 破壊時のパーティクルエフェクト
    this.breakParticle = config.breakParticle || 'wood_particle';
    
    // 障害物の状態
    this.state = 'normal'; // normal, damaged, broken
    
    // ヘルスバーが必要な場合（オプション）
    this.showHealthBar = config.showHealthBar || false;
    if (this.showHealthBar && this.breakable) {
      this.createHealthBar();
    }
  }
  
  // 位置プロパティのゲッターとセッター
  get x() {
    return this._x;
  }
  
  set x(value) {
    this._x = value;
    if (this.sprite) this.sprite.x = value;
  }
  
  get y() {
    return this._y;
  }
  
  set y(value) {
    this._y = value;
    if (this.sprite) this.sprite.y = value;
  }
  
  // アルファ値のゲッターとセッター
  get alpha() {
    return this.sprite ? this.sprite.alpha : 1;
  }
  
  set alpha(value) {
    if (this.sprite) this.sprite.alpha = value;
  }
  
  // 幅と高さのゲッター
  get width() {
    return this.sprite ? this.sprite.width : 0;
  }
  
  get height() {
    return this.sprite ? this.sprite.height : 0;
  }
  
  // 深度のゲッターとセッター
  get depth() {
    return this.sprite ? this.sprite.depth : 0;
  }
  
  set depth(value) {
    if (this.sprite) this.sprite.setDepth(value);
  }
  
  // スプライト関連のメソッドの委譲
  setOrigin(x, y) {
    if (this.sprite) this.sprite.setOrigin(x, y);
    return this;
  }
  
  setTint(tint) {
    if (this.sprite) this.sprite.setTint(tint);
    return this;
  }
  
  clearTint() {
    if (this.sprite) this.sprite.clearTint();
    return this;
  }
  
  setTexture(key, frame) {
    if (this.sprite) this.sprite.setTexture(key, frame);
    return this;
  }
  
  // アニメーション関連のメソッドの委譲
  get anims() {
    return this.sprite ? this.sprite.anims : null;
  }
  
  // イベント発火の委譲
  emit(event, ...args) {
    if (this.sprite) {
      this.sprite.emit(event, ...args);
    }
  }
  
  on(event, callback, context) {
    if (this.sprite) {
      this.sprite.on(event, callback, context);
    }
    return this;
  }
  
  once(event, callback, context) {
    if (this.sprite) {
      this.sprite.once(event, callback, context);
    }
    return this;
  }
  
  /**
   * 障害物を破壊可能に設定
   * @param {boolean} breakable - 破壊可能かどうか
   * @param {number} durability - 耐久値
   */
  setBreakable(breakable, durability = 1) {
    this.breakable = breakable;
    this.durability = durability;
    this.maxDurability = durability;
    
    if (this.showHealthBar && this.breakable) {
      this.createHealthBar();
    }
  }
  
  /**
   * 障害物にダメージを与える
   * @param {number} amount - ダメージ量
   * @param {Phaser.GameObjects.GameObject} source - ダメージ源
   * @returns {boolean} - 破壊されたかどうか
   */
  takeDamage(amount, source = null) {
    if (!this.breakable || this.state === 'broken') {
      return false;
    }
    
    this.durability -= amount;
    
    // ダメージエフェクト
    this.showDamageEffect();
    
    // 耐久値が半分以下になったら見た目を変更
    if (this.durability <= this.maxDurability / 2 && this.state === 'normal') {
      this.state = 'damaged';
      this.showDamagedState();
    }
    
    // ヘルスバーの更新
    if (this.healthBar) {
      this.updateHealthBar();
    }
    
    // 耐久値が0以下になったら破壊
    if (this.durability <= 0) {
      this.break(source);
      return true;
    }
    
    return false;
  }
  
  /**
   * 障害物を破壊する
   * @param {Phaser.GameObjects.GameObject} source - 破壊源
   */
  break(source = null) {
    if (this.state === 'broken') {
      return;
    }
    
    this.state = 'broken';
    
    // 破壊アニメーションがあれば再生
    if (this.sprite && this.sprite.anims && this.scene.anims.exists(`obstacle_${this.obstacleType}_break`)) {
      this.sprite.anims.play(`obstacle_${this.obstacleType}_break`, true);
      
      // アニメーション完了後に破壊処理
      this.sprite.once('animationcomplete', () => {
        this.completeBreak(source);
      });
    } else {
      // アニメーションがなければ直接破壊処理
      this.completeBreak(source);
    }
  }
  
  /**
   * 破壊処理を完了する
   * @param {Phaser.GameObjects.GameObject} source - 破壊源
   */
  completeBreak(source = null) {
    // 破壊エフェクト
    this.showBreakEffect();
    
    // アイテムのドロップ
    this.dropLoot();
    
    // 物理ボディの無効化
    if (this.body) {
      this.body.enable = false;
    }
    
    // 破壊音の再生
    if (this.scene.sound && this.scene.sound.get(this.breakSound)) {
      this.scene.sound.play(this.breakSound, { volume: 0.5 });
    }
    
    // イベント発火
    this.emit('broken', { source: source });
    
    // ヘルスバーの削除
    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }
    
    // フェードアウトして削除
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.destroy();
      }
    });
  }
  
  /**
   * 障害物とインタラクトする
   * @param {Phaser.GameObjects.GameObject} interactor - インタラクトするオブジェクト
   * @returns {boolean} - インタラクション成功したかどうか
   */
  interact(interactor) {
    if (!this.interactive || this.state === 'broken') {
      return false;
    }
    
    // インタラクションコールバックがあれば実行
    if (this.onInteract) {
      return this.onInteract(this, interactor);
    }
    
    return false;
  }
  
  /**
   * アイテムをドロップする
   */
  dropLoot() {
    if (!this.scene || !this.dropItems || this.dropItems.length === 0) {
      return;
    }
    
    // シーンのアイテムファクトリーを取得
    const itemFactory = this.scene.itemFactory;
    if (!itemFactory) {
      return;
    }
    
    // ドロップアイテムの処理
    for (const dropItem of this.dropItems) {
      // ドロップ率に基づいて判定
      if (Math.random() <= dropItem.dropRate) {
        // アイテムの生成と配置
        const item = itemFactory.createItem({
          ...dropItem.itemConfig,
          x: this.x + getRandomInt(-10, 10),
          y: this.y + getRandomInt(-10, 10)
        });
        
        if (item) {
          this.scene.add.existing(item);
          
          // シーンのアイテム配列があれば追加
          if (this.scene.items) {
            this.scene.items.push(item);
          }
        }
      }
    }
  }
  
  /**
   * 影を追加する
   */
  addShadow() {
    const shadow = this.scene.add.ellipse(
      this.x,
      this.y + this.height / 3,
      this.width * 0.7,
      this.height * 0.2,
      0x000000,
      0.3
    );
    
    shadow.setDepth(this.depth - 1);
    
    // オブジェクトにバインド
    this.shadow = shadow;
    
    // 削除時に影も削除
    this.once('destroy', () => {
      if (this.shadow) {
        this.shadow.destroy();
      }
    });
  }
  
  /**
   * ダメージを受けた状態の見た目を表示
   */
  showDamagedState() {
    // ダメージフレームがある場合は切り替え
    const damageFrameKey = `${this.sprite.texture.key}_damaged`;
    
    if (this.scene.textures.exists(damageFrameKey)) {
      this.setTexture(damageFrameKey);
    } else {
      // テクスチャがなければ色調を変更
      this.setTint(0xaaaaaa);
    }
  }
  
  /**
   * ダメージエフェクトを表示
   */
  showDamageEffect() {
    // 一時的に赤く点滅
    this.setTint(0xff0000);
    
    this.scene.time.delayedCall(100, () => {
      if (this.state === 'damaged') {
        this.setTint(0xaaaaaa);
      } else {
        this.clearTint();
      }
    });
    
    // 小さな揺れエフェクト
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.x + getRandomInt(-3, 3),
      y: this.y + getRandomInt(-2, 2),
      duration: 50,
      yoyo: true
    });
  }
  
  /**
   * 破壊エフェクトを表示
   */
  showBreakEffect() {
    // パーティクルがあれば表示
    if (this.scene.add.particles && this.scene.textures.exists(this.breakParticle)) {
      const particles = this.scene.add.particles(this.x, this.y, this.breakParticle, {
        lifespan: 1000,
        speed: { min: 50, max: 100 },
        scale: { start: 0.4, end: 0.1 },
        quantity: 10,
        emitting: false
      });
      
      particles.explode(20);
      
      // 一定時間後にパーティクルを削除
      this.scene.time.delayedCall(1000, () => {
        particles.destroy();
      });
    }
  }
  
  /**
   * ヘルスバーを作成
   */
  createHealthBar() {
    if (!this.scene) {
      return;
    }
    
    const barWidth = this.width;
    const barHeight = 6;
    const yOffset = -this.height / 2 - 10;
    
    // 背景バー
    this.healthBarBg = this.scene.add.rectangle(
      this.x,
      this.y + yOffset,
      barWidth,
      barHeight,
      0x000000,
      0.7
    ).setOrigin(0.5, 0.5);
    
    // 体力バー
    this.healthBar = this.scene.add.rectangle(
      this.x - barWidth / 2,
      this.y + yOffset,
      barWidth,
      barHeight,
      0x00ff00,
      1
    ).setOrigin(0, 0.5);
    
    // 深度設定
    this.healthBarBg.setDepth(this.depth + 1);
    this.healthBar.setDepth(this.depth + 1);
    
    // 削除時にヘルスバーも削除
    this.once('destroy', () => {
      if (this.healthBarBg) {
        this.healthBarBg.destroy();
      }
      if (this.healthBar) {
        this.healthBar.destroy();
      }
    });
  }
  
  /**
   * ヘルスバーを更新
   */
  updateHealthBar() {
    if (!this.healthBar || !this.healthBarBg) {
      return;
    }
    
    const healthRatio = Math.max(0, this.durability) / this.maxDurability;
    const barWidth = this.healthBarBg.width * healthRatio;
    
    // 体力バーの幅を更新
    this.healthBar.width = barWidth;
    
    // 体力に応じて色を変更
    let color;
    if (healthRatio > 0.6) {
      color = 0x00ff00; // 緑
    } else if (healthRatio > 0.3) {
      color = 0xffff00; // 黄
    } else {
      color = 0xff0000; // 赤
    }
    
    this.healthBar.fillColor = color;
  }
  
  /**
   * 更新処理
   * @param {number} time - 現在の時間
   * @param {number} delta - 前回更新からの経過時間
   */
  update(time, delta) {
    // ヘルスバーの位置更新
    if (this.healthBar && this.healthBarBg) {
      const yOffset = -this.height / 2 - 10;
      this.healthBarBg.setPosition(this.x, this.y + yOffset);
      this.healthBar.setPosition(this.x - this.healthBarBg.width / 2, this.y + yOffset);
    }
    
    // 影の位置更新
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y + this.height / 3);
    }
  }
  
  /**
   * 障害物のツールチップデータを取得
   * @returns {object} - ツールチップデータ
   */
  getTooltipData() {
    return {
      name: this.name,
      description: this.description,
      type: this.obstacleType,
      breakable: this.breakable,
      interactive: this.interactive,
      durability: this.breakable ? `${this.durability}/${this.maxDurability}` : 'N/A'
    };
  }
  
  /**
   * リソースの解放
   */
  destroy() {
    // シャドウの削除
    if (this.shadow) {
      this.shadow.destroy();
    }
    
    // ヘルスバーの削除
    if (this.healthBarBg) {
      this.healthBarBg.destroy();
    }
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    
    // スプライトの削除
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}