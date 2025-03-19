import { v4 as uuidv4 } from 'uuid';
import { getDistance } from '../../utils/mathUtils';

export default class Item {
  constructor(scene, x, y, texture) {
    this.scene = scene;
    this._x = x;
    this._y = y;
    
    // スプライトをメンバーとして作成
    this.sprite = scene.add.sprite(x, y, texture);
    
    // 基本的なアイテムプロパティ
    this.uuid = uuidv4();
    this.name = 'Item';
    this.description = 'A basic item';
    this.size = {
      width: 1,
      height: 1
    };
    
    // インタラクション設定
    this.canInteract = true;
    this.collected = false;
    this.dropTime = Date.now();
    this.interactionDelay = 500; // ミリ秒単位のインタラクション遅延
    
    // 表示設定
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setScale(0.8);
    this.sprite.setInteractive();
    
    // フローティングエフェクト
    this.yOrig = y;
    this.floatHeight = 4;
    this.floatSpeed = 1.5;
    
    // 光るエフェクト
    this.glowAlpha = 0;
    this.glowDirection = 1;
    this.glow = scene.add.sprite(x, y, texture)
      .setOrigin(0.5, 0.5)
      .setScale(1)
      .setTint(0xffffff)
      .setAlpha(0);
    
    // イベントリスナー
    this.sprite.on('pointerdown', () => this.onClick());
    this.sprite.on('pointerover', () => this.onHover());
    this.sprite.on('pointerout', () => this.onHoverEnd());
    
    // アップデート関数を有効化
    scene.events.on('update', this.update, this);
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
  
  // スケール値のゲッターとセッター
  get scale() {
    return this.sprite ? this.sprite.scale : 1;
  }
  
  set scale(value) {
    if (this.sprite) this.sprite.setScale(value);
  }
  
  // スプライト関連のメソッドの委譲
  setOrigin(x, y) {
    if (this.sprite) this.sprite.setOrigin(x, y);
    return this;
  }
  
  setInteractive(options) {
    if (this.sprite) this.sprite.setInteractive(options);
    return this;
  }
  
  disableInteractive() {
    if (this.sprite) this.sprite.disableInteractive();
    return this;
  }
  
  setScale(value) {
    if (this.sprite) this.sprite.setScale(value);
    return this;
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
  
  onClick() {
    // アイテムをクリックした時の処理
    if (this.canInteract && !this.collected && 
        Date.now() - this.dropTime > this.interactionDelay) {
      
      // プレイヤーとの距離をチェック
      const player = this.scene.player;
      if (player) {
        const distance = getDistance(
          this.x, this.y, player.x, player.y
        );
        
        // 一定距離内ならアイテム取得
        if (distance < 100) {
          this.onCollect(player);
        } else {
          // プレイヤーが遠い場合、移動を促すメッセージ
          const uiScene = this.scene.scene.get('UIScene');
          if (uiScene && uiScene.showMessage) {
            uiScene.showMessage('アイテムまで近づいてください');
          }
        }
      }
    }
  }
  
  onHover() {
    // ホバー時の処理
    if (this.canInteract && !this.collected) {
      this.setScale(0.9);
      
      // ツールチップ表示
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.showTooltip) {
        uiScene.showTooltip(this);
      }
    }
  }
  
  onHoverEnd() {
    // ホバー終了時の処理
    this.setScale(0.8);
    
    // ツールチップ非表示
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene && uiScene.hideTooltip) {
      uiScene.hideTooltip();
    }
  }
  
  update(time, delta) {
    // アイテムの浮遊アニメーション
    if (!this.collected) {
      this.y = this.yOrig + Math.sin(time / 500 * this.floatSpeed) * this.floatHeight;
      
      // 光るエフェクト
      this.glowAlpha += 0.01 * this.glowDirection;
      if (this.glowAlpha >= 0.3) {
        this.glowDirection = -1;
      } else if (this.glowAlpha <= 0) {
        this.glowDirection = 1;
      }
      
      this.glow.setPosition(this.x, this.y);
      this.glow.setAlpha(this.glowAlpha);
    }
  }
  
  onCollect(player) {
    // アイテム取得時の処理
    if (!this.collected && player) {
      this.collected = true;
      
      // 収集エフェクト
      this.scene.tweens.add({
        targets: [this.sprite, this.glow],
        y: this.y - 20,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        onComplete: () => {
          // プレイヤーのインベントリにアイテムを追加
          this.addToPlayerInventory(player);
          
          // メッセージ表示
          const uiScene = this.scene.scene.get('UIScene');
          if (uiScene && uiScene.showMessage) {
            uiScene.showMessage(`${this.name}を取得しました！`);
          }
          
          // オブジェクトの削除
          if (this.glow) this.glow.destroy();
          this.destroy();
        }
      });
      
      // 効果音再生
      if (this.scene.sound) {
        this.scene.sound.play('item_pickup');
      }
      
      return true;
    }
    
    return false;
  }
  
  addToPlayerInventory(player) {
    // プレイヤーのインベントリへアイテムを追加
    // この関数はサブクラスでオーバーライドされることを想定
    return false;
  }
  
  getTooltipData() {
    // ツールチップに表示するデータ
    return {
      name: this.name,
      description: this.description
    };
  }
  
  // 子クラスがオーバーライドして使用するメソッド
  use(character) {
    // アイテムの使用（継承先でオーバーライド）
    console.log(`${character.name} uses ${this.name}`);
    return false;
  }
  
  destroy() {
    // リソースのクリーンアップ
    if (this.scene) {
      this.scene.events.off('update', this.update, this);
    }
    
    if (this.glow) {
      this.glow.destroy();
    }
    
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}