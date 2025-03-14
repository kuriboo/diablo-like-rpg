import Character from './Character';

/**
 * NPC - ゲーム内のNPC（非プレイヤーキャラクター）を表すクラス
 */
class NPC extends Character {
  /**
   * NPC を作成
   * @param {object} config - 設定オブジェクト
   */
  constructor(config) {
    super(config);
    
    // NPC固有プロパティ
    this.isShop = config.isShop || false;
    this.type = config.type || 'villager';
    this.shopType = config.shopType || 'general';
    this.shopItems = config.shopItems || [];
    this.dialogues = config.dialogues || [];
    this.currentDialogueIndex = 0;
    this.interactRange = config.interactRange || 100;

    // NPCの表示設定
    this.setTexture(config.texture || `npc_${this.type}`);
    
    // NPC固有のアニメーション設定
    this.setupAnimations();
    
    // クラスタイプを設定
    this.ClassType = { name: 'NPC' };
    
    // インタラクティブ設定（プレイヤーとの対話用）
    this.setInteractive();
    
    // 移動していない時はNPCらしく小さく動かす
    this.idleTimer = 0;
    this.idleMovement = false;
  }

  /**
   * NPCのアニメーション設定
   */
  setupAnimations() {
    // アニメーションが存在しない場合は作成
    if (this.scene && !this.scene.anims.exists(`${this.type}_idle`)) {
      // アイドルアニメーション
      this.scene.anims.create({
        key: `${this.type}_idle`,
        frames: this.scene.anims.generateFrameNumbers(`npc_${this.type}`, { start: 0, end: 3 }),
        frameRate: 5,
        repeat: -1
      });
      
      // 会話アニメーション
      this.scene.anims.create({
        key: `${this.type}_talk`,
        frames: this.scene.anims.generateFrameNumbers(`npc_${this.type}`, { start: 4, end: 7 }),
        frameRate: 8,
        repeat: -1
      });
    }
    
    // デフォルトアニメーション再生
    this.play(`${this.type}_idle`);
  }

  /**
   * NPCの更新処理
   * @param {number} time - 現在の時間
   * @param {number} delta - 前回の更新からの経過時間
   */
  update(time, delta) {
    super.update(time, delta);
    
    // NPCのアイドル時の動き
    this.updateIdleBehavior(time, delta);
  }

  /**
   * アイドル時の挙動の更新
   * @param {number} time - 現在の時間
   * @param {number} delta - 前回の更新からの経過時間
   */
  updateIdleBehavior(time, delta) {
    // 3〜8秒ごとにランダムに小さな動き
    this.idleTimer += delta;
    
    // 時間が経過したらランダムに新しい動きを設定
    if (this.idleTimer > (this.idleMovement ? 1500 : 5000)) {
      this.idleTimer = 0;
      this.idleMovement = !this.idleMovement;
      
      if (this.idleMovement) {
        // ちょっとした動き（首を傾げる、うなずくなど）
        this.play(`${this.type}_idle`, true);
        
        // スケールをちょっと変えて動きを表現
        this.scene.tweens.add({
          targets: this,
          scaleX: this.scaleX * 0.95,
          scaleY: this.scaleY * 1.05,
          duration: 300,
          yoyo: true,
          repeat: 1,
          ease: 'Sine.easeInOut'
        });
      }
    }
  }

  /**
   * NPC とプレイヤーの対話を開始
   * @param {Player} player - 対話するプレイヤー
   * @returns {object} 対話情報
   */
  interact(player) {
    // 対話アニメーション再生
    this.play(`${this.type}_talk`);
    
    // 対話内容の取得
    const dialogueData = this.getDialogue();
    
    // ショップの場合は商品情報も返す
    if (this.isShop) {
      return {
        type: 'shop',
        npc: this,
        dialogue: dialogueData,
        shopType: this.shopType,
        shopItems: this.getShopItems(player)
      };
    }
    
    // 通常のNPCの場合
    return {
      type: 'dialogue',
      npc: this,
      dialogue: dialogueData
    };
  }

  /**
   * 次の会話を取得
   * @returns {string} 会話テキスト
   */
  getDialogue() {
    if (this.dialogues.length === 0) {
      return '...';
    }
    
    // 現在の会話インデックスを取得
    const dialogue = this.dialogues[this.currentDialogueIndex];
    
    // インデックスを次に進める（ループ）
    this.currentDialogueIndex = (this.currentDialogueIndex + 1) % this.dialogues.length;
    
    return dialogue;
  }

  /**
   * 全ての会話を取得
   * @returns {Array} 会話リスト
   */
  getAllDialogues() {
    return this.dialogues;
  }

  /**
   * 会話を設定
   * @param {Array} dialogues - 会話リスト
   */
  setDialogues(dialogues) {
    this.dialogues = dialogues;
    this.currentDialogueIndex = 0;
  }

  /**
   * ショップアイテムリストを取得
   * @param {Player} player - プレイヤー（レベルに基づいてアイテム調整）
   * @returns {Array} ショップアイテムリスト
   */
  getShopItems(player) {
    if (!this.isShop) {
      return [];
    }
    
    // プレイヤーレベルに応じてアイテムをフィルタリング
    const playerLevel = player ? player.level : 1;
    
    return this.shopItems.filter(item => {
      // アイテムが使用可能かチェック（レベル制限など）
      return !item.requiredLevel || item.requiredLevel <= playerLevel;
    });
  }

  /**
   * ショップアイテムを設定
   * @param {Array} items - アイテムリスト
   */
  setShopItems(items) {
    this.shopItems = items;
  }

  /**
   * ショップタイプを設定
   * @param {string} type - ショップタイプ
   */
  setShopType(type) {
    this.shopType = type;
  }

  /**
   * アイテムの売却処理
   * @param {Player} player - 売却するプレイヤー
   * @param {Item} item - 売却するアイテム
   * @returns {boolean} 売却成功かどうか
   */
  sellItem(player, item) {
    if (!player || !item) {
      return false;
    }
    
    // アイテムの売却価格を計算（通常は買値の半分くらい）
    const sellPrice = Math.floor(item.price * 0.5);
    
    // プレイヤーのインベントリからアイテムを削除
    const removed = player.removeFromInventory(item);
    
    if (removed) {
      // プレイヤーにゴールドを追加
      player.addGold(sellPrice);
      return true;
    }
    
    return false;
  }

  /**
   * アイテムの購入処理
   * @param {Player} player - 購入するプレイヤー
   * @param {Item} item - 購入するアイテム
   * @returns {boolean} 購入成功かどうか
   */
  buyItem(player, item) {
    if (!player || !item) {
      return false;
    }
    
    // プレイヤーのゴールドをチェック
    if (player.gold < item.price) {
      return false;
    }
    
    // プレイヤーのインベントリに追加
    const added = player.addToInventory(item);
    
    if (added) {
      // プレイヤーからゴールドを差し引く
      player.removeGold(item.price);
      return true;
    }
    
    return false;
  }

  /**
   * 対話終了時の処理
   */
  endInteraction() {
    // 通常のアイドルアニメーションに戻す
    this.play(`${this.type}_idle`);
  }
}

export default NPC;