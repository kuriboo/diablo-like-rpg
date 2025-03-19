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

// シーンの初期化
import { SCENES } from '../constants';
import { PlayerStats } from '../../data/PlayerStats';

// GameOverSceneのプロキシクラス
export default class GameOverScene {
  // 静的なシーンインスタンスを保持
  static instance = null;
  
  // Phaserシーンのインスタンス化前に非同期で初期化する
  static async initialize() {
    if (GameOverScene.instance) return GameOverScene.instance;
    
    const Scene = await getSceneClass();
    
    // Sceneを継承した実装クラス
    class GameOverSceneImpl extends Scene {
      constructor() {
        super({ key: SCENES.GAME_OVER });
        this.playerStats = null;
        this.gameData = null;
      }
    
      init(data) {
        // 前のシーンからのデータを受け取る
        this.gameData = data || {};
        this.playerStats = PlayerStats.getInstance();
      }
    
      preload() {
        // ゲームオーバー画面用のアセット
        this.load.image('gameover-background', 'assets/images/ui/gameover_background.png');
        this.load.image('blood-overlay', 'assets/images/ui/blood_overlay.png');
        this.load.image('skull-icon', 'assets/images/ui/skull_icon.png');
        this.load.audio('gameover-sound', 'assets/sounds/game_over.mp3');
      }
    
      create() {
        // BGMの停止と効果音の再生
        this.sound.stopAll();
        this.sound.play('gameover-sound', { volume: 0.7 });
        
        // 背景画像
        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'gameover-background')
          .setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        
        // 血のオーバーレイエフェクト
        const bloodOverlay = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'blood-overlay')
          .setDisplaySize(this.cameras.main.width, this.cameras.main.height)
          .setAlpha(0);
        
        // スカルアイコン
        const skull = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2 - 80, 'skull-icon')
          .setScale(0.1)
          .setAlpha(0);
        
        // ゲームオーバーテキスト（最初は透明）
        const gameOverText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 20, 'ゲームオーバー', {
          fontSize: '64px',
          fontFamily: 'Arial Black',
          color: '#f00',
          stroke: '#000',
          strokeThickness: 8,
          shadow: { offsetX: 5, offsetY: 5, color: '#000', blur: 10, stroke: true, fill: true }
        }).setOrigin(0.5).setAlpha(0);
        
        // アニメーションシーケンス作成
        this.tweens.add({
          targets: bloodOverlay,
          alpha: 0.7,
          duration: 1000,
          ease: 'Power2',
          onComplete: () => {
            // 血のオーバーレイが表示された後、スカルを表示
            this.tweens.add({
              targets: skull,
              alpha: 1,
              scale: 0.5,
              duration: 800,
              ease: 'Back.easeOut',
              onComplete: () => {
                // スカルが表示された後、テキストをフェードイン
                this.tweens.add({
                  targets: gameOverText,
                  alpha: 1,
                  duration: 800,
                  ease: 'Power2',
                  onComplete: () => {
                    // 全てのアニメーション完了後にプレイヤー情報と選択肢を表示
                    this.showPlayerStats();
                    this.showOptions();
                  }
                });
              }
            });
          }
        });
        
        // 画面全体をクリック可能に（デバッグ用）
        this.input.on('pointerdown', () => {
          // デバッグ用：クリックでアニメーションをスキップ
          this.tweens.killAll();
          bloodOverlay.setAlpha(0.7);
          skull.setAlpha(1).setScale(0.5);
          gameOverText.setAlpha(1);
          this.showPlayerStats();
          this.showOptions();
        });
      }
      
      showPlayerStats() {
        // プレイヤーの統計情報の表示
        const statsY = this.cameras.main.height / 2 + 60;
        const statsX = this.cameras.main.width / 2;
        
        // キャラクター名
        this.add.text(statsX, statsY, `キャラクター名: ${this.playerStats.name || '不明'}`, {
          fontSize: '24px',
          fontFamily: 'Arial',
          color: '#fff',
          stroke: '#000',
          strokeThickness: 3
        }).setOrigin(0.5);
        
        // レベル
        this.add.text(statsX, statsY + 40, `レベル: ${this.playerStats.level || 1}`, {
          fontSize: '24px',
          fontFamily: 'Arial',
          color: '#fff',
          stroke: '#000',
          strokeThickness: 3
        }).setOrigin(0.5);
        
        // 死亡理由
        const deathReason = this.gameData.deathReason || 'モンスターの攻撃による';
        this.add.text(statsX, statsY + 80, `死亡理由: ${deathReason}`, {
          fontSize: '24px',
          fontFamily: 'Arial',
          color: '#fff',
          stroke: '#000',
          strokeThickness: 3
        }).setOrigin(0.5);
        
        // プレイ時間
        const playTime = this.formatPlayTime(this.gameData.playTime || 0);
        this.add.text(statsX, statsY + 120, `生存時間: ${playTime}`, {
          fontSize: '24px',
          fontFamily: 'Arial',
          color: '#fff',
          stroke: '#000',
          strokeThickness: 3
        }).setOrigin(0.5);
      }
      
      showOptions() {
        const optionsY = this.cameras.main.height - 120;
        const optionsX = this.cameras.main.width / 2;
        
        // 選択肢ボタン
        this.createButton(optionsX - 150, optionsY, 'リトライ', () => {
          // 現在のキャラクターでリトライ
          this.scene.start(SCENES.GAME);
        });
        
        this.createButton(optionsX + 150, optionsY, 'メインメニューへ', () => {
          // メインメニューに戻る
          this.scene.start(SCENES.MAIN_MENU);
        });
      }
      
      createButton(x, y, text, callback) {
        const button = this.add.rectangle(x, y, 200, 50, 0x222222, 0.8)
          .setStrokeStyle(2, 0xaaaaaa)
          .setInteractive();
        
        const buttonText = this.add.text(x, y, text, {
          fontSize: '24px',
          fontFamily: 'Arial',
          color: '#fff'
        }).setOrigin(0.5);
        
        button.on('pointerover', () => {
          button.setFillStyle(0x444444, 0.8);
          buttonText.setStyle({ color: '#ff0' });
        });
        
        button.on('pointerout', () => {
          button.setFillStyle(0x222222, 0.8);
          buttonText.setStyle({ color: '#fff' });
        });
        
        button.on('pointerdown', () => {
          this.sound.play('click-sfx', { volume: 0.5 });
          callback();
        });
        
        return { button, text: buttonText };
      }
      
      formatPlayTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        const formattedHours = hours > 0 ? `${hours}時間` : '';
        const formattedMinutes = minutes % 60 > 0 ? `${minutes % 60}分` : '';
        const formattedSeconds = seconds % 60 > 0 ? `${seconds % 60}秒` : '';
        
        return `${formattedHours}${formattedMinutes}${formattedSeconds}`;
      }
      
      update() {
        // 必要に応じた更新処理
      }
    }
    
    // 実装クラスを保存
    GameOverScene.instance = GameOverSceneImpl;
    return GameOverSceneImpl;
  }
  
  // シーンのインスタンス化
  constructor() {
    if (!GameOverScene.instance) {
      throw new Error('GameOverScene must be initialized before instantiation. Call GameOverScene.initialize() first.');
    }
    return new GameOverScene.instance();
  }
}