// Phaserを動的にロードするためのユーティリティ
let PhaserModule = null;

// 非同期でPhaserをロードする関数
async function getPhaserModule() {
  if (PhaserModule) return PhaserModule;
  
  try {
    PhaserModule = await import('phaser');
    return PhaserModule;
  } catch (error) {
    console.error('Failed to load Phaser:', error);
    throw error;
  }
}

// SceneクラスをPhaserから取得するユーティリティ関数
async function getSceneClass() {
  const phaser = await getPhaserModule();
  return phaser.Scene || phaser.default.Scene;
}

// Mathユーティリティをロードする関数
async function getPhaserMath() {
  const phaser = await getPhaserModule();
  return phaser.Math || phaser.default.Math;
}

import TopDownMap from '.././../map/TopDownMap';
import MapGenerator from '.././../map/MapGenerator';
import CharacterFactory from '../../factories/CharacterFactory';
import ItemFactory from '../../factories/ItemFactory';
import ActionFactory from '../../factories/ActionFactory';
import SkillTreeManager from '../../skills/core/SkillTreeManager';
import { PlayerStats } from '../../data/PlayerStats';
import { Game } from '../../core/Game';
import Debug from '../../../debug';
import PlaceholderAssets from '../../../debug/PlaceholderAssets';
import { generateMapData, generatePlayerStats, generateEnemyStats } from '../../../debug/DebugUtils';
import { SCENES } from '../constants';

// ActionSystemのインポート
import ActionSystem from '../../actions/ActionSystem';

export default class MainScene {
  // 静的なシーンインスタンスを保持
  static instance = null;
  
  /**
   * Phaserシーンのインスタンス化前に非同期で初期化する
   */
  static async initialize() {
    if (MainScene.instance) return MainScene.instance;
    
    const Scene = await getSceneClass();
    const PhaserMath = await getPhaserMath();
    
    // Sceneを継承した実装クラス
    class MainSceneImpl extends Scene {
      constructor() {
        super({ key: SCENES.GAME });
        
        // プロパティの初期化
        this.player = null;
        this.companions = [];
        this.enemies = [];
        this.npcs = [];
        this.items = [];
        this.topDownMap = null; // isometricMapからtopDownMapに変更
        this.mapGenerator = null;
        
        // ファクトリーのインスタンス
        this.characterFactory = null;
        this.itemFactory = null;
        this.actionFactory = null;
        
        // アクションシステム
        this.actionSystem = null;
        
        // ゲームデータ
        this.gameData = {
          currentLevel: 1,
          difficulty: 'normal' // 'normal', 'nightmare', 'hell'
        };
        
        // スキルツリーマネージャー
        this.skillTreeManager = null;
        
        // 現在のマップタイプ
        this.currentMapType = 'dungeon';
      }
      
      init(data) {
        // 前のシーンからのデータ受け取り
        this.gameData = data.gameData || this.gameData;
        
        // ActionSystemの初期化
        this.actionSystem = ActionSystem.getInstance();
        
        // ファクトリーの初期化
        this.characterFactory = new CharacterFactory(this);
        this.itemFactory = new ItemFactory(this);
        this.actionFactory = new ActionFactory(this);
        
        // スキルツリーマネージャーの初期化
        this.skillTreeManager = SkillTreeManager;

        // デバッグフラグ
        this.isDebugMode = process.env.NODE_ENV !== 'production';
      }
      
      preload() {
        // 必要なアセットの読み込み
        // (既にLoadingSceneで読み込まれているはず)
        
        // デバッグモードの場合、プレースホルダーアセットをロード
        if (this.isDebugMode) {
          //this.loadDebugAssets();
        }
      }
      
      /**
       * デバッグ用のアセットをロード
       */
      loadDebugAssets() {
        // プレースホルダーアセットの使用
        const placeholders = PlaceholderAssets.placeholders;
        
        // 必要な画像をロード（存在するかチェックして）
        // プレイヤー
        if (placeholders.player) {
          this.load.image('player_placeholder', placeholders.player);
        }
        
        // 敵タイプ
        if (placeholders.enemy_normal) {
          this.load.image('enemy_normal_placeholder', placeholders.enemy_normal);
        }
        if (placeholders.enemy_elite) {
          this.load.image('enemy_elite_placeholder', placeholders.enemy_elite);
        }
        if (placeholders.enemy_boss) {
          this.load.image('enemy_boss_placeholder', placeholders.enemy_boss);
        }
        
        // コンパニオン
        if (placeholders.companion) {
          this.load.image('companion_placeholder', placeholders.companion);
        }
        
        // NPCタイプ
        if (placeholders.npc_villager) {
          this.load.image('npc_villager_placeholder', placeholders.npc_villager);
        }
        if (placeholders.npc_guard) {
          this.load.image('npc_guard_placeholder', placeholders.npc_guard);
        }
        if (placeholders.npc_merchant) {
          this.load.image('npc_merchant_placeholder', placeholders.npc_merchant);
        }
        if (placeholders.npc_blacksmith) {
          this.load.image('npc_blacksmith_placeholder', placeholders.npc_blacksmith);
        }
        if (placeholders.npc_alchemist) {
          this.load.image('npc_alchemist_placeholder', placeholders.npc_alchemist);
        }
        
        // エフェクト
        if (placeholders.slash_effect) {
          this.load.spritesheet('slash_effect', placeholders.slash_effect, { 
            frameWidth: 64, frameHeight: 64 
          });
        }
        if (placeholders.impact_effect) {
          this.load.spritesheet('impact_effect', placeholders.impact_effect, { 
            frameWidth: 64, frameHeight: 64 
          });
        }
        if (placeholders.skill_effect) {
          this.load.spritesheet('skill_effect', placeholders.skill_effect, { 
            frameWidth: 64, frameHeight: 64 
          });
        }
        
        // アイテム
        if (placeholders.item_potion) {
          this.load.image('item_potion_placeholder', placeholders.item_potion);
        }
        if (placeholders.item_weapon) {
          this.load.image('item_weapon_placeholder', placeholders.item_weapon);
        }
        if (placeholders.item_armor) {
          this.load.image('item_armor_placeholder', placeholders.item_armor);
        }
        
        // UIエレメント
        if (placeholders.ui_button) {
          this.load.image('ui_button_placeholder', placeholders.ui_button);
        }
        
        // デバッグ用のアニメーション設定
        if (this.anims && placeholders.slash_effect) {
          this.anims.create({
            key: 'slash_anim',
            frames: this.anims.generateFrameNumbers('slash_effect', { start: 0, end: 5 }),
            frameRate: 15,
            repeat: 0
          });
        }
        
        if (this.anims && placeholders.impact_effect) {
          this.anims.create({
            key: 'impact_anim',
            frames: this.anims.generateFrameNumbers('impact_effect', { start: 0, end: 5 }),
            frameRate: 15,
            repeat: 0
          });
        }
        
        if (this.anims && placeholders.skill_effect) {
          this.anims.create({
            key: 'skill_anim',
            frames: this.anims.generateFrameNumbers('skill_effect', { start: 0, end: 7 }),
            frameRate: 15,
            repeat: 0
          });
        }
        
        console.log('🎮 デバッグアセットをロード完了');
      }
      
      async create() {
        console.log('MainScene: create');
        
        // ActionSystemを初期化
        this.actionSystem.initialize(this);
        
        // マップジェネレーターの作成（そのまま）
        this.mapGenerator = new MapGenerator({
          width: 50,
          height: 50,
          seed: Date.now(),
          difficultyLevel: this.gameData.difficulty
        });
        
        // TopDownMapの作成（タイルサイズを32x32に変更）
        this.topDownMap = new TopDownMap({
          scene: this,
          tileSize: 32 // 正方形のタイルサイズに変更
        });
        
        // マップの生成
        await this.generateMap();
        
        // プレイヤーの作成
        this.createPlayer();
        
        // コンパニオンの作成（オプション）
        if (this.gameData.hasCompanion) {
          this.createCompanion();
        }
        
        // カメラの設定
        this.setupCamera();
        
        // UIシーンの開始
        this.scene.launch('UIScene', { mainScene: this });
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // スキルツリーシステムの初期化
        this.initializeSkillTreeSystem();
        
        // ゲーム開始イベント
        this.events.emit('game-started', this.gameData);
        
        // FPSカウンターの表示（デバッグ用）
        if (this.game.config.physics.arcade?.debug) {
          this.fpsText = this.add.text(10, 10, '', { font: '16px Arial', fill: '#00ff00' });
          this.fpsText.setScrollFactor(0);
          this.fpsText.setDepth(999);
        }

         // デバッグモードの初期化
        if (this.isDebugMode) {
          Debug.initialize(this);
          
          // 追加敵の生成（デバッグ用）
          this.createDebugEnemies();
          
          // ゲームの状態をコンソールに出力
          console.log('🎮 ゲーム状態:', {
            mapType: this.currentMapType,
            level: this.gameData.currentLevel,
            difficulty: this.gameData.difficulty
          });
        }
      }
      
      update(time, delta) {
        // FPS表示の更新（デバッグ用）
        if (this.fpsText) {
          this.fpsText.setText(`FPS: ${Math.round(1000 / delta)}`);
        }
        
        // マップの更新
        if (this.topDownMap) {
          this.topDownMap.update();
        }
        
        // プレイヤーの更新
        if (this.player) {
          this.player.update(time, delta);
        }
        
        // コンパニオンの更新
        for (const companion of this.companions) {
          companion.update(time, delta);
        }
        
        // 敵の更新
        for (const enemy of this.enemies) {
          if (enemy && enemy.update) {
            enemy.update(time, delta);
          }
        }
        
        // ActionSystem自体の更新は不要（イベントリスナーで自動更新）
        
        // カメラのアップデート
        this.updateCamera();
      }
      
      /**
       * マップ生成処理
       */
      async generateMap() {
        try {
          // 進行度に応じてマップタイプを決定
          this.selectMapType();
          
          // マップを生成
          const mapData = await this.mapGenerator.generateMap(this.currentMapType);

          // マップ生成に失敗した場合や開発中の場合はダミーマップを使用
          if (!mapData && this.isDebugMode) {
            console.log('🗺️ ダミーマップを生成します');
            
            // DebugUtilsのgenerateMapData関数を使用
            const dummyMapData = generateMapData(80, 100, this.currentMapType);
            this.topDownMap.setMapData(dummyMapData);
            
            // オブジェクトを配置
            this.topDownMap.placeObjects();
            
            console.log(`🗺️ ダミーマップ生成完了: ${this.currentMapType}`);
            return true;
          }
          
          // 生成したマップをTopDownMapに設定
          this.topDownMap.setMapData(mapData);
          
          // オブジェクトを配置
          this.topDownMap.placeObjects();
          
          console.log(`Map generated: ${this.currentMapType}`);
          
          return true;
        } catch (error) {
          console.error('Map generation failed:', error);
          return false;
        }
      }
      
      /**
       * 進行度に応じてマップタイプを選択
       */
      selectMapType() {
        // 進行度（1-100）に応じてマップタイプを決定
        const progress = this.calculateProgressPercentage();
        
        // まれにアリーナ（ボスマップ）を生成（10%ごとに1回）
        if (progress % 10 === 0 && progress > 0) {
          this.currentMapType = 'arena';
          return;
        }
        
        // 進行度10%ごとに町マップを生成（ただし、アリーナの次は生成しない）
        if ((progress + 5) % 10 === 0 && progress > 0) {
          this.currentMapType = 'town';
          return;
        }
        
        // その他の場合は50%の確率でダンジョンかフィールド
        this.currentMapType = Math.random() < 0.5 ? 'dungeon' : 'field';
      }
      
      /**
       * 現在の進行度パーセンテージ（0-100）を計算
       */
      calculateProgressPercentage() {
        const maxLevel = {
          normal: 30,
          nightmare: 60,
          hell: 100
        }[this.gameData.difficulty];
        
        return Math.floor((this.gameData.currentLevel / maxLevel) * 100);
      }
      
      /**
       * プレイヤーの作成
       */
      createPlayer() {
        try {
          // プレイヤーのスタート位置を移動可能な場所から取得
          const startPosition = this.topDownMap.getRandomWalkablePosition();
          const worldPos = this.topDownMap.tileToWorldXY(startPosition.x, startPosition.y);
          
          // PlayerStatsから保存済みのプレイヤーレベルを取得
          const playerStats = PlayerStats.getInstance();
          const playerLevel = playerStats.level || this.gameData.playerLevel || 1;
          const playerClass = this.gameData.playerClass || 'warrior';
          
          // デバッグモードの場合はプレースホルダーテクスチャを使用
          const texture = this.isDebugMode ? 'player_placeholder' : (playerClass || 'warrior');
          
          // プレイヤーキャラクターの作成 - パラメータを明示的に指定
          this.player = this.characterFactory.createPlayer({
            scene: this,
            x: worldPos.x,
            y: worldPos.y,
            texture: texture,
            level: playerLevel,
            classType: {
              name: playerClass || 'warrior' // クラスタイプを明示的にオブジェクトとして渡す
            },
            name: playerStats.name || 'プレイヤー'
          });
          
          // プレイヤーをシーンに追加
          this.add.existing(this.player);
          
          // デプスソートは不要になるためコメントアウトまたは削除
          // TopDownでは単純なシーンのdepthプロパティで重なり順を制御
          this.player.setDepth(10); // キャラクターの深度を設定
          
          // プレイヤーに基本アクションを設定
          this.setupPlayerActions();
          
          // プレイヤー作成イベント
          this.events.emit('player-created', this.player);
          
          // 通知: プレイヤーデータを復元
          if (playerStats.level > 1) {
            const uiScene = this.scene.get('UIScene');
            if (uiScene && uiScene.showMessage) {
              uiScene.showMessage('プレイヤーデータを復元しました');
            }
          }
        } catch (error) {
          console.error('プレイヤー生成エラー:', error);
          
          if (this.isDebugMode) {
            console.error('プレイヤー生成エラー、ダミーデータを使用します:', error);
            
            // プレイヤーのスタート位置を移動可能な場所から取得
            const startPosition = this.topDownMap.getRandomWalkablePosition();
            const worldPos = this.topDownMap.tileToWorldXY(startPosition.x, startPosition.y);
            
            // ダミープレイヤーステータスの生成
            const playerStats = generatePlayerStats('warrior', 5, 'デバッグプレイヤー');
            
            // デバッグモードの場合はプレースホルダーテクスチャを使用
            const texture = 'player_placeholder';
            
            // プレイヤーキャラクターの作成 - この場合も classType を明示的に指定
            this.player = this.characterFactory.createPlayer({
              scene: this,
              x: worldPos.x,
              y: worldPos.y,
              texture: texture,
              level: playerStats.level,
              classType: {
                name: playerStats.classType || 'warrior'
              },
              name: playerStats.name,
              stats: playerStats
            });
            
            // 以下は通常の処理と同様...
            this.add.existing(this.player);
            this.player.setDepth(10);
            this.setupPlayerActions();
            this.events.emit('player-created', this.player);
          } else {
            throw error; // 本番環境ではエラーを伝播
          }
        }
      }
      
      /**
       * プレイヤーの基本アクションを設定
       */
      setupPlayerActions() {
        if (!this.player || !this.actionSystem) return;
        
        // プレイヤーの基本アクションを設定
        const basicActions = {
          move: this.actionSystem.createAction('move', {
            owner: this.player,
            topDownMap: this.topDownMap
          }),
          
          attack: this.actionSystem.createAction('attack', {
            owner: this.player,
            attackRange: this.player.attackRange || 60,
            attackCooldown: 800
          }),
          
          idle: this.actionSystem.createAction('idle', {
            owner: this.player,
            duration: 1000
          })
        };
        
        // プレイヤーにアクションを登録
        this.player.basicActions = basicActions;
        
        console.log('プレイヤーアクションを設定しました');
      }
      
      /**
       * コンパニオンの作成
       */
      createCompanion() {
        // プレイヤーの周辺で移動可能な場所を探す
        const playerPos = this.topDownMap.worldToTileXY(this.player.x, this.player.y);
        let companionPos = null;
        
        // プレイヤーの近くで移動可能な位置を探す
        const directions = [
          { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, 
          { dx: -1, dy: 0 }, { dx: 0, dy: -1 }
        ];
        
        for (const dir of directions) {
          const x = playerPos.x + dir.dx;
          const y = playerPos.y + dir.dy;
          
          if (this.topDownMap.isWalkableAt(x, y) && !this.topDownMap.hasEntityAt(x, y)) {
            companionPos = { x, y };
            break;
          }
        }
        
        // 適切な位置が見つからなければランダムな位置を使用
        if (!companionPos) {
          companionPos = this.topDownMap.getRandomWalkablePosition();
        }
        
        // ワールド座標に変換
        const worldPos = this.topDownMap.tileToWorldXY(companionPos.x, companionPos.y);
        
        // デバッグモードの場合はプレースホルダーテクスチャを使用
        const texture = this.isDebugMode ? 'companion_placeholder' : 
                         (this.gameData.companionType || 'rogue');
        
        // コンパニオンの作成
        const companion = this.characterFactory.createCompanion({
          scene: this,
          x: worldPos.x,
          y: worldPos.y,
          texture: texture,
          level: this.gameData.playerLevel || 1,
          type: this.gameData.companionType || 'rogue'
        });
        
        // コンパニオンをシーンに追加
        this.add.existing(companion);
        
        // コンパニオンリストに追加
        this.companions.push(companion);
        
        // デプスの設定（デプスソートの代わり）
        companion.setDepth(10);
        
        // ActionSystemを使った新しいAI設定
        if (this.actionSystem) {
          // 旧AIインスタンスがあれば無効化
          if (companion.ai && companion.ai.setEnabled) {
            companion.ai.setEnabled(false);
          }
          
          // 新しいAIインスタンスの作成（実装済みの場合）
          // companion.ai = new CompanionAI(companion, {}, this.actionSystem);
          // companion.ai.setPlayer(this.player);
        }
        // 従来のAIシステム
        else if (companion.ai) {
          companion.ai.setPlayer(this.player);
        }
      }
      
      /**
       * デバッグ用の敵を作成
       */
      createDebugEnemies() {
        // デバッグモードでなければ何もしない
        if (!this.isDebugMode || !this.player) return;
        
        // 敵の数を決定（5～10体）
        const enemyCount = 5 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < enemyCount; i++) {
          // プレイヤーから少し離れた位置を取得
          const position = this.getRandomPositionAwayFromPlayer(200, 500);
          if (!position) continue;
          
          // 敵のレベルを決定（プレイヤーレベル±2）
          const level = Math.max(1, this.player.level + Math.floor(Math.random() * 5) - 2);
          
          // 敵タイプをランダムに決定
          const enemyTypes = ['normal', 'elite', 'boss'];
          const typeIndex = Math.random() < 0.7 ? 0 : (Math.random() < 0.85 ? 1 : 2);
          const enemyType = enemyTypes[typeIndex];
          
          // プレースホルダーテクスチャを使用
          const texture = `enemy_${enemyType}_placeholder`;
          
          // 敵キャラクターの作成
          const enemy = this.characterFactory.createEnemy({
            scene: this,
            x: position.x,
            y: position.y,
            texture: texture,
            level: level,
            type: enemyType
          });
          
          // ボスタイプなら大きくする
          if (enemyType === 'boss') {
            enemy.setScale(1.5);
          } else if (enemyType === 'elite') {
            enemy.setScale(1.2);
          }
          
          // 敵をシーンに追加
          this.add.existing(enemy);
          
          // 敵リストに追加
          this.enemies.push(enemy);
          
          // デプスの設定
          enemy.setDepth(10);
          
          // ActionSystemを使った新しいAI設定
          if (this.actionSystem) {
            // 旧AIインスタンスがあれば無効化
            if (enemy.ai && enemy.ai.setEnabled) {
              enemy.ai.setEnabled(false);
            }
            
            // 新しいAIインスタンスの作成（実装済みの場合）
            // enemy.ai = new EnemyAI(enemy, {}, this.actionSystem);
          }
        }
        
        console.log(`🎮 デバッグ用の敵を ${this.enemies.length} 体生成しました`);
      }
      
      /**
       * プレイヤーから一定距離離れたランダムな位置を取得
       * @param {number} minDistance - 最小距離
       * @param {number} maxDistance - 最大距離
       * @returns {object|null} - 位置オブジェクトまたはnull
       */
      getRandomPositionAwayFromPlayer(minDistance, maxDistance) {
        if (!this.player || !this.topDownMap) return null;
        
        // 最大10回試行
        for (let i = 0; i < 10; i++) {
          // ランダムな角度と距離
          const angle = Math.random() * Math.PI * 2;
          const distance = minDistance + Math.random() * (maxDistance - minDistance);
          
          // 位置を計算
          const x = this.player.x + Math.cos(angle) * distance;
          const y = this.player.y + Math.sin(angle) * distance;
          
          // タイル座標に変換
          const tilePos = this.topDownMap.worldToTileXY(x, y);
          
          // 移動可能かチェック
          if (this.topDownMap.isWalkableAt(tilePos.x, tilePos.y)) {
            // ワールド座標に変換して返す
            return this.topDownMap.tileToWorldXY(tilePos.x, tilePos.y);
          }
        }
        
        // 適切な位置が見つからなければランダムな位置を使用
        const position = this.topDownMap.getRandomWalkablePosition();
        if (position) {
          return this.topDownMap.tileToWorldXY(position.x, position.y);
        }
        
        return null;
      }
      
      /**
       * カメラの設定
       */
      setupCamera() {
        // カメラの設定 - TopDownマップには追加のオフセットは不要
        if (this.player) {
          this.cameras.main.startFollow(this.player);
          this.cameras.main.setZoom(1);
          // アイソメトリックマップで必要だったオフセットは削除
          // this.cameras.main.setFollowOffset(-this.player.width / 2, -this.player.height / 2);
        }
      }
      
      /**
       * カメラの更新
       */
      updateCamera() {
        // 必要に応じてカメラの位置やズームを調整
      }
      
      /**
       * イベントリスナーの設定
       */
      setupEventListeners() {
        // ESCキー：メニュー表示
        this.input.keyboard.on('keydown-ESC', () => {
          // メニューを表示
          const uiScene = this.scene.get('UIScene');
          if (uiScene) {
            uiScene.toggleMenu();
          }
        });
        
        // マウスクリック：移動/攻撃
        this.input.on('pointerdown', (pointer) => {
          if (this.player && !this.player.isDead) {
            // 右クリックの場合は移動
            if (pointer.rightButtonDown()) {
              this.handlePlayerMovement(pointer);
            }
            // 左クリックの場合は攻撃/インタラクション
            else if (pointer.leftButtonDown()) {
              this.handlePlayerAction(pointer);
            }
          }
        });
        
        // スペースキー：基本攻撃
        this.input.keyboard.on('keydown-SPACE', () => {
          if (this.player && !this.player.isDead) {
            this.performBasicAttack();
          }
        });
        
        // 1-5キー：スキル使用
        for (let i = 1; i <= 5; i++) {
          this.input.keyboard.on(`keydown-${i}`, () => {
            if (this.player && !this.player.isDead) {
              this.usePlayerSkill(i - 1);
            }
          });
        }
        
        // QWERキー：ポーション使用など
        this.input.keyboard.on('keydown-Q', () => {
          if (this.player && !this.player.isDead) {
            this.useHealthPotion();
          }
        });
        
        this.input.keyboard.on('keydown-E', () => {
          if (this.player && !this.player.isDead) {
            this.useManaPotion();
          }
        });
        
        // ミニマップ表示トグル
        this.input.keyboard.on('keydown-M', () => {
          const uiScene = this.scene.get('UIScene');
          if (uiScene && uiScene.toggleMinimap) {
            uiScene.toggleMinimap();
          }
        });
        
        // スキルツリー表示
        this.input.keyboard.on('keydown-T', () => {
          this.showSkillTree();
        });
        
        // マップ生成用テストキー（デバッグ用）
        if (this.game.config.physics.arcade?.debug) {
          this.input.keyboard.on('keydown-R', async () => {
            await this.generateMap();
            
            // プレイヤーの位置をリセット
            const startPosition = this.topDownMap.getRandomWalkablePosition();
            const worldPos = this.topDownMap.tileToWorldXY(startPosition.x, startPosition.y);
            this.player.setPosition(worldPos.x, worldPos.y);
            
            console.log('Map regenerated');
          });
        }

        // デバッグモード専用キー
        if (this.isDebugMode) {

          // MainScene.js setupEventListeners()メソッドにF1キーのイベント追加
          this.input.keyboard.on('keydown-F1', () => {
            Debug.DebugUtils.showDebugHelp(this);
          });

          // Nキー：デバッグNPC追加
          this.input.keyboard.on('keydown-N', () => {
            if (this.player && this.topDownMap) {
              // プレイヤーの近くにNPCを配置
              const playerPos = this.topDownMap.worldToTileXY(this.player.x, this.player.y);
              let npcPos = { 
                x: playerPos.x + 2, 
                y: playerPos.y 
              };
              
              if (!this.topDownMap.isWalkableAt(npcPos.x, npcPos.y)) {
                // 移動可能な場所を探す
                npcPos = this.topDownMap.getRandomWalkablePosition();
              }
              
              // ワールド座標に変換
              const worldPos = this.topDownMap.tileToWorldXY(npcPos.x, npcPos.y);
              
              // NPCタイプをランダム選択
              const npcTypes = ['villager', 'guard', 'merchant', 'blacksmith', 'alchemist'];
              const npcType = npcTypes[Math.floor(Math.random() * npcTypes.length)];
              const isShop = Math.random() < 0.5;
              
              // テクスチャ
              const texture = `npc_${npcType}_placeholder`;
              
              // NPCの生成
              const npc = this.characterFactory.createNPC({
                scene: this,
                x: worldPos.x,
                y: worldPos.y,
                texture: texture,
                type: npcType,
                isShop: isShop,
                dialogues: ['これはデバッグNPCです。', 'テスト用に生成されました。']
              });
              
              if (isShop) {
                // ショップアイテム生成
                const shopType = ['weapon', 'armor', 'potion', 'general'][Math.floor(Math.random() * 4)];
                npc.setShopType(shopType);
                npc.setShopItems(Debug.DebugUtils.generateShopItems(shopType, 10));
              }
              
              // シーンに追加
              this.add.existing(npc);
              if (!this.npcs) this.npcs = [];
              this.npcs.push(npc);
              
              // デプスの設定
              npc.setDepth(10);
              
              console.log(`🧙 デバッグNPC追加: ${npcType}${isShop ? ' (ショップ)' : ''}`);
            }
          });
          
          // Bキー：デバッグボス追加
          this.input.keyboard.on('keydown-B', () => {
            if (this.player && this.topDownMap) {
              // プレイヤーから少し離れた場所にボスを配置
              const playerPos = this.topDownMap.worldToTileXY(this.player.x, this.player.y);
              let bossPos = { 
                x: playerPos.x + 5, 
                y: playerPos.y + 5 
              };
              
              if (!this.topDownMap.isWalkableAt(bossPos.x, bossPos.y)) {
                bossPos = this.topDownMap.getRandomWalkablePosition();
              }
              
              // ワールド座標に変換
              const worldPos = this.topDownMap.tileToWorldXY(bossPos.x, bossPos.y);
              
              // ボス敵の生成
              const boss = this.characterFactory.createEnemy({
                scene: this,
                x: worldPos.x,
                y: worldPos.y,
                texture: 'enemy_boss_placeholder',
                level: this.player.level + 2,
                type: 'boss'
              });
              
              // ボスのスケール調整
              boss.setScale(1.5);
              
              // シーンに追加
              this.add.existing(boss);
              if (!this.enemies) this.enemies = [];
              this.enemies.push(boss);
              
              // デプスの設定
              boss.setDepth(10);
              
              // ActionSystemを使った新しいAI設定（実装済みの場合）
              if (this.actionSystem) {
                // 旧AIインスタンスがあれば無効化
                if (boss.ai && boss.ai.setEnabled) {
                  boss.ai.setEnabled(false);
                }
                
                // 新しいAIインスタンスを設定
                // boss.ai = new EnemyAI(boss, { aggressiveness: 0.9 }, this.actionSystem);
              }
              
              console.log(`👹 デバッグボス追加: Lv.${boss.level}`);
            }
          });
        }
      }
      
      /**
       * プレイヤー移動処理
       */
      handlePlayerMovement(pointer) {
        // クリック位置を取得
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        
        // トップダウン座標に変換
        const tileXY = this.topDownMap.worldToTileXY(worldPoint.x, worldPoint.y);
        
        // 移動可能かチェック
        if (this.topDownMap.isWalkableAt(tileXY.x, tileXY.y)) {
          // プレイヤーの現在位置をタイル座標で取得
          const playerTileXY = this.topDownMap.worldToTileXY(this.player.x, this.player.y);
          
          // 経路を探索
          const path = this.topDownMap.findPath(
            playerTileXY.x, playerTileXY.y,
            tileXY.x, tileXY.y
          );
          
          // 経路が見つかった場合
          if (path && path.length > 0) {
            // ActionSystemが使用可能な場合
            if (this.actionSystem) {
              // 既存のアクションをキャンセル
              this.actionSystem.cancelEntityActions(this.player);
              
              // パスをワールド座標に変換
              const worldPath = path.map(p => {
                const worldPos = this.topDownMap.tileToWorldXY(p.x, p.y);
                return { x: worldPos.x, y: worldPos.y };
              });
              
              // 移動アクションを作成して実行
              const moveAction = this.actionSystem.createAction('move', {
                owner: this.player,
                path: worldPath,
                topDownMap: this.topDownMap
              });
              
              this.actionSystem.queueAction(moveAction, true);
            }
            // 従来の方法
            else {
              this.movePlayerAlongPath(path);
            }
          }
        }
      }
      
      /**
       * プレイヤーが経路に沿って移動（従来の方法）
       */
      movePlayerAlongPath(path) {
        // 移動アクションを作成
        const moveAction = this.actionFactory.createBasicAction('move', {
          owner: this.player,
          path: path,
          topDownMap: this.topDownMap
        });
        
        // 移動アクション実行
        if (moveAction) {
          moveAction.play();
        }
      }
      
      /**
       * プレイヤーアクション処理（攻撃/インタラクション）
       */
      handlePlayerAction(pointer) {
        // クリック位置を取得
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        
        // トップダウン座標に変換
        const tileXY = this.topDownMap.worldToTileXY(worldPoint.x, worldPoint.y);
        
        // クリック位置にエンティティがあるかチェック
        const entity = this.topDownMap.getEntityAt(tileXY.x, tileXY.y);
        
        if (entity) {
          // 敵の場合は攻撃
          if (entity.type === 'enemy' || entity.classType?.name === 'Enemy') {
            this.attackTarget(entity);
          }
          // NPCの場合は会話
          else if (entity.type === 'npc' || entity.classType?.name === 'NPC') {
            this.interactWithNPC(entity);
          }
          // アイテム/宝箱の場合は取得
          else if (entity.type === 'item' || entity.type === 'chest') {
            this.collectItem(entity);
          }
        } else {
          // 何もないところをクリックした場合は基本攻撃
          this.performBasicAttack();
        }
      }
      
      /**
       * ターゲットを攻撃
       */
      attackTarget(target) {
        if (!this.player || !target) return;
        
        // ActionSystemが使用可能な場合
        if (this.actionSystem) {
          // 既存のアクションをキャンセル
          this.actionSystem.cancelEntityActions(this.player);
          
          // 攻撃アクションを作成して実行
          const attackAction = this.actionSystem.createAction('attack', {
            owner: this.player,
            target: target,
            attackRange: this.player.attackRange || 60
          });
          
          this.actionSystem.queueAction(attackAction, true);
        }
        // 従来の方法
        else {
          // 攻撃アクションを作成
          const attackAction = this.actionFactory.createBasicAction('attack', {
            owner: this.player,
            target: target
          });
          
          // 攻撃アクション実行
          if (attackAction) {
            attackAction.play();
          }
        }
      }
      
      /**
       * 基本攻撃の実行
       */
      performBasicAttack() {
        if (!this.player) return;
        
        // 最も近い敵を探す
        const nearestEnemy = this.findNearestEnemy();
        
        // 敵が見つかった場合は攻撃
        if (nearestEnemy) {
          this.attackTarget(nearestEnemy);
        } else {
          // ActionSystemが使用可能な場合
          if (this.actionSystem) {
            // 既存のアクションをキャンセル
            this.actionSystem.cancelEntityActions(this.player);
            
            // 攻撃アクションを作成して実行（ターゲットなし）
            const attackAction = this.actionSystem.createAction('attack', {
              owner: this.player,
              attackRange: this.player.attackRange || 60
            });
            
            this.actionSystem.queueAction(attackAction, true);
          }
          // 従来の方法
          else {
            // 敵がいない場合は空振り
            const attackAction = this.actionFactory.createBasicAction('attack', {
              owner: this.player
            });
            
            if (attackAction) {
              attackAction.play();
            }
          }
        }
      }
      
      /**
       * 最も近い敵を探す
       */
      findNearestEnemy() {
        if (!this.player || !this.enemies || this.enemies.length === 0) return null;
        
        let nearestEnemy = null;
        let minDistance = Infinity;
        
        for (const enemy of this.enemies) {
          if (enemy && !enemy.isDead) {
            // getDistance関数を使用
            const dist = getDistance(
              this.player.x, this.player.y,
              enemy.x, enemy.y
            );
            
            if (dist < minDistance) {
              minDistance = dist;
              nearestEnemy = enemy;
            }
          }
        }
        
        // 一定距離内の敵だけを対象にする
        const attackRange = this.player.attackRange || 150;
        return minDistance <= attackRange ? nearestEnemy : null;
      }
      
      /**
       * NPCとのインタラクション
       */
      interactWithNPC(npc) {
        if (!this.player || !npc) return;
        
        // NPCとの会話を開始
        const uiScene = this.scene.get('UIScene');
        
        if (uiScene && uiScene.showDialogue) {
          uiScene.showDialogue(npc);
        }
      }
      
      /**
       * アイテム/宝箱の収集
       */
      collectItem(item) {
        if (!this.player || !item) return;
        
        // アイテムの所有者をプレイヤーに設定
        item.collect(this.player);
        
        // アイテムリストから削除
        const index = this.items.indexOf(item);
        if (index !== -1) {
          this.items.splice(index, 1);
        }
        
        // エンティティリストから削除
        if (this.topDownMap) {
          this.topDownMap.removeEntity(item);
        }
        
        // アイテム取得イベント
        this.events.emit('item-collected', item);
      }
      
      /**
       * プレイヤースキルの使用
       */
      usePlayerSkill(skillIndex) {
        // プレイヤーのスキルリストからスキルを取得
        if (!this.player || !this.player.specialActions) return;
        
        const skillKeys = Array.from(this.player.specialActions.keys());
        if (skillIndex >= skillKeys.length) return;
        
        const skillKey = skillKeys[skillIndex];
        const skillData = this.player.specialActions.get(skillKey);
        
        if (skillData) {
          // ActionSystemが使用可能な場合
          if (this.actionSystem) {
            // 既存のアクションをキャンセル
            this.actionSystem.cancelEntityActions(this.player);
            
            // ターゲットを取得
            const nearestEnemy = this.findNearestEnemy();
            
            // スキルアクションを作成
            const skillAction = this.actionSystem.createAction('skill', {
              owner: this.player,
              target: nearestEnemy,
              skillId: skillKey,
              ...skillData // スキルデータをコピー
            });
            
            this.actionSystem.queueAction(skillAction, true);
          }
          // 従来の方法
          else {
            const skillAction = this.player.specialActions.get(skillKey);
            
            if (skillAction) {
              // スキルのターゲットを設定（必要に応じて）
              const nearestEnemy = this.findNearestEnemy();
              if (nearestEnemy) {
                skillAction.target = nearestEnemy;
              }
              
              // スキル使用
              skillAction.play();
            }
          }
          
          // スキル使用イベント
          this.events.emit('skill-used', { skillKey, skillAction });
        }
      }
      
      /**
       * ヘルスポーションの使用
       */
      useHealthPotion() {
        if (!this.player) return;
        
        // プレイヤーのポーション使用メソッドを呼び出し
        const success = this.player.useHealthPotion();
        
        if (success) {
          // ポーション使用イベント
          this.events.emit('potion-used', 'health');
        }
      }
      
      /**
       * マナポーションの使用
       */
      useManaPotion() {
        if (!this.player) return;
        
        // プレイヤーのポーション使用メソッドを呼び出し
        const success = this.player.useManaPotion();
        
        if (success) {
          // ポーション使用イベント
          this.events.emit('potion-used', 'mana');
        }
      }
      
      /**
       * スキルツリーシステムの初期化
       */
      async initializeSkillTreeSystem() {
        try {
          if (!this.player) return;
          
          // スキルツリーマネージャーの初期化
          await this.skillTreeManager.initialize(this.player);
          
          // 解放済みスキルの設定（ゲームデータから）
          if (this.gameData.unlockedSkills) {
            for (const skillId of this.gameData.unlockedSkills) {
              this.skillTreeManager.allocateSkillPoint(skillId, this.player);
            }
          }
          
          // プレイヤーのスキルリスト更新
          this.updatePlayerSkills();
          
          console.log('Skill tree system initialized');
        } catch (error) {
          console.error('Failed to initialize skill tree system:', error);
        }
      }
      
      /**
       * プレイヤースキルの更新
       */
      updatePlayerSkills() {
        if (!this.player || !this.skillTreeManager) return;
        
        // 既存のスキルをクリア
        if (!this.player.specialActions) {
          this.player.specialActions = new Map();
        }
        
        // 解放済みスキルの取得
        const unlockedSkills = this.skillTreeManager.getUnlockedSkills(this.player);
        
        // スキルアクションの作成と設定
        for (const skill of unlockedSkills) {
          if (skill.type === 'skill') {
            // ActionSystemが使用可能な場合
            if (this.actionSystem) {
              // スキルデータを作成
              const skillData = {
                skillId: skill.id,
                name: skill.name,
                description: skill.description,
                manaCost: skill.manaCost || 10,
                cooldown: skill.cooldown || 3000,
                damage: skill.damage,
                damageType: skill.damageType || 'physical',
                range: skill.range || 100,
                areaOfEffect: skill.areaOfEffect || 0,
                effectType: skill.effectType,
                effectValue: skill.effectValue,
                effectDuration: skill.effectDuration || 0,
                targetType: skill.targetType || 'enemy'
              };
              
              // スキルデータを登録
              this.player.specialActions.set(skill.id, skillData);
            }
            // 従来の方法
            else {
              const skillAction = this.actionFactory.createSpecialAction(skill.id, {
                owner: this.player,
                scene: this
              });
              
              if (skillAction) {
                this.player.specialActions.set(skill.id, skillAction);
              }
            }
          }
        }
        
        // スキル更新イベント
        this.events.emit('skills-updated', this.player.specialActions);
      }
      
      /**
       * スキルツリーUI表示
       */
      showSkillTree() {
        // UIシーンにスキルツリー表示を要求
        const uiScene = this.scene.get('UIScene');
        if (uiScene && uiScene.showSkillTree) {
          uiScene.showSkillTree(this.player);
        }
      }
      
      /**
       * レベルアップ時の処理
       */
      playerLevelUp() {
        if (!this.player) return;
        
        // レベルアップ処理
        this.player.levelUp();
        
        // スキルポイント追加
        if (this.skillTreeManager) {
          this.skillTreeManager.addSkillPoints(this.player, 1);
        }
        
        // レベルアップ通知
        const uiScene = this.scene.get('UIScene');
        if (uiScene && uiScene.showLevelUpNotification) {
          uiScene.showLevelUpNotification();
        }
        
        // レベルアップイベント
        this.events.emit('player-level-up', this.player.level);
        
        // ゲームデータ更新
        this.gameData.playerLevel = this.player.level;
      }
      
      /**
       * 次のフロアへの進行
       */
      async goToNextFloor() {
        // 現在のフロアレベルを更新
        this.gameData.currentLevel++;
        
        // 新しいマップを生成
        await this.generateMap();
        
        // プレイヤーの位置をリセット
        const startPosition = this.topDownMap.getRandomWalkablePosition();
        const worldPos = this.topDownMap.tileToWorldXY(startPosition.x, startPosition.y);
        this.player.setPosition(worldPos.x, worldPos.y);
        
        // コンパニオンの位置も更新
        if (this.companions.length > 0) {
          for (const companion of this.companions) {
            // プレイヤーの近くに配置
            const companionPos = this.topDownMap.getRandomWalkablePosition();
            const companionWorldPos = this.topDownMap.tileToWorldXY(companionPos.x, companionPos.y);
            companion.setPosition(companionWorldPos.x, companionWorldPos.y);
          }
        }
        
        // フロア移動イベント
        this.events.emit('floor-changed', this.gameData.currentLevel);
        
        // UIの更新
        const uiScene = this.scene.get('UIScene');
        if (uiScene && uiScene.updateFloorInfo) {
          uiScene.updateFloorInfo(this.gameData.currentLevel);
        }
      }
      
      /**
       * ゲームオーバー処理
       */
      gameOver(data = {}) {
        // ゲームオーバー時の処理
        this.events.emit('game-over');
        
        // プレイヤーデータを保存
        if (this.player && this.player.onGameSave) {
          this.player.onGameSave();
        }
        
        // ゲームオーバー画面表示
        if (this.scene) {
          this.scene.start('GameOverScene', data);
        }
      }

      /**
       * ゲームの保存
       */
      saveGame() {
        try {
          // プレイヤーデータの保存
          let saveData = {};
          
          if (this.player && this.player.onGameSave) {
            saveData.playerData = this.player.onGameSave();
          }
          
          // ゲーム状態の保存
          saveData.gameState = {
            currentLevel: this.gameData.currentLevel,
            difficulty: this.gameData.difficulty,
            mapType: this.currentMapType,
            timestamp: Date.now()
          };
          
          // ゲームインスタンスを取得してセーブ
          const game = Game.getInstance();
          if (game && game.saveGameData) {
            game.saveGameData('auto', saveData);
            
            // 保存通知
            const uiScene = this.scene.get('UIScene');
            if (uiScene && uiScene.showMessage) {
              uiScene.showMessage('ゲームを保存しました');
            }
            
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('ゲームの保存に失敗しました:', error);
          return false;
        }
      }
    }
    
    // 実装クラスを保存
    MainScene.instance = MainSceneImpl;
    return MainSceneImpl;
  }
  
  /**
   * シーンのインスタンス化
   * initialize()が事前に呼ばれている必要がある
   */
  constructor() {
    if (!MainScene.instance) {
      throw new Error('MainScene must be initialized before instantiation. Call MainScene.initialize() first.');
    }
    return new MainScene.instance();
  }
}