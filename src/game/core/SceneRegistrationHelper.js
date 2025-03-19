// src/game/core/SceneRegistrationHelper.js

/**
 * Phaserシーンの登録と初期化を管理するヘルパークラス
 */
export class SceneRegistrationHelper {
    constructor() {
      // 初期化済みシーンクラスのマップ
      this.initializedScenes = new Map();
      
      // 登録済みシーンクラスのマップ
      this.registeredSceneClasses = new Map();
    }
    
    /**
     * シーンを登録する
     * @param {string} key - シーンキー
     * @param {Object} SceneClass - シーンクラス
     */
    registerScene(key, SceneClass) {
      if (!SceneClass) {
        console.warn(`警告: ${key}に対するシーンクラスが未定義です`);
        return;
      }
      console.log(`シーン登録: ${key}`, SceneClass);
      this.registeredSceneClasses.set(key, SceneClass);
    }
    
    /**
     * 複数のシーンを一括登録
     * @param {Object} scenes - キーとシーンクラスのマッピング
     */
    registerScenes(scenes) {
      for (const [key, SceneClass] of Object.entries(scenes)) {
        this.registerScene(key, SceneClass);
      }
    }
    
    /**
     * 特定のシーンを初期化
     * @param {string} key - 初期化するシーンのキー
     * @returns {Promise<Object>} 初期化されたシーンクラス
     */
    async initializeScene(key) {
      // 既に初期化済みなら、そのインスタンスを返す
      if (this.initializedScenes.has(key)) {
        return this.initializedScenes.get(key);
      }
      
      // 登録されたシーンクラスを取得
      const SceneClass = this.registeredSceneClasses.get(key);
      if (!SceneClass) {
        throw new Error(`シーンクラスが登録されていません: ${key}`);
      }
      
      try {
        // 初期化メソッドの存在を確認
        if (typeof SceneClass.initialize !== 'function') {
          console.warn(`シーン ${key} にinitializeメソッドがありません。デフォルトの実装を使用します。`);
          
          // デフォルトの実装として、クラスをそのまま返す
          this.initializedScenes.set(key, SceneClass);
          return SceneClass;
        }
        
        // 初期化メソッドを呼び出し
        const InitializedClass = await SceneClass.initialize();
        
        // 初期化されたクラスを保存
        this.initializedScenes.set(key, InitializedClass);
        return InitializedClass;
      } catch (error) {
        console.error(`シーン ${key} の初期化に失敗しました:`, error);
        throw error;
      }
    }
    
    /**
     * すべての登録済みシーンを初期化
     * @returns {Promise<Map>} 初期化されたシーンのマップ
     */
    async initializeAllScenes() {
      const initPromises = [];
      
      // すべての登録済みシーンを初期化
      for (const [key] of this.registeredSceneClasses.entries()) {
        if (!this.initializedScenes.has(key)) {
          initPromises.push(
            this.initializeScene(key)
              .catch(error => {
                console.error(`シーン ${key} の初期化中にエラーが発生しました:`, error);
                throw error;
              })
          );
        }
      }
      
      // すべての初期化が完了するのを待つ
      if (initPromises.length > 0) {
        await Promise.all(initPromises);
      }
      
      return this.initializedScenes;
    }
    
    /**
     * 指定されたキーのシーンをインスタンス化する
     * @param {string} key - シーンキー
     * @returns {Object} シーンインスタンス
     */
    createScene(key) {
      // 初期化されたシーンクラスを取得
      const InitializedSceneClass = this.initializedScenes.get(key);
      if (!InitializedSceneClass) {
        throw new Error(`シーン ${key} が初期化されていません。先にinitializeSceneを呼び出してください。`);
      }
      
      try {
        // 通常のコンストラクタ呼び出しを試みる
        return new InitializedSceneClass();
      } catch (error) {
        console.error(`シーン ${key} のインスタンス化中にエラーが発生しました:`, error);
        throw error;
      }
    }
    
    /**
     * すべての初期化済みシーンをインスタンス化
     * @returns {Array} シーンインスタンスの配列
     */
    createAllScenes() {
      // すべての初期化済みシーンをインスタンス化
      const scenes = [];
      
      for (const [key] of this.initializedScenes.entries()) {
        try {
          scenes.push(this.createScene(key));
        } catch (error) {
          console.error(`シーン ${key} のインスタンス化中にエラーが発生しました:`, error);
        }
      }
      
      return scenes;
    }
    
    /**
     * Phaserゲーム設定用のシーン配列を取得
     * @returns {Array} ゲーム設定用のシーン配列
     */
    getSceneConfig() {
      return this.createAllScenes();
    }
  }
  
  // 使用例:
  /*
  import { LoadingScene } from './scenes/LoadingScene';
  import { MainMenuScene } from './scenes/MainMenuScene';
  import { GameScene } from './scenes/GameScene';
  import { PauseScene } from './scenes/PauseScene';
  import { SCENES } from './constants';
  
  // 1. ヘルパーのインスタンス化
  const sceneHelper = new SceneRegistrationHelper();
  
  // 2. シーンの登録
  sceneHelper.registerScenes({
    [SCENES.LOADING]: LoadingScene,
    [SCENES.MAIN_MENU]: MainMenuScene,
    [SCENES.GAME]: GameScene,
    [SCENES.PAUSE]: PauseScene
  });
  
  // 3. ゲーム初期化時に非同期で全てのシーンを初期化
  async function initGame() {
    await sceneHelper.initializeAllScenes();
    
    const config = {
      // ... 他の設定
      scene: sceneHelper.getSceneConfig()
    };
    
    const game = new Phaser.Game(config);
    return game;
  }
  */