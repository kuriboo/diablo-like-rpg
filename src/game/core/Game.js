import Phaser from 'phaser';
import IsometricPlugin from 'phaser3-plugin-isometric';
import MainScene from './scenes/MainScene';
import UIScene from './scenes/UIScene';
import LoadingScene from './scenes/LoadingScene';
import MenuScene from './scenes/MenuScene';

class Game {
  constructor() {
    this.config = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      backgroundColor: '#000000',
      parent: 'game-container',
      scene: [LoadingScene, MenuScene, MainScene, UIScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      plugins: {
        global: [
          { key: 'IsometricPlugin', plugin: IsometricPlugin, start: true }
        ]
      },
      // アイソメトリックの射影設定
      isometricProjection: {
        projectionAngle: 30, // 投影角度
        depth: 1            // 深さ
      },
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };
    
    this.game = null;
    this.scenes = {};
    this.gameState = {
      currentLevel: 1,
      difficulty: 'normal', // 'normal', 'nightmare', 'hell'
      maxLevel: {
        normal: 30,
        nightmare: 60,
        hell: 100
      }
    };
  }

  init() {
    // Phaserインスタンスの作成
    this.game = new Phaser.Game(this.config);
    
    // グローバルイベントエミッターの設定
    this.events = new Phaser.Events.EventEmitter();
    
    // ブラウザのリサイズ対応
    window.addEventListener('resize', this.onResize.bind(this));
    
    return this;
  }

  onResize() {
    if (this.game) {
      this.game.scale.resize(window.innerWidth, window.innerHeight);
    }
  }

  // シーン間通信用メソッド
  getScene(key) {
    return this.game.scene.getScene(key);
  }

  // ゲーム状態管理
  setDifficulty(difficulty) {
    if (['normal', 'nightmare', 'hell'].includes(difficulty)) {
      this.gameState.difficulty = difficulty;
      this.events.emit('difficultyChanged', difficulty);
    }
  }

  getCurrentMaxLevel() {
    return this.gameState.maxLevel[this.gameState.difficulty];
  }

  // シーン遷移
  startGame() {
    this.game.scene.start('MainScene');
  }

  goToMenu() {
    this.game.scene.start('MenuScene');
  }

  // ゲームリソースの解放
  destroy() {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
    
    window.removeEventListener('resize', this.onResize);
  }
}

// シングルトンとしてエクスポート
const gameInstance = new Game();
export default gameInstance;