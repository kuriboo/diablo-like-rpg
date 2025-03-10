import Phaser from 'phaser';
import MapGenerator from '../../map/MapGenerator';
import CharacterFactory from '../../factories/CharacterFactory';
import ItemFactory from '../../factories/ItemFactory';
import ActionFactory from '../../factories/ActionFactory';
import Player from '../../characters/Player';
import AIController from '../../ai/AIController';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    
    this.mapGenerator = null;
    this.characterFactory = null;
    this.itemFactory = null;
    this.actionFactory = null;
    
    this.player = null;
    this.companions = [];
    this.enemies = [];
    this.npcs = [];
    this.items = [];
    
    this.mapSize = { width: 50, height: 50 };
    this.tileSize = { width: 64, height: 32 };
    
    this.cursors = null;
    this.aiController = null;
    
    // カメラとプレイヤーのオフセット
    this.cameraOffset = { x: 0, y: 0 };
    
    // イベントシステム
    this.events = new Phaser.Events.EventEmitter();
  }

  init(data) {
    // シーン初期化時のデータ受け取り
    this.level = data.level || 1;
    this.difficulty = data.difficulty || 'normal';
    
    // ファクトリークラスの初期化
    this.characterFactory = new CharacterFactory(this);
    this.itemFactory = new ItemFactory(this);
    this.actionFactory = new ActionFactory(this);
    
    // マップジェネレータの初期化
    this.mapGenerator = new MapGenerator(this, this.mapSize, this.difficulty, this.level);
    
    // AI制御システムの初期化
    this.aiController = new AIController(this);
  }

  preload() {
    // アセットのロードはLoadingSceneで行うが、ここでも追加のアセットが必要な場合はロード
  }

  create() {
    // アイソメトリックプラグインのセットアップ
    this.isometricPlugin = this.plugins.get('IsometricPlugin');
    this.iso = this.isometricPlugin.projector;
    
    // マップの生成
    const map = this.mapGenerator.generateMap();
    this.createIsometricMap(map);
    
    // プレイヤーキャラクターの生成
    this.player = this.characterFactory.createPlayer({
      x: this.mapSize.width / 2,
      y: this.mapSize.height / 2,
      classType: 'warrior' // 仮のクラスタイプ
    });
    this.add.existing(this.player);
    
    // コンパニオンの生成（オプション）
    const companion = this.characterFactory.createCompanion({
      x: this.player.x + 1,
      y: this.player.y + 1,
      classType: 'rogue' // 仮のクラスタイプ
    });
    this.companions.push(companion);
    this.add.existing(companion);
    
    // 敵とNPCの配置（マップデータから）
    this.placeCharactersFromMap(map);
    
    // アイテムの配置
    this.placeItemsFromMap(map);
    
    // カメラ設定
    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setZoom(1);
    
    // 入力設定
    this.cursors = this.input.keyboard.createCursorKeys();
    this.setupInputHandlers();
    
    // UI表示の通知
    this.events.emit('scene-ready', this);
    
    // AIの開始
    this.aiController.startAI();
  }

  update(time, delta) {
    // プレイヤー入力処理
    this.handlePlayerInput();
    
    // キャラクターの更新処理
    this.updateCharacters(delta);
    
    // カメラの更新
    this.updateCamera();
    
    // 衝突検出
    this.checkCollisions();
    
    // AIの更新
    this.aiController.update(delta);
  }

  createIsometricMap(mapData) {
    // アイソメトリックマップの作成
    this.isoGroup = this.add.group();
    
    // 地形タイルの配置
    for (let y = 0; y < this.mapSize.height; y++) {
      for (let x = 0; x < this.mapSize.width; x++) {
        const tileType = mapData.terrain[y][x];
        const tileX = (x - y) * this.tileSize.width / 2;
        const tileY = (x + y) * this.tileSize.height / 2;
        
        // タイルの作成と配置
        const tile = this.add.isoSprite(tileX, tileY, 0, `tile_${tileType}`, this.isoGroup);
        tile.setInteractive();
        
        // タイルのプロパティ設定
        tile.tileX = x;
        tile.tileY = y;
        tile.tileType = tileType;
        tile.walkable = mapData.walkable[y][x];
        
        // イベントリスナー
        tile.on('pointerdown', (pointer) => {
          this.onTileClicked(tile, pointer);
        });
      }
    }
    
    // デプスソートの設定
    this.isoGroup.children.entries.sort((a, b) => {
      return (a.y - b.y) || (a.x - b.x);
    });
  }

  placeCharactersFromMap(mapData) {
    // マップデータから敵とNPCを配置
    for (let y = 0; y < this.mapSize.height; y++) {
      for (let x = 0; x < this.mapSize.width; x++) {
        const objType = mapData.objects[y][x];
        
        if (objType === 1) { // Enemy
          const enemy = this.characterFactory.createEnemy({
            x: x,
            y: y,
            level: this.level,
            difficulty: this.difficulty
          });
          this.enemies.push(enemy);
          this.add.existing(enemy);
        } 
        else if (objType === 4) { // NPC
          const npc = this.characterFactory.createNPC({
            x: x,
            y: y,
            isShop: Math.random() > 0.7 // 70%の確率でショップNPC
          });
          this.npcs.push(npc);
          this.add.existing(npc);
        }
      }
    }
  }

  placeItemsFromMap(mapData) {
    // マップデータからアイテムを配置（チェストなど）
    for (let y = 0; y < this.mapSize.height; y++) {
      for (let x = 0; x < this.mapSize.width; x++) {
        const objType = mapData.objects[y][x];
        
        if (objType === 2) { // Chest
          const chest = this.itemFactory.createChest({
            x: x,
            y: y,
            level: this.level,
            difficulty: this.difficulty
          });
          this.items.push(chest);
          this.add.existing(chest);
        }
      }
    }
  }

  handlePlayerInput() {
    // キーボード入力による移動処理
    if (!this.player || this.player.isPerformingAction) return;
    
    const speed = this.player.getMoveSpeed();
    let dx = 0;
    let dy = 0;
    
    if (this.cursors.left.isDown) {
      dx -= speed;
    }
    else if (this.cursors.right.isDown) {
      dx += speed;
    }
    
    if (this.cursors.up.isDown) {
      dy -= speed;
    }
    else if (this.cursors.down.isDown) {
      dy += speed;
    }
    
    if (dx !== 0 || dy !== 0) {
      // 移動アクションの実行
      const moveAction = this.actionFactory.createBasicAction({
        type: 'move',
        owner: this.player,
        position: { x: this.player.x + dx, y: this.player.y + dy }
      });
      
      if (this.canMoveToPosition(this.player.x + dx, this.player.y + dy)) {
        moveAction.play();
      }
    }
    
    // アタックアクション（スペースキー）
    if (this.input.keyboard.checkDown(this.input.keyboard.addKey('SPACE'), 250)) {
      const attackAction = this.actionFactory.createBasicAction({
        type: 'attack',
        owner: this.player
      });
      attackAction.play();
    }
    
    // スキル使用（1-9キー）
    for (let i = 1; i <= 9; i++) {
      const key = this.input.keyboard.addKey(String(i));
      if (this.input.keyboard.checkDown(key, 500)) {
        this.usePlayerSkill(i - 1);
      }
    }
  }

  updateCharacters(delta) {
    // すべてのキャラクターの更新処理
    if (this.player) {
      this.player.update(delta);
    }
    
    this.companions.forEach(companion => companion.update(delta));
    this.enemies.forEach(enemy => enemy.update(delta));
    this.npcs.forEach(npc => npc.update(delta));
    
    // 深度ソート（レンダリング順序の調整）
    this.depthSort();
  }

  updateCamera() {
    // プレイヤーに追従するカメラの更新
    if (!this.player) return;
    
    // カメラのポジション更新など
  }

  checkCollisions() {
    // キャラクター間の衝突や相互作用をチェック
    
    // プレイヤーとアイテムの衝突
    this.items.forEach(item => {
      if (this.physics.overlap(this.player, item)) {
        this.handleItemCollision(this.player, item);
      }
    });
    
    // プレイヤーと敵の衝突
    this.enemies.forEach(enemy => {
      if (this.physics.overlap(this.player, enemy)) {
        // 敵との衝突処理
      }
    });
    
    // プレイヤーとNPCの衝突
    this.npcs.forEach(npc => {
      if (this.physics.overlap(this.player, npc)) {
        this.handleNPCInteraction(npc);
      }
    });
  }

  handleItemCollision(player, item) {
    // アイテムとの衝突処理
    if (item.canInteract && !item.collected) {
      item.onCollect(player);
      // UI更新のイベント発行
      this.events.emit('item-collected', item);
    }
  }

  handleNPCInteraction(npc) {
    // NPCとの相互作用
    if (npc.canInteract && this.input.keyboard.checkDown(this.input.keyboard.addKey('E'), 500)) {
      if (npc.isShop) {
        // ショップUIを開く
        this.events.emit('open-shop', npc);
      } else {
        // 会話UIを開く
        this.events.emit('open-dialog', npc);
      }
    }
  }

  usePlayerSkill(skillIndex) {
    // プレイヤーのスキル使用
    if (!this.player || !this.player.canUseSkill()) return;
    
    const skill = this.player.getSkill(skillIndex);
    if (skill) {
      const specialAction = this.actionFactory.createSpecialAction({
        type: skill.type,
        owner: this.player,
        skill: skill
      });
      specialAction.play();
    }
  }

  canMoveToPosition(x, y) {
    // 指定位置に移動可能かをチェック
    const targetTileX = Math.floor(x / this.tileSize.width);
    const targetTileY = Math.floor(y / this.tileSize.height);
    
    // マップ範囲外チェック
    if (targetTileX < 0 || targetTileX >= this.mapSize.width || 
        targetTileY < 0 || targetTileY >= this.mapSize.height) {
      return false;
    }
    
    // タイルの歩行可能判定
    const tiles = this.isoGroup.getChildren();
    for (const tile of tiles) {
      if (tile.tileX === targetTileX && tile.tileY === targetTileY) {
        return tile.walkable;
      }
    }
    
    return false;
  }

  onTileClicked(tile, pointer) {
    // タイルクリック時の処理
    if (pointer.rightButtonDown()) {
      // 右クリックでの移動
      if (tile.walkable && this.player && !this.player.isPerformingAction) {
        const moveAction = this.actionFactory.createBasicAction({
          type: 'move',
          owner: this.player,
          position: { x: tile.tileX * this.tileSize.width, y: tile.tileY * this.tileSize.height }
        });
        moveAction.play();
      }
    }
  }

  depthSort() {
    // 描画順序のソート（奥のものから手前に向かって描画）
    const allSprites = [
      this.player,
      ...this.companions,
      ...this.enemies,
      ...this.npcs,
      ...this.items,
      ...this.isoGroup.getChildren()
    ].filter(Boolean);
    
    allSprites.sort((a, b) => {
      // y座標が小さいものから大きいものへソート（奥から手前）
      return (a.y - b.y) || (a.x - b.x);
    });
    
    // 深度の設定
    allSprites.forEach((sprite, index) => {
      sprite.setDepth(index);
    });
  }
}