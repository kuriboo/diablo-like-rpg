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

import AssetPipeline from '../AssetPipeline';
import { SCENES } from '../constants';
import PlaceholderAssets from '../../../debug/PlaceholderAssets';
import { isDebugMode } from '../../../debug';
import AudioPlaceholders from '../../../debug/AudioPlaceholders';

/**
 * LoadingScene - ゲームアセットの読み込みを担当するシーン
 */
export default class LoadingScene {
  // 静的なシーンインスタンスを保持
  static instance = null;
  
  // アセットリストの定義
  static loadingAssets = {
    images: [
      // キャラクター関連
      { key: 'player_warrior', path: 'assets/images/characters/player_warrior.png' },
      { key: 'player_rogue', path: 'assets/images/characters/player_rogue.png' },
      { key: 'player_sorcerer', path: 'assets/images/characters/player_sorcerer.png' },
      { key: 'companion_warrior', path: 'assets/images/characters/companion_warrior.png' },
      { key: 'companion_rogue', path: 'assets/images/characters/companion_rogue.png' },
      { key: 'companion_sorcerer', path: 'assets/images/characters/companion_sorcerer.png' },
      
      // 敵キャラクター
      { key: 'enemy_skeleton', path: 'assets/images/characters/enemy_skeleton.png' },
      { key: 'enemy_zombie', path: 'assets/images/characters/enemy_zombie.png' },
      { key: 'enemy_ghost', path: 'assets/images/characters/enemy_ghost.png' },
      { key: 'enemy_spider', path: 'assets/images/characters/enemy_spider.png' },
      { key: 'enemy_slime', path: 'assets/images/characters/enemy_slime.png' },
      { key: 'enemy_wolf', path: 'assets/images/characters/enemy_wolf.png' },
      { key: 'enemy_boss', path: 'assets/images/characters/enemy_boss.png' },
      
      // NPC
      { key: 'npc_villager', path: 'assets/images/characters/npc_villager.png' },
      { key: 'npc_guard', path: 'assets/images/characters/npc_guard.png' },
      { key: 'npc_blacksmith', path: 'assets/images/characters/npc_blacksmith.png' },
      { key: 'npc_merchant', path: 'assets/images/characters/npc_merchant.png' },
      { key: 'npc_alchemist', path: 'assets/images/characters/npc_alchemist.png' },
      
      // タイル関連
      { key: 'tile_grass', path: 'assets/images/tiles/tile_grass.png' },
      { key: 'tile_dirt', path: 'assets/images/tiles/tile_dirt.png' },
      { key: 'tile_stone', path: 'assets/images/tiles/tile_stone.png' },
      { key: 'tile_water', path: 'assets/images/tiles/tile_water.png' },
      { key: 'tile_snow', path: 'assets/images/tiles/tile_snow.png' },
      { key: 'tile_sand', path: 'assets/images/tiles/tile_sand.png' },
      { key: 'tile_lava', path: 'assets/images/tiles/tile_lava.png' },
      
      // 障害物
      { key: 'obstacle_tree', path: 'assets/images/tiles/obstacle_tree.png' },
      { key: 'obstacle_rock', path: 'assets/images/tiles/obstacle_rock.png' },
      { key: 'obstacle_bush', path: 'assets/images/tiles/obstacle_bush.png' },
      { key: 'obstacle_crate', path: 'assets/images/tiles/obstacle_crate.png' },
      
      // アイテム
      { key: 'item_potion_health', path: 'assets/images/items/item_potion_health.png' },
      { key: 'item_potion_mana', path: 'assets/images/items/item_potion_mana.png' },
      { key: 'item_chest', path: 'assets/images/items/item_chest.png' },
      { key: 'item_weapon_sword', path: 'assets/images/items/item_weapon_sword.png' },
      { key: 'item_weapon_axe', path: 'assets/images/items/item_weapon_axe.png' },
      { key: 'item_weapon_bow', path: 'assets/images/items/item_weapon_bow.png' },
      { key: 'item_armor', path: 'assets/images/items/item_armor.png' },
      
      // UI要素
      { key: 'ui_panel', path: 'assets/images/ui/ui_panel.png' },
      { key: 'ui_button', path: 'assets/images/ui/ui_button.png' },
      { key: 'ui_button_hover', path: 'assets/images/ui/ui_button_hover.png' },
      { key: 'ui_inventory', path: 'assets/images/ui/ui_inventory.png' },
      { key: 'ui_health_bar', path: 'assets/images/ui/ui_health_bar.png' },
      { key: 'ui_mana_bar', path: 'assets/images/ui/ui_mana_bar.png' },
      { key: 'ui_skill_icon', path: 'assets/images/ui/ui_skill_icon.png' },
      
      // エフェクト
      { key: 'effect_attack', path: 'assets/images/effects/effect_attack.png' },
      { key: 'effect_heal', path: 'assets/images/effects/effect_heal.png' },
      { key: 'effect_magic', path: 'assets/images/effects/effect_magic.png' },
      
      // ロゴと背景
      { key: 'logo', path: 'assets/images/ui/logo.png' },
      { key: 'background', path: 'assets/images/ui/background.png' }
    ],
    
    // スプライトシート
    spritesheets: [
      { 
        key: 'player_sheet', 
        path: 'assets/images/characters/player_sheet.png',
        frameConfig: { frameWidth: 64, frameHeight: 64 }
      },
      { 
        key: 'enemy_sheet', 
        path: 'assets/images/characters/enemy_sheet.png',
        frameConfig: { frameWidth: 64, frameHeight: 64 }
      },
      { 
        key: 'effects_sheet', 
        path: 'assets/images/effects/effects_sheet.png',
        frameConfig: { frameWidth: 64, frameHeight: 64 }
      },
      {
        key: 'particle',
        path: 'assets/images/effects/particle.png',
        frameConfig: { frameWidth: 8, frameHeight: 8 }
      }
    ],
    
    // オーディオ
    audio: [
      { key: 'bgm_main', path: 'assets/audio/bgm_main.mp3' },
      { key: 'bgm_battle', path: 'assets/audio/bgm_battle.mp3' },
      { key: 'bgm_town', path: 'assets/audio/bgm_town.mp3' },
      { key: 'sfx_attack', path: 'assets/audio/sfx_attack.mp3' },
      { key: 'sfx_spell', path: 'assets/audio/sfx_spell.mp3' },
      { key: 'sfx_item', path: 'assets/audio/sfx_item.mp3' },
      { key: 'click-sfx', path: 'assets/audio/click.mp3' },
      { key: 'hover-sfx', path: 'assets/audio/hover.mp3' },
      { key: 'game_over', path: 'assets/audio/game_over.mp3' }
    ],
    
    // その他
    others: []
  };
  
  /**
   * Phaserシーンのインスタンス化前に非同期で初期化する
   */
  static async initialize() {
    if (LoadingScene.instance) return LoadingScene.instance;
    
    const Scene = await getSceneClass();
    
    // Sceneを継承した実装クラス
    class LoadingSceneImpl extends Scene {
      constructor() {
        super({ key: SCENES.LOADING });
        
        this.loadingText = null;
        this.progressBar = null;
        this.progressBox = null;
        this.loadingAssets = LoadingScene.loadingAssets;
        
        // アセットパイプライン
        this.assetPipeline = null;
      }
      
      preload() {
        // プログレスバーとテキストの初期設定
        this.setupProgressBar();
    
        // デバッグモードの場合、プレースホルダーアセットを初期化
        if (isDebugMode) {
          console.log('デバッグモード: プレースホルダーアセットを初期化中...');
          PlaceholderAssets.initialize(this);
        }
        
        // アセットの読み込み
        this.loadAssets();
        
        // ロード進捗イベントのリスナー
        this.load.on('progress', this.updateProgressBar, this);
        this.load.on('complete', this.completeLoading, this);
        
        if (isDebugMode) {
          console.log('🎮 デバッグモード: 音声プレースホルダーを準備中...');
          
          // 音声ロードのモック
          const originalLoadAudio = this.load.audio;
          
          // 音声ロード関数をオーバーライド
          this.load.audio = (key, urls) => {
            // キーをキャッシュに登録するだけ（実際にはロードしない）
            console.log(`🔊 音声アセットスキップ: ${key}`);
            
            // 音声が再生されたときにエラーにならないようモックオブジェクトを登録
            if (!this.cache.audio.exists(key)) {
              this.cache.audio.add(key, {
                duration: 0,
                isPlaying: false,
                mute: false,
                // ダミー関数を提供
                play: () => { console.log(`▶️ モック音声再生: ${key}`); return this; },
                stop: () => { return this; },
                pause: () => { return this; },
                resume: () => { return this; }
              });
            }
            
            return this;
          };
          
          // サウンドシステムのモック拡張
          if (this.sound) {
            // オリジナルのメソッドを保存
            const originalAdd = this.sound.add;
            const originalPlay = this.sound.play;
            
            // add メソッドをオーバーライド
            this.sound.add = (key, config) => {
              console.log(`🔊 モック音声追加: ${key}`);
              
              // モックサウンドオブジェクトを返す
              return {
                key: key,
                isPlaying: false,
                isPaused: false,
                loop: config?.loop || false,
                volume: config?.volume || 1,
                // 音声メソッドをモック
                play: () => { console.log(`▶️ モック音声再生: ${key}`); return this; },
                stop: () => { return this; },
                pause: () => { return this; },
                resume: () => { return this; },
                setVolume: () => { return this; },
                setLoop: () => { return this; },
                setRate: () => { return this; }
              };
            };
            
            // play メソッドをオーバーライド
            this.sound.play = (key, config) => {
              console.log(`▶️ モック音声再生: ${key}`);
              return this;
            };
          }
          
          // 必要なサウンドキーをあらかじめ登録
          this.dummySoundKeys = [
            'menu-bgm',
            'hover-sfx',
            'click-sfx',
            'bgm_main',
            'bgm_battle',
            'bgm_town',
            'sfx_attack',
            'sfx_spell',
            'sfx_item',
            'game_over'
          ];
          
          // すべてのダミーサウンドを登録
          this.dummySoundKeys.forEach(key => {
            this.load.audio(key, '');
          });
        }
      }
      
      create() {
        console.log('LoadingScene: create');
        
        // アニメーションの作成（キャラクターなど）
        this.createAnimations();
        
        // アセットパイプラインの初期化
        this.initializeAssetPipeline();

        if (isDebugMode) {
          console.log('🎮 デバッグモード: 音声システムをモックに置き換え中...');
          
          // グローバルなサウンドシステムもモック化（他のシーンのためにゲーム全体に適用）
          if (this.sys.game.sound) {
            // オリジナルのメソッドを保存
            const originalAdd = this.sys.game.sound.add;
            const originalPlay = this.sys.game.sound.play;
            
            // add メソッドをオーバーライド
            this.sys.game.sound.add = (key, config) => {
              console.log(`🔊 モック音声追加(グローバル): ${key}`);
              
              // モックサウンドオブジェクトを返す
              return {
                key: key,
                isPlaying: false,
                isPaused: false,
                loop: config?.loop || false,
                volume: config?.volume || 1,
                // 音声メソッドをモック
                play: function() { 
                  console.log(`▶️ モック音声再生(グローバル): ${key}`); 
                  return this; 
                },
                stop: function() { return this; },
                pause: function() { return this; },
                resume: function() { return this; },
                setVolume: function() { return this; },
                setLoop: function() { return this; },
                setRate: function() { return this; }
              };
            };
            
            // play メソッドをオーバーライド
            this.sys.game.sound.play = (key, config) => {
              console.log(`▶️ モック音声再生(グローバル): ${key}`);
              return null;
            };
          }
        }
        
        // 短い遅延後にメニューシーンへ移動
        this.time.delayedCall(500, () => {
          this.scene.start(SCENES.MAIN_MENU);
        });
      }
      
      /**
       * プログレスバーの初期設定
       */
      setupProgressBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // プログレスボックス
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x222222, 0.8);
        this.progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        // ロード中テキスト
        this.loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
          font: '20px monospace',
          fill: '#ffffff'
        });
        this.loadingText.setOrigin(0.5, 0.5);
        
        // パーセント表示テキスト
        this.percentText = this.add.text(width / 2, height / 2 + 50, '0%', {
          font: '18px monospace',
          fill: '#ffffff'
        });
        this.percentText.setOrigin(0.5, 0.5);
        
        // プログレスバー
        this.progressBar = this.add.graphics();
      }
      
      /**
       * アセットの読み込みを開始
       */
      loadAssets() {
        // 画像読み込み
        this.loadingAssets.images.forEach(img => {
          this.load.image(img.key, img.path);
        });
        
        // スプライトシート読み込み
        this.loadingAssets.spritesheets.forEach(sheet => {
          this.load.spritesheet(sheet.key, sheet.path, sheet.frameConfig);
        });
        
        // オーディオ読み込み
        this.loadingAssets.audio.forEach(audio => {
          this.load.audio(audio.key, audio.path);
        });
        
        // その他のアセット読み込み
        this.loadingAssets.others.forEach(asset => {
          if (asset.type === 'json') {
            this.load.json(asset.key, asset.path);
          } else if (asset.type === 'atlas') {
            this.load.atlas(asset.key, asset.imagePath, asset.jsonPath);
          }
        });
    
        // デバッグモードでエラー表示を少なくする（アセット不足対策）
        if (isDebugMode) {
          // アセット読み込みエラーのハンドリング
          this.load.on('loaderror', (fileObj) => {
            console.warn(`⚠️ アセット読み込みエラー: ${fileObj.key} - プレースホルダーを使用します`);
            
            // アセットタイプに基づいてプレースホルダーを生成
            if (fileObj.key.includes('player')) {
              PlaceholderAssets.getFallbackTexture(this, 'player');
            } else if (fileObj.key.includes('enemy')) {
              PlaceholderAssets.getFallbackTexture(this, 'enemy');
            } else if (fileObj.key.includes('tile')) {
              PlaceholderAssets.getFallbackTexture(this, 'tile');
            } else if (fileObj.key.includes('item')) {
              PlaceholderAssets.getFallbackTexture(this, 'item');
            } else {
              PlaceholderAssets.getFallbackTexture(this, 'character');
            }
          });
        }
      }
      
      /**
       * プログレスバーの更新
       * @param {number} value - 進捗値（0～1）
       */
      updateProgressBar(value) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // プログレスバーの更新
        this.progressBar.clear();
        this.progressBar.fillStyle(0xffffff, 1);
        this.progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        
        // パーセント表示の更新
        const percent = Math.floor(value * 100);
        this.percentText.setText(`${percent}%`);
      }
      
      /**
       * ロード完了時の処理
       */
      completeLoading() {
        // 「ロード完了」テキストに変更
        this.loadingText.setText('Load Complete!');
        this.percentText.setText('100%');
      }
      
      /**
       * アニメーションの作成
       */
      createAnimations() {
        // プレイヤーアニメーション
        this.createCharacterAnimations('player', ['idle', 'walk', 'attack', 'hurt', 'death']);
        
        // 敵アニメーション
        this.createCharacterAnimations('enemy', ['idle', 'walk', 'attack', 'hurt', 'death']);
        
        // エフェクトアニメーション
        this.createEffectAnimations();
      }
      
      /**
       * キャラクターアニメーションの作成
       * @param {string} prefix - プレフィックス（'player'や'enemy'など）
       * @param {Array} actions - アクションリスト（'idle'、'walk'など）
       */
      createCharacterAnimations(prefix, actions) {
        // キャラクタータイプごとのアニメーション作成
        const types = prefix === 'player' ? 
          ['warrior', 'rogue', 'sorcerer'] : 
          ['skeleton', 'zombie', 'ghost', 'spider', 'slime', 'wolf', 'boss'];
        
        types.forEach(type => {
          actions.forEach(action => {
            // アニメーションキー（例: 'player_warrior_idle'）
            const key = `${prefix}_${type}_${action}`;
            
            // フレーム数とフレームレート設定
            let frameRate = 10;
            let frameCount = 4;
            
            switch (action) {
              case 'attack':
                frameRate = 15;
                break;
              case 'hurt':
                frameRate = 8;
                frameCount = 2;
                break;
              case 'death':
                frameRate = 8;
                frameCount = 6;
                break;
            }
            
            // アニメーション作成（対応するスプライトシートがあれば）
            const sheet = `${prefix}_sheet`;
            if (this.textures.exists(sheet)) {
              this.anims.create({
                key: key,
                frames: this.anims.generateFrameNumbers(sheet, {
                  start: 0,
                  end: frameCount - 1
                }),
                frameRate: frameRate,
                repeat: action === 'idle' || action === 'walk' ? -1 : 0
              });
            }
          });
        });
      }
      
      /**
       * エフェクトアニメーションの作成
       */
      createEffectAnimations() {
        const effects = ['attack', 'heal', 'magic'];
        
        effects.forEach(effect => {
          const key = `effect_${effect}`;
          
          // フレーム数とフレームレート設定
          let frameRate = 15;
          let frameCount = 5;
          
          // アニメーション作成
          if (this.textures.exists('effects_sheet')) {
            this.anims.create({
              key: key,
              frames: this.anims.generateFrameNumbers('effects_sheet', {
                start: 0,
                end: frameCount - 1
              }),
              frameRate: frameRate,
              repeat: 0
            });
          }
        });
      }
      
      /**
       * アセットパイプラインの初期化
       */
      initializeAssetPipeline() {
        try {
          // アセットパイプラインの作成と初期化
          this.assetPipeline = new AssetPipeline(this);
          const initialized = this.assetPipeline.initialize();
          
          // 初期化が成功したら、ゲームデータに設定
          if (initialized) {
            // ゲームデータを取得（存在しなければ作成）
            this.registry.set('assetPipeline', this.assetPipeline);
            console.log('LoadingScene: AssetPipeline initialized and registered.');
          } else {
            console.error('LoadingScene: Failed to initialize AssetPipeline.');
          }
        } catch (error) {
          console.error('LoadingScene: Error initializing AssetPipeline:', error);
        }
      }
    }
    
    // 実装クラスを保存
    LoadingScene.instance = LoadingSceneImpl;
    return LoadingSceneImpl;
  }
  
  // シーンのインスタンス化
  constructor() {
    if (!LoadingScene.instance) {
      throw new Error('LoadingScene must be initialized before instantiation. Call LoadingScene.initialize() first.');
    }
    return new LoadingScene.instance();
  }
}